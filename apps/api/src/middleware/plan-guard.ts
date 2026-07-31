import type { PlanTier } from '@webcraft/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuth } from './auth.js';

const FEATURE_MIN_PLAN: Record<string, PlanTier> = {
  'site:generate': 'starter',
  'site:deploy': 'starter',
  'site:granular-edit': 'pro',
  'ecommerce:manage': 'pro',
  'marketplace:sell': 'pro',
  'white-label': 'agency',
};

export function requirePlan(feature: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const minPlan = FEATURE_MIN_PLAN[feature];
    if (!minPlan) return;

    const { userPlan } = getAuth(request);
    const planLevels: Record<string, number> = { free: 0, starter: 1, pro: 2, agency: 3 };
    const userLevel = planLevels[userPlan] ?? 0;
    const requiredLevel = planLevels[minPlan] ?? 0;

    if (userLevel < requiredLevel) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'PLAN_RESTRICTED',
          message: `La feature '${feature}' requiere plan ${minPlan} o superior. Tu plan: ${userPlan}`,
        },
      });
    }
  };
}
