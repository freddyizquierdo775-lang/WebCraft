-- ============================================================
-- WebCraft AI Studio — Migración 0001: Tablas principales
-- ============================================================

-- profiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  plan          plan_tier NOT NULL DEFAULT 'free',
  credits_balance INTEGER NOT NULL DEFAULT 10 CHECK (credits_balance >= 0),
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_projects
CREATE TABLE IF NOT EXISTS public.user_projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  business_type TEXT,
  status        project_status NOT NULL DEFAULT 'draft',
  html_content  TEXT,
  css_content   TEXT,
  js_content    TEXT,
  ast_tree      JSONB,
  preview_url   TEXT,
  published_url TEXT,
  briefing_data JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.user_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.user_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON public.user_projects(created_at DESC);

CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- credit_transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  type          credit_transaction_type NOT NULL,
  balance_after INTEGER NOT NULL,
  reference     JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON public.credit_transactions(created_at DESC);

-- generation_logs
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES public.user_projects(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt        TEXT NOT NULL,
  model_used    TEXT NOT NULL,
  tokens_in     INTEGER NOT NULL DEFAULT 0,
  tokens_out    INTEGER NOT NULL DEFAULT 0,
  credits_cost  INTEGER NOT NULL DEFAULT 0,
  duration_ms   INTEGER,
  success       BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genlogs_project ON public.generation_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_genlogs_user ON public.generation_logs(user_id);

-- credit_packages
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  credits       INTEGER NOT NULL CHECK (credits > 0),
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  currency      TEXT NOT NULL DEFAULT 'MXN',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan                  plan_tier NOT NULL,
  status                subscription_status NOT NULL DEFAULT 'incomplete',
  provider              TEXT NOT NULL,
  provider_subscription_id TEXT,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  canceled_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
