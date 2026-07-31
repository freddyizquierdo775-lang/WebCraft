// ─── Generation request/response types ─────────────────────
export interface GenerateRequest {
  project_id: string;
  user_id: string;
  briefing: BriefingData;
  model?: string;
  idempotency_key: string;
}

export interface BriefingData {
  business_name: string;
  industry: string;
  description: string;
  target_audience?: string;
  brand_colors?: string[];
  sections?: string[];
  tone?: string;
  has_ecommerce?: boolean;
  language?: string;
}

export interface GenerateResponse {
  project_id: string;
  status: 'generating' | 'completed' | 'failed';
  html?: string;
  css?: string;
  js?: string;
  preview_url?: string;
  credits_used: number;
  model_used: string;
  tokens_in: number;
  tokens_out: number;
  duration_ms: number;
}

export interface CreditBalanceResponse {
  balance: number;
  plan: string;
  monthly_allowance: number;
  allowance_used: number;
  next_refill: string | null;
}

// ─── Model routing decision ────────────────────────────────
export interface RoutingDecision {
  model_id: string;
  reason: string;
  estimated_credits: number;
  fallback_model?: string;
}

// ─── Site template section ─────────────────────────────────
export interface SiteSection {
  type:
    | 'hero'
    | 'features'
    | 'about'
    | 'services'
    | 'menu'
    | 'gallery'
    | 'testimonials'
    | 'contact'
    | 'footer'
    | 'cta'
    | 'pricing';
  title: string;
  content: string;
  html: string;
}
