'use client';

import { createBrowserClient } from '@/lib/supabase';
import type { UserProject } from '@webcraft/shared';
import { create } from 'zustand';

interface ProjectState {
  projects: UserProject[];
  currentProject: UserProject | null;
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: {
    name: string;
    description?: string;
    business_type?: string;
    briefing_data?: Record<string, unknown>;
  }) => Promise<UserProject | null>;
  setCurrentProject: (project: UserProject | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    const supabase = createBrowserClient();
    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ projects: projects as UserProject[], loading: false });
  },

  fetchProject: async (id: string) => {
    set({ loading: true, error: null });
    const supabase = createBrowserClient();
    const { data, error } = await supabase.from('user_projects').select('*').eq('id', id).single();

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    set({ currentProject: data as UserProject, loading: false });
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    const supabase = createBrowserClient();
    const { data: user } = await supabase.auth.getUser();

    const { data: project, error } = await supabase
      .from('user_projects')
      .insert({
        owner_id: user.user?.id,
        name: data.name,
        description: data.description || null,
        business_type: data.business_type || null,
        briefing_data: data.briefing_data || {},
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      set({ error: error.message, loading: false });
      return null;
    }

    const newProject = project as UserProject;
    set((state) => ({
      projects: [newProject, ...state.projects],
      currentProject: newProject,
      loading: false,
    }));

    return newProject;
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
