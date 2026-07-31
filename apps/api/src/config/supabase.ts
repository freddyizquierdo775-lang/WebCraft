import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

// Admin client — bypasses RLS, used only server-side
export const supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper: get user profile with plan info
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, plan, credits_balance')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(`User profile not found: ${userId}`);
  }
  return data;
}

// Helper: verify JWT and get user ID (for routes that receive the token)
export async function verifyJWT(token: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('Invalid or expired token');
  }
  return data.user.id;
}
