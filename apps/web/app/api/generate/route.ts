import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ─── System prompt para generación de sitios ────────────────
function buildSystemPrompt(briefing: Record<string, unknown>): string {
  const sections = (briefing.sections as string[])?.join(', ') || 'inicio, servicios, contacto';
  const tone = (briefing.tone as string) || 'moderno';
  const industry = (briefing.industry as string) || 'negocio';
  const description = (briefing.description as string) || '';
  const audience = (briefing.target_audience as string) || '';
  const businessName = (briefing.business_name as string) || 'Mi Negocio';

  return `Eres un diseñador web experto. Genera un sitio web completo para "${businessName}", un ${industry}.

Descripción del negocio: ${description}
Público objetivo: ${audience}
Tono: ${tone}
Secciones requeridas: ${sections}

INSTRUCCIONES:
1. Genera HTML5 semántico, CSS moderno (usa variables CSS), y JavaScript vanilla.
2. El sitio debe ser responsive (mobile-first), profesional y listo para producción.
3. Incluye las secciones solicitadas.
4. Usa una paleta de colores ${tone} y tipografía limpia.
5. El CSS debe usar variables CSS para colores y estar bien organizado.
6. El JavaScript debe ser mínimo: navegación mobile, scroll suave, formulario de contacto básico.

RESPONDE ÚNICAMENTE con un objeto JSON válido con este formato exacto:
{
  "html": "<html completo aquí>",
  "css": "<css completo aquí>",
  "js": "<javascript aquí>"
}

No incluyas explicaciones, solo el JSON.`;
}

// ─── POST /api/generate ────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ success: false, error: 'projectId requerido' }, { status: 400 });
    }

    // Verificar auth
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Cliente Supabase admin (server-side)
    const supabase = createClient(
      // biome-ignore lint/style/noNonNullAssertion: env vars required at runtime
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      // biome-ignore lint/style/noNonNullAssertion: env vars required at runtime
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verificar usuario
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Obtener proyecto
    const { data: project, error: projectError } = await supabase
      .from('user_projects')
      .select('*')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 },
      );
    }

    if (project.status === 'generating') {
      return NextResponse.json(
        { success: false, error: 'Generación en progreso' },
        { status: 409 },
      );
    }

    // Verificar créditos
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits_balance < 2) {
      return NextResponse.json(
        { success: false, error: 'Créditos insuficientes' },
        { status: 402 },
      );
    }

    // Marcar como generando
    await supabase.from('user_projects').update({ status: 'generating' }).eq('id', projectId);

    // Llamar a OpenRouter
    const startTime = Date.now();
    const prompt = buildSystemPrompt({
      business_name: project.name,
      industry: project.business_type,
      description: project.description,
      ...project.briefing_data,
    });

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://webcraft.ai',
        'X-Title': 'WebCraft AI Studio',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-26b-a4b-it:free',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: `Genera el sitio web para ${project.name}. Responde solo con el JSON.`,
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    const duration = Date.now() - startTime;

    if (!openRouterRes.ok) {
      await supabase.from('user_projects').update({ status: 'draft' }).eq('id', projectId);
      const errText = await openRouterRes.text();
      return NextResponse.json(
        { success: false, error: `OpenRouter error: ${errText.slice(0, 200)}` },
        { status: 502 },
      );
    }

    const aiData = await openRouterRes.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    const tokensIn = aiData.usage?.prompt_tokens || 0;
    const tokensOut = aiData.usage?.completion_tokens || 0;

    // Parsear respuesta JSON
    let generated: Record<string, string> | undefined;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      generated = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch {
      await supabase.from('user_projects').update({ status: 'draft' }).eq('id', projectId);
      return NextResponse.json(
        { success: false, error: 'La IA no devolvió JSON válido' },
        { status: 502 },
      );
    }

    if (!generated) {
      await supabase.from('user_projects').update({ status: 'draft' }).eq('id', projectId);
      return NextResponse.json(
        { success: false, error: 'La IA devolvió datos vacíos' },
        { status: 502 },
      );
    }

    const html = generated.html || '';
    const css = generated.css || '';
    const js = generated.js || '';
    const creditsCost = 2; // Gemini Flash

    // Guardar en BD
    await supabase
      .from('user_projects')
      .update({
        html_content: html,
        css_content: css,
        js_content: js,
        status: 'ready',
      })
      .eq('id', projectId);

    // Deducir créditos
    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: creditsCost,
      p_type: 'generation',
      p_reference: { project_id: projectId, model: 'google/gemma-4-26b-a4b-it:free' },
      p_idempotency_key: `gen_${projectId}_${Date.now()}`,
    });

    // Registrar en logs
    await supabase.from('generation_logs').insert({
      project_id: projectId,
      user_id: user.id,
      prompt: project.description || project.name,
      model_used: 'google/gemma-4-26b-a4b-it:free',
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      credits_cost: creditsCost,
      duration_ms: duration,
      success: true,
    });

    // Obtener créditos actualizados
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        html,
        css,
        js,
        credits_used: creditsCost,
        credits_remaining: updatedProfile?.credits_balance || 0,
        duration_ms: duration,
        model: 'google/gemma-4-26b-a4b-it:free',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[generate] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
