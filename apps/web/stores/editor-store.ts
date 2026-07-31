'use client';

import { create } from 'zustand';

interface Snapshot {
  html: string;
  css: string;
  timestamp: number;
  label: string;
}

interface EditorState {
  // Content
  html: string;
  css: string;
  js: string;
  originalHtml: string;
  originalCss: string;

  // Undo/redo
  snapshots: Snapshot[];
  currentSnapshotIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Selection
  selectedElement: { id: string; tag: string; path: string[]; html: string } | null;

  // AI edits
  isAIEditing: boolean;

  // Actions
  setContent: (html: string, css: string, js?: string) => void;
  setOriginalContent: (html: string, css: string) => void;
  applyEdit: (html: string, css: string, label: string) => void;
  undo: () => Snapshot | null;
  redo: () => Snapshot | null;
  selectElement: (el: { id: string; tag: string; path: string[]; html: string } | null) => void;
  setAIEditing: (editing: boolean) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  html: '',
  css: '',
  js: '',
  originalHtml: '',
  originalCss: '',
  snapshots: [],
  currentSnapshotIndex: -1,
  canUndo: false,
  canRedo: false,
  selectedElement: null,
  isAIEditing: false,

  setContent: (html, css, js = '') => {
    set({ html, css, js });
  },

  setOriginalContent: (html, css) => {
    set({ originalHtml: html, originalCss: css });
    // Take initial snapshot
    const state = get();
    if (state.snapshots.length === 0) {
      set({
        snapshots: [{ html, css, timestamp: Date.now(), label: 'Estado inicial' }],
        currentSnapshotIndex: 0,
        canUndo: false,
        canRedo: false,
      });
    }
  },

  applyEdit: (html, css, label) => {
    const state = get();
    const newSnapshots = state.snapshots.slice(0, state.currentSnapshotIndex + 1);
    newSnapshots.push({ html, css, timestamp: Date.now(), label });

    set({
      html,
      css,
      snapshots: newSnapshots,
      currentSnapshotIndex: newSnapshots.length - 1,
      canUndo: newSnapshots.length > 1,
      canRedo: false,
      selectedElement: null,
    });
  },

  undo: () => {
    const state = get();
    if (state.currentSnapshotIndex <= 0) return null;

    const newIndex = state.currentSnapshotIndex - 1;
    const snapshot = state.snapshots[newIndex]!;

    set({
      html: snapshot.html,
      css: snapshot.css,
      currentSnapshotIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
      selectedElement: null,
    });

    return snapshot;
  },

  redo: () => {
    const state = get();
    if (state.currentSnapshotIndex >= state.snapshots.length - 1) return null;

    const newIndex = state.currentSnapshotIndex + 1;
    const snapshot = state.snapshots[newIndex]!;

    set({
      html: snapshot.html,
      css: snapshot.css,
      currentSnapshotIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.snapshots.length - 1,
      selectedElement: null,
    });

    return snapshot;
  },

  selectElement: (el) => set({ selectedElement: el }),
  setAIEditing: (editing) => set({ isAIEditing: editing }),

  reset: () =>
    set({
      html: '',
      css: '',
      js: '',
      originalHtml: '',
      originalCss: '',
      snapshots: [],
      currentSnapshotIndex: -1,
      canUndo: false,
      canRedo: false,
      selectedElement: null,
      isAIEditing: false,
    }),
}));
