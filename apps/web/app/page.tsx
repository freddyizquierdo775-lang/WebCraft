import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Impulsado por IA de última generación
        </div>

        <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Crea sitios web
          <span className="block bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            con el poder de la IA
          </span>
        </h1>

        <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
          Describe tu negocio en lenguaje natural y WebCraft AI Studio genera, edita y publica tu
          sitio profesional en minutos. Sin código, sin plantillas genéricas.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-lg border bg-card px-8 text-sm font-semibold shadow-sm transition-colors hover:bg-accent"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: 'IA Generativa',
              desc: 'Describe tu idea y obtén un sitio completo en segundos',
            },
            {
              title: 'Edición Granular',
              desc: 'Modifica elementos específicos sin tocar el resto del código',
            },
            {
              title: 'Publicación 1-Click',
              desc: 'Tu sitio en línea con un solo clic, sin configurar hosting',
            },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-xl border bg-card p-6 text-left shadow-sm">
              <h3 className="mb-2 font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
