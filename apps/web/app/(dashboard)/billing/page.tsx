'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createBrowserClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { PLAN_LIMITS } from '@webcraft/shared';
import { Building2, Check, Crown, Loader2, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const PLAN_ICONS = { free: Zap, starter: Sparkles, pro: Crown, agency: Building2 };

export default function BillingPage() {
  const { user, loadUser } = useAuthStore();
interface CreditPackage { id: string; name: string; credits: number; price_cents: number; }
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits')
      .then(({ data }) => {
        if (data) setPackages(data);
      });
  }, []);

  const handleCheckout = useCallback(
    async (packageId: string) => {
      setCheckingOut(packageId);
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
      setCheckingOut(null);
    },
    [router],
  );

  const credits = user?.credits_balance ?? 0;
  const plan = user?.plan ?? 'free';
  const monthlyCredits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.credits_per_month ?? 10;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Créditos y Plan</h2>
        <p className="text-sm text-muted-foreground">Gestiona tu suscripción y créditos de IA</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo de créditos</CardTitle>
            <CardDescription>Créditos disponibles para generación IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-4xl font-bold">{credits}</div>
            <Progress
              value={Math.min((credits / monthlyCredits) * 100, 100)}
              className="mb-2 h-2"
            />
            <p className="text-xs text-muted-foreground">
              Plan {plan} · {monthlyCredits} créditos/mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comprar créditos</CardTitle>
            <CardDescription>Paquetes disponibles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {packages.map((pkg) => (
              <Button
                key={pkg.id}
                variant="outline"
                size="sm"
                className="w-full justify-between"
                disabled={checkingOut === pkg.id}
                onClick={() => handleCheckout(pkg.id)}
              >
                <span>
                  {pkg.name} — ${(pkg.price_cents / 100).toFixed(0)} MXN
                </span>
                {checkingOut === pkg.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Planes disponibles</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.entries(PLAN_LIMITS) as [string, typeof PLAN_LIMITS.free][]).map(([key, p]) => {
            const Icon = PLAN_ICONS[key as keyof typeof PLAN_ICONS] || Sparkles;
            const isCurrent = key === plan;
            return (
              <Card key={key} className={isCurrent ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {isCurrent && <Badge variant="default">Actual</Badge>}
                  </div>
                  <CardTitle className="mt-3">{p.name}</CardTitle>
                  <CardDescription>
                    {p.price_monthly_mxn === 0 ? 'Gratis' : `$${p.price_monthly_mxn} MXN/mes`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-4 space-y-2 text-sm">
                    {p.features.map((f) => (
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
                    {isCurrent ? 'Plan actual' : <Link href="/payment-setup">Elegir plan</Link>}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
