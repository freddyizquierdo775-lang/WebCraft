import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    // biome-ignore lint/style/noNonNullAssertion: env vars required at runtime, validated by Next.js
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion: env vars required at runtime, validated by Next.js
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
