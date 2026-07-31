'use client';

import { createBrowserClient } from '@/lib/supabase';
import type { UserProfile } from '@webcraft/shared';
import { create } from 'zustand';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;

  loadUser: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  loadUser: async () => {
    const supabase = createBrowserClient();
    const { data: session } = await supabase.auth.getUser();

    if (!session.user) {
      set({ user: null, loading: false });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    set({ user: profile as UserProfile | null, loading: false });
  },

  signOut: async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    set({ user: null });
  },

  refreshCredits: async () => {
    const supabase = createBrowserClient();
    const { data: session } = await supabase.auth.getUser();

    if (!session.user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_balance, plan')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      set((state) => ({
        user: state.user
          ? { ...state.user, credits_balance: profile.credits_balance, plan: profile.plan }
          : null,
      }));
    }
  },
}));
