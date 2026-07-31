-- ============================================================
-- WebCraft AI Studio — Migración 0002: RLS Policies
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view projects"
  ON public.user_projects FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Owner can create projects"
  ON public.user_projects FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update projects"
  ON public.user_projects FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete projects"
  ON public.user_projects FOR DELETE USING (owner_id = auth.uid());

-- credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own transactions"
  ON public.credit_transactions FOR SELECT USING (user_id = auth.uid());

-- generation_logs
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own generation logs"
  ON public.generation_logs FOR SELECT USING (user_id = auth.uid());

-- credit_packages (lectura pública)
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.credit_packages FOR SELECT USING (is_active = true);

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own subscriptions"
  ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
