-- ============================================================
-- WebCraft AI Studio — Seed: Paquetes de créditos y datos iniciales
-- ============================================================

INSERT INTO public.credit_packages (name, credits, price_cents, currency) VALUES
  ('10 Créditos', 10, 2900, 'MXN'),
  ('50 Créditos', 50, 11900, 'MXN'),
  ('100 Créditos', 100, 19900, 'MXN'),
  ('500 Créditos', 500, 79900, 'MXN')
ON CONFLICT DO NOTHING;
