// Supabase Edge Function: handle-new-user
// Se ejecuta cuando un nuevo usuario se registra en Supabase Auth.
// Crea el perfil con plan 'free' y 10 créditos de bienvenida.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  try {
    const { record } = await req.json();
    const { id, email, raw_user_meta_data } = record;

    if (!id || !email) {
      return new Response(JSON.stringify({ error: 'Missing user data' }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.from('profiles').insert({
      id,
      email,
      full_name: raw_user_meta_data?.full_name || null,
      avatar_url: raw_user_meta_data?.avatar_url || null,
      plan: 'free',
      credits_balance: 10,
      metadata: {},
    });

    if (error) {
      console.error('Error creating profile:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
