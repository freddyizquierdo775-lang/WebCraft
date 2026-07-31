import type { FastifyInstance } from 'fastify';
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  verifyWebhook,
} from '../../services/billing/stripe.js';

export async function webhookRoutes(app: FastifyInstance) {
  // Stripe webhook — HMAC signature verified here, PCI-DSS compliant
  app.post('/stripe', async (request, reply) => {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    try {
      const rawBody = JSON.stringify(request.body);
      const event = verifyWebhook(rawBody, signature);

      switch (event.type) {
        case 'checkout.session.completed': {
          // biome-ignore lint/suspicious/noExplicitAny: Stripe SDK event.data.object is dynamic
          const session = event.data.object as any;
          await handleCheckoutCompleted(session);
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          // biome-ignore lint/suspicious/noExplicitAny: Stripe SDK event.data.object is dynamic
          const subscription = event.data.object as any;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        default:
          console.log(`[webhook] Unhandled event: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      console.error('[webhook] Error:', (err as Error).message);
      return reply.status(400).send({ error: 'Webhook verification failed' });
    }
  });

  app.post('/mercadopago', async (request) => {
    console.log('[mercadopago webhook]', request.body);
    return { received: true };
  });

  app.post('/conekta', async (request) => {
    console.log('[conekta webhook]', request.body);
    return { received: true };
  });
}
