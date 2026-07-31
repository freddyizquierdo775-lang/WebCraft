import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { config } from './config/env.js';
import { creditPackageRoutes, creditRoutes } from './routes/credits/index.js';
import { granularRoutes } from './routes/granular/index.js';
import { projectRoutes } from './routes/projects/index.js';
import { shopRoutes } from './routes/shop/index.js';
import { webhookRoutes } from './routes/webhooks/index.js';
import { handleEditorWS } from './services/deployment/websocket.js';

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(websocket);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API v1
  await app.register(
    async (v1) => {
      await v1.register(projectRoutes, { prefix: '/projects' });
      await v1.register(creditRoutes, { prefix: '/credits' });
      await v1.register(creditPackageRoutes);
      await v1.register(granularRoutes, { prefix: '/projects' });
      await v1.register(shopRoutes, { prefix: '/shop' });
    },
    { prefix: '/api/v1' },
  );

  // Webhooks (no auth, external services)
  await app.register(webhookRoutes, { prefix: '/webhooks' });

  // WebSocket
  app.register(async (wsScope) => {
    wsScope.get('/ws/editor/:projectId', { websocket: true }, (socket, req) => {
      const { projectId } = req.params as { projectId: string };
      handleEditorWS(socket, req, projectId);
    });
  });

  return app;
}
