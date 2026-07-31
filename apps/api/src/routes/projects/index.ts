import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../config/supabase.js';
import { getAuth } from '../../middleware/auth.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requirePlan } from '../../middleware/plan-guard.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.js';

export async function projectRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', rateLimitMiddleware);

  // GET /api/v1/projects
  app.get('/', async (request, reply) => {
    const { userId } = getAuth(request);
    const { data, error } = await supabaseAdmin
      .from('user_projects')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return reply
        .status(500)
        .send({ success: false, error: { code: 'INTERNAL', message: error.message } });
    }
    return { success: true, data };
  });

  // POST /api/v1/projects
  app.post('/', async (request, reply) => {
    const { userId } = getAuth(request);
    const { name, description, business_type, briefing_data } = request.body as Record<
      string,
      unknown
    >;

    if (!name || typeof name !== 'string') {
      return reply.status(422).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name es requerido' },
      });
    }

    const { data, error } = await supabaseAdmin
      .from('user_projects')
      .insert({
        owner_id: userId,
        name,
        description: description ?? null,
        business_type: business_type ?? null,
        briefing_data: briefing_data ?? {},
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return reply
        .status(500)
        .send({ success: false, error: { code: 'INTERNAL', message: error.message } });
    }
    return reply.status(201).send({ success: true, data });
  });

  // GET /api/v1/projects/:id
  app.get('/:id', async (request, reply) => {
    const { userId } = getAuth(request);
    const { id } = request.params as { id: string };

    const { data, error } = await supabaseAdmin
      .from('user_projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', userId)
      .single();

    if (error || !data) {
      return reply.status(404).send({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Proyecto no encontrado' },
      });
    }
    return { success: true, data };
  });

  // PATCH /api/v1/projects/:id
  app.patch('/:id', async (request, reply) => {
    const { userId } = getAuth(request);
    const { id } = request.params as { id: string };
    const updates = request.body as Record<string, unknown>;

    const { data, error } = await supabaseAdmin
      .from('user_projects')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) {
      return reply
        .status(500)
        .send({ success: false, error: { code: 'INTERNAL', message: error.message } });
    }
    return { success: true, data };
  });

  // DELETE /api/v1/projects/:id
  app.delete('/:id', async (request, reply) => {
    const { userId } = getAuth(request);
    const { id } = request.params as { id: string };

    const { error } = await supabaseAdmin
      .from('user_projects')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) {
      return reply
        .status(500)
        .send({ success: false, error: { code: 'INTERNAL', message: error.message } });
    }
    return { success: true, data: null };
  });

  // POST /api/v1/projects/:id/generate
  app.post(
    '/:id/generate',
    { preHandler: [requirePlan('site:generate')] },
    async (request, reply) => {
      const { userId } = getAuth(request);
      const { id } = request.params as { id: string };

      const { data: project, error: projectErr } = await supabaseAdmin
        .from('user_projects')
        .select('id, owner_id, status, briefing_data')
        .eq('id', id)
        .eq('owner_id', userId)
        .single();

      if (projectErr || !project) {
        return reply.status(404).send({
          success: false,
          error: { code: 'PROJECT_NOT_FOUND', message: 'Proyecto no encontrado' },
        });
      }

      if (project.status === 'generating') {
        return reply.status(409).send({
          success: false,
          error: { code: 'GENERATION_IN_PROGRESS', message: 'El proyecto ya está generándose' },
        });
      }

      await supabaseAdmin.from('user_projects').update({ status: 'generating' }).eq('id', id);

      return {
        success: true,
        data: { project_id: id, status: 'generating', estimated_credits: 5, eta_seconds: 30 },
      };
    },
  );
}
