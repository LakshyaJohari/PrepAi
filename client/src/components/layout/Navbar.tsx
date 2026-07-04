import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import Logo from '../ui/Logo'
import Sidebar from './Sidebar'
export default function Navbar() {
  const { user, logout } = useAuthStore()
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
    <nav className="h-14 border-b bg-black border-[#1a1a1a] flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-8">
        <button onClick={() => navigate('/dashboard')}>
          <Logo size="sm" dark={true} />
        </button>
        <Sidebar />
      </div>

      <div className="flex items-center gap-3">
        {/* Streak indicator */}
        <div className="flex items-center gap-1.5 bg-[#111111] border border-[#222222] rounded-full px-3 py-1.5">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path
              d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z"
              fill={streakActive ? '#3B82F6' : 'transparent'}
              stroke={streakActive ? '#3B82F6' : '#444444'}
              strokeWidth="1.5"
            />
            {streakActive && (
              <path d="M9 15.5C9 15.5 10 17 12 17" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
            )}
          </svg>
          <span className={`text-xs font-bold ${streakActive ? 'text-blue-400' : 'text-[#444444]'}`}>{streak}</span>
        </div>

        {/* Profile button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 bg-[#111111] border border-[#222222] hover:border-[#444444] rounded-full pl-1 pr-3 py-1 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-white font-medium">{displayName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        </button>
      </div>
    </nav>
  )
}