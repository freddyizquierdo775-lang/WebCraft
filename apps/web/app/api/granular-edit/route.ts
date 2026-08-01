import { createClient } from '@supabase/supabase-js';
// biome-ignore lint/style/noNonNullAssertion: env vars required by Supabase
import { NextResponse } from 'next/server';

// ─── POST /api/granular-edit ───────────────────────────────
export async function POST(request: Request) {
  try {
    const { projectId, elementHtml, prompt } = await request.json();
    if (!projectId || !elementHtml || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Faltan projectId, elementHtml o prompt' },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, // biome-ignore lint/style/noNonNullAssertion
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // biome-ignore lint/style/noNonNullAssertion
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    const { data: project } = await supabase
      .from('user_projects')
      .select('id,owner_id,html_content')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .single();
    if (!project)
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 },
      );

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .single();
    if (!profile || profile.credits_balance < 1) {
      return NextResponse.json(
        { success: false, error: 'Créditos insuficientes' },
        { status: 402 },
      );
    }

    const startTime = Date.now();
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://webcraft.ai',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5',
        messages: [
          {
            role: 'system',
            content:
              'Eres un editor HTML experto. Recibes un fragmento HTML y una instrucción. Devuelve SOLO el HTML modificado (sin explicaciones, sin markdown, sin bloques de código). Mantén los mismos atributos y estructura base. Solo modifica lo solicitado.',
          },
          {
            role: 'user',
            content: `HTML actual:\n${elementHtml}\n\nInstrucción: ${prompt}\n\nDevuelve solo el HTML modificado.`,
          },
        ],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    const duration = Date.now() - startTime;

    if (!openRouterRes.ok) {
      return NextResponse.json({ success: false, error: 'Error en OpenRouter' }, { status: 502 });
    }

    const aiData = await openRouterRes.json();
    const modifiedHtml = (aiData.choices?.[0]?.message?.content || '')
      .replace(/```html\n?|```\n?/g, '')
      .trim();

    if (!modifiedHtml || modifiedHtml.length < 5) {
      return NextResponse.json(
        { success: false, error: 'La IA devolvió una respuesta vacía' },
        { status: 502 },
      );
    }

    const fullHtml = (project.html_content || '').replace(elementHtml, modifiedHtml);

    await supabase.from('user_projects').update({ html_content: fullHtml }).eq('id', projectId);

    await supabase.rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_type: 'granular_edit',
      p_reference: { project_id: projectId, prompt },
      p_idempotency_key: `granular_${projectId}_${Date.now()}`,
    });

    await supabase.from('generation_logs').insert({
      project_id: projectId,
      user_id: user.id,
      prompt,
      model_used: 'google/gemini-flash-1.5',
      tokens_in: aiData.usage?.prompt_tokens || 0,
      tokens_out: aiData.usage?.completion_tokens || 0,
      credits_cost: 1,
      duration_ms: duration,
      success: true,
    });

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        modifiedHtml,
        fullHtml,
        credits_used: 1,
        credits_remaining: updatedProfile?.credits_balance || 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
