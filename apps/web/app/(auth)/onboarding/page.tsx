'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { createBrowserClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  Globe,
  Loader2,
  Palette,
  ShoppingBag,
  Sparkles,
  Store,
  Upload,
  Wand2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ─── Constantes ──────────────────────────────────────────

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

const COLOR_PALETTES = [
  {
    name: 'Corporate Blue',
    colors: ['#1e40af', '#3b82f6', '#eff6ff', '#f8fafc'],
    preview: 'bg-blue-600',
  },
  {
    name: 'Warm Earth',
    colors: ['#92400e', '#d97706', '#fef3c7', '#fffbeb'],
    preview: 'bg-amber-600',
  },
  {
    name: 'Mint Fresh',
    colors: ['#065f46', '#10b981', '#d1fae5', '#f0fdf4'],
    preview: 'bg-emerald-600',
  },
  {
    name: 'Sunset',
    colors: ['#9a3412', '#f97316', '#fed7aa', '#fff7ed'],
    preview: 'bg-orange-600',
  },
  { name: 'Ocean', colors: ['#0c4a6e', '#0ea5e9', '#e0f2fe', '#f0f9ff'], preview: 'bg-cyan-600' },
  { name: 'Berry', colors: ['#831843', '#ec4899', '#fce7f3', '#fdf2f8'], preview: 'bg-pink-600' },
  {
    name: 'Dark Mode',
    colors: ['#18181b', '#3f3f46', '#71717a', '#fafafa'],
    preview: 'bg-zinc-800',
  },
  { name: 'Forest', colors: ['#14532d', '#22c55e', '#dcfce7', '#f0fdf4'], preview: 'bg-green-700' },
];

const VISUAL_STYLES = [
  {
    id: 'modern-saas',
    name: 'SaaS Moderno',
    desc: 'Limpio, gradientes sutiles, mucho espacio blanco',
    icon: '🫧',
  },
  {
    id: 'classic-pro',
    name: 'Profesional Clásico',
    desc: 'Serio, confiable, estructurado',
    icon: '🏛️',
  },
  {
    id: 'bold-creative',
    name: 'Creativo Bold',
    desc: 'Colores vibrantes, tipografía grande',
    icon: '🎨',
  },
  {
    id: 'minimal-luxe',
    name: 'Lujo Minimalista',
    desc: 'Pocos elementos, alta calidad visual',
    icon: '✨',
  },
  {
    id: 'friendly-warm',
    name: 'Cálido y Cercano',
    desc: 'Redondeado, colores suaves, fotos humanas',
    icon: '🤝',
  },
  { id: 'tech-dark', name: 'Tech Oscuro', desc: 'Modo oscuro, neones, terminal look', icon: '⚡' },
];

// ─── Componente principal ────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [hasBrand, setHasBrand] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    business_name: '',
    industry: '',
    description: '',
    target_audience: '',
    tone: 'moderno',
    sections: [] as string[],
    language: 'es',
    // Brand assets (camino A)
    brand_colors: [] as string[],
    brand_logo_url: '',
    brand_fonts: [] as string[],
    // Selección guiada (camino B)
    selected_palette: '',
    selected_style: '',
  });

  const totalSteps = hasBrand === null ? 4 : 5;
  const STEPS =
    hasBrand === null
      ? [
          { id: 'business', label: 'Negocio', icon: Store },
          { id: 'brand', label: 'Marca', icon: Palette },
          { id: 'details', label: 'Detalles', icon: Globe },
          { id: 'features', label: 'Extras', icon: ShoppingBag },
        ]
      : [
          { id: 'business', label: 'Negocio', icon: Store },
          { id: 'style', label: 'Estilo', icon: Palette },
          { id: 'details', label: 'Detalles', icon: Globe },
          { id: 'audience', label: 'Audiencia', icon: Globe },
          { id: 'features', label: 'Extras', icon: ShoppingBag },
        ];

  // biome-ignore lint/style/noNonNullAssertion: const array, always defined
  const currentStep = STEPS[step] ?? STEPS[0]!;
  const progress = ((step + 1) / totalSteps) * 100;

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

  const addColor = (color: string) => {
    setForm((prev) => ({
      ...prev,
      brand_colors: prev.brand_colors.includes(color)
        ? prev.brand_colors.filter((c) => c !== color)
        : prev.brand_colors.length < 4
          ? [...prev.brand_colors, color]
          : prev.brand_colors,
    }));
  };

  // Botón "Mejorar con IA"
  const handleEnhance = async () => {
    if (!form.description.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_KEY || ''}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            {
              role: 'user',
              content: `Mejora esta descripción de negocio para generar un sitio web profesional. Agrega palabras clave de SEO, detalles de ambiente, y beneficios para el cliente. Responde SOLO con la descripción mejorada, sin introducción ni markdown:\n\n"${form.description}"`,
            },
          ],
          max_tokens: 300,
        }),
      });
      const data = await res.json();
      const enhanced = data.choices?.[0]?.message?.content || form.description;
      update('description', enhanced.trim());
    } catch {
      /* mantener descripción original */
    }
    setEnhancing(false);
  };

  // Seleccionar paleta (camino B)
  const selectPalette = (name: string, colors: string[]) => {
    update('selected_palette', name);
    update('brand_colors', colors);
  };

  // Crear proyecto
  const handleFinish = async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const briefing = {
        industry: form.industry,
        description: form.description,
        target_audience: form.target_audience,
        tone: form.tone,
        sections: form.sections,
        language: form.language,
        has_brand: hasBrand,
        brand_colors: form.brand_colors,
        brand_logo_url: form.brand_logo_url || null,
        brand_fonts: form.brand_fonts,
        selected_palette: form.selected_palette || null,
        selected_style: form.selected_style || null,
      };

      const { data: project, error } = await supabase
        .from('user_projects')
        .insert({
          owner_id: user.id,
          name: form.business_name,
          description: form.description,
          business_type: form.industry,
          briefing_data: briefing,
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

  const canAdvance = () => {
    if (hasBrand === null) {
      if (step === 0) return !!form.business_name && !!form.industry;
      if (step === 1) return true; // bifurcación — siempre puede avanzar
      if (step === 2) return !!form.description;
      if (step === 3) return true; // secciones
      return false;
    }
    if (step === 0) return !!form.business_name && !!form.industry;
    if (step === 1 && hasBrand) return form.brand_colors.length > 0;
    if (step === 1 && !hasBrand) return !!form.selected_palette && !!form.selected_style;
    if (step === 2) return !!form.description;
    if (step === 3) return !!form.target_audience;
    if (step === 4) return true;
    return false;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Paso {step + 1} de {totalSteps}
              </span>
              <span>{currentStep.label}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <CardTitle className="text-xl">
            {step === 0 && 'Cuéntanos sobre tu negocio'}
            {step === 1 && hasBrand === null && '¿Ya tienes identidad de marca?'}
            {step === 1 && hasBrand === true && 'Tu marca actual'}
            {step === 1 && hasBrand === false && 'Elige tu estilo visual'}
            {step === 2 && 'Describe tu negocio'}
            {step === 3 && hasBrand === false && '¿A quién va dirigido?'}
            {step === 3 && hasBrand !== false && 'Características adicionales'}
            {step === 4 && 'Características adicionales'}
          </CardTitle>
          <CardDescription>
            {step === 0 && 'Esta información ayudará a la IA a crear el sitio perfecto para ti.'}
            {step === 1 && hasBrand === null && 'Así personalizamos tu experiencia.'}
            {step === 1 &&
              hasBrand === true &&
              'Ingresa los colores y elementos de tu marca existente.'}
            {step === 1 &&
              hasBrand === false &&
              'Selecciona una paleta y estilo — nosotros armamos el diseño.'}
            {step === 2 && 'Mientras más detalles, mejor será el resultado.'}
            {step === 3 && hasBrand === false && 'Define quiénes son tus clientes ideales.'}
            {step === 3 && hasBrand !== false && 'Elige las secciones que necesitas.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 0 — Nombre + Industria */}
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

          {/* Step 1 — Bifurcación ¿Tienes marca? */}
          {step === 1 && hasBrand === null && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si ya tienes un logotipo, colores corporativos o una guía de marca hecha por un
                diseñador, podemos usarlos. Si no, te ayudamos a crear una desde cero.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setHasBrand(true)}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
                >
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="font-semibold">Sí, tengo marca</span>
                  <span className="text-xs text-muted-foreground">Subiré mis colores y logo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHasBrand(false)}
                  className="flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:border-primary hover:bg-primary/5"
                >
                  <Wand2 className="h-8 w-8 text-primary" />
                  <span className="font-semibold">No, ayúdame</span>
                  <span className="text-xs text-muted-foreground">
                    Quiero elegir paletas y estilos
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1-A — Upload de marca existente */}
          {step === 1 && hasBrand === true && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Colores de tu marca (selecciona hasta 4)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    '#1e40af',
                    '#3b82f6',
                    '#92400e',
                    '#d97706',
                    '#065f46',
                    '#10b981',
                    '#9a3412',
                    '#f97316',
                    '#831843',
                    '#ec4899',
                    '#18181b',
                    '#3f3f46',
                    '#0c4a6e',
                    '#0ea5e9',
                    '#6366f1',
                    '#8b5cf6',
                  ].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => addColor(c)}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-all',
                        form.brand_colors.includes(c)
                          ? 'scale-110 border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: c }}
                      title={c}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
                {form.brand_colors.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Seleccionados: {form.brand_colors.join(', ')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">URL de tu logotipo</Label>
                <Input
                  id="logo"
                  placeholder="https://tudominio.com/logo.png"
                  value={form.brand_logo_url}
                  onChange={(e) => update('brand_logo_url', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipografías (separadas por coma)</Label>
                <Input
                  placeholder="Inter, Playfair Display"
                  value={form.brand_fonts.join(', ')}
                  onChange={(e) =>
                    update(
                      'brand_fonts',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* Step 1-B — Selector Canva-like (sin marca) */}
          {step === 1 && hasBrand === false && (
            <div className="space-y-6">
              {/* Paletas de color */}
              <div className="space-y-2">
                <Label>Paleta de colores</Label>
                <div className="grid grid-cols-4 gap-3">
                  {COLOR_PALETTES.map((palette) => (
                    <button
                      type="button"
                      key={palette.name}
                      onClick={() => selectPalette(palette.name, palette.colors)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:border-primary',
                        form.selected_palette === palette.name
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-transparent',
                      )}
                    >
                      <div className="flex gap-1">
                        {palette.colors.map((c) => (
                          <div
                            key={c}
                            className="h-5 w-5 rounded-full border"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium">{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estilo visual */}
              <div className="space-y-2">
                <Label>Estilo visual</Label>
                <div className="grid grid-cols-2 gap-3">
                  {VISUAL_STYLES.map((style) => (
                    <button
                      type="button"
                      key={style.id}
                      onClick={() => update('selected_style', style.id)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:border-primary',
                        form.selected_style === style.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-transparent',
                      )}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <div>
                        <span className="text-sm font-semibold">{style.name}</span>
                        <p className="text-xs text-muted-foreground">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Descripción + Mejorar con IA */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="desc">Describe tu negocio</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 h-7 text-xs"
                    onClick={handleEnhance}
                    disabled={!form.description.trim() || enhancing}
                  >
                    {enhancing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Mejorar con IA
                  </Button>
                </div>
                <Textarea
                  id="desc"
                  placeholder="Ej: Somos un restaurante de carnes asadas con 15 años de tradición en el centro de Cancún. Nuestro ambiente es rústico-elegante con música en vivo los fines de semana..."
                  rows={5}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  💡 Sé específico: menciona tu ubicación, ambiente, precios y qué te hace
                  diferente. Usa "Mejorar con IA" para enriquecer el texto.
                </p>
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

          {/* Step 3 (sin marca) — Audiencia */}
          {step === 3 && hasBrand === false && (
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

          {/* Step 3/4 — Secciones */}
          {((step === 3 && hasBrand !== false) || step === 4) && (
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
                    Disponible en plan Pro+. Se habilitará pronto.
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
            <Button
              variant="ghost"
              onClick={() => {
                if (step === 1 && hasBrand !== null) {
                  setHasBrand(null);
                  return;
                }
                setStep((s) => s - 1);
              }}
              disabled={step === 0}
            >
              Atrás
            </Button>

            {(hasBrand === null && step < 3) || (hasBrand !== null && step < totalSteps - 1) ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Siguiente
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading || !canAdvance()}>
                {loading ? 'Creando proyecto...' : 'Crear mi sitio'}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
