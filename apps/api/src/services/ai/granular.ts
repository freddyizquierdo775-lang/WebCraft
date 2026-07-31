import { openRouterCompletion } from '../../lib/openrouter';
import type { ASTNode } from './ast';
import { parseHTMLToAST, serializeAST } from './ast';

// ─── Tipos ─────────────────────────────────────────────────

export interface GranularEditResult {
  modified: string;
  diff: string;
  explanation: string;
  path: number[];
  tokens_in: number;
  tokens_out: number;
  model_used: string;
}

export interface GranularEditOptions {
  /** HTML completo del documento donde aplicar la edición */
  html: string;
  /** Selector CSS simplificado (id, class, tag) */
  selector: string;
  /** Instrucción de modificación en lenguaje natural */
  prompt: string;
  /** Modelo a usar (por defecto anthropic/claude-3.5-sonnet) */
  model?: string;
  /** Temperatura para el LLM (por defecto 0.3 para ediciones precisas) */
  temperature?: number;
}

// ─── Re-exports del módulo AST ─────────────────────────────

export { findElementByPath, generateElementPath, parseHTMLToAST } from './ast';
export type { ASTNode } from './ast';

// ─── CSS Selector Engine (regex, sin cheerio) ──────────────

interface SelectorMatch {
  html: string;
  startIndex: number;
  endIndex: number;
  path: number[];
  elementHTML: string;
  tagName: string;
  id: string | null;
  classes: string[];
}

/**
 * Encuentra un elemento en el HTML usando selectores CSS simples.
 * Soporta: #id, .class, tag, tag#id, tag.class.
 */
function findElementBySelector(html: string, selector: string): SelectorMatch | null {
  const trimmed = selector.trim();

  // ── Selector por ID: #mi-id ──────────────────────────────
  const idMatch = trimmed.match(/^#([\w-]+)$/);
  if (idMatch) {
    return findByAttribute(html, 'id', idMatch[1]!);
  }

  // ── Selector por clase: .mi-clase ────────────────────────
  const classMatch = trimmed.match(/^\.([\w-]+)$/);
  if (classMatch) {
    return findByClass(html, classMatch[1]!);
  }

  // ── Selector tag + id: div#mi-id ─────────────────────────
  const tagIdMatch = trimmed.match(/^(\w+)#([\w-]+)$/);
  if (tagIdMatch) {
    const m = findByAttribute(html, 'id', tagIdMatch[2]!);
    if (m && m.tagName.toLowerCase() === tagIdMatch[1]!.toLowerCase()) return m;
    return null;
  }

  // ── Selector tag + class: div.mi-clase ───────────────────
  const tagClassMatch = trimmed.match(/^(\w+)\.([\w-]+)$/);
  if (tagClassMatch) {
    return findByClassAndTag(html, tagClassMatch[2]!, tagClassMatch[1]!);
  }

  // ── Selector solo tag ────────────────────────────────────
  const tagMatch = trimmed.match(/^(\w+)$/);
  if (tagMatch) {
    return findByTag(html, tagMatch[1]!);
  }

  return null;
}

function findByAttribute(html: string, attr: string, value: string): SelectorMatch | null {
  // Buscar patrón: <tagname ... attr="value" ...>
  const regex = new RegExp(
    `<(\\w+)[^>]*\\s${attr}\\s*=\\s*["']${escapeRegex(value)}["'][^>]*>`,
    'i',
  );
  const match = regex.exec(html);
  if (!match) return null;

  const tagName = match[1]!;
  const startIndex = match.index;
  const tagOpen = match[0];

  // Encontrar el cierre correspondiente
  const closeInfo = findClosingTag(html, tagName, startIndex + tagOpen.length);
  if (!closeInfo) return null;

  const elementHTML = html.slice(startIndex, closeInfo.endIndex);

  return {
    html: elementHTML,
    startIndex,
    endIndex: closeInfo.endIndex,
    path: [], // Se llenará con el AST
    elementHTML: extractInnerHTML(tagName, elementHTML),
    tagName,
    id: value,
    classes: extractClasses(tagOpen),
  };
}

function findByClass(html: string, className: string): SelectorMatch | null {
  // Buscar patrón: class="... className ..." o class='... className ...'
  const regex = new RegExp(
    `<(\\w+)[^>]*\\sclass\\s*=\\s*["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>`,
    'i',
  );
  const match = regex.exec(html);
  if (!match) return null;

  const tagName = match[1]!;
  const startIndex = match.index;
  const tagOpen = match[0];

  const closeInfo = findClosingTag(html, tagName, startIndex + tagOpen.length);
  if (!closeInfo) return null;

  const elementHTML = html.slice(startIndex, closeInfo.endIndex);

  return {
    html: elementHTML,
    startIndex,
    endIndex: closeInfo.endIndex,
    path: [],
    elementHTML: extractInnerHTML(tagName, elementHTML),
    tagName,
    id: extractAttr(tagOpen, 'id'),
    classes: extractClasses(tagOpen),
  };
}

function findByClassAndTag(html: string, className: string, tagName: string): SelectorMatch | null {
  const regex = new RegExp(
    `<${escapeRegex(tagName)}[^>]*\\sclass\\s*=\\s*["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>`,
    'i',
  );
  const match = regex.exec(html);
  if (!match) return null;

  const startIndex = match.index;
  const tagOpen = match[0];
  const closeInfo = findClosingTag(html, tagName, startIndex + tagOpen.length);
  if (!closeInfo) return null;

  const elementHTML = html.slice(startIndex, closeInfo.endIndex);
  return {
    html: elementHTML,
    startIndex,
    endIndex: closeInfo.endIndex,
    path: [],
    elementHTML: extractInnerHTML(tagName, elementHTML),
    tagName,
    id: extractAttr(tagOpen, 'id'),
    classes: extractClasses(tagOpen),
  };
}

function findByTag(html: string, tagName: string): SelectorMatch | null {
  const regex = new RegExp(`<${escapeRegex(tagName)}(\\s[^>]*)?>`, 'gi');
  const match = regex.exec(html);
  if (!match) return null;

  const startIndex = match.index;
  const tagOpen = match[0];
  const closeInfo = findClosingTag(html, tagName, startIndex + tagOpen.length);
  if (!closeInfo) return null;

  const elementHTML = html.slice(startIndex, closeInfo.endIndex);
  return {
    html: elementHTML,
    startIndex,
    endIndex: closeInfo.endIndex,
    path: [],
    elementHTML: extractInnerHTML(tagName, elementHTML),
    tagName,
    id: extractAttr(tagOpen, 'id'),
    classes: extractClasses(tagOpen),
  };
}

// ─── Encontrar tag de cierre balanceado ────────────────────

function findClosingTag(
  html: string,
  tagName: string,
  startPos: number,
): { endIndex: number } | null {
  const voidElements = new Set([
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
  if (voidElements.has(tagName.toLowerCase())) {
    return { endIndex: startPos };
  }

  let depth = 1;
  let pos = startPos;
  const openRegex = new RegExp(`<${escapeRegex(tagName)}(\\s[^>]*)?(?:>|\\/>)`, 'gi');
  const closeRegex = new RegExp(`<\\/${escapeRegex(tagName)}\\s*>`, 'gi');

  while (pos < html.length && depth > 0) {
    // Buscar siguiente etiqueta de apertura o cierre
    const nextOpen = findNextRegex(html, openRegex, pos);
    const nextClose = findNextRegex(html, closeRegex, pos);

    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      openRegex.lastIndex = 0;
      pos = nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) {
        return { endIndex: nextClose + `</${tagName}>`.length };
      }
      closeRegex.lastIndex = 0;
      pos = nextClose + 1;
    }
  }

  return null;
}

function findNextRegex(html: string, regex: RegExp, startPos: number): number {
  regex.lastIndex = startPos;
  const m = regex.exec(html);
  return m ? m.index : -1;
}

// ─── Helpers ───────────────────────────────────────────────

function extractInnerHTML(tagName: string, fullElement: string): string {
  // Quitar etiqueta de apertura
  const openEnd = fullElement.indexOf('>') + 1;
  // Quitar etiqueta de cierre
  const closeStart = fullElement.lastIndexOf(`</${tagName}`);
  if (closeStart === -1) return fullElement.slice(openEnd);
  return fullElement.slice(openEnd, closeStart);
}

function extractAttr(tagOpen: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const m = regex.exec(tagOpen);
  return m?.[1] ?? null;
}

function extractClasses(tagOpen: string): string[] {
  const classAttr = extractAttr(tagOpen, 'class');
  return classAttr ? classAttr.split(/\s+/).filter(Boolean) : [];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── generateDiff ──────────────────────────────────────────

/**
 * Genera un unified diff entre dos strings (original y modificado).
 * Implementación simplificada sin dependencia de librerías externas.
 */
export function generateDiff(original: string, modified: string): string {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  // Algoritmo LCS simplificado para diff línea por línea
  const lcs = computeLCS(origLines, modLines);

  const result: string[] = [];
  let oi = 0;
  let mi = 0;

  for (const [origIdx, modIdx] of lcs) {
    // Líneas eliminadas (solo en original)
    while (oi < origIdx) {
      result.push(`- ${origLines[oi]}`);
      oi++;
    }
    // Líneas añadidas (solo en modificado)
    while (mi < modIdx) {
      result.push(`+ ${modLines[mi]}`);
      mi++;
    }
    // Línea sin cambios
    result.push(`  ${origLines[oi]}`);
    oi++;
    mi++;
  }

  // Remanentes
  while (oi < origLines.length) {
    result.push(`- ${origLines[oi]}`);
    oi++;
  }
  while (mi < modLines.length) {
    result.push(`+ ${modLines[mi]}`);
    mi++;
  }

  return result.join('\n');
}

/**
 * Computa Longest Common Subsequence entre dos arrays de strings.
 * Retorna array de pares [índice_en_a, índice_en_b].
 */
function computeLCS(a: string[], b: string[]): [number, number][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrack para obtener la secuencia
  const result: [number, number][] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if ((dp[i - 1]![j] ?? 0) > (dp[i]![j - 1] ?? 0)) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

// ─── applyGranularEdit ─────────────────────────────────────

/**
 * Función principal de edición granular.
 *
 * Flujo:
 * 1. Encuentra el elemento HTML usando el selector CSS
 * 2. Extrae el HTML interno del elemento
 * 3. Construye un prompt contextual para el LLM
 * 4. Llama a openRouterCompletion para obtener el HTML modificado
 * 5. Reemplaza el elemento en el HTML completo
 * 6. Genera el unified diff
 * 7. Retorna HTML modificado + diff + explicación
 */
export async function applyGranularEdit(options: GranularEditOptions): Promise<GranularEditResult> {
  const {
    html,
    selector,
    prompt,
    model = 'anthropic/claude-3.5-sonnet',
    temperature = 0.3,
  } = options;

  // ── 1. Encontrar el elemento ──────────────────────────────
  const match = findElementBySelector(html, selector);
  if (!match) {
    throw new Error(
      `No se encontró ningún elemento con el selector "${selector}" en el HTML proporcionado`,
    );
  }

  // ── 2. Construir path vía AST para trazabilidad ───────────
  const ast = parseHTMLToAST(html);
  const path = findPathForElement(ast, html, match.startIndex, match.endIndex);

  // ── 3. Construir el prompt contextual ─────────────────────
  const systemPrompt = `Eres un desarrollador web frontend senior especializado en ediciones precisas de HTML.
Tu tarea es modificar el HTML interno de un elemento específico según las instrucciones del usuario.

## REGLAS OBLIGATORIAS

1. **Solo modifica el contenido interno del elemento** — NO cambies la etiqueta HTML que lo envuelve, sus atributos (id, class, data-*, etc.) ni su estructura exterior.
2. **Preserva el formato original** — Mantén la indentación, atributos y estructura general del HTML proporcionado.
3. **HTML5 semántico** — Usa etiquetas semánticas dentro del elemento si es necesario.
4. **CSS inline o clases existentes** — No inventes nuevas clases CSS a menos que sea estrictamente necesario. Usa estilos inline si requieres ajustes visuales específicos.
5. **Responde ÚNICAMENTE con un JSON válido** — Sin markdown, sin texto adicional.

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con este JSON:

{
  "html": "<aquí el HTML interno modificado del elemento>",
  "explanation": "Explicación en español de los cambios realizados"
}

El campo "html" debe contener SOLO el contenido interno del elemento (lo que va entre la etiqueta de apertura y la de cierre), NO la etiqueta contenedora.`;

  const userMessage = `## ELEMENTO ACTUAL

Selector CSS: \`${selector}\`
Tag: <${match.tagName}>
ID: ${match.id || '(ninguno)'}
Clases: ${match.classes.length > 0 ? match.classes.join(', ') : '(ninguna)'}

### HTML interno actual del elemento:
\`\`\`html
${match.elementHTML}
\`\`\`

## INSTRUCCIÓN DE MODIFICACIÓN

${prompt}

Recuerda: solo debes devolver el HTML INTERNO modificado (sin la etiqueta <${match.tagName}> contenedora).`;

  // ── 4. Llamar al LLM ─────────────────────────────────────
  const completion = await openRouterCompletion({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 4096,
    temperature,
  });

  // ── 5. Parsear respuesta ─────────────────────────────────
  const parsed = parseGranularResponse(completion.content);
  const newInnerHTML = parsed.html;
  const explanation = parsed.explanation;

  // ── 6. Reemplazar en el HTML completo ────────────────────
  const openEndPos = html.indexOf('>', match.startIndex) + 1;
  const closeStartPos = match.endIndex - `</${match.tagName}>`.length;
  const before = html.slice(0, openEndPos);
  const after = html.slice(closeStartPos);
  const modifiedHTML = before + newInnerHTML + after;

  // ── 7. Generar diff ──────────────────────────────────────
  const diff = generateDiff(html, modifiedHTML);

  return {
    modified: modifiedHTML,
    diff,
    explanation,
    path,
    tokens_in: completion.tokens_in,
    tokens_out: completion.tokens_out,
    model_used: completion.model,
  };
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Parsea la respuesta JSON del LLM para edición granular.
 */
function parseGranularResponse(rawContent: string): { html: string; explanation: string } {
  let jsonStr = rawContent.trim();

  // Quitar bloque de markdown si existe
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    jsonStr = codeBlockMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      `El LLM no devolvió JSON válido para la edición granular. ` +
        `Primeros 200 caracteres: ${jsonStr.substring(0, 200)}`,
    );
  }

  const html = typeof parsed.html === 'string' ? parsed.html : '';
  const explanation =
    typeof parsed.explanation === 'string'
      ? parsed.explanation
      : 'Edición granular aplicada exitosamente';

  if (!html) {
    throw new Error('La respuesta del LLM no contiene campo "html" o está vacío');
  }

  return { html, explanation };
}

/**
 * Encuentra la ruta (path) en el AST que corresponde a un rango
 * de caracteres en el HTML original. Se usa para trazabilidad.
 */
function findPathForElement(
  ast: ASTNode,
  _html: string,
  _startIndex: number,
  _endIndex: number,
): number[] {
  // Estrategia simplificada: usar el AST para encontrar el elemento
  // por su contenido textual (primeros 50 chars del innerHTML)
  // y luego navegar la estructura para devolver la ruta.

  // Buscamos el nodo hoja más cercano al rango
  function search(node: ASTNode, currentPath: number[]): number[] | null {
    const nodeHTML = node.tag !== 'root' ? serializeAST(node) : '';

    // Si este nodo contiene el texto del rango, profundizar
    for (let i = 0; i < node.children.length; i++) {
      const childPath = search(node.children[i]!, [...currentPath, i]);
      if (childPath) return childPath;
    }

    // Si no hay hijos y este nodo no es root, devolver la ruta actual
    if (node.tag !== 'root' && node.children.length === 0) {
      return currentPath;
    }

    return null;
  }

  // Fallback: devolver ruta al primer nodo que contenga texto
  return search(ast, []) || [];
}
