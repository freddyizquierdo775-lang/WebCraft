import { CREDIT_COSTS } from '@webcraft/shared';
import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../config/supabase';
import { authMiddleware, getAuth } from '../../middleware/auth';
import { requirePlan } from '../../middleware/plan-guard';
import { rateLimitMiddleware } from '../../middleware/rate-limit';
import { applyGranularEdit } from '../../services/ai/granular';

// ─── Tipos ─────────────────────────────────────────────────

interface GranularEditBody {
  selector: string;
  prompt: string;
  model?: string;
  temperature?: number;
}

interface ProjectRecord {
  id: string;
  owner_id: string;
  status: string;
  html_content: string | null;
  css_content: string | null;
  js_content: string | null;
}

// ─── Rutas ─────────────────────────────────────────────────

export async function granularRoutes(app: FastifyInstance): Promise<void> {
  // Middleware global para todas las rutas de este plugin
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', rateLimitMiddleware);

  /**
   * POST /api/v1/projects/:id/granular-edit
   *
   * Aplica una edición granular con IA sobre un elemento específico del HTML
   * de un proyecto. Requiere plan 'pro' o superior.
   *
   * Body:
   *   - selector (string): Selector CSS del elemento a editar (id, class, tag)
   *   - prompt (string): Instrucción de modificación en lenguaje natural
   *   - model (string, opcional): Modelo de IA a utilizar
   *   - temperature (number, opcional): Temperatura del LLM (default 0.3)
   *
   * Response:
   *   - modified_html: HTML completo con la edición aplicada
   *   - diff: Unified diff mostrando los cambios
   *   - explanation: Explicación en español de los cambios
   *   - credits_used: Créditos consumidos
   *   - model_used: Modelo utilizado
   *   - tokens_in / tokens_out: Tokens consumidos
   */
  app.post(
    '/:id/granular-edit',
    { preHandler: [requirePlan('site:granular-edit')] },
    async (request, reply) => {
      const { userId, userCredits } = getAuth(request);
      const { id: projectId } = request.params as { id: string };
      const body = request.body as GranularEditBody;

      // ── Validar body ─────────────────────────────────────
      if (!body || typeof body.selector !== 'string' || typeof body.prompt !== 'string') {
        return reply.status(422).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los campos "selector" y "prompt" son requeridos (strings)',
          },
        });
      }

      const selector = body.selector.trim();
      const prompt = body.prompt.trim();

      if (!selector || !prompt) {
        return reply.status(422).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '"selector" y "prompt" no pueden estar vacíos',
          },
        });
      }

      if (prompt.length > 4000) {
        return reply.status(422).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El prompt no puede exceder 4000 caracteres',
          },
        });
      }

      // ── Obtener proyecto y validar ownership ─────────────
      const { data: project, error: projectErr } = await supabaseAdmin
        .from('user_projects')
        .select('id, owner_id, status, html_content, css_content, js_content')
        .eq('id', projectId)
        .eq('owner_id', userId)
        .single();

      if (projectErr || !project) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Proyecto no encontrado o no tienes acceso',
          },
        });
      }

      const projectRecord = project as ProjectRecord;

      // ── Validar estado del proyecto ──────────────────────
      if (projectRecord.status !== 'ready') {
        const statusMessages: Record<string, string> = {
          draft: 'El proyecto aún no ha sido generado. Debes generarlo primero.',
          generating: 'El proyecto está generándose. Espera a que termine.',
          archived: 'El proyecto está archivado y no puede editarse.',
          published: 'El proyecto ya está publicado.',
        };
        const message =
          statusMessages[projectRecord.status] ||
          `El proyecto no está en estado "ready" (estado actual: ${projectRecord.status})`;

        return reply.status(409).send({
          success: false,
          error: { code: 'INVALID_STATUS', message },
        });
      }

      // ── Validar que el proyecto tenga HTML ───────────────
      if (!projectRecord.html_content) {
        return reply.status(422).send({
          success: false,
          error: {
            code: 'NO_HTML_CONTENT',
            message: 'El proyecto no tiene contenido HTML para editar',
          },
        });
      }

      // ── Validar créditos suficientes ─────────────────────
      const estimatedCredits = CREDIT_COSTS.GRANULAR_EDIT_CLAUDE;

      if (userCredits < estimatedCredits) {
        return reply.status(402).send({
          success: false,
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: `Créditos insuficientes. Necesitas ${estimatedCredits} créditos, tienes ${userCredits}.`,
            required: estimatedCredits,
            available: userCredits,
          },
        });
      }

      // ── Generar idempotency key ──────────────────────────
      const idempotencyKey = `granular_${projectId}_${userId}_${Date.now()}`;

      // ── Deducir créditos vía RPC ─────────────────────────
      try {
        const { data: deductResult, error: deductError } = await supabaseAdmin.rpc(
          'deduct_credits',
          {
            p_user_id: userId,
            p_amount: estimatedCredits,
            p_type: 'granular_edit',
            p_reference: {
              project_id: projectId,
              selector,
              prompt_preview: prompt.substring(0, 100),
            },
            p_idempotency_key: idempotencyKey,
          },
        );

        if (deductError) {
          return reply.status(500).send({
            success: false,
            error: {
              code: 'CREDIT_DEDUCTION_FAILED',
              message: `Error al deducir créditos: ${deductError.message}`,
            },
          });
        }

        const deduction = deductResult as {
          success: boolean;
          balance_after: number;
          error?: string;
        };

        if (!deduction.success) {
          return reply.status(402).send({
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDITS',
              message: deduction.error || 'Créditos insuficientes',
            },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        return reply.status(500).send({
          success: false,
          error: {
            code: 'CREDIT_DEDUCTION_FAILED',
            message: `Error al deducir créditos: ${msg}`,
          },
        });
      }

      // ── Ejecutar edición granular ────────────────────────
      const startTime = Date.now();

      try {
        const result = await applyGranularEdit({
          html: projectRecord.html_content,
          selector,
          prompt,
          model: body.model || undefined,
          temperature: body.temperature ?? undefined,
        });

        const durationMs = Date.now() - startTime;

        // ── Guardar el HTML modificado en la DB ────────────
        const { error: updateError } = await supabaseAdmin
          .from('user_projects')
          .update({
            html_content: result.modified,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .eq('owner_id', userId);

        if (updateError) {
          console.error(
            `[granular-edit] Error al guardar edición para ${projectId}: ${updateError.message}`,
          );
          // No fallamos la request — la edición ya se realizó, solo falló el guardado
        }

        // ── Registrar en generation_logs ───────────────────
        const { error: logError } = await supabaseAdmin.from('generation_logs').insert({
          project_id: projectId,
          user_id: userId,
          prompt: `Granular edit: ${selector} — ${prompt.substring(0, 200)}`,
          model_used: result.model_used,
          tokens_in: result.tokens_in,
          tokens_out: result.tokens_out,
          credits_cost: estimatedCredits,
          duration_ms: durationMs,
          success: true,
          error_message: null,
          created_at: new Date().toISOString(),
        });

        if (logError) {
          console.error(`[granular-edit] Error al registrar generation_log: ${logError.message}`);
        }

        // ── Responder con éxito ────────────────────────────
        return reply.status(200).send({
          success: true,
          data: {
            modified_html: result.modified,
            diff: result.diff,
            explanation: result.explanation,
            path: result.path,
            credits_used: estimatedCredits,
            model_used: result.model_used,
            tokens_in: result.tokens_in,
            tokens_out: result.tokens_out,
            selector,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        const durationMs = Date.now() - startTime;

        console.error(
          `[granular-edit] Error en edición granular para ${projectId}: ${errorMessage}`,
        );

        // ── Registrar fallo en generation_logs ─────────────
        const { error: logError } = await supabaseAdmin.from('generation_logs').insert({
          project_id: projectId,
          user_id: userId,
          prompt: `Granular edit (FAILED): ${selector} — ${prompt.substring(0, 200)}`,
          model_used: body.model || 'unknown',
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
            `[granular-edit] Error al registrar fallo en generation_log: ${logError.message}`,
          );
        }

        // ── Determinar código de error ─────────────────────
        let statusCode = 500;
        let errorCode = 'GRANULAR_EDIT_FAILED';

        if (errorMessage.includes('No se encontró ningún elemento')) {
          statusCode = 422;
          errorCode = 'SELECTOR_NOT_FOUND';
        } else if (errorMessage.includes('JSON válido')) {
          statusCode = 502;
          errorCode = 'LLM_INVALID_RESPONSE';
        }

        return reply.status(statusCode).send({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
          },
        });
      }
    },
  );
}
