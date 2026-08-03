'use client';

import { AstRenderer } from '@/components/editor/AstRenderer';
import { BottomAIPanel } from '@/components/editor/BottomAIPanel';
import { CanvasSectionPanel } from '@/components/editor/CanvasSectionPanel';
import { OutlinePanel } from '@/components/editor/OutlinePanel';
import { RightFloatingBar } from '@/components/editor/RightFloatingBar';
import { createBrowserClient } from '@/lib/supabase';
import { useEditorStore } from '@/stores/editor-store';
import { useProjectStore } from '@/stores/project-store';
import type { ASTNode } from '@/types/ast';
import { ArrowLeft, Edit3, Eye } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
      classes: ['p-6', 'bg-purple-600', 'text-white'],
      styles: {},
      text: 'Mi Sitio Web',
      children: [
        {
          id: 'nav',
          tag: 'nav',
          classes: ['flex', 'gap-4', 'mt-2'],
          styles: {},
          text: 'Inicio | Servicios | Contacto',
        },
      ],
    },
    {
      id: 'hero',
      tag: 'section',
      classes: ['p-12', 'text-center'],
      styles: {},
      text: 'Bienvenido a tu nuevo sitio',
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

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, fetchProject } = useProjectStore();
  const { ast, selectedElementId, setAst, selectElement, undo, redo } = useEditorStore();

  const [showOutline, setShowOutline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [editMode, setEditMode] = useState(true);

  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLen = useEditorStore((s) => s.history.length);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLen - 1;

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

  // Keyboard shortcuts
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

  useEffect(() => {
    if (!hasChanges) return;
    const t = setTimeout(() => handleSave(), 30000);
    return () => clearTimeout(t);
  }, [hasChanges, handleSave]);

  // AI request — global (bottom bar)
  const handleAIRequest = useCallback(
    async (prompt: string) => {
      if (!ast || !projectId) return;
      setAiLoading(true);
      console.log('[AI Global Payload]', { prompt, selectedElementId, ast, projectId });
      await new Promise((r) => setTimeout(r, 1500));
      setAiLoading(false);
      setHasChanges(true);
    },
    [ast, selectedElementId, projectId],
  );

  // Section-level AI edit
  const handleSectionAIEdit = useCallback((sectionId: string, prompt: string) => {
    console.log('[Section AI Edit]', { sectionId, prompt });
    setHasChanges(true);
  }, []);

  // Reorder sections
  const moveSection = useCallback(
    (index: number, direction: 'up' | 'down') => {
      if (!ast?.children) return;
      const newChildren = [...ast.children];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newChildren.length) return;
      [newChildren[index], newChildren[targetIndex]] = [
        newChildren[targetIndex]!,
        newChildren[index]!,
      ];
      const newAst = { ...ast, children: newChildren };
      setAst(newAst);
      setHasChanges(true);
    },
    [ast, setAst],
  );

  // Delete section
  const deleteSection = useCallback(
    (index: number) => {
      if (!ast?.children) return;
      const newChildren = ast.children.filter((_, i) => i !== index);
      setAst({ ...ast, children: newChildren });
      setHasChanges(true);
    },
    [ast, setAst],
  );

  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-dot-pattern">
        <p className="text-muted-foreground">Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-dot-pattern">
      {/* Top bar */}
      <div className="absolute left-4 top-4 z-50 flex items-center gap-3">
        <Link href={`/projects/${projectId}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-card hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </div>
        </Link>
        <span className="text-sm font-medium text-muted-foreground">{currentProject.name}</span>
        {saving && (
          <span className="text-xs text-muted-foreground animate-pulse">Guardando...</span>
        )}

        {/* Edit / Preview toggle */}
        <div className="ml-4 flex items-center rounded-lg border bg-card/90 p-0.5 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${editMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Edit3 className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${!editMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center p-8 pt-20">
        <div className="w-full max-w-5xl overflow-hidden rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-[11px] text-muted-foreground">
              {currentProject.name || 'localhost:3000'}
            </span>
          </div>
          <div className="max-h-[60vh] overflow-auto">
            {ast ? (
              editMode && ast.children ? (
                // Stitch Canvas: wrap each top-level section in a panel
                <div
                  className={ast.classes.join(' ')}
                  style={
                    Object.keys(ast.styles).length > 0
                      ? (ast.styles as React.CSSProperties)
                      : undefined
                  }
                >
                  {ast.children.map((child, index) => (
                    <CanvasSectionPanel
                      key={child.id}
                      sectionId={child.id}
                      sectionName={child.text ? child.text.slice(0, 30) : child.tag}
                      isSelected={child.id === selectedElementId}
                      onSelect={() => selectElement(child.id)}
                      onMoveUp={index > 0 ? () => moveSection(index, 'up') : undefined}
                      onMoveDown={
                        index < ast.children!.length - 1
                          ? () => moveSection(index, 'down')
                          : undefined
                      }
                      onDelete={() => deleteSection(index)}
                      onAIEdit={(prompt) => handleSectionAIEdit(child.id, prompt)}
                      editMode={editMode}
                    >
                      <AstRenderer node={child} editMode={editMode} />
                    </CanvasSectionPanel>
                  ))}
                </div>
              ) : (
                <AstRenderer node={ast} editMode={false} />
              )
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Sin contenido — genera tu sitio desde el dashboard
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Outline panel */}
      {showOutline && (
        <div className="absolute left-4 top-20 z-40 w-56 rounded-xl border bg-card/95 shadow-lg backdrop-blur">
          <div className="p-2">
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
          </div>
        </div>
      )}

      <RightFloatingBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => {
          undo();
          setHasChanges(true);
        }}
        onRedo={() => {
          redo();
          setHasChanges(true);
        }}
        onToggleOutline={() => setShowOutline(!showOutline)}
        showOutline={showOutline}
      />

      {editMode && <BottomAIPanel onSubmit={handleAIRequest} loading={aiLoading} />}
    </div>
  );
}
