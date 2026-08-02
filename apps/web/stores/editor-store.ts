'use client';

import type { ASTNode } from '@/types/ast';
import { cloneAst } from '@/types/ast';
import { create } from 'zustand';

const MAX_HISTORY = 50;

interface EditorState {
  ast: ASTNode | null;
  selectedElementId: string | null;
  history: ASTNode[];
  historyIndex: number;

  setAst: (ast: ASTNode) => void;
  selectElement: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<ASTNode>) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

function pushHistory(history: ASTNode[], historyIndex: number, newAst: ASTNode) {
  const trimmed = history.slice(0, historyIndex + 1);
  trimmed.push(cloneAst(newAst));
  if (trimmed.length > MAX_HISTORY) trimmed.shift();
  return {
    history: trimmed,
    historyIndex: trimmed.length - 1,
    ast: newAst,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ast: null,
  selectedElementId: null,
  history: [],
  historyIndex: -1,

  setAst: (ast) => {
    set({
      ast,
      history: [cloneAst(ast)],
      historyIndex: 0,
      selectedElementId: null,
    });
  },

  selectElement: (id) => set({ selectedElementId: id }),

  updateNode: (id, updates) => {
    const state = get();
    if (!state.ast) return;
    const newAst = cloneAst(state.ast);
    const updated = applyUpdate(newAst, id, updates);
    if (!updated) return;
    set(pushHistory(state.history, state.historyIndex, newAst));
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return;
    const newIndex = state.historyIndex - 1;
    const entry = state.history[newIndex];
    if (!entry) return;
    set({
      ast: cloneAst(entry),
      historyIndex: newIndex,
      selectedElementId: null,
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return;
    const newIndex = state.historyIndex + 1;
    const entry = state.history[newIndex];
    if (!entry) return;
    set({
      ast: cloneAst(entry),
      historyIndex: newIndex,
      selectedElementId: null,
    });
  },

  reset: () =>
    set({
      ast: null,
      selectedElementId: null,
      history: [],
      historyIndex: -1,
    }),
}));

/** Aplica updates a un nodo (búsqueda recursiva). Retorna true si lo encontró. */
function applyUpdate(root: ASTNode, targetId: string, updates: Partial<ASTNode>): boolean {
  if (root.id === targetId) {
    if (updates.classes !== undefined) root.classes = updates.classes;
    if (updates.styles !== undefined) root.styles = updates.styles;
    if (updates.text !== undefined) root.text = updates.text;
    if (updates.tag !== undefined) root.tag = updates.tag;
    if (updates.children !== undefined) root.children = updates.children;
    return true;
  }
  if (!root.children) return false;
  for (const child of root.children) {
    if (applyUpdate(child, targetId, updates)) return true;
  }
  return false;
}
