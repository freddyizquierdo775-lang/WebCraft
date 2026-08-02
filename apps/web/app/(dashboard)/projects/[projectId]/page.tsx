'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createBrowserClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useProjectStore } from '@/stores/project-store';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  Globe,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

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
  const { refreshCredits } = useAuthStore();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genProgress, setGenProgress] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (projectId) fetchProject(projectId);
  }, [projectId, fetchProject]);

  // Auto-disparar generación si el proyecto es nuevo (draft + briefing + sin html)
  const [autoGenerating, setAutoGenerating] = useState(false);
  useEffect(() => {
    if (autoGenerating || generating || !currentProject) return;
    const hasBriefing =
      currentProject.briefing_data && typeof currentProject.briefing_data === 'object' && Object.keys(currentProject.briefing_data).length > 0;
    const needsGeneration =
      (currentProject.status === 'draft' || currentProject.status === 'generating') && hasBriefing && (!currentProject.html_content || currentProject.html_content.length < 10);
    if (needsGeneration) {
      setAutoGenerating(true);
      handleGenerate();
    }
  }, [currentProject, autoGenerating, generating]);

  // Progress bar animation
  useEffect(() => {
    if (!generating) {
      setGenProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setGenProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 800);
    return () => clearInterval(interval);
  }, [generating]);

  const handleGenerate = useCallback(async () => {
    if (!projectId) return;
    setGenerating(true);
    setGenError('');
    setGenProgress(5);

    const supabase = createBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setGenError('No hay sesión activa. Inicia sesión de nuevo.');
      setGenerating(false);
      return;
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenError(data.error || `Error HTTP ${res.status}`);
        setGenerating(false);
        return;
      }

      setGenProgress(100);
      setCreditsUsed(data.data.credits_used);
      setCreditsRemaining(data.data.credits_remaining);

      // Recargar proyecto y créditos
      await Promise.all([fetchProject(projectId), refreshCredits()]);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setGenerating(false);
    }
  }, [projectId, fetchProject, refreshCredits]);

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al dashboard
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
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {generating ? 'Generando...' : 'Generar sitio'}
            </Button>
          )}
          {currentProject.status === 'ready' && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/projects/${projectId}/editor`}>
                <Code className="h-4 w-4" /> Editar
              </Link>
            </Button>
          )}
          {currentProject.published_url && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={currentProject.published_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Visitar
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {genError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{genError}</p>
          </CardContent>
        </Card>
      )}

      {/* Generating state */}
      {generating && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center py-12">
            <Sparkles className="mb-4 h-12 w-12 animate-pulse text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Generando tu sitio web</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              La IA está creando tu sitio basado en el briefing...
            </p>
            <Progress value={genProgress} className="h-2 w-64" />
            <p className="mt-2 text-xs text-muted-foreground">{Math.round(genProgress)}%</p>
          </CardContent>
        </Card>
      )}

      {/* Success feedback */}
      {creditsRemaining !== null && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-sm">¡Sitio generado!</p>
              <p className="text-xs text-muted-foreground">
                Se usaron {creditsUsed} créditos · Te quedan {creditsRemaining} créditos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {currentProject.html_content && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" /> Vista previa
              </CardTitle>
              <CardDescription>Contenido generado por IA</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${projectId}/editor`}>Abrir en editor</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <iframe
                srcDoc={`${currentProject.html_content}${currentProject.css_content ? `<style>${currentProject.css_content}</style>` : ''}${currentProject.js_content ? `<script>${currentProject.js_content}</script>` : ''}`}
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
      {currentProject.status === 'draft' && !generating && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <Sparkles className="mb-4 h-16 w-16 text-primary/30" />
            <h3 className="mb-2 text-lg font-semibold">Listo para generar</h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Tu proyecto está configurado. Haz clic en "Generar sitio" para que la IA cree un sitio
              web completo.
            </p>
            <Button onClick={handleGenerate} size="lg" className="gap-2">
              <Zap className="h-5 w-5" /> Generar sitio (2 créditos)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
