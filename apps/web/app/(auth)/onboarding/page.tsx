'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronRight, Globe, Palette, ShoppingBag, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { useState } from 'react';

const STEPS = [
  { id: 'business', label: 'Negocio', icon: Store },
  { id: 'details', label: 'Detalles', icon: Palette },
  { id: 'audience', label: 'Audiencia', icon: Globe },
  { id: 'features', label: 'Extras', icon: ShoppingBag },
];

const INDUSTRIES = [
  'Restaurante',
  'Hotel',
  'Servicios turísticos',
  'Tienda en línea',
  'Servicios profesionales',
  'Salud y bienestar',
  'Inmobiliaria',
  'Educación',
  'Tecnología',
  'Otro',
];

const TONES = [
  { value: 'moderno', label: 'Moderno' },
  { value: 'clásico', label: 'Clásico' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'rústico', label: 'Rústico' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'divertido', label: 'Divertido' },
];

const SECTIONS = [
  'Inicio',
  'Menú / Servicios',
  'Sobre nosotros',
  'Contacto',
  'Reservaciones',
  'Galería',
  'Testimonios',
  'Blog',
  'Tienda',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    description: '',
    target_audience: '',
    tone: 'moderno',
    sections: [] as string[],
    has_ecommerce: false,
    language: 'es',
  });

  // biome-ignore lint/style/noNonNullAssertion: const array, always defined
  const currentStep = STEPS[step] ?? STEPS[0]!;
  const progress = ((step + 1) / STEPS.length) * 100;

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSection = (section: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Crear proyecto en Supabase con los datos del briefing
      const { data: project, error } = await supabase
        .from('user_projects')
        .insert({
          owner_id: user.id,
          name: form.business_name,
          description: form.description,
          business_type: form.industry,
          briefing_data: {
            industry: form.industry,
            description: form.description,
            target_audience: form.target_audience,
            tone: form.tone,
            sections: form.sections,
            language: form.language,
          },
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      router.push(`/projects/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Paso {step + 1} de {STEPS.length}
              </span>
              <span>{currentStep.label}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <CardTitle className="text-xl">
            {step === 0 && 'Cuéntanos sobre tu negocio'}
            {step === 1 && 'Detalles del proyecto'}
            {step === 2 && '¿A quién va dirigido?'}
            {step === 3 && 'Características adicionales'}
          </CardTitle>
          <CardDescription>
            {step === 0 && 'Esta información ayudará a la IA a crear el sitio perfecto para ti.'}
            {step === 1 && 'Define el estilo y contenido que tendrá tu sitio web.'}
            {step === 2 && 'Mientras más específico seas, mejores serán los resultados.'}
            {step === 3 && 'Selecciona las secciones que necesitas para tu sitio.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 0: Business info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del negocio</Label>
                <Input
                  id="name"
                  placeholder="Ej: La Parrilla del Centro"
                  value={form.business_name}
                  onChange={(e) => update('business_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Industria</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <Badge
                      key={ind}
                      variant={form.industry === ind ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => update('industry', ind)}
                    >
                      {ind}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desc">Describe tu negocio</Label>
                <Textarea
                  id="desc"
                  placeholder="Ej: Somos un restaurante de carnes asadas con 15 años de tradición en el centro de Cancún..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tono del sitio</Label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <Badge
                      key={t.value}
                      variant={form.tone === t.value ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => update('tone', t.value)}
                    >
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Público objetivo</Label>
                <Textarea
                  id="audience"
                  placeholder="Ej: Turistas internacionales de 25-50 años que buscan gastronomía local auténtica, y familias locales los fines de semana..."
                  rows={3}
                  value={form.target_audience}
                  onChange={(e) => update('target_audience', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Features */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Secciones del sitio</Label>
                <div className="flex flex-wrap gap-2">
                  {SECTIONS.map((sec) => (
                    <Badge
                      key={sec}
                      variant={form.sections.includes(sec) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSection(sec)}
                    >
                      {form.sections.includes(sec) && <Check className="mr-1 h-3 w-3" />}
                      {sec}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-4">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">¿Incluir tienda en línea?</p>
                  <p className="text-xs text-muted-foreground">
                    Disponible en plan Pro+. Se habilitará en la Fase D.
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary">Próximamente</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              Atrás
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 0 && (!form.business_name || !form.industry)) ||
                  (step === 1 && !form.description)
                }
              >
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading}>
                {loading ? 'Creando proyecto...' : 'Crear mi sitio'}
                <SparklesIcon />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg
      className="ml-2 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <title>Sparkles</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
