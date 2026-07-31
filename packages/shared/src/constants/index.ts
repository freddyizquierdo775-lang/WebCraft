import type { PlanTier } from '../types/index.js';

// ─── Plan limits ───────────────────────────────────────────
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    name: string;
    price_monthly_mxn: number;
    max_projects: number | null;
    credits_per_month: number;
    features: string[];
  }
> = {
  free: {
    name: 'Free',
    price_monthly_mxn: 0,
    max_projects: 1,
    credits_per_month: 10,
    features: ['1 proyecto', '10 créditos/mes', 'Gemini Flash', 'Preview temporal'],
  },
  starter: {
    name: 'Starter',
    price_monthly_mxn: 299,
    max_projects: 5,
    credits_per_month: 50,
    features: [
      '5 proyectos',
      '50 créditos/mes',
      'GPT-4o Mini',
      'Publicación',
      'Dominio personalizado',
    ],
  },
  pro: {
    name: 'Pro',
    price_monthly_mxn: 799,
    max_projects: 20,
    credits_per_month: 200,
    features: [
      '20 proyectos',
      '200 créditos/mes',
      'Claude 3.5 Sonnet',
      'Edición granular',
      'E-commerce',
      'Marketplace venta',
    ],
  },
  agency: {
    name: 'Agency',
    price_monthly_mxn: 1999,
    max_projects: null,
    credits_per_month: 500,
    features: [
      'Proyectos ilimitados',
      '500 créditos/mes',
      'Todos los modelos',
      'White-label',
      'Soporte prioritario',
    ],
  },
};

// ─── Available AI models per tier ──────────────────────────
export const MODELS_BY_TIER: Record<PlanTier, string[]> = {
  free: ['google/gemini-flash-1.5'],
  starter: ['google/gemini-flash-1.5', 'openai/gpt-4o-mini'],
  pro: ['google/gemini-flash-1.5', 'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet'],
  agency: [
    'google/gemini-flash-1.5',
    'openai/gpt-4o-mini',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'anthropic/claude-3-opus',
  ],
};

// ─── Credit costs per operation ────────────────────────────
export const CREDIT_COSTS = {
  GENERATE_SITE_FLASH: 2,
  GENERATE_SITE_GPT4O_MINI: 5,
  GENERATE_SITE_CLAUDE: 10,
  GRANULAR_EDIT_GPT4O_MINI: 1,
  GRANULAR_EDIT_CLAUDE: 3,
  REGENERATE_SECTION: 2,
} as const;

// ─── Rate limits (req/min) per plan ────────────────────────
export const RATE_LIMITS: Record<PlanTier, number> = {
  free: 10,
  starter: 60,
  pro: 300,
  agency: 1000,
};

// ─── API routes ────────────────────────────────────────────
export const API_ROUTES = {
  AUTH: {
    WEBHOOK: '/api/v1/auth/webhook',
  },
  PROJECTS: {
    BASE: '/api/v1/projects',
    BY_ID: (id: string) => `/api/v1/projects/${id}`,
    GENERATE: (id: string) => `/api/v1/projects/${id}/generate`,
    DEPLOY: (id: string) => `/api/v1/projects/${id}/deploy`,
    GRANULAR_EDIT: (id: string) => `/api/v1/projects/${id}/granular-edit`,
  },
  CREDITS: {
    BALANCE: '/api/v1/credits/balance',
    HISTORY: '/api/v1/credits/history',
    PURCHASE: '/api/v1/credits/purchase',
    PACKAGES: '/api/v1/credit-packages',
  },
  MODELS: '/api/v1/models',
} as const;

// ─── App metadata ──────────────────────────────────────────
export const APP = {
  NAME: 'WebCraft AI Studio',
  DESCRIPTION: 'Crea, edita y publica sitios web profesionales con inteligencia artificial',
  URL: 'https://webcraft.ai',
} as const;
