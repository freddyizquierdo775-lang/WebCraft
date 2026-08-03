'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createBrowserClient } from '@/lib/supabase';
import { useProjectStore } from '@/stores/project-store';
import {
  Clock, Copy, Edit3, ExternalLink, Globe, Loader2,
  MoreHorizontal, PlusCircle, Sparkles, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const STATUS_MAP = {
  draft: { label: 'Borrador', variant: 'secondary' as const, icon: Edit3 },
  generating: { label: 'Generando', variant: 'secondary' as const, icon: Sparkles },
  ready: { label: 'Listo', variant: 'default' as const, icon: Globe },
  published: { label: 'Publicado', variant: 'default' as const, icon: ExternalLink },
  archived: { label: 'Archivado', variant: 'outline' as const, icon: Clock },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Dropdown menu inline ──────────────────────────────
function ActionsDropdown({ onEdit, onDomain, onDuplicate, onDelete }: {
  onEdit: () => void; onDomain: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border bg-card p-1 shadow-xl">
          <button type="button" onClick={() => { onEdit(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"><Edit3 className="h-4 w-4" />Editar</button>
          <button type="button" onClick={() => { onDomain(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"><Globe className="h-4 w-4" />Configurar dominio</button>
          <button type="button" onClick={() => { onDuplicate(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"><Copy className="h-4 w-4" />Duplicar</button>
          <button type="button" onClick={() => { onDelete(); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" />Eliminar</button>
        </div>
      )}
    </div>
  );
}

// ─── Publish Modal ──────────────────────────────────────
function PublishModal({ projectName, onClose, onConfirm, loading }: {
  projectName: string; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl">
        <h3 className="text-lg font-bold">Publicar en 1-Click 🚀</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu sitio <strong>{projectName}</strong> estará disponible en internet con un subdominio gratuito de WebCraft.
        </p>
        <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          🌐 URL: <strong>{projectName.toLowerCase().replace(/\s+/g, '-')}.webcraft.me</strong>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={onConfirm} disabled={loading}>{loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}Publicar ahora</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Domain Modal ───────────────────────────────────────
function DomainModal({ projectName, onClose }: { projectName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl">
        <h3 className="text-lg font-bold">Configurar dominio · SEO</h3>
        <p className="mt-2 text-sm text-muted-foreground">Conecta tu propio dominio a <strong>{projectName}</strong>.</p>
        <div className="mt-4 space-y-3">
          <input type="text" placeholder="midominio.com" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <input type="text" placeholder="Título SEO" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <textarea placeholder="Descripción meta (160 caracteres)" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
          <Button size="sm">Guardar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────
export default function DashboardPage() {
  const { projects, loading, fetchProjects } = useProjectStore();
  const [publishTarget, setPublishTarget] = useState<{ id: string; name: string } | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [domainTarget, setDomainTarget] = useState<string | null>(null);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handlePublish = useCallback(async () => {
    if (!publishTarget) return;
    setPublishLoading(true);
    const supabase = createBrowserClient();
    await supabase.from('user_projects').update({ status: 'published', published_url: `https://${publishTarget.name.toLowerCase().replace(/\s+/g, '-')}.webcraft.me` }).eq('id', publishTarget.id);
    await fetchProjects();
    setPublishLoading(false);
    setPublishTarget(null);
  }, [publishTarget, fetchProjects]);

  const handleDuplicate = useCallback(async (id: string) => {
    const supabase = createBrowserClient();
    const { data: original } = await supabase.from('user_projects').select('*').eq('id', id).single();
    if (!original) return;
    await supabase.from('user_projects').insert({
      owner_id: original.owner_id, name: `${original.name} (copia)`, description: original.description,
      business_type: original.business_type, briefing_data: original.briefing_data,
      html_content: original.html_content, css_content: original.css_content, status: 'draft',
    });
    await fetchProjects();
  }, [fetchProjects]);

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createBrowserClient();
    await supabase.from('user_projects').delete().eq('id', id);
    await fetchProjects();
  }, [fetchProjects]);

  const isEmpty = !loading && projects.length === 0;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mis Sitios</h2>
          <p className="text-sm text-muted-foreground">Gestiona y edita tus sitios web generados con IA</p>
        </div>
        <Link href="/onboarding"><Button className="gap-2"><PlusCircle className="h-4 w-4" />Nuevo sitio</Button></Link>
      </div>

      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-8 w-8 text-primary" /></div>
            <h3 className="mb-2 text-lg font-semibold">Aún no tienes sitios</h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">Describe tu negocio y deja que la IA genere un sitio web profesional para ti en segundos.</p>
            <Link href="/onboarding"><Button size="lg" className="gap-2"><PlusCircle className="h-5 w-5" />Crear mi primer sitio</Button></Link>
          </CardContent>
        </Card>
      )}

      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const statusInfo = STATUS_MAP[project.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.draft;
            const StatusIcon = statusInfo.icon;
            return (
              <Card key={project.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5">
                  {project.published_url ? <Globe className="h-12 w-12 text-muted-foreground/40" /> : <Sparkles className="h-12 w-12 text-primary/30" />}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Link href={`/projects/${project.id}`} className="hover:underline"><CardTitle className="text-base">{project.name}</CardTitle></Link>
                      <CardDescription className="line-clamp-1 text-xs">{project.description}</CardDescription>
                    </div>
                    <ActionsDropdown
                      onEdit={() => { window.location.href = `/projects/${project.id}/editor`; }}
                      onDomain={() => setDomainTarget(project.name)}
                      onDuplicate={() => handleDuplicate(project.id)}
                      onDelete={() => handleDelete(project.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { if (project.status === 'draft' || project.status === 'ready') setPublishTarget({ id: project.id, name: project.name }); }}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${project.status === 'published' ? 'cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-primary/30'}`}
                    >
                      <Badge variant={statusInfo.variant} className="gap-1 pointer-events-none">
                        <StatusIcon className="h-3 w-3" />{statusInfo.label}
                      </Badge>
                    </button>
                    <span className="text-xs text-muted-foreground">{formatDate(project.created_at || '')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                      <Link href={`/projects/${project.id}/editor`}><Edit3 className="h-3.5 w-3.5" />Editar</Link>
                    </Button>
                    {project.published_url ? (
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <a href={project.published_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" />Visitar</a>
                      </Button>
                    ) : project.preview_url ? (
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <a href={project.preview_url} target="_blank" rel="noopener noreferrer"><Globe className="h-3.5 w-3.5" />Preview</a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <Link href={`/projects/${project.id}`}><Sparkles className="h-3.5 w-3.5" />Generar</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Sitios creados', value: projects.length, icon: Globe },
            { label: 'Publicados', value: projects.filter((p) => p.status === 'published').length, icon: ExternalLink },
            { label: 'Borradores', value: projects.filter((p) => p.status === 'draft').length, icon: Edit3 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {publishTarget && (
        <PublishModal projectName={publishTarget.name} onClose={() => setPublishTarget(null)} onConfirm={handlePublish} loading={publishLoading} />
      )}
      {domainTarget && (
        <DomainModal projectName={domainTarget} onClose={() => setDomainTarget(null)} />
      )}
    </div>
  );
}
