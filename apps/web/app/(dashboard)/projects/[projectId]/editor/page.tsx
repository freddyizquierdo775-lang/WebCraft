'use client';

import { AstRenderer } from '@/components/editor/AstRenderer';
import { BottomAIPanel } from '@/components/editor/BottomAIPanel';
import { OutlinePanel } from '@/components/editor/OutlinePanel';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { useProjectStore } from '@/stores/project-store';
import type { ASTNode } from '@/types/ast';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit3,
  Eye,
  GripVertical,
  Palette,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ─── Color palette selector ─────────────────────────
const QUICK_COLORS = [
  '#1e40af',
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#18181b',
  '#ffffff',
];

function astToHtml(node: ASTNode): string {
  const classes = node.classes.length > 0 ? ` class="${node.classes.join(' ')}"` : '';
  const styles =
    Object.keys(node.styles).length > 0
      ? ` style="${Object.entries(node.styles)
          .map(([k, v]) => `${k}:${v}`)
          .join(';')}"`
      : '';
  const children = node.children?.map(astToHtml).join('') ?? '';
  const voidTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
  if (voidTags.includes(node.tag)) return `<${node.tag}${classes}${styles} />`;
  return `<${node.tag}${classes}${styles}>${node.text ?? ''}${children}</${node.tag}>`;
}

const DEFAULT_AST: ASTNode = {
  id: 'root',
  tag: 'div',
  classes: ['min-h-screen', 'bg-white', 'flex', 'flex-col'],
  styles: {},
  children: [
    {
      id: 'header',
      tag: 'header',
      classes: ['p-6', 'bg-blue-600', 'text-white'],
      styles: {},
      text: 'Mi Sitio',
      children: [
        {
          id: 'nav',
          tag: 'nav',
          classes: ['flex', 'gap-4', 'mt-2', 'text-sm'],
          styles: {},
          text: 'Inicio | Servicios | Contacto',
        },
      ],
    },
    {
      id: 'hero',
      tag: 'section',
      classes: ['p-12', 'text-center', 'bg-gradient-to-br', 'from-blue-50', 'to-white'],
      styles: {},
      text: 'Bienvenido — tu sitio profesional comienza aquí',
    },
    {
      id: 'features',
      tag: 'section',
      classes: ['p-8', 'grid', 'grid-cols-3', 'gap-6'],
      styles: {},
      children: [
        {
          id: 'card1',
          tag: 'div',
          classes: ['p-6', 'bg-white', 'rounded-xl', 'shadow-sm', 'border', 'text-center'],
          styles: {},
          text: '⚡ Rápido',
        },
        {
          id: 'card2',
          tag: 'div',
          classes: ['p-6', 'bg-white', 'rounded-xl', 'shadow-sm', 'border', 'text-center'],
          styles: {},
          text: '🎨 Personalizable',
        },
        {
          id: 'card3',
          tag: 'div',
          classes: ['p-6', 'bg-white', 'rounded-xl', 'shadow-sm', 'border', 'text-center'],
          styles: {},
          text: '🚀 IA-Powered',
        },
      ],
    },
    {
      id: 'footer',
      tag: 'footer',
      classes: ['p-4', 'bg-gray-100', 'text-center', 'text-sm', 'text-gray-500', 'mt-auto'],
      styles: {},
      text: '© 2026 WebCraft AI Studio',
    },
  ],
};

// ─── Section card on the stitch canvas ───────────────
function SectionCard({
  node,
  index,
  total,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  editMode,
}: {
  node: ASTNode;
  index: number;
  total: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  editMode: boolean;
}) {
  const sectionLabel = node.text?.slice(0, 25) || node.tag;

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-white transition-all duration-200',
        editMode && 'cursor-pointer hover:shadow-lg',
        isSelected && editMode && 'ring-2 ring-purple-500 shadow-xl',
        !editMode && 'border-transparent',
      )}
      onClick={() => editMode && onSelect()}
      onKeyDown={(e) => {
        if (editMode && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Drag handle + label */}
      {editMode && (
        <div className="absolute -left-1 top-4 flex -translate-x-full items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Toolbar on select */}
      {editMode && isSelected && (
        <div className="absolute -top-9 right-2 z-20 flex items-center gap-1 rounded-lg border bg-white px-2 py-1 shadow-lg">
          <span className="mr-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {sectionLabel}
          </span>
          {onMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Section preview */}
      <div className={cn('overflow-hidden rounded-2xl', editMode && 'pointer-events-none')}>
        <AstRenderer node={node} editMode={false} />
      </div>

      {/* Position indicator */}
      {editMode && (
        <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          Sección {index + 1}/{total}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────
export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, fetchProject, loading, error } = useProjectStore();
  const { ast, selectedElementId, setAst, selectElement, undo, redo } = useEditorStore();

  const [showOutline, setShowOutline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [_hasChanges, setHasChanges] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editMode, setEditMode] = useState(true);

  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLen = useEditorStore((s) => s.history.length);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);
  useEffect(() => {
    if (currentProject?.html_content) {
      setAst(DEFAULT_AST);
      setHasChanges(false);
    }
  }, [currentProject, setAst]);

  const handleSave = useCallback(async () => {
    if (!projectId || !ast) return;
    setSaving(true);
    const supabase = createBrowserClient();
    await supabase
      .from('user_projects')
      .update({ html_content: astToHtml(ast), updated_at: new Date().toISOString() })
      .eq('id', projectId);
    setHasChanges(false);
    setSaving(false);
  }, [projectId, ast]);

  // Auto-save after 30s when there are changes
  useEffect(() => {
    if (!_hasChanges) return;
    const t = setTimeout(() => {
      handleSave();
    }, 30000);
    return () => clearTimeout(t);
  }, [_hasChanges, handleSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        setHasChanges(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        setHasChanges(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleSave]);

  const handleAIRequest = useCallback(async (_prompt: string) => {
    setAiLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setAiLoading(false);
    setHasChanges(true);
  }, []);

  const moveSection = useCallback(
    (index: number, dir: 'up' | 'down') => {
      if (!ast?.children) return;
      const children = [...ast.children];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= children.length) return;
      const a = children[index];
      const b = children[target];
      if (!a || !b) return;
      [children[index], children[target]] = [b, a];
      setAst({ ...ast, children });
      setHasChanges(true);
    },
    [ast, setAst],
  );

  const deleteSection = useCallback(
    (index: number) => {
      if (!ast?.children) return;
      setAst({ ...ast, children: ast.children.filter((_, i) => i !== index) });
      setHasChanges(true);
    },
    [ast, setAst],
  );

  // Error state — fetchProject falló (sesión expirada, RLS, red)
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No se pudo cargar el proyecto</h2>
        <p className="max-w-sm text-center text-sm text-gray-500">{error}</p>
        <div className="flex gap-3">
          <a href="/dashboard">
            <Button variant="outline" size="sm">
              ← Volver al dashboard
            </Button>
          </a>
          <Button
            size="sm"
            onClick={() => {
              if (projectId) fetchProject(projectId);
            }}
          >
            🔄 Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !currentProject) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <p className="text-sm text-gray-400">Cargando proyecto...</p>
      </div>
    );
  }

  // Final guard — no currentProject after loading finished (shouldn't happen but safe)
  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <span className="text-sm font-semibold text-gray-700">{currentProject.name}</span>
          {saving && <span className="text-xs text-gray-400 animate-pulse">Guardando...</span>}
        </div>

        <div className="flex items-center gap-3">
          {/* Color palette quick selector */}
          {editMode && (
            <div className="flex items-center gap-1 rounded-lg border bg-gray-50 px-2 py-1">
              <Palette className="h-3.5 w-3.5 text-gray-400" />
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="h-5 w-5 rounded-full border transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    /* future: apply color to selected */
                  }}
                />
              ))}
            </div>
          )}

          {/* Edit/Preview toggle */}
          <div className="flex rounded-lg border bg-gray-50 p-0.5">
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium',
                editMode ? 'bg-purple-600 text-white' : 'text-gray-500',
              )}
            >
              <Edit3 className="h-3 w-3" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium',
                !editMode ? 'bg-purple-600 text-white' : 'text-gray-500',
              )}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowOutline(!showOutline)}>
            Estructura
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={historyIndex <= 0}
              onClick={() => {
                undo();
                setHasChanges(true);
              }}
            >
              ↩
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={historyIndex >= historyLen - 1}
              onClick={() => {
                redo();
                setHasChanges(true);
              }}
            >
              ↪
            </Button>
          </div>
        </div>
      </header>

      {/* ── Canvas ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Outline drawer */}
        {showOutline && (
          <aside className="w-52 shrink-0 border-r bg-white p-3">
            <OutlinePanel
              tree={
                ast
                  ? [
                      {
                        id: ast.id,
                        tag: ast.tag,
                        label: ast.tag,
                        selected: ast.id === selectedElementId,
                        children:
                          ast.children?.map((c) => ({
                            id: c.id,
                            tag: c.tag,
                            label: c.text ?? c.tag,
                            selected: c.id === selectedElementId,
                            children: [],
                          })) ?? [],
                      },
                    ]
                  : []
              }
              onSelectNode={(id: string) => selectElement(id)}
              selectedId={selectedElementId}
            />
          </aside>
        )}

        {/* Main canvas area */}
        <main className="flex-1 overflow-y-auto p-6">
          {ast?.children ? (
            <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-24">
              {editMode
                ? ast.children.map((child, index) => (
                    <SectionCard
                      key={child.id}
                      node={child}
                      index={index}
                      total={ast.children?.length ?? 0}
                      isSelected={child.id === selectedElementId}
                      onSelect={() => selectElement(child.id)}
                      onMoveUp={index > 0 ? () => moveSection(index, 'up') : undefined}
                      onMoveDown={
                        index < (ast.children?.length ?? 0) - 1
                          ? () => moveSection(index, 'down')
                          : undefined
                      }
                      onDelete={() => deleteSection(index)}
                      editMode={editMode}
                    />
                  ))
                : ast.children.map((child) => (
                    <AstRenderer key={child.id} node={child} editMode={false} />
                  ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              Sin contenido — genera tu sitio desde el dashboard
            </div>
          )}
        </main>
      </div>

      {/* AI bar */}
      {editMode && <BottomAIPanel onSubmit={handleAIRequest} loading={aiLoading} />}
    </div>
  );
}
