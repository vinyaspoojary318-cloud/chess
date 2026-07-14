import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { initFirebase, onAuthStateChanged, getAuthInstance } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initAuth: () => void;
  mockGuestLogin: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  
  initAuth: () => {
    if (get().initialized) return;
    
    try {
      initFirebase();
      const auth = getAuthInstance();
      onAuthStateChanged(auth, (user) => {
        set({ user, loading: false, initialized: true });
      });
    } catch (err) {
      console.warn('Firebase init failed (likely missing .env configuration). Running in offline mode.');
      set({ loading: false, initialized: true });
    }
  },
  
  mockGuestLogin: () => {
    set({ user: { uid: 'guest-local-user' } as any, loading: false, initialized: true });
  }
}));
