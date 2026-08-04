import { create } from 'zustand'
import api from '../lib/api'

interface User {
  id: string
  email: string
  name: string
  streak?: number
  isAdmin?: boolean
}

type Theme = 'dark' | 'light'

interface AuthStore {
  user: User | null
  loading: boolean
  theme: Theme
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  initAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  theme: (localStorage.getItem('prepai-theme') as Theme) || 'dark',
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: () => {
    localStorage.removeItem('prepai-token')
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
  initAuth: async () => {
    const token = localStorage.getItem('prepai-token')
    if (!token) {
      set({ user: null, loading: false })
      return
    }

    try {
      const response = await api.get('/auth/me')
      set({ user: response.data.user, loading: false })
    } catch (err) {
      console.error('Failed to init auth:', err)
      localStorage.removeItem('prepai-token')
      set({ user: null, loading: false })
    }
  }
}))