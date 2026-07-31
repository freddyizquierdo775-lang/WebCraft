// ─── AST Utilities for WebCraft granular editing ───────────
// Provides a lightweight HTML AST for element-level manipulation
// without external dependencies (pure string + regex approach).

// ─── Tipos ─────────────────────────────────────────────────

export interface ASTNode {
  tag: string;
  attrs: Record<string, string>;
  children: ASTNode[];
  text?: string;
  id?: string;
}

// ─── Console dummy tag names ───────────────────────────────
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

// ─── parseHTMLToAST ────────────────────────────────────────

/**
 * Parsea un string HTML a un árbol AST simplificado.
 * Maneja etiquetas anidadas, atributos, texto y elementos void.
 * Los nodos hoja (sin hijos) almacenan su contenido textual en `text`.
 */
export function parseHTMLToAST(html: string): ASTNode {
  const root: ASTNode = { tag: 'root', attrs: {}, children: [], id: 'root' };
  if (!html || !html.trim()) return root;

  const stack: ASTNode[] = [root];
  let pos = 0;

  while (pos < html.length) {
    // Saltar texto plano fuera de etiquetas
    const tagOpen = html.indexOf('<', pos);
    if (tagOpen === -1) break;

    // Texto antes de la etiqueta: asignar al padre si es nodo hoja
    if (tagOpen > pos) {
      const text = html.slice(pos, tagOpen).trim();
      if (text && stack.length > 0) {
        const parent = stack[stack.length - 1];
        if (parent && parent.children.length === 0) {
          parent.text = (parent.text || '') + text;
        }
      }
    }

    // Comentarios HTML <!-- -->
    if (html.startsWith('<!--', tagOpen)) {
      const commentEnd = html.indexOf('-->', tagOpen + 4);
      pos = commentEnd !== -1 ? commentEnd + 3 : tagOpen + 4;
      continue;
    }

    // DOCTYPE
    if (html.startsWith('<!', tagOpen)) {
      const doctypeEnd = html.indexOf('>', tagOpen);
      pos = doctypeEnd !== -1 ? doctypeEnd + 1 : tagOpen + 2;
      continue;
    }

    // Cierre de etiqueta </...>
    if (html[tagOpen + 1] === '/') {
      const tagEnd = html.indexOf('>', tagOpen);
      if (tagEnd === -1) {
        pos = tagOpen + 2;
        continue;
      }
      // const closeTag = html.slice(tagOpen + 2, tagEnd).trim().split(/\s+/)[0];
      pos = tagEnd + 1;
      if (stack.length > 1) stack.pop();
      continue;
    }

    // Apertura de etiqueta <...>
    const tagEnd = html.indexOf('>', tagOpen);
    if (tagEnd === -1) break;
    const fullTag = html.slice(tagOpen + 1, tagEnd);

    // Self-closing <.../>
    const selfClosing = fullTag.endsWith('/');
    const cleanTag = (selfClosing ? fullTag.slice(0, -1) : fullTag).trim();

    // Extraer nombre de tag y atributos
    const spaceIdx = cleanTag.search(/\s/);
    const tagName = (spaceIdx !== -1 ? cleanTag.slice(0, spaceIdx) : cleanTag).toLowerCase();
    const attrsStr = spaceIdx !== -1 ? cleanTag.slice(spaceIdx + 1) : '';

    const attrs = parseAttrs(attrsStr);
    const id = attrs.id || undefined;

    const node: ASTNode = {
      tag: tagName,
      attrs,
      children: [],
      ...(id ? { id } : {}),
    };

    // Asignar al padre
    if (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top) top.children.push(node);
    }

    // Si es void o self-closing, no anidar
    if (!VOID_ELEMENTS.has(tagName) && !selfClosing) {
      stack.push(node);
    }

    pos = tagEnd + 1;
  }

  return root;
}

// ─── serializeAST ──────────────────────────────────────────

/**
 * Convierte un nodo AST (y sus hijos) de vuelta a string HTML.
 * Los nodos void se serializan sin etiqueta de cierre.
 */
export function serializeAST(node: ASTNode): string {
  if (node.tag === 'root') {
    return node.children.map((c) => serializeAST(c)).join('');
  }

  const attrsStr = serializeAttrs(node.attrs);
  const openTag = `<${node.tag}${attrsStr ? ' ' + attrsStr : ''}>`;

  if (VOID_ELEMENTS.has(node.tag)) {
    return openTag;
  }

  const childrenHTML = node.children.map((c) => serializeAST(c)).join('');
  const content = childrenHTML || node.text || '';
  const closeTag = `</${node.tag}>`;

  return `${openTag}${content}${closeTag}`;
}

// ─── findElementByPath ─────────────────────────────────────

/**
 * Encuentra un nodo en el AST siguiendo una ruta de índices.
 * Cada elemento del array `path` es un índice 0-based sobre `children`.
 *
 * Ejemplo: [0, 2, 1] → root.children[0].children[2].children[1]
 */
export function findElementByPath(ast: ASTNode, path: number[]): ASTNode | null {
  let current: ASTNode = ast;
  for (const idx of path) {
    if (!current.children || idx >= current.children.length) return null;
    const child = current.children[idx];
    if (!child) return null;
    current = child;
  }
  return current;
}

// ─── generateElementPath ───────────────────────────────────

/**
 * Genera la ruta (array de índices) hacia un elemento por su atributo `id`.
 * Retorna null si no se encuentra ningún elemento con ese ID.
 */
export function generateElementPath(ast: ASTNode, targetId: string): number[] | null {
  function search(node: ASTNode, currentPath: number[]): number[] | null {
    if (node.id === targetId) return currentPath;

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;
      const childPath = search(child, [...currentPath, i]);
      if (childPath) return childPath;
    }

    return null;
  }

  return search(ast, []);
}

// ─── applyPatchToAST ───────────────────────────────────────

/**
 * Aplica un parche de HTML en una ruta específica del AST.
 * Reemplaza el nodo en `path` con el nuevo HTML parseado.
 * La ruta debe apuntar a un nodo existente.
 *
 * Retorna un NUEVO AST (inmutable en cuanto a la raíz).
 */
export function applyPatchToAST(ast: ASTNode, path: number[], newHTML: string): ASTNode {
  const parsedFragment = parseHTMLToAST(newHTML);

  // Clon profundo con reemplazo en la ruta
  function cloneAndReplace(node: ASTNode, pathRemaining: number[], depth: number): ASTNode {
    if (pathRemaining.length === 0) {
      // Llegamos al nodo a reemplazar: devolver el contenido parseado
      // Si es un fragmento con varios hijos, devolvemos un wrapper
      const firstChild = parsedFragment.children[0];
      if (parsedFragment.children.length === 1 && firstChild) {
        return { ...firstChild };
      }
      // Si el fragmento tiene múltiples hijos, devolver un nodo span que los agrupe
      return {
        tag: 'span',
        attrs: {},
        children: parsedFragment.children.map((c) => ({ ...c })),
      };
    }

    const [idx, ...rest] = pathRemaining;
    const newChildren = node.children.map((child, i) => {
      if (i === idx) {
        return cloneAndReplace(child, rest, depth + 1);
      }
      return {
        ...child,
        children: child.children.map((cc) => ({ ...cc, children: [...cc.children] })),
      };
    });

    return { ...node, children: newChildren };
  }

  return cloneAndReplace(ast, path, 0);
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Parsea un string de atributos HTML (key="value" key2='value2' key3)
 * a un Record<string, string>.
 */
function parseAttrs(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!attrStr) return attrs;

  // Match: key="value", key='value', key=value, key (boolean)
  const attrRegex = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(attrStr)) !== null) {
    const key = match[1];
    if (!key) continue;
    // Preferir valor entrecomillado, luego sin comillas, luego true (boolean)
    const val = (match[2] ?? match[3] ?? match[4] ?? '') as string;
    attrs[key] = val;
  }
  return attrs;
}

/**
 * Serializa un Record de atributos a string HTML.
 */
function serializeAttrs(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([key, val]) => {
      if (val === '') return key;
      return `${key}="${val.replace(/"/g, '&quot;')}"`;
    })
    .join(' ');
}
