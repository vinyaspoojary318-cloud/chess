import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initAuth: () => void;
  mockGuestLogin: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  
  initAuth: () => {
    if (get().initialized) return;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, loading: false, initialized: true });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, loading: false });
    });
  },
  
  mockGuestLogin: async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.user) {
      set({ user: data.user, loading: false, initialized: true });
    } else {
      console.warn('Anonymous login failed. Generating local guest user.');
      set({ user: { id: 'guest-local-user', email: 'guest@chess.local' } as User, loading: false, initialized: true });
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  }
}));
