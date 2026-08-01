'use client';

import { AIPanel } from '@/components/editor/AIPanel';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { OutlinePanel } from '@/components/editor/OutlinePanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createBrowserClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useEditorStore } from '@/stores/editor-store';
import { useProjectStore } from '@/stores/project-store';
import { ArrowLeft, Eye, Layers, Redo2, Save, Sparkles, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { currentProject, fetchProject } = useProjectStore();
  const { user } = useAuthStore();
  const {
    html,
    css,
    originalHtml,
    originalCss,
    canUndo,
    canRedo,
    selectedElement,
    setContent,
    setOriginalContent,
    applyEdit,
    undo,
    redo,
    selectElement,
    setAIEditing,
  } = useEditorStore();

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('ai');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const _outlineTree: unknown[] = [];

  // Load project
  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  // Load content into editor
  useEffect(() => {
    if (currentProject?.html_content) {
      setContent(
        currentProject.html_content,
        currentProject.css_content || '',
        currentProject.js_content || '',
      );
      setOriginalContent(currentProject.html_content, currentProject.css_content || '');
    }
  }, [currentProject, setContent, setOriginalContent]);

  // Check for unsaved changes
  useEffect(() => {
    setHasChanges(html !== originalHtml || css !== originalCss);
  }, [html, css, originalHtml, originalCss]);

  const handleSave = useCallback(async () => {
    if (!projectId) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from('user_projects')
      .update({ html_content: html, css_content: css, updated_at: new Date().toISOString() })
      .eq('id', projectId);
    if (!error) {
      setOriginalContent(html, css);
      setHasChanges(false);
    }
    setSaving(false);
  }, [projectId, html, css, setOriginalContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleSave]);

  // Autosave cada 30s cuando hay cambios
  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 30000);
    return () => clearTimeout(timer);
  }, [hasChanges, handleSave]);

  const handleElementSelect = useCallback(
    (el: { id: string; tag: string; path: string[]; html: string }) => {
      selectElement(el);
    },
    [selectElement],
  );

  const handleContentChange = useCallback(
    (newHtml: string, newCss: string) => {
      setContent(newHtml, newCss);
    },
    [setContent],
  );

  const handleAIApply = useCallback(
    (newHtml: string, diff: string) => {
      applyEdit(newHtml, css, `IA: ${diff.slice(0, 40)}...`);
      setAIEditing(false);
    },
    [css, applyEdit, setAIEditing],
  );

  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <header className="flex h-12 items-center gap-2 border-b bg-card px-3">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        <Separator orientation="vertical" className="h-6" />

        <span className="text-sm font-medium truncate max-w-[200px]">{currentProject.name}</span>

        <Badge variant="outline" className="text-xs">
          {currentProject.status}
        </Badge>

        <div className="flex-1" />

        {/* Undo/redo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canUndo}
          onClick={() => undo()}
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={!canRedo}
          onClick={() => redo()}
          title="Rehacer (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Panel toggles */}
        <Button
          variant={showLeftPanel ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          title="Panel de estructura"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button
          variant={showRightPanel ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowRightPanel(!showRightPanel)}
          title="Panel de IA"
        >
          <Sparkles className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Save */}
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving} className="gap-1">
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Outline */}
        {showLeftPanel && (
          <div className="w-56 flex-shrink-0 border-r bg-card">
            <OutlinePanel
              tree={_outlineTree}
              onSelectNode={(_id: string) => {
                // GrapesJS selection would be triggered here
              }}
              selectedId={selectedElement?.id || null}
            />
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <EditorCanvas
            projectId={projectId}
            initialHtml={html}
            initialCss={css}
            onElementSelect={handleElementSelect}
            onContentChange={handleContentChange}
          />
        </div>

        {/* Right panel — AI + Tabs */}
        {showRightPanel && (
          <div className="w-80 flex-shrink-0 border-l bg-card">
            <Tabs
              value={activeRightTab}
              onValueChange={setActiveRightTab}
              className="flex h-full flex-col"
            >
              <div className="border-b px-3 pt-2">
                <TabsList className="w-full">
                  <TabsTrigger value="ai" className="flex-1 text-xs gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    IA
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1 text-xs gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
                <AIPanel
                  selectedElement={selectedElement}
                  projectId={projectId}
                  onApplyEdit={handleAIApply}
                  credits={user?.credits_balance ?? 0}
                />
              </TabsContent>
              <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-4">
                <div className="rounded-lg border overflow-hidden h-full">
                  <iframe
                    srcDoc={`${html}<style>${css}</style>`}
                    className="h-full w-full"
                    title="Preview"
                    sandbox="allow-scripts"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex h-7 items-center gap-4 border-t bg-muted/30 px-4 text-xs text-muted-foreground">
        <span>Proyecto: {projectId?.slice(0, 8)}...</span>
        <span>{html.length.toLocaleString()} chars HTML</span>
        <span>{css.length.toLocaleString()} chars CSS</span>
        {hasChanges && <span className="text-amber-500">● Cambios sin guardar</span>}
        <div className="flex-1" />
        <span>WebCraft AI Studio — Editor v0.1</span>
      </footer>
    </div>
  );
}
