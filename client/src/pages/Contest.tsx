import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trophy, Clock, ChevronRight, Plus } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

interface Contest {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  status: string
  problem_ids: string[]
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Ended'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [endTime])
  return <span>{timeLeft}</span>
}

function StartCountdown({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    const update = () => {
      const diff = new Date(startTime).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Starting now...'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}h ${m}m ${s}s`)
    }
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [startTime])
  return <span>{timeLeft}</span>
}

export default function Contest() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // Sync statuses first
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/contests/sync`)
      } catch {}

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/contests`)
        setContests(res.data.contests || [])
      } catch {
        console.error('Failed to fetch contests')
      }

      // Check admin
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        setIsAdmin(data?.is_admin || false)
      }

      setLoading(false)
    }
    fetchData()
  }, [user])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeContests = contests.filter(c => c.status === 'active')
  const upcomingContests = contests.filter(c => c.status === 'upcoming')
  const endedContests = contests.filter(c => c.status === 'ended')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Contest</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Compete with peers in timed coding challenges</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/contest/schedule')}
            className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium px-4 py-2 rounded-[var(--radius-md)] text-sm transition-all duration-150"
          >
            <Plus size={14} /> Schedule Contest
          </button>
        )}
      </div>

      {/* Active contests */}
      {activeContests.map(c => (
        <div
          key={c.id}
          onClick={() => navigate(`/contest/${c.id}`)}
          className="bg-[var(--bg-surface)] border border-[var(--success-border)] rounded-[var(--radius-lg)] p-5 cursor-pointer hover:border-[var(--border-strong)] transition-colors duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-active">● Live Now</span>
                <span className="text-xs text-[var(--text-muted)]">{c.problem_ids?.length || 0} problems · 90 min</span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{c.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{c.description}</p>
              <div className="flex items-center gap-1.5 text-[var(--warning)] text-sm">
                <Clock size={14} />
                <span className="font-mono font-semibold"><CountdownTimer endTime={c.end_time} /></span>
                <span className="text-[var(--text-muted)] text-xs">remaining</span>
              </div>
            </div>
            <button className="btn btn-primary ml-6 flex-shrink-0">
              Enter Contest <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Upcoming contests */}
      {upcomingContests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Upcoming</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>
          <div className="space-y-3">
            {upcomingContests.map(c => (
              <div key={c.id} className="bg-[var(--bg-surface)] border border-[var(--accent-border)] rounded-[var(--radius-md)] p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-upcoming">◷ Upcoming</span>
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm">{c.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-muted)]">
                    <span>{c.problem_ids?.length || 0} problems</span>
                    <span>Starts: {new Date(c.start_time).toLocaleString()}</span>
                    <span className="text-[var(--info)]">
                      In <StartCountdown startTime={c.start_time} />
                    </span>
                  </div>
                </div>
                <Trophy size={20} className="text-[var(--text-disabled)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past contests */}
      {endedContests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Past Contests</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>
          <div className="space-y-2">
            {endedContests.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/contest/${c.id}`)}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] p-4 flex items-center justify-between cursor-pointer transition-colors duration-150 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-ended">✓ Ended</span>
                  </div>
                  <h3 className="font-medium text-[var(--text-secondary)]">{c.title}</h3>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {new Date(c.start_time).toLocaleDateString()} · {c.problem_ids?.length || 0} problems
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-disabled)] group-hover:text-[var(--text-primary)] transition-colors duration-150" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {contests.length === 0 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] py-12 text-center">
          <Trophy size={32} className="text-[var(--text-disabled)] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No Contests Yet</h2>
          <p className="text-[var(--text-muted)] text-sm mb-6">Check back soon for upcoming contests</p>
          {isAdmin && (
            <button
              onClick={() => navigate('/contest/schedule')}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium px-4 py-2 rounded-[var(--radius-md)] text-sm transition-all duration-150"
            >
              Schedule First Contest
            </button>
          )}
        </div>
      )}
    </div>
  )
}
