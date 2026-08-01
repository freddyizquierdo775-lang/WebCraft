import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  Edit3,
  ExternalLink,
  Globe,
  MoreHorizontal,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

// Mock data — en Fase B esto vendrá de la BD
const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'La Parrilla del Centro',
    description: 'Restaurante de carnes asadas en Cancún Centro',
    status: 'draft' as const,
    business_type: 'Restaurante',
    created_at: '2026-07-30T12:00:00Z',
    preview_url: null,
  },
  {
    id: '2',
    name: 'Hotel Paraíso Maya',
    description: 'Boutique hotel frente al mar en Tulum',
    status: 'ready' as const,
    business_type: 'Hotel',
    created_at: '2026-07-25T09:30:00Z',
    preview_url: 'https://preview.webcraft.ai/hotel-paraiso',
  },
  {
    id: '3',
    name: 'Buceo Cancún Tours',
    description: 'Agencia de tours de buceo y snorkel',
    status: 'published' as const,
    business_type: 'Servicios turísticos',
    created_at: '2026-07-15T14:20:00Z',
    preview_url: 'https://preview.webcraft.ai/buceo-cancun',
    published_url: 'https://buceocancun.com',
  },
];

const STATUS_MAP = {
  draft: { label: 'Borrador', variant: 'secondary' as const, icon: Edit3 },
  generating: { label: 'Generando', variant: 'secondary' as const, icon: Sparkles },
  ready: { label: 'Listo', variant: 'default' as const, icon: Globe },
  published: { label: 'Publicado', variant: 'default' as const, icon: ExternalLink },
  archived: { label: 'Archivado', variant: 'outline' as const, icon: Clock },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const isEmpty = MOCK_PROJECTS.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mis Sitios</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona y edita tus sitios web generados con IA
          </p>
        </div>
        <Link href="/onboarding">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nuevo sitio
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Aún no tienes sitios</h3>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Describe tu negocio y deja que la IA genere un sitio web profesional para ti en
              segundos.
            </p>
            <Link href="/onboarding">
              <Button size="lg" className="gap-2">
                <PlusCircle className="h-5 w-5" />
                Crear mi primer sitio
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Project grid */}
      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_PROJECTS.map((project) => {
            const statusInfo = STATUS_MAP[project.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card
                key={project.id}
                className="group relative overflow-hidden transition-shadow hover:shadow-md"
              >
                {/* Preview thumbnail */}
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5">
                  {project.preview_url ? (
                    <Globe className="h-12 w-12 text-muted-foreground/40" />
                  ) : (
                    <Sparkles className="h-12 w-12 text-primary/30" />
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Link href={`/projects/${project.id}`} className="hover:underline">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                      </Link>
                      <CardDescription className="line-clamp-1 text-xs">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(project.created_at)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                      <Link href={`/projects/${project.id}/editor`}>
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </Link>
                    </Button>
                    {project.published_url ? (
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <a href={project.published_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visitar
                        </a>
                      </Button>
                    ) : project.preview_url ? (
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <a href={project.preview_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3.5 w-3.5" />
                          Preview
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 gap-1" asChild>
                        <Link href={`/projects/${project.id}`}>
                          <Sparkles className="h-3.5 w-3.5" />
                          Generar
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick stats */}
      {!isEmpty && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Sitios creados', value: MOCK_PROJECTS.length, icon: Globe },
            {
              label: 'Publicados',
              value: MOCK_PROJECTS.filter((p) => p.status === 'published').length,
              icon: ExternalLink,
            },
            {
              label: 'Borradores',
              value: MOCK_PROJECTS.filter((p) => p.status === 'draft').length,
              icon: Edit3,
            },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
