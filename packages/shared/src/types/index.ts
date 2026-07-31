// ─── Plan tiers ────────────────────────────────────────────
export type PlanTier = 'free' | 'starter' | 'pro' | 'agency';

export const PLAN_TIERS = ['free', 'starter', 'pro', 'agency'] as const;

// ─── User profile ──────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanTier;
  credits_balance: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Project status ────────────────────────────────────────
export type ProjectStatus = 'draft' | 'generating' | 'ready' | 'published' | 'archived';

export interface UserProject {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  business_type: string | null;
  status: ProjectStatus;
  html_content: string | null;
  css_content: string | null;
  js_content: string | null;
  ast_tree: unknown | null;
  preview_url: string | null;
  published_url: string | null;
  briefing_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Credits ───────────────────────────────────────────────
export type CreditTransactionType =
  | 'purchase'
  | 'subscription'
  | 'generation'
  | 'granular_edit'
  | 'refund'
  | 'admin_grant'
  | 'referral_bonus';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CreditTransactionType;
  balance_after: number;
  reference: Record<string, unknown>;
  idempotency_key: string | null;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

// ─── Generation ────────────────────────────────────────────
export interface GenerationLog {
  id: string;
  project_id: string | null;
  user_id: string;
  prompt: string;
  model_used: string;
  tokens_in: number;
  tokens_out: number;
  credits_cost: number;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

// ─── Subscription ──────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  provider: string;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── AI Models ─────────────────────────────────────────────
export interface AIModel {
  id: string;
  name: string;
  credits_per_1k_tokens: number;
  tier: PlanTier;
  capabilities: ('generation' | 'editing' | 'analysis' | 'granular')[];
}
