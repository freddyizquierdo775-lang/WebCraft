import type { PlanTier, RoutingDecision } from '@webcraft/shared';
import { CREDIT_COSTS, MODELS_BY_TIER } from '@webcraft/shared';

// ─── Model catalog with capabilities and costs ─────────────
const MODEL_CATALOG = {
  'google/gemini-flash-1.5': {
    name: 'Gemini Flash 1.5',
    tier: 'free' as PlanTier,
    credits_per_1k_tokens: 0.01,
    capabilities: ['generation', 'editing'],
    cost_per_generation: CREDIT_COSTS.GENERATE_SITE_FLASH,
    max_tokens: 8192,
  },
  'openai/gpt-4o-mini': {
    name: 'GPT-4o Mini',
    tier: 'starter' as PlanTier,
    credits_per_1k_tokens: 0.15,
    capabilities: ['generation', 'editing', 'analysis'],
    cost_per_generation: CREDIT_COSTS.GENERATE_SITE_GPT4O_MINI,
    max_tokens: 16384,
  },
  'anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    tier: 'pro' as PlanTier,
    credits_per_1k_tokens: 3.0,
    capabilities: ['generation', 'editing', 'analysis', 'granular'],
    cost_per_generation: CREDIT_COSTS.GENERATE_SITE_CLAUDE,
    max_tokens: 8192,
  },
  'openai/gpt-4o': {
    name: 'GPT-4o',
    tier: 'agency' as PlanTier,
    credits_per_1k_tokens: 5.0,
    capabilities: ['generation', 'editing', 'analysis', 'granular'],
    cost_per_generation: 15,
    max_tokens: 16384,
  },
} as const;

type ModelId = keyof typeof MODEL_CATALOG;

// ─── Complexity heuristics ─────────────────────────────────
function assessComplexity(prompt: string, sections: number): 'low' | 'medium' | 'high' {
  const len = prompt.length;
  if (len < 200 && sections <= 3) return 'low';
  if (len < 800 && sections <= 6) return 'medium';
  return 'high';
}

function hasEcommerceRequirement(prompt: string): boolean {
  const ecommerceKeywords = [
    'tienda',
    'producto',
    'carrito',
    'pago',
    'ecommerce',
    'compra',
    'venta',
    'inventario',
  ];
  return ecommerceKeywords.some((kw) => prompt.toLowerCase().includes(kw));
}

// ─── Route to best model ───────────────────────────────────
export function routeModel(
  userPlan: PlanTier,
  prompt: string,
  sections: string[],
): RoutingDecision {
  const availableModels = MODELS_BY_TIER[userPlan] as string[];
  const complexity = assessComplexity(prompt, sections.length);
  const ecommerce = hasEcommerceRequirement(prompt);

  // Pick the best model available for this tier and complexity
  let modelId: ModelId;

  if (complexity === 'low') {
    modelId = availableModels.includes('google/gemini-flash-1.5')
      ? 'google/gemini-flash-1.5'
      : (availableModels[0] as ModelId);
    return {
      model_id: modelId,
      reason: `Prompt simple (${prompt.length} chars, ${sections.length} secciones) → modelo económico`,
      estimated_credits: MODEL_CATALOG[modelId]?.cost_per_generation ?? 5,
    };
  }

  if (complexity === 'medium') {
    modelId = availableModels.includes('openai/gpt-4o-mini')
      ? 'openai/gpt-4o-mini'
      : (availableModels[0] as ModelId);
    return {
      model_id: modelId,
      reason: `Complejidad media (${prompt.length} chars, ${sections.length} secciones) → modelo balanceado`,
      estimated_credits: MODEL_CATALOG[modelId]?.cost_per_generation ?? 5,
    };
  }

  // High complexity — use best available
  if (ecommerce && availableModels.includes('anthropic/claude-3.5-sonnet')) {
    modelId = 'anthropic/claude-3.5-sonnet';
    return {
      model_id: modelId,
      reason: 'Requiere e-commerce + alta complejidad → Claude 3.5 Sonnet',
      estimated_credits: MODEL_CATALOG[modelId]?.cost_per_generation ?? 10,
    };
  }

  // Best model available for this tier
  modelId = availableModels.includes('anthropic/claude-3.5-sonnet')
    ? 'anthropic/claude-3.5-sonnet'
    : availableModels.includes('openai/gpt-4o-mini')
      ? 'openai/gpt-4o-mini'
      : (availableModels[0] as ModelId);

  return {
    model_id: modelId,
    reason: `Alta complejidad → mejor modelo disponible para plan ${userPlan}`,
    estimated_credits: MODEL_CATALOG[modelId]?.cost_per_generation ?? 10,
    fallback_model: availableModels.includes('openai/gpt-4o-mini')
      ? 'openai/gpt-4o-mini'
      : undefined,
  };
}

export function getModelInfo(modelId: string) {
  return MODEL_CATALOG[modelId as ModelId];
}
