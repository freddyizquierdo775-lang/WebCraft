import type { BriefingData, GenerateResponse, RoutingDecision } from '@webcraft/shared';
import { supabaseAdmin } from '../../config/supabase';
import { openRouterCompletion } from '../../lib/openrouter';
import type { GeneratedSite } from './prompts';
import { buildSystemPrompt } from './prompts';
import { getModelInfo, routeModel } from './router';

// ─── Tipos internos ────────────────────────────────────────
interface ProfileData {
  id: string;
  plan: string;
  credits_balance: number;
}

// ─── Función principal ─────────────────────────────────────

/**
 * Genera un sitio web completo a partir de un briefing usando IA.
 *
 * Flujo:
 * 1. Obtiene el perfil del usuario (plan tier, créditos)
 * 2. Enruta al modelo óptimo según complejidad y plan
 * 3. Verifica y deduce créditos vía RPC (idempotente)
 * 4. Llama a OpenRouter con el system prompt construido
 * 5. Parsea la respuesta JSON (html, css, js)
 * 6. Guarda el resultado en user_projects y generation_logs
 * 7. Retorna GenerateResponse
 *
 * En caso de error en cualquier paso, revierte el proyecto a 'draft'.
 */
export async function generateSite(
  briefing: BriefingData,
  userId: string,
  projectId: string,
  idempotencyKey: string,
): Promise<GenerateResponse> {
  const startTime = Date.now();

  // Marcar proyecto como 'generating'
  await supabaseAdmin
    .from('user_projects')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('owner_id', userId);

  let _creditsDeducted = false;

  try {
    // ── 1. Obtener perfil del usuario ──────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, plan, credits_balance')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error(`Perfil de usuario no encontrado: ${userId}`);
    }

    const profileData = profile as ProfileData;

    // ── 2. Enrutar al modelo óptimo ────────────────────────
    const sections = briefing.sections || [];
    const promptText = briefing.description || '';
    const decision: RoutingDecision = routeModel(
      profileData.plan as 'free' | 'starter' | 'pro' | 'agency',
      promptText,
      sections,
    );

    const modelId = decision.model_id;
    const estimatedCredits = decision.estimated_credits;

    // ── 3. Verificar y deducir créditos ────────────────────
    const { data: deductResult, error: deductError } = await supabaseAdmin.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: estimatedCredits,
      p_type: 'generation',
      p_reference: { project_id: projectId, model: modelId },
      p_idempotency_key: idempotencyKey,
    });

    if (deductError) {
      throw new Error(`Error al deducir créditos: ${deductError.message}`);
    }

    // deduct_credits RPC devuelve { success: boolean, balance_after: number, error?: string }
    const deduction = deductResult as {
      success: boolean;
      balance_after: number;
      error?: string;
    };

    if (!deduction.success) {
      throw new Error(deduction.error || 'Créditos insuficientes');
    }

    _creditsDeducted = true;

    // ── 4. Construir prompts y llamar al LLM ───────────────
    const systemPrompt = buildSystemPrompt(briefing);
    const userMessage = `Genera el sitio web completo para ${briefing.business_name}. 
Incluye todas las secciones solicitadas: ${sections.join(', ') || 'todas las relevantes'}.
Responde ÚNICAMENTE con el JSON.`;

    const modelConfig = getModelInfo(modelId);

    const completion = await openRouterCompletion({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: modelConfig?.max_tokens ?? 8192,
      temperature: 0.7,
    });

    // ── 5. Parsear respuesta JSON ──────────────────────────
    const generatedSite = parseGeneratedJSON(completion.content);

    // ── 6. Guardar resultado en user_projects ──────────────
    const durationMs = Date.now() - startTime;

    const { error: updateError } = await supabaseAdmin
      .from('user_projects')
      .update({
        status: 'ready',
        html_content: generatedSite.html,
        css_content: generatedSite.css,
        js_content: generatedSite.js,
        briefing_data: briefing as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('owner_id', userId);

    if (updateError) {
      throw new Error(`Error al guardar el sitio generado: ${updateError.message}`);
    }

    // ── 7. Registrar en generation_logs ────────────────────
    const { error: logError } = await supabaseAdmin.from('generation_logs').insert({
      project_id: projectId,
      user_id: userId,
      prompt: `${briefing.business_name} - ${briefing.industry}`,
      model_used: completion.model,
      tokens_in: completion.tokens_in,
      tokens_out: completion.tokens_out,
      credits_cost: estimatedCredits,
      duration_ms: durationMs,
      success: true,
      error_message: null,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      // Log error pero no romper el flujo — el sitio ya se generó
      console.error(`[generateSite] Error al registrar generation_log: ${logError.message}`);
    }

    // ── 8. Retornar respuesta ──────────────────────────────
    return {
      project_id: projectId,
      status: 'completed',
      html: generatedSite.html,
      css: generatedSite.css,
      js: generatedSite.js,
      credits_used: estimatedCredits,
      model_used: completion.model,
      tokens_in: completion.tokens_in,
      tokens_out: completion.tokens_out,
      duration_ms: durationMs,
    };
  } catch (error) {
    // ── Rollback: revertir proyecto a 'draft' ──────────────
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`[generateSite] Error para proyecto ${projectId}: ${errorMessage}`);

    // Revertir estado del proyecto
    const { error: revertError } = await supabaseAdmin
      .from('user_projects')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('owner_id', userId);

    if (revertError) {
      console.error(
        `[generateSite] Error al revertir estado del proyecto ${projectId}: ${revertError.message}`,
      );
    }

    // Registrar el fallo en generation_logs
    const durationMs = Date.now() - startTime;
    const { error: logError } = await supabaseAdmin.from('generation_logs').insert({
      project_id: projectId,
      user_id: userId,
      prompt: `${briefing.business_name} - ${briefing.industry}`,
      model_used: 'unknown',
      tokens_in: 0,
      tokens_out: 0,
      credits_cost: 0,
      duration_ms: durationMs,
      success: false,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error(
        `[generateSite] Error al registrar fallo en generation_log: ${logError.message}`,
      );
    }

    throw new Error(`Generación fallida: ${errorMessage}`);
  }
}

// ─── Helpers ───────────────────────────────────────────────

/**
 * Parsea la respuesta JSON del LLM extrayendo html, css y js.
 * Maneja respuestas que vienen envueltas en markdown code blocks.
 */
function parseGeneratedJSON(rawContent: string): GeneratedSite {
  // Intentar extraer JSON de posibles bloques de markdown
  let jsonStr = rawContent.trim();

  // Quitar bloque de código markdown si existe
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch?.[1]) {
    jsonStr = codeBlockMatch[1].trim();
  }

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      `El LLM no devolvió JSON válido. Primeros 200 caracteres: ${jsonStr.substring(0, 200)}`,
    );
  }

  const html = typeof parsed.html === 'string' ? parsed.html : '';
  const css = typeof parsed.css === 'string' ? parsed.css : '';
  const js = typeof parsed.js === 'string' ? parsed.js : '';

  if (!html) {
    throw new Error('La respuesta del LLM no contiene campo "html" o está vacío');
  }

  return { html, css, js };
}
