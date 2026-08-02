export interface ASTNode {
  id: string;
  tag: string;
  classes: string[];
  styles: Record<string, string>;
  text?: string;
  children?: ASTNode[];
}

export interface EditorState {
  ast: ASTNode | null;
  selectedElementId: string | null;
  history: ASTNode[][];
  historyIndex: number;
}

export interface EditorActions {
  setAst: (ast: ASTNode) => void;
  selectElement: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<ASTNode>) => void;
  undo: () => void;
  redo: () => void;
}

export type EditorStore = EditorState & EditorActions;

export function cloneAst(node: ASTNode): ASTNode {
  return JSON.parse(JSON.stringify(node));
}

/** Retorna la ruta de ids desde la raíz hasta el nodo con el id dado */
export function findNodePath(root: ASTNode, targetId: string): string[] | null {
  if (root.id === targetId) return [root.id];
  if (!root.children) return null;
  for (const child of root.children) {
    const path = findNodePath(child, targetId);
    if (path) return [root.id, ...path];
  }
  return null;
}

/** Retorna el nodo padre del nodo con el id dado, o null si es la raíz */
export function findParentNode(root: ASTNode, targetId: string): ASTNode | null {
  if (!root.children) return null;
  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentNode(child, targetId);
    if (found) return found;
  }
  return null;
}
