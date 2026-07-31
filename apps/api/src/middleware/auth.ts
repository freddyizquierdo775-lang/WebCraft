import type { FastifyReply, FastifyRequest } from 'fastify';
import { getUserProfile, verifyJWT } from '../config/supabase.js';

// Augmented request type used across all middleware
export interface AuthenticatedRequest {
  userId: string;
  userPlan: string;
  userCredits: number;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply
      .status(401)
      .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } });
  }

  const token = authHeader.slice(7);
  try {
    const userId = await verifyJWT(token);
    const profile = await getUserProfile(userId);

    // Attach to request
    (request as unknown as AuthenticatedRequest).userId = userId;
    (request as unknown as AuthenticatedRequest).userPlan = profile.plan;
    (request as unknown as AuthenticatedRequest).userCredits = profile.credits_balance;
  } catch {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' },
    });
  }
}

export function getAuth(req: FastifyRequest): AuthenticatedRequest {
  return req as unknown as AuthenticatedRequest;
}
