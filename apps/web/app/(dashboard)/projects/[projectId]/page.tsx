'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createBrowserClient } from '@/lib/supabase';
import { useProjectStore } from '@/stores/project-store';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  Globe,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <Clock className="h-4 w-4" />,
  generating: <Sparkles className="h-4 w-4 animate-pulse" />,
  ready: <CheckCircle2 className="h-4 w-4" />,
  published: <Globe className="h-4 w-4" />,
  archived: <Clock className="h-4 w-4" />,
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  generating: 'Generando...',
  ready: 'Listo para publicar',
  published: 'Publicado',
  archived: 'Archivado',
};

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, fetchProject, loading } = useProjectStore();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  const handleGenerate = async () => {
    if (!projectId) return;
    setGenerating(true);

    const supabase = createBrowserClient();
    const { data: session } = await supabase.auth.getUser();
    const idempotencyKey = crypto.randomUUID();

    // Llamar al backend API
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/projects/${projectId}/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.user?.id}`,
          },
          body: JSON.stringify({ idempotency_key: idempotencyKey }),
        },
      );

      if (res.ok) {
        // Poll for completion
        await fetchProject(projectId);
      }
    } catch (err) {
      console.error('Generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center py-20">
        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <Link href="/dashboard">
          <Button variant="link" className="mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{currentProject.name}</h2>
            <p className="text-sm text-muted-foreground">
              {currentProject.description || 'Sin descripción'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={currentProject.status === 'published' ? 'default' : 'secondary'}
            className="gap-1"
          >
            {STATUS_ICONS[currentProject.status]}
            {STATUS_LABELS[currentProject.status]}
          </Badge>
          {currentProject.status === 'draft' && (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {generating ? 'Generando...' : 'Generar sitio'}
            </Button>
          )}
          {currentProject.status === 'ready' && (
            <Button variant="outline" className="gap-2">
              <Globe className="h-4 w-4" />
              Publicar
            </Button>
          )}
          {currentProject.published_url && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={currentProject.published_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Visitar
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Generating state */}
      {currentProject.status === 'generating' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center py-12">
            <Sparkles className="mb-4 h-12 w-12 animate-pulse text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Generando tu sitio web</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              La IA está creando tu sitio basado en el briefing. Esto puede tomar ~30 segundos.
            </p>
            <Progress value={60} className="h-2 w-64" />
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {currentProject.html_content && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Vista previa
              </CardTitle>
              <CardDescription>Contenido generado por IA</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <iframe
                srcDoc={
                  currentProject.html_content +
                  (currentProject.css_content
                    ? `<style>${currentProject.css_content}</style>`
                    : '') +
                  (currentProject.js_content ? `<script>${currentProject.js_content}</script>` : '')
                }
                className="h-[500px] w-full"
                title="Site preview"
                sandbox="allow-scripts"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Briefing summary */}
      {currentProject.briefing_data &&
        Object.keys(currentProject.briefing_data as object).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Briefing del proyecto</CardTitle>
              <CardDescription>Datos proporcionados a la IA para la generación</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(currentProject.briefing_data as Record<string, unknown>).map(
                  ([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-sm">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </CardContent>
          </Card>
        )}

      {/* Empty state */}
      {currentProject.status === 'draft' && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <Sparkles className="mb-4 h-16 w-16 text-primary/30" />
            <h3 className="mb-2 text-lg font-semibold">Listo para generar</h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Tu proyecto está configurado. Haz clic en "Generar sitio" para que la IA cree un sitio
              web completo basado en tu briefing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
