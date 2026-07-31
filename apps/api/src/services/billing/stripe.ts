import Stripe from 'stripe';
import { config } from '../../config/env.js';
import { supabaseAdmin } from '../../config/supabase.js';

const stripe = new Stripe(config.STRIPE_SECRET_KEY || '');

// ─── Create checkout session for credit purchase ────────────
export async function createCheckoutSession(
  userId: string,
  packageId: string,
  successUrl: string,
  cancelUrl: string,
) {
  const { data: pkg } = await supabaseAdmin
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (!pkg) throw new Error('Paquete no encontrado');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: (pkg.currency as string).toLowerCase(),
          product_data: { name: pkg.name as string },
          unit_amount: pkg.price_cents as number,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: String(pkg.credits),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { url: session.url, sessionId: session.id };
}

// ─── Create subscription checkout ──────────────────────────
export async function createSubscriptionCheckout(
  userId: string,
  plan: string,
  successUrl: string,
  cancelUrl: string,
) {
  const priceIds: Record<string, string> = {
    starter: config.STRIPE_STARTER_PRICE_ID || 'price_starter',
    pro: config.STRIPE_PRO_PRICE_ID || 'price_pro',
    agency: config.STRIPE_AGENCY_PRICE_ID || 'price_agency',
  };

  const priceId = priceIds[plan];
  if (!priceId) throw new Error(`Plan no encontrado: ${plan}`);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: userId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return { url: session.url, sessionId: session.id };
}

// ─── Verify webhook signature ──────────────────────────────
export function verifyWebhook(payload: string | Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, config.STRIPE_WEBHOOK_SECRET || '');
}

// ─── Handle completed checkout ─────────────────────────────
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const packageId = session.metadata?.package_id;
  const credits = Number.parseInt(session.metadata?.credits || '0', 10);

  if (!userId || !credits) return;

  // Add credits to profile
  const { error } = await supabaseAdmin.rpc('add_credits', {
    p_user_id: userId,
    p_amount: credits,
    p_type: 'purchase',
    p_reference: { stripe_session: session.id, package_id: packageId },
    p_idempotency_key: `stripe_${session.id}`,
  });

  if (error) {
    console.error('Failed to add credits:', error);
  }
}

// ─── Handle subscription events ────────────────────────────
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const plan = subscription.metadata?.plan;
  if (!userId || !plan) return;

  const status =
    subscription.status === 'active'
      ? 'active'
      : subscription.status === 'past_due'
        ? 'past_due'
        : 'canceled';

  // biome-ignore lint/suspicious/noExplicitAny: Stripe SDK types are broad for subscription fields
  const sub = subscription as any;
  const subStart = new Date(sub.current_period_start * 1000).toISOString();
  const subEnd = new Date(sub.current_period_end * 1000).toISOString();

  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      status,
      provider: 'stripe',
      provider_subscription_id: subscription.id,
      current_period_start: subStart,
      current_period_end: subEnd,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    { onConflict: 'provider_subscription_id' },
  );

  if (!error && status === 'active') {
    // Update user plan
    await supabaseAdmin.from('profiles').update({ plan }).eq('id', userId);
  }
}
