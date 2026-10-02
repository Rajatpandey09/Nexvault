import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, Theme, User } from '@/types';

interface AppState {
  user: User | null;
  language: Language;
  theme: Theme;
  sidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      language: 'en',
      theme: 'dark',
      sidebarOpen: true,
      setUser: (user) => set({ user }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'vault-storage',
    }
  )
);
