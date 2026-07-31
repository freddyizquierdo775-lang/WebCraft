-- ============================================================
-- WebCraft AI Studio — Migración 0004: E-commerce tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shop_products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency    TEXT NOT NULL DEFAULT 'MXN',
  image_url   TEXT,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_products_project ON public.shop_products(project_id);

CREATE TRIGGER set_updated_at_shop_products
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES public.user_projects(id) ON DELETE CASCADE,
  customer_email  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','cancelled')),
  total_cents     INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  items           JSONB NOT NULL DEFAULT '[]',
  payment_provider TEXT,
  payment_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_orders_project ON public.shop_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON public.shop_orders(status);

CREATE TRIGGER set_updated_at_shop_orders
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Marketplace: templates for sale
CREATE TABLE IF NOT EXISTS public.templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),
  currency      TEXT NOT NULL DEFAULT 'MXN',
  preview_url   TEXT,
  html_content  TEXT NOT NULL,
  css_content   TEXT,
  category      TEXT,
  sales_count   INTEGER NOT NULL DEFAULT 0,
  rating        NUMERIC(3,2) DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_seller ON public.templates(seller_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.templates(is_active) WHERE is_active = true;

CREATE TRIGGER set_updated_at_templates
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Marketplace: purchase records (escrow-like: credits held until delivery)
CREATE TABLE IF NOT EXISTS public.template_purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id     UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  buyer_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price_cents     INTEGER NOT NULL,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','refunded')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_template_purchases_buyer ON public.template_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_template_purchases_seller ON public.template_purchases(seller_id);

-- RLS for shop tables
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_purchases ENABLE ROW LEVEL SECURITY;

-- Shop products: owner of project can manage
CREATE POLICY "Project owner can manage products"
  ON public.shop_products FOR ALL
  USING (EXISTS (SELECT 1 FROM user_projects WHERE id = shop_products.project_id AND owner_id = auth.uid()));

-- Shop orders: owner of project can view
CREATE POLICY "Project owner can view orders"
  ON public.shop_orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_projects WHERE id = shop_orders.project_id AND owner_id = auth.uid()));

-- Templates: public read, seller can manage
CREATE POLICY "Anyone can view active templates"
  ON public.templates FOR SELECT USING (is_active = true);

CREATE POLICY "Seller can manage own templates"
  ON public.templates FOR ALL USING (seller_id = auth.uid());

-- Template purchases: buyer and seller can view
CREATE POLICY "Buyer can view own purchases"
  ON public.template_purchases FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Seller can view sales"
  ON public.template_purchases FOR SELECT USING (seller_id = auth.uid());
