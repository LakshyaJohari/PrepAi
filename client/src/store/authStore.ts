import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name: string
}

interface AuthStore {
  user: User | null
  loading: boolean
  darkMode: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  toggleDarkMode: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  darkMode: true,
  setUser: (user) => set({ user, loading: false }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}))