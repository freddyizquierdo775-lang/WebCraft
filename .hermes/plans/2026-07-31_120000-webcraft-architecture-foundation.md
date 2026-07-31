# WebCraft AI Studio — Arquitectura Fundacional (Fase 1 MVP)

> **Para Hermes:** Usar `plan` + `subagent-driven-development` para implementar tarea por tarea.

**Goal:** Establecer la arquitectura cloud-native base de WebCraft AI Studio: estructura del monorepo, esquemas Supabase (usuarios, proyectos, créditos), contratos de API REST/WS, y plan de ejecución por fases con auditorías.

**Architecture:** Monorepo con Turborepo — `apps/web` (Next.js 14 App Router + React 19), `apps/api` (Node.js + Express/Fastify), `packages/shared` (tipos, constantes, utilidades). Supabase como BaaS (auth, DB, realtime, storage). OpenRouter como gateway unificado de modelos LLM. Despliegue en Vercel (frontend) + Railway/Render (API).

**Tech Stack:** TypeScript 5.x, Next.js 14 (App Router), React 19, TailwindCSS + shadcn/ui, Supabase (PostgreSQL 15 + Auth + Realtime), Node.js 20 LTS, Fastify, Drizzle ORM, OpenRouter SDK, Fabric.js (editor visual — Fase C), Stripe/Conekta/MercadoPago (Fase D).

---

## 1. Árbol de Directorios del Proyecto

```
webcraft/
├── .hermes/
│   └── plans/                          # Planes de arquitectura y features
│       └── 2026-07-31_120000-webcraft-architecture-foundation.md
│
├── apps/
│   ├── web/                            # Frontend — Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (auth)/                 # Rutas de autenticación (layout propio)
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── signup/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── onboarding/
│   │   │   │   │   └── page.tsx        # Flujo de briefing del negocio
│   │   │   │   └── layout.tsx          # Layout limpio sin navbar
│   │   │   ├── (dashboard)/            # Rutas protegidas (layout con sidebar)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx        # "Mis Sitios" — grid de proyectos
│   │   │   │   ├── projects/
│   │   │   │   │   └── [projectId]/
│   │   │   │   │       ├── page.tsx    # Vista general del proyecto
│   │   │   │   │       ├── editor/
│   │   │   │   │       │   └── page.tsx # Editor visual (Fase C)
│   │   │   │   │       └── settings/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── billing/
│   │   │   │   │   └── page.tsx        # Créditos y suscripción
│   │   │   │   ├── marketplace/
│   │   │   │   │   └── page.tsx        # Marketplace de plantillas
│   │   │   │   └── layout.tsx          # Sidebar + header del dashboard
│   │   │   ├── api/                    # API Routes de Next.js (proxies ligeros)
│   │   │   │   └── [...]
│   │   │   ├── layout.tsx              # Root layout (providers, fonts)
│   │   │   ├── page.tsx                # Landing page pública
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn/ui primitives
│   │   │   ├── layout/                 # Navbar, Sidebar, Footer
│   │   │   ├── dashboard/              # ProjectCard, CreditMeter, StatsWidget
│   │   │   ├── editor/                 # Canvas, AIPanel, OutlineTree (Fase C)
│   │   │   ├── onboarding/             # BusinessBriefingWizard
│   │   │   └── shared/                 # Loading, ErrorBoundary, EmptyState
│   │   ├── hooks/                      # useUser, useProject, useCredits
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts           # Browser client (anon key)
│   │   │   │   ├── server.ts           # Server client (service_role — server-only)
│   │   │   │   └── middleware.ts       # Auth middleware + session refresh
│   │   │   ├── openrouter/
│   │   │   │   └── client.ts           # OpenRouter SDK wrapper
│   │   │   └── utils.ts
│   │   ├── stores/                     # Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   ├── project-store.ts
│   │   │   └── editor-store.ts
│   │   ├── middleware.ts               # Next.js middleware (auth guard)
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                            # Backend API — Node.js + Fastify
│       ├── src/
│       │   ├── index.ts                # Entry point
│       │   ├── app.ts                  # Fastify app factory
│       │   ├── config/
│       │   │   ├── env.ts              # Zod-validated env vars
│       │   │   └── supabase.ts         # Supabase admin client (service_role)
│       │   ├── routes/
│       │   │   ├── auth/
│       │   │   │   └── index.ts        # Webhook handlers (auth events)
│       │   │   ├── projects/
│       │   │   │   ├── index.ts        # CRUD proyectos
│       │   │   │   └── [id].ts
│       │   │   ├── generation/
│       │   │   │   └── index.ts        # Endpoint de generación IA
│       │   │   ├── deployment/
│       │   │   │   └── index.ts        # Deploy a WHM/cPanel
│       │   │   └── credits/
│       │   │       └── index.ts        # Consulta/compra de créditos
│       │   ├── services/
│       │   │   ├── ai/
│       │   │   │   ├── router.ts       # Policy Layer — enrutamiento inteligente
│       │   │   │   ├── generator.ts    # Generador de sitios desde prompt
│       │   │   │   └── granular.ts     # Edición granular AST + Diff (Fase C)
│       │   │   ├── deployment/
│       │   │   │   └── whm.ts          # API WHM/cPanel
│       │   │   └── billing/
│       │   │       └── credits.ts      # Lógica de créditos
│       │   ├── middleware/
│       │   │   ├── auth.ts             # JWT verification (Supabase)
│       │   │   ├── rate-limit.ts       # Rate limiting por plan
│       │   │   └── plan-guard.ts       # Bloqueo de features por plan
│       │   ├── lib/
│       │   │   ├── db.ts               # Drizzle ORM + pg connection
│       │   │   ├── openrouter.ts       # OpenRouter client wrapper
│       │   │   └── errors.ts           # Tipos de error estandarizados
│       │   └── types/
│       │       ├── project.ts
│       │       ├── generation.ts
│       │       └── api.ts              # Request/Response contracts
│       ├── drizzle/
│       │   └── migrations/             # Migraciones generadas por Drizzle
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   └── shared/                         # Código compartido entre apps
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.ts             # User, Plan enum
│       │   │   ├── project.ts          # Project, ProjectStatus, Deployment
│       │   │   ├── credits.ts          # CreditTransaction, CreditPackage
│       │   │   └── api.ts              # APIResponse<T>, PaginatedResponse<T>
│       │   ├── constants/
│       │   │   ├── plans.ts            # Plan tiers y límites
│       │   │   ├── models.ts           # Modelos OpenRouter + costos
│       │   │   └── routes.ts           # API route paths
│       │   ├── validators/
│       │   │   ├── project.ts          # Zod schemas
│       │   │   └── generation.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── supabase/                           # Configuración y migraciones Supabase
│   ├── migrations/
│   │   ├── 0000_init_users.sql
│   │   ├── 0001_init_projects.sql
│   │   ├── 0002_init_credits.sql
│   │   └── 0003_rls_policies.sql
│   ├── functions/                      # Edge Functions (Deno)
│   │   ├── handle-new-user/            # Trigger auth → crea perfil
│   │   └── credit-deduct/              # Deducción atómica de créditos
│   └── seed.sql                        # Datos semilla (planes, paquetes crédito)
│
├── docker/
│   ├── docker-compose.yml              # Entorno local (opcional)
│   └── Dockerfile.api
│
├── .env.example                        # Variables de entorno template
├── .gitignore
├── turbo.json                          # Turborepo config
├── package.json                        # Root package.json (workspaces)
├── pnpm-workspace.yaml
├── biome.json                          # Linter + formatter (Biome)
└── README.md
```

### Convenciones de nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` | `credit-meter.tsx` |
| Componentes React | `PascalCase` | `ProjectCard` |
| Funciones/hooks | `camelCase` | `useProjectCredits` |
| Tablas Supabase | `snake_case` plural | `user_projects` |
| Columnas BD | `snake_case` | `created_at` |
| Endpoints API | `kebab-case` | `/api/v1/credit-packages` |
| Commits | Conventional Commits | `feat: add project grid dashboard` |

---

## 2. Esquemas de Base de Datos (Supabase)

### 2.1 Diagrama Entidad-Relación

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│    profiles     │       │   user_projects  │       │  credit_transactions│
│─────────────────│       │──────────────────│       │─────────────────────│
│ id (UUID) PK    │──1:N──│ id (UUID) PK     │       │ id (UUID) PK        │
│ user_id (FK)→auth│      │ owner_id (FK)    │       │ user_id (FK)        │
│ email           │       │ name             │       │ amount              │
│ full_name       │       │ description      │       │ type (enum)         │
│ plan (enum)     │       │ status (enum)    │       │ balance_after       │
│ credits_balance │       │ html_content     │       │ reference           │
│ created_at      │       │ css_content      │       │ created_at          │
└─────────────────┘       │ js_content       │       └─────────────────────┘
                           │ ast_tree (JSONB) │
                           │ preview_url      │       ┌─────────────────────┐
                           │ published_url    │       │   subscriptions     │
                           │ created_at       │       │─────────────────────│
                           │ updated_at       │       │ id (UUID) PK        │
                           └──────────────────┘       │ user_id (FK)        │
                                                      │ plan (enum)         │
┌─────────────────┐                                   │ status (enum)       │
│ generation_logs │                                   │ current_period_start│
│─────────────────│                                   │ current_period_end  │
│ id (UUID) PK    │                                   │ stripe_sub_id       │
│ project_id (FK) │                                   │ created_at          │
│ prompt          │                                   └─────────────────────┘
│ model_used      │
│ tokens_in       │       ┌──────────────────┐
│ tokens_out      │       │ credit_packages  │
│ credits_cost    │       │──────────────────│
│ created_at      │       │ id (UUID) PK     │
└─────────────────┘       │ name             │
                          │ credits          │
                          │ price_cents      │
                          │ is_active        │
                          └──────────────────┘
```

### 2.2 DDL — Definiciones de Tablas

```sql
-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

-- Planes de suscripción
CREATE TYPE plan_tier AS ENUM (
  'free',
  'starter',
  'pro',
  'agency'
);

-- Estado de proyecto
CREATE TYPE project_status AS ENUM (
  'draft',        -- Borrador, no generado aún
  'generating',   -- La IA está generando
  'ready',        -- Generado, listo para editar/publicar
  'published',    -- Publicado en URL temporal
  'archived'      -- Archivado
);

-- Tipo de transacción de créditos
CREATE TYPE credit_transaction_type AS ENUM (
  'purchase',          -- Compra de paquete
  'subscription',      -- Créditos mensuales del plan
  'generation',        -- Gasto por generación de sitio
  'granular_edit',     -- Gasto por edición granular
  'refund',            -- Reembolso
  'admin_grant',       -- Concesión administrativa
  'referral_bonus'     -- Bono por referido
);

-- Estado de suscripción
CREATE TYPE subscription_status AS ENUM (
  'active',
  'past_due',
  'canceled',
  'trialing',
  'incomplete'
);

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  
  -- Plan y créditos
  plan          plan_tier NOT NULL DEFAULT 'free',
  credits_balance INTEGER NOT NULL DEFAULT 0
    CHECK (credits_balance >= 0),
  
  -- Metadatos
  metadata      JSONB DEFAULT '{}'::jsonb,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLA: user_projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Info básica
  name          TEXT NOT NULL,
  description   TEXT,
  business_type TEXT,           -- Tipo de negocio (restaurante, hotel, etc.)
  
  -- Estado
  status        project_status NOT NULL DEFAULT 'draft',
  
  -- Contenido generado (Fase B)
  html_content  TEXT,
  css_content   TEXT,
  js_content    TEXT,
  
  -- AST para edición granular (Fase C)
  ast_tree      JSONB,          -- Árbol sintáctico del sitio
  
  -- URLs
  preview_url   TEXT,            -- URL temporal de preview
  published_url TEXT,            -- URL de producción
  
  -- Metadatos del briefing
  briefing_data JSONB DEFAULT '{}'::jsonb,  -- Datos del onboarding
  
  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.user_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.user_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON public.user_projects(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLA: credit_transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  amount        INTEGER NOT NULL,              -- Positivo = crédito, Negativo = débito
  type          credit_transaction_type NOT NULL,
  
  balance_after INTEGER NOT NULL,              -- Saldo después de la transacción
  
  -- Referencia opcional
  reference     JSONB DEFAULT '{}'::jsonb,     -- {project_id, model, tokens...}
  
  -- Idempotency key para evitar duplicados
  idempotency_key TEXT UNIQUE,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_type ON public.credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_idempotency ON public.credit_transactions(idempotency_key);


-- ============================================================
-- TABLA: generation_logs (auditoría de uso de IA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID REFERENCES public.user_projects(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  prompt        TEXT NOT NULL,
  model_used    TEXT NOT NULL,                -- 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'
  
  tokens_in     INTEGER NOT NULL DEFAULT 0,
  tokens_out    INTEGER NOT NULL DEFAULT 0,
  credits_cost  INTEGER NOT NULL DEFAULT 0,
  
  duration_ms   INTEGER,                      -- Tiempo de respuesta del modelo
  
  -- Éxito/error
  success       BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_genlogs_project ON public.generation_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_genlogs_user ON public.generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_genlogs_created ON public.generation_logs(created_at DESC);


-- ============================================================
-- TABLA: credit_packages (productos de compra de créditos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  credits       INTEGER NOT NULL CHECK (credits > 0),
  price_cents   INTEGER NOT NULL CHECK (price_cents >= 0),  -- Precio en centavos MXN/USD
  currency      TEXT NOT NULL DEFAULT 'MXN',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  metadata      JSONB DEFAULT '{}'::jsonb,
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- TABLA: subscriptions (Stripe/Conekta/MercadoPago)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  plan                  plan_tier NOT NULL,
  status                subscription_status NOT NULL DEFAULT 'incomplete',
  
  -- Datos del proveedor de pagos
  provider              TEXT NOT NULL,              -- 'stripe', 'conekta', 'mercadopago'
  provider_subscription_id TEXT,                     -- ID en el proveedor
  
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  
  canceled_at           TIMESTAMPTZ,
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- SEMILLA: Paquetes de créditos iniciales
-- ============================================================
INSERT INTO public.credit_packages (name, credits, price_cents, currency) VALUES
  ('10 Créditos', 10, 2900, 'MXN'),      -- ~$29 MXN
  ('50 Créditos', 50, 11900, 'MXN'),     -- ~$119 MXN
  ('100 Créditos', 100, 19900, 'MXN'),   -- ~$199 MXN
  ('500 Créditos', 500, 79900, 'MXN')    -- ~$799 MXN
ON CONFLICT DO NOTHING;
```

### 2.3 Políticas RLS (Row Level Security)

```sql
-- ============================================================
-- RLS: profiles — usuarios solo ven su propio perfil
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- El INSERT lo maneja el trigger/Edge Function post-auth


-- ============================================================
-- RLS: user_projects — solo el dueño accede
-- ============================================================
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view projects"
  ON public.user_projects FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can create projects"
  ON public.user_projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update projects"
  ON public.user_projects FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete projects"
  ON public.user_projects FOR DELETE
  USING (owner_id = auth.uid());


-- ============================================================
-- RLS: credit_transactions — solo el dueño ve sus transacciones
-- ============================================================
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (user_id = auth.uid());

-- INSERT solo desde backend (service_role) o Edge Functions


-- ============================================================
-- RLS: generation_logs — solo el dueño ve sus logs
-- ============================================================
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own generation logs"
  ON public.generation_logs FOR SELECT
  USING (user_id = auth.uid());


-- ============================================================
-- RLS: credit_packages — lectura pública
-- ============================================================
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);


-- ============================================================
-- RLS: subscriptions — solo el dueño
-- ============================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());
```

### 2.4 Edge Function: `handle-new-user`

Se ejecuta automáticamente cuando un usuario se registra en Supabase Auth:

```typescript
// supabase/functions/handle-new-user/index.ts
// Crea el perfil con plan 'free' y 10 créditos de bienvenida
```

### 2.5 Función PL/pgSQL: `deduct_credits`

Deducción atómica de créditos (resuelve race conditions):

```sql
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_transaction_type,
  p_reference JSONB DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Verificar idempotencia
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM credit_transactions WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'Duplicate transaction' USING ERRCODE = '23505';
    END IF;
  END IF;

  -- Bloquear fila y leer saldo actual
  SELECT credits_balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: have %, need %', v_balance, p_amount
      USING ERRCODE = 'P0001';
  END IF;

  -- Debitar
  UPDATE profiles
  SET credits_balance = credits_balance - p_amount
  WHERE id = p_user_id;

  -- Registrar transacción
  INSERT INTO credit_transactions (user_id, amount, type, balance_after, reference, idempotency_key)
  VALUES (p_user_id, -p_amount, p_type, v_balance - p_amount, p_reference, p_idempotency_key);

  RETURN v_balance - p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Contratos de API

### 3.1 Tipos Compartidos

```typescript
// packages/shared/src/types/api.ts

// Envoltorio estándar de respuesta
interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;           // 'INSUFFICIENT_CREDITS', 'PROJECT_NOT_FOUND', etc.
    message: string;        // Mensaje legible
    details?: unknown;      // Detalles adicionales (validación, etc.)
  };
  meta?: {
    timestamp: string;      // ISO 8601
    request_id: string;     // UUID para tracing
  };
}

// Respuesta paginada
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

### 3.2 Endpoints REST

#### **Auth** (Webhooks de Supabase — no expuestos directamente)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/webhook` | Webhook de Supabase (new user, delete) | `service_role` |

#### **Projects**

| Método | Ruta | Descripción | Auth | Plan |
|---|---|---|---|---|
| `GET` | `/api/v1/projects` | Listar proyectos del usuario | Bearer JWT | Todos |
| `POST` | `/api/v1/projects` | Crear proyecto (draft) | Bearer JWT | Todos |
| `GET` | `/api/v1/projects/:id` | Obtener proyecto por ID | Bearer JWT | Todos |
| `PATCH` | `/api/v1/projects/:id` | Actualizar proyecto | Bearer JWT | Todos |
| `DELETE` | `/api/v1/projects/:id` | Eliminar proyecto | Bearer JWT | Todos |
| `POST` | `/api/v1/projects/:id/generate` | Generar sitio con IA | Bearer JWT | Starter+ |
| `POST` | `/api/v1/projects/:id/deploy` | Publicar en URL temporal | Bearer JWT | Starter+ |
| `POST` | `/api/v1/projects/:id/granular-edit` | Edición granular con IA (Fase C) | Bearer JWT | Pro+ |

**Request: `POST /api/v1/projects`**
```json
{
  "name": "La Parrilla del Centro",
  "description": "Restaurante de carnes asadas en Cancún",
  "business_type": "restaurant",
  "briefing_data": {
    "industry": "restaurant",
    "target_audience": "turistas y locales",
    "brand_colors": ["#8B0000", "#FFD700"],
    "sections": ["menu", "about", "contact", "reservations"],
    "tone": "rústico y acogedor"
  }
}
```

**Response: `POST /api/v1/projects/:id/generate`**
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "status": "generating",
    "estimated_credits": 5,
    "eta_seconds": 30
  }
}
```

#### **Credits**

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/credits/balance` | Saldo actual del usuario | Bearer JWT |
| `GET` | `/api/v1/credits/history` | Historial de transacciones | Bearer JWT |
| `GET` | `/api/v1/credit-packages` | Paquetes disponibles | Pública |
| `POST` | `/api/v1/credits/purchase` | Comprar paquete de créditos | Bearer JWT |

**Response: `GET /api/v1/credits/balance`**
```json
{
  "success": true,
  "data": {
    "balance": 25,
    "plan": "starter",
    "monthly_allowance": 50,
    "allowance_used": 15,
    "next_refill": "2026-08-15T00:00:00Z"
  }
}
```

#### **OpenRouter Models** (consulta de modelos disponibles)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/models` | Modelos disponibles según plan | Bearer JWT |

**Response: `GET /api/v1/models`**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "google/gemini-flash-1.5",
        "name": "Gemini Flash 1.5",
        "credits_per_1k_tokens": 0.01,
        "tier": "free",
        "capabilities": ["generation", "editing"]
      },
      {
        "id": "openai/gpt-4o-mini",
        "name": "GPT-4o Mini",
        "credits_per_1k_tokens": 0.15,
        "tier": "starter",
        "capabilities": ["generation", "editing", "analysis"]
      },
      {
        "id": "anthropic/claude-3.5-sonnet",
        "name": "Claude 3.5 Sonnet",
        "credits_per_1k_tokens": 3.0,
        "tier": "pro",
        "capabilities": ["generation", "editing", "analysis", "granular"]
      }
    ]
  }
}
```

### 3.3 WebSocket Events (Fase C — Editor en tiempo real)

```
ws://api/v1/ws/editor/:projectId
```

| Evento | Dirección | Payload |
|---|---|---|
| `editor:join` | Cliente → Servidor | `{ projectId }` |
| `editor:element-select` | Cliente → Servidor | `{ elementId, path }` |
| `ai:granular-edit` | Cliente → Servidor | `{ elementId, prompt, context }` |
| `ai:edit-progress` | Servidor → Cliente | `{ elementId, status, diff? }` |
| `ai:edit-complete` | Servidor → Cliente | `{ elementId, patch, html, css }` |
| `preview:update` | Servidor → Cliente | `{ html, css, js }` |

### 3.4 Errores Estandarizados

| Código | HTTP | Significado |
|---|---|---|
| `INSUFFICIENT_CREDITS` | 402 | Sin créditos suficientes para la operación |
| `PLAN_RESTRICTED` | 403 | Feature no disponible en el plan actual |
| `PROJECT_NOT_FOUND` | 404 | Proyecto no existe o no pertenece al usuario |
| `GENERATION_IN_PROGRESS` | 409 | Ya hay una generación en curso |
| `RATE_LIMITED` | 429 | Demasiadas solicitudes |
| `AI_SERVICE_ERROR` | 502 | Error en OpenRouter o modelo |
| `VALIDATION_ERROR` | 422 | Datos de entrada inválidos |

---

## 4. Planes y Límites

### 4.1 Tiers

| Característica | Free | Starter | Pro | Agency |
|---|---|---|---|---|
| **Precio mensual (MXN)** | $0 | $299 | $799 | $1,999 |
| **Proyectos** | 1 | 5 | 20 | Ilimitados |
| **Créditos/mes** | 10 | 50 | 200 | 500 |
| **Modelos IA** | Gemini Flash | + GPT-4o Mini | + Claude 3.5 Sonnet | Todos + Priority |
| **Generación sitios** | 1 | Ilimitado | Ilimitado | Ilimitado |
| **Edición granular** | ❌ | ❌ | ✅ | ✅ |
| **White-label** | ❌ | ❌ | ❌ | ✅ |
| **E-commerce** | ❌ | ❌ | ✅ | ✅ |
| **Marketplace venta** | ❌ | ❌ | ✅ | ✅ |

### 4.2 Costos de Créditos por Operación

| Operación | Modelo | Créditos |
|---|---|---|
| Generar sitio (1 página) | Gemini Flash 1.5 | 2 |
| Generar sitio (1 página) | GPT-4o Mini | 5 |
| Generar sitio (1 página) | Claude 3.5 Sonnet | 10 |
| Edición granular | GPT-4o Mini | 1 |
| Edición granular | Claude 3.5 Sonnet | 3 |
| Regenerar sección | GPT-4o Mini | 2 |

---

## 5. Roadmap por Fases y Criterios de Auditoría

### Fase A: Esqueleto y Autenticación (Semanas 1-2)

**Entregables:**
- Monorepo configurado (Turborepo + pnpm)
- Next.js App Router con layouts base
- Supabase Auth configurado (email/password + OAuth Google)
- Dashboard "Mis Sitios" con grid de tarjetas
- Onboarding wizard de briefing de negocio
- Sidebar de navegación + header con créditos
- Edge Function `handle-new-user`

**Auditoría de Arquitectura — Fase A:**
- [ ] ¿El monorepo compila sin errores con `pnpm build`?
- [ ] ¿La autenticación usa Supabase Auth nativo (sin reinventar)?
- [ ] ¿RLS está activado en todas las tablas de usuario?
- [ ] ¿Las consultas al frontend usan el anon key (no service_role)?
- [ ] ¿El diseño es responsive (mobile-first)?
- [ ] ¿No hay lógica de negocio en el frontend (solo UI state)?
- [ ] ¿El onboarding guarda datos como JSONB en `briefing_data`?

---

### Fase B: Motor de Generación y OpenRouter (Semanas 3-5)

**Entregables:**
- Servicio `ai/router.ts` — Policy Layer de enrutamiento inteligente
- Servicio `ai/generator.ts` — Generador de sitios desde prompt
- Endpoint `POST /projects/:id/generate`
- Sistema de créditos: deducción atómica con `deduct_credits()`
- Integración WHM/cPanel para deploy automático
- Vista de preview del sitio generado

**Auditoría de Arquitectura — Fase B:**
- [ ] ¿La Policy Layer selecciona el modelo según complejidad del prompt y plan?
- [ ] ¿La deducción de créditos usa `FOR UPDATE` para evitar race conditions?
- [ ] ¿El `idempotency_key` previene cobros dobles?
- [ ] ¿Los logs de generación registran tokens, costo y modelo usado?
- [ ] ¿El deploy es asíncrono (no bloquea la respuesta HTTP)?
- [ ] ¿Se aplica rate limiting diferenciado por plan?
- [ ] ¿Los secretos de WHM/cPanel NO están en el frontend?

---

### Fase C: Editor Visual y Edición Granular (Semanas 6-8)

**Entregables:**
- Canvas interactivo con Fabric.js / GrapesJS
- Panel "Editar con IA" (prompt contextual por elemento)
- Servicio `ai/granular.ts` — edición vía AST + Diff matching
- Panel de estructura (Outline tree)
- WebSocket para colaboración en tiempo real
- Vista previa instantánea de cambios

**Auditoría de Arquitectura — Fase C:**
- [ ] ¿La edición granular modifica solo el componente seleccionado?
- [ ] ¿El AST tree del proyecto se persiste como JSONB?
- [ ] ¿El diff matching preserva el resto del código sin alteraciones?
- [ ] ¿Los cambios aplicados son atómicos (todo o nada)?
- [ ] ¿El WebSocket usa autenticación JWT?
- [ ] ¿El canvas maneja correctamente undo/redo?
- [ ] ¿La UI no se bloquea durante operaciones de IA?

---

### Fase D: Tienda y Pagos (Semanas 9-10)

**Entregables:**
- Dashboard de e-commerce (inventario, pedidos)
- Flujo de onboarding de pasarelas (Conekta, MercadoPago, Stripe)
- Sistema de suscripciones recurrente
- Marketplace de plantillas (compra/venta)
- Analíticas básicas de ventas

**Auditoría de Arquitectura — Fase D:**
- [ ] ¿Las claves API de pasarelas NUNCA se exponen al cliente?
- [ ] ¿Los webhooks de pago verifican firma/firma HMAC?
- [ ] ¿Las suscripciones manejan graceful degradation (pasarela caída)?
- [ ] ¿El marketplace usa escrow de créditos hasta la entrega?
- [ ] ¿La comisión del 0.5% se calcula en backend (no confiar en frontend)?
- [ ] ¿Cumplimiento PCI-DSS: no se almacenan números de tarjeta?

---

## 6. Variables de Entorno Requeridas

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_DB_URL=postgresql://postgres.<project>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# WHM/cPanel (Fase B)
WHM_HOST=server.example.com
WHM_API_TOKEN=...
CPANEL_USERNAME=webcraft

# Stripe (Fase D)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Conekta (Fase D)
CONEKTA_PRIVATE_KEY=key_...

# MercadoPago (Fase D)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

---

## 7. Principios de Arquitectura (No Negociables)

1. **La inteligencia financiera vive en la BD** — Créditos, deducciones, y saldos se manejan en PL/pgSQL con `FOR UPDATE`, nunca en el frontend.
2. **Secrets never touch the client** — `service_role`, API keys de pasarelas, y tokens de WHM solo existen en `apps/api` o Edge Functions.
3. **RLS como primera línea de defensa** — Cada tabla tiene políticas RLS antes que middleware de API.
4. **Idempotencia en cada transacción** — `idempotency_key` en toda operación que modifica créditos o genera contenido.
5. **AST como fuente de verdad del editor** — El árbol sintáctico JSONB persiste el estado del sitio; el HTML/CSS/JS es materialización derivada.
6. **Rate limiting por plan** — Free: 10 req/min, Starter: 60 req/min, Pro: 300 req/min, Agency: 1000 req/min.

---

*Plan generado: 2026-07-31. Próxima revisión: al finalizar Fase A.*
