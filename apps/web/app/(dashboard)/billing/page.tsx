import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PLAN_LIMITS } from '@webcraft/shared';
import { Building2, Check, Crown, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

const PLAN_ICONS = {
  free: Zap,
  starter: Sparkles,
  pro: Crown,
  agency: Building2,
};

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Créditos y Plan</h2>
        <p className="text-sm text-muted-foreground">Gestiona tu suscripción y créditos de IA</p>
      </div>

      {/* Current plan + credits */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo de créditos</CardTitle>
            <CardDescription>Créditos disponibles para generación IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-4xl font-bold">10</div>
            <Progress value={100} className="mb-2 h-2" />
            <p className="text-xs text-muted-foreground">
              Plan Free · 10 créditos/mes · Se renuevan el 1 de agosto
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link href="/payment-setup">Comprar más créditos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan actual</CardTitle>
            <CardDescription>Free — $0 MXN/mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {PLAN_LIMITS.free.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-4 w-full" asChild>
              <Link href="/payment-setup">Actualizar plan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Planes */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">Planes disponibles</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(PLAN_LIMITS) as [string, typeof PLAN_LIMITS.free][]).map(
            ([key, plan]) => {
              const Icon = PLAN_ICONS[key as keyof typeof PLAN_ICONS] || Sparkles;
              const isCurrent = key === 'free';

              return (
                <Card key={key} className={isCurrent ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      {isCurrent && <Badge variant="default">Actual</Badge>}
                    </div>
                    <CardTitle className="mt-3">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.price_monthly_mxn === 0
                        ? 'Gratis'
                        : `$${plan.price_monthly_mxn} MXN/mes`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="mb-4 space-y-2 text-sm">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={isCurrent ? 'outline' : 'default'}
                      size="sm"
                      className="w-full"
                      disabled={isCurrent}
                      asChild={!isCurrent}
                    >
                      {isCurrent ? (
                        'Plan actual'
                      ) : (
                        <Link href="/payment-setup">Elegir plan</Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
