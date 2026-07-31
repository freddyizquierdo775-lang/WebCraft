'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Building2, Check, CreditCard, ExternalLink, Shield, Store } from 'lucide-react';
import { useState } from 'react';

const PROVIDERS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Procesa pagos con tarjeta en +135 monedas. Ideal para ventas internacionales.',
    icon: CreditCard,
    connected: true,
    features: [
      'Tarjetas crédito/débito',
      '135+ monedas',
      'Suscripciones',
      'Webhooks en tiempo real',
    ],
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Principal pasarela en Latinoamérica. Cuotas, efectivo, transferencias.',
    icon: Store,
    connected: false,
    features: [
      'Tarjetas',
      'Efectivo (OXXO)',
      'Transferencias',
      'Cuotas sin tarjeta',
      'Link de pago',
    ],
  },
  {
    id: 'conekta',
    name: 'Conekta',
    description: 'Pasarela mexicana con soporte para SPEI, OXXO y terminales físicas.',
    icon: Building2,
    connected: false,
    features: ['Tarjetas', 'SPEI', 'OXXO Pay', 'Terminales físicas', 'Meses sin intereses'],
  },
];

export default function PaymentSetupPage() {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    // Simulate OAuth flow — in production redirects to provider
    await new Promise((r) => setTimeout(r, 1500));
    setConnecting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <Badge variant="secondary" className="text-xs">
            PCI-DSS Compliant
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Pasarelas de pago</h2>
        <p className="text-sm text-muted-foreground">
          Conecta tus pasarelas favoritas. Nosotros manejamos las claves API — tú solo vendes.
        </p>
      </div>

      {/* Security notice */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="font-medium text-sm">Tus claves API están seguras</p>
            <p className="text-xs text-muted-foreground">
              WebCraft AI Studio gestiona las claves API en el backend. Nunca se exponen al
              navegador. Cumplimos con estándares PCI-DSS nivel 1 para el manejo de datos de pago.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Providers */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((provider) => (
          <Card key={provider.id} className={cn(provider.connected && 'border-primary/50')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <provider.icon className="h-5 w-5 text-primary" />
                </div>
                {provider.connected ? (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline">No conectado</Badge>
                )}
              </div>
              <CardTitle className="mt-3">{provider.name}</CardTitle>
              <CardDescription>{provider.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1">
                {provider.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Separator />
              <Button
                variant={provider.connected ? 'outline' : 'default'}
                className="w-full gap-1"
                disabled={provider.connected || connecting === provider.id}
                onClick={() => handleConnect(provider.id)}
              >
                {connecting === provider.id ? (
                  'Conectando...'
                ) : provider.connected ? (
                  'Configurada'
                ) : (
                  <>
                    Conectar {provider.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding steps */}
      <Card>
        <CardHeader>
          <CardTitle>Cómo funciona</CardTitle>
          <CardDescription>
            Conecta una pasarela en 3 pasos. Sin tocar código ni copiar claves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: 'Elige tu pasarela',
                desc: 'Selecciona Stripe, Mercado Pago o Conekta según tu mercado objetivo.',
              },
              {
                step: 2,
                title: 'Autoriza con OAuth',
                desc: 'Serás redirigido a la plataforma de la pasarela para autorizar la conexión con un clic.',
              },
              {
                step: 3,
                title: 'Empieza a vender',
                desc: 'WebCraft configura automáticamente webhooks, endpoints y manejo de pagos. Tú solo agregas productos.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {step}
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
