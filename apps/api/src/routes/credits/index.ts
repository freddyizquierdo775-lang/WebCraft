import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../config/supabase.js';
import { authMiddleware, getAuth } from '../../middleware/auth.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.js';

export async function creditRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', rateLimitMiddleware);

  app.get('/balance', async (request) => {
    const { userId } = getAuth(request);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan, credits_balance')
      .eq('id', userId)
      .single();

    return {
      success: true,
      data: {
        balance: profile?.credits_balance ?? 0,
        plan: profile?.plan ?? 'free',
        monthly_allowance: 10,
        allowance_used: 0,
        next_refill: null,
      },
    };
  });

  app.get('/history', async (request) => {
    const { userId } = getAuth(request);
    const { data, error } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: { code: 'INTERNAL', message: error.message } };
    }
    return { success: true, data };
  });
}

export async function creditPackageRoutes(app: FastifyInstance) {
  app.get('/packages', async () => {
    const { data } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('is_active', true)
      .order('credits', { ascending: true });

    return { success: true, data };
  });
}
