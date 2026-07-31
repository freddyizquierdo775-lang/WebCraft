import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userPlan: string;
    userCredits: number;
  }
}
