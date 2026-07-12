import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import Logo from '../ui/Logo'
import Sidebar from './Sidebar'
export default function Navbar() {
  const { user, theme, toggleTheme } = useAuthStore()
  const navigate = useNavigate()
  const [streak, setStreak] = useState(0)
  const [streakActive, setStreakActive] = useState(false)

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('streak, last_solved')
        .eq('id', user.id)
        .single()
      if (data) {
        setStreak(data.streak || 0)
        const today = new Date().toISOString().split('T')[0]
        setStreakActive(data.last_solved === today)
      }
    }
    fetchStreak()
  }, [user])

  const displayName = user?.name || user?.email?.split('@')[0] || '?'

  return (
    <nav
      className={`h-[var(--nav-height)] border-b border-[var(--border-subtle)] flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 ${
        theme === 'light' ? 'bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]' : 'bg-[var(--bg-base)]'
      }`}
    >
      <div className="flex items-center gap-8">
        <button onClick={() => navigate('/dashboard')}>
          <Logo size="sm" />
        </button>
        <Sidebar />
      </div>

      <div className="flex items-center gap-3">
        {/* Streak indicator */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-full)] px-2.5 py-1">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
              fill={streakActive ? 'var(--info)' : 'transparent'}
              stroke={streakActive ? 'var(--info)' : 'var(--text-muted)'}
              strokeWidth="1.5"
            />
            {streakActive && (
              <path d="M9 15.5C9 15.5 10 17 12 17" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
            )}
          </svg>
          <span className={`text-xs font-semibold ${streakActive ? 'text-[var(--info)]' : 'text-[var(--text-muted)]'}`}>{streak}</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-150"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Profile button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-full)] pl-0.5 pr-3 py-0.5 transition-colors duration-150"
        >
          <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-[var(--text-primary)] font-medium">{displayName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
        </button>
      </div>
    </nav>
  )
}
