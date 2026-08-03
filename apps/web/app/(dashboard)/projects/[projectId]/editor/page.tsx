'use client';

import { AstRenderer } from '@/components/editor/AstRenderer';
import { BottomAIPanel } from '@/components/editor/BottomAIPanel';
import { CanvasSectionPanel } from '@/components/editor/CanvasSectionPanel';
import { Button } from '@/components/ui/button';
import { createBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { useProjectStore } from '@/stores/project-store';
import type { ASTNode } from '@/types/ast';
import { cloneAst } from '@/types/ast';
import {
  ArrowLeft,
  CreditCard,
  Edit3,
  Eye,
  Globe,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const SIDEBAR_ITEMS = [
  { icon: Store, label: 'Nuestro sitio', href: '/dashboard' },
  { icon: Globe, label: 'Marketplace', href: '/marketplace' },
  { icon: ShoppingBag, label: 'Tienda', href: '/ecommerce' },
  { icon: CreditCard, label: 'Pagos', href: '/payment-setup' },
];

function findInTree(node: ASTNode, targetId: string): ASTNode | null {
  if (node.id === targetId) return node;
  if (!node.children) return null;
  for (const child of node.children) {
    const found = findInTree(child, targetId);
    if (found) return found;
  }
  return null;
}

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
      classes: ['p-12', 'text-center'],
      styles: {},
      text: 'Bienvenido a tu nuevo sitio web profesional',
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

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, fetchProject, loading, error } = useProjectStore();
  const { ast, selectedElementId, setAst, selectElement, undo, redo } = useEditorStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [_hasChanges, setHasChanges] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
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
    const supabase = createBrowserClient();
    await supabase
      .from('user_projects')
      .update({ html_content: astToHtml(ast), updated_at: new Date().toISOString() })
      .eq('id', projectId);
    setHasChanges(false);
  }, [projectId, ast]);

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

  const handleAIRequest = useCallback(
    async (prompt: string) => {
      if (!projectId || !ast) return;
      setAiLoading(true);
      setAiResponse('');
      const selectedNode = selectedElementId ? findInTree(ast, selectedElementId) : null;
      const elementHtml = selectedNode ? astToHtml(selectedNode) : '';
      const fullHtml = astToHtml(ast);
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_KEY || '';
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://webcraft.ai',
            'X-Title': 'WebCraft AI Studio',
          },
          body: JSON.stringify({
            model: 'openrouter/free',
            messages: [
              {
                role: 'system',
                content:
                  'Eres un editor web. Responde SOLO con HTML del fragmento modificado. Sin explicaciones.',
              },
              {
                role: 'user',
                content: `Sitio HTML:\n${fullHtml.slice(0, 3000)}\n\nElemento seleccionado:\n${elementHtml || '(nada)'}\n\nPrompt: ${prompt}\n\nDevuelve SOLO el HTML mejorado.`,
              },
            ],
            max_tokens: 2000,
          }),
        });
        const data = await res.json();
        setAiResponse(data.choices?.[0]?.message?.content || 'Sin respuesta.');
      } catch (err) {
        setAiResponse(`Error: ${err instanceof Error ? err.message : 'desconocido'}`);
      }
      setAiLoading(false);
      setHasChanges(true);
    },
    [projectId, ast, selectedElementId],
  );

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

  const duplicateSection = useCallback(
    (index: number) => {
      if (!ast?.children) return;
      const original = ast.children[index];
      if (!original) return;
      const cloned = cloneAst(original);
      cloned.id = `${original.id}_copy_${Date.now()}`;
      const children = [...ast.children];
      children.splice(index + 1, 0, cloned);
      setAst({ ...ast, children });
      setHasChanges(true);
    },
    [ast, setAst],
  );

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <span className="text-3xl">⚠️</span>
        <h2 className="text-lg font-semibold text-gray-700">No se pudo cargar</h2>
        <p className="max-w-sm text-center text-sm text-gray-500">{error}</p>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              ← Dashboard
            </Button>
          </Link>
          <Button size="sm" onClick={() => projectId && fetchProject(projectId)}>
            🔄 Reintentar
          </Button>
        </div>
      </div>
    );
  }
  if (loading && !currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }
  if (!currentProject) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside
        className={cn(
          'flex flex-col border-r bg-gray-50 transition-all duration-300',
          sidebarOpen ? 'w-56' : 'w-14',
        )}
      >
        <div className="flex items-center justify-between px-3 py-3">
          {sidebarOpen && (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              WebCraft
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className={cn(
            'flex items-center gap-2 mx-2 mb-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200',
            !sidebarOpen && 'justify-center px-2',
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {sidebarOpen && <span className="truncate text-xs">Volver</span>}
        </Link>
        <nav className="mt-3 flex-1 space-y-0.5 px-2">
          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-200',
                !sidebarOpen && 'justify-center px-2',
              )}
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="text-xs">{item.label}</span>}
            </Link>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="border-t px-3 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
              {currentProject.name}
            </p>
            <p className="text-[10px] text-gray-400">{ast?.children?.length ?? 0} secciones</p>
          </div>
        )}
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b bg-white px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-700">{currentProject.name}</h2>
            <span className="text-[10px] text-gray-400">
              {ast?.children?.length ?? 0} secciones
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-xs"
              disabled={historyIndex <= 0}
              onClick={() => {
                undo();
                setHasChanges(true);
              }}
              title="Deshacer"
            >
              ↩
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-xs"
              disabled={historyIndex >= historyLen - 1}
              onClick={() => {
                redo();
                setHasChanges(true);
              }}
              title="Rehacer"
            >
              ↪
            </Button>
            <div className="mx-2 h-4 w-px bg-gray-200" />
            <Button variant="ghost" size="icon" className="h-7 w-7" title="Capas">
              <Layers className="h-4 w-4" />
            </Button>
            <div className="flex rounded-lg border bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium',
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
                  'flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium',
                  !editMode ? 'bg-purple-600 text-white' : 'text-gray-500',
                )}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto bg-slate-50"
          style={{
            backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="mx-auto max-w-3xl px-6 py-8">
            {ast?.children ? (
              <div className="flex flex-col gap-8 pb-32">
                {editMode
                  ? ast.children.map((child, index) => (
                      <CanvasSectionPanel
                        key={child.id}
                        sectionId={child.id}
                        sectionName={child.text?.slice(0, 25) || child.tag}
                        isSelected={child.id === selectedElementId}
                        onSelect={() => selectElement(child.id)}
                        onMoveUp={index > 0 ? () => moveSection(index, 'up') : undefined}
                        onMoveDown={
                          index < (ast.children?.length ?? 0) - 1
                            ? () => moveSection(index, 'down')
                            : undefined
                        }
                        onDuplicate={() => duplicateSection(index)}
                        onDelete={() => deleteSection(index)}
                        onAIEdit={(prompt) => handleAIRequest(prompt)}
                        editMode={editMode}
                      >
                        <AstRenderer node={child} editMode={false} />
                      </CanvasSectionPanel>
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
          </div>
        </div>

        {aiResponse && (
          <div className="mx-4 mb-2 max-h-48 overflow-auto rounded-xl border bg-gray-900 p-3 text-xs font-mono text-green-400">
            <pre className="whitespace-pre-wrap">{aiResponse}</pre>
          </div>
        )}
      </main>

      {editMode && <BottomAIPanel onSubmit={handleAIRequest} loading={aiLoading} />}
    </div>
  );
}
