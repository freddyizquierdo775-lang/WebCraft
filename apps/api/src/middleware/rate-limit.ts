import type { PlanTier } from '@webcraft/shared';
import { RATE_LIMITS } from '@webcraft/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuth } from './auth.js';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const { userId, userPlan } = getAuth(request);
  const plan = userPlan as PlanTier;
  const limit = RATE_LIMITS[plan] ?? 10;
  const key = `rate:${userId}`;
  const now = Date.now();

  let record = requestCounts.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    requestCounts.set(key, record);
  }

  record.count++;

  if (record.count > limit) {
    return reply.status(429).send({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Límite de ${limit} solicitudes/minuto alcanzado. Plan: ${plan}`,
      },
    });
  }
}

// Limpieza cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(requestCounts.keys());
  for (const key of keys) {
    const record = requestCounts.get(key);
    if (record && now > record.resetAt) requestCounts.delete(key);
  }
}, 300_000);
