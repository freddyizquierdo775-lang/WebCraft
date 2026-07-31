-- ============================================================
-- WebCraft AI Studio — Migración 0000: Extensiones y ENUMs
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMs
DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'agency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('draft', 'generating', 'ready', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE credit_transaction_type AS ENUM (
    'purchase', 'subscription', 'generation', 'granular_edit',
    'refund', 'admin_grant', 'referral_bonus'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active', 'past_due', 'canceled', 'trialing', 'incomplete'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
