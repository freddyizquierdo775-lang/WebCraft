import type {
  CreditBalanceResponse,
  CreditPackage,
  CreditTransaction,
  CreditTransactionType,
} from '@webcraft/shared';
import { supabaseAdmin } from '../../config/supabase';

// ─── Consultar saldo de créditos ───────────────────────────

/**
 * Obtiene el saldo actual de créditos y la información del plan del usuario.
 */
export async function getCreditsBalance(userId: string): Promise<CreditBalanceResponse> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('credits_balance, plan')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(
      `No se pudo obtener el perfil del usuario: ${error?.message || 'no encontrado'}`,
    );
  }

  const profile = data as { credits_balance: number; plan: string };

  // Obtener la allowance mensual del plan
  const { data: planData } = await supabaseAdmin
    .from('subscriptions')
    .select('current_period_start, current_period_end')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  // Calcular créditos usados este mes vía credit_transactions
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: monthlyUsage } = await supabaseAdmin
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'generation')
    .gte('created_at', monthStart);

  const allowanceUsed = monthlyUsage
    ? monthlyUsage.reduce((sum: number, tx: { amount: number }) => sum + Math.abs(tx.amount), 0)
    : 0;

  // Allowance mensual por plan
  const monthlyAllowances: Record<string, number> = {
    free: 10,
    starter: 50,
    pro: 200,
    agency: 500,
  };
  const monthlyAllowance = monthlyAllowances[profile.plan] || 0;

  return {
    balance: profile.credits_balance,
    plan: profile.plan,
    monthly_allowance: monthlyAllowance,
    allowance_used: allowanceUsed,
    next_refill: planData?.current_period_end || null,
  };
}

// ─── Deducir créditos (RPC) ────────────────────────────────

/**
 * Deduce créditos del saldo del usuario llamando a la RPC `deduct_credits`.
 * Es idempotente gracias al `idempotencyKey`.
 *
 * @returns El nuevo balance después de la deducción
 * @throws Si hay créditos insuficientes o error en la RPC
 */
export async function deductCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  reference: Record<string, unknown>,
  idempotencyKey: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_reference: reference,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    throw new Error(`Error en RPC deduct_credits: ${error.message}`);
  }

  const result = data as {
    success: boolean;
    balance_after: number;
    error?: string;
  };

  if (!result.success) {
    throw new Error(result.error || 'Créditos insuficientes');
  }

  return result.balance_after;
}

// ─── Historial de transacciones ────────────────────────────

/**
 * Obtiene el historial de transacciones de créditos del usuario,
 * ordenado de más reciente a más antiguo.
 */
export async function getCreditHistory(userId: string, limit = 20): Promise<CreditTransaction[]> {
  const { data, error } = await supabaseAdmin
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error al obtener historial de créditos: ${error.message}`);
  }

  return (data || []) as CreditTransaction[];
}

// ─── Paquetes de créditos disponibles ──────────────────────

/**
 * Obtiene la lista de paquetes de créditos disponibles para compra.
 * Solo retorna los paquetes activos.
 */
export async function getCreditPackages(): Promise<CreditPackage[]> {
  const { data, error } = await supabaseAdmin
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('credits', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener paquetes de créditos: ${error.message}`);
  }

  return (data || []) as CreditPackage[];
}

// ─── Créditos mensuales (cron job) ─────────────────────────

/**
 * Agrega créditos mensuales al saldo del usuario según su plan.
 * Diseñado para ejecutarse vía cron job al inicio de cada ciclo de facturación.
 *
 * Registra la transacción como tipo 'subscription'.
 */
export async function addMonthlyCredits(userId: string, planCredits: number): Promise<number> {
  // Verificar saldo actual
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits_balance')
    .eq('id', userId)
    .single();

  const currentBalance = (profile as { credits_balance: number } | null)?.credits_balance || 0;

  // Registrar transacción de créditos mensuales
  const { error: txError } = await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: planCredits,
    type: 'subscription',
    balance_after: currentBalance + planCredits,
    reference: { source: 'monthly_refill', credits_added: planCredits },
    idempotency_key: `monthly_${userId}_${new Date().toISOString().slice(0, 7)}`,
    created_at: new Date().toISOString(),
  });

  if (txError) {
    throw new Error(`Error al registrar créditos mensuales: ${txError.message}`);
  }

  // Actualizar saldo en profiles
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      credits_balance: currentBalance + planCredits,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(`Error al actualizar saldo: ${updateError.message}`);
  }

  return currentBalance + planCredits;
}
