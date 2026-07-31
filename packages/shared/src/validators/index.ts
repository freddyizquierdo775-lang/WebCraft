import { z } from 'zod';
// PLAN_TIERS is a const array, not used directly in validators currently

// ─── Auth ──────────────────────────────────────────────────

// ─── Project ───────────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().max(500).optional(),
  business_type: z.string().max(50).optional(),
  briefing_data: z.record(z.unknown()).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ─── Generation ────────────────────────────────────────────
export const generateSiteSchema = z.object({
  project_id: z.string().uuid(),
  model: z.string().optional(),
  sections: z.array(z.string()).optional(),
  style_preferences: z.record(z.string()).optional(),
});

export type GenerateSiteInput = z.infer<typeof generateSiteSchema>;

// ─── Granular edit ─────────────────────────────────────────
export const granularEditSchema = z.object({
  project_id: z.string().uuid(),
  element_id: z.string(),
  element_path: z.string(),
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  context_html: z.string().optional(),
});

export type GranularEditInput = z.infer<typeof granularEditSchema>;

// ─── Credits ───────────────────────────────────────────────
export const purchaseCreditsSchema = z.object({
  package_id: z.string().uuid(),
  idempotency_key: z.string().uuid(),
});

export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;

// ─── Onboarding briefing ───────────────────────────────────
export const briefingSchema = z.object({
  business_name: z.string().min(2),
  industry: z.string(),
  description: z.string().min(10).max(1000),
  target_audience: z.string().optional(),
  brand_colors: z.array(z.string()).max(5).optional(),
  sections: z.array(z.string()).optional(),
  tone: z
    .enum(['moderno', 'clásico', 'minimalista', 'rústico', 'corporativo', 'divertido'])
    .optional(),
  has_ecommerce: z.boolean().optional(),
  language: z.enum(['es', 'en']).default('es'),
});

export type BriefingInput = z.infer<typeof briefingSchema>;
