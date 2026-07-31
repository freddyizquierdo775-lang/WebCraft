import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePlan } from '../../middleware/plan-guard.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.js';
import {
  createProduct,
  deleteProduct,
  getOrders,
  getProducts,
  updateProduct,
} from '../../services/ecommerce/shop.js';

export async function shopRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', rateLimitMiddleware);

  app.get('/:projectId/products', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    try {
      const products = await getProducts(projectId);
      return { success: true, data: products };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL', message: (err as Error).message },
      });
    }
  });

  app.post(
    '/:projectId/products',
    { preHandler: [requirePlan('ecommerce:manage')] },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      try {
        // biome-ignore lint/suspicious/noExplicitAny: user input validated at DB level
        const product = await createProduct(projectId, request.body as any);
        return reply.status(201).send({ success: true, data: product });
      } catch (err) {
        return reply.status(500).send({
          success: false,
          error: { code: 'INTERNAL', message: (err as Error).message },
        });
      }
    },
  );

  app.patch('/products/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    try {
      const product = await updateProduct(productId, request.body as Record<string, unknown>);
      return { success: true, data: product };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL', message: (err as Error).message },
      });
    }
  });

  app.delete('/products/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    try {
      await deleteProduct(productId);
      return { success: true, data: null };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL', message: (err as Error).message },
      });
    }
  });

  app.get('/:projectId/orders', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    try {
      const orders = await getOrders(projectId);
      return { success: true, data: orders };
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL', message: (err as Error).message },
      });
    }
  });
}
