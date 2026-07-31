import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  WHM_HOST: z.string().optional(),
  WHM_API_TOKEN: z.string().optional(),
  CPANEL_USERNAME: z.string().optional(),
  PREVIEW_DOMAIN: z.string().default('preview.webcraft.ai'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_AGENCY_PRICE_ID: z.string().optional(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  CONEKTA_PRIVATE_KEY: z.string().optional(),
  MARKETPLACE_COMMISSION_PCT: z.string().default('0.5'),
});

export const config = envSchema.parse(process.env);
