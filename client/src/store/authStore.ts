import { create } from 'zustand'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name: string
}

type Theme = 'dark' | 'light'

interface AuthStore {
  user: User | null
  loading: boolean
  theme: Theme
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  theme: (localStorage.getItem('prepai-theme') as Theme) || 'dark',
  setUser: (user) => set({ user, loading: false }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
  toggleTheme: () => {
    const newTheme: Theme = get().theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('prepai-theme', newTheme)
    set({ theme: newTheme })
  },
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('prepai-theme', theme)
    set({ theme })
  },
}))