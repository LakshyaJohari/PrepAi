import { useAuthStore } from '../store/authStore'
import { Mic, ArrowRight, Trophy, Code, Calendar, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../lib/api'

interface Session {
  id: string
  company: string
  role: string
  round_type: string
  difficulty: string
  overall_score: number | null
  created_at: string
}

interface DailyProblem {
  id: string
  title: string
  slug: string
  difficulty: string
  topics: string[]
  companies: string[]
}

interface Contest {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  status: string
}

function ContestCountdown({ endTime }: { endTime: string }) {
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
  return <span className="font-mono font-semibold text-[var(--warning)]">{timeLeft}</span>
}

function ContestStartCountdown({ startTime }: { startTime: string }) {
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
  return <span className="font-mono font-semibold text-[var(--info)]">{timeLeft}</span>
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [dailyProblem, setDailyProblem] = useState<DailyProblem | null>(null)
  const [streak, setStreak] = useState(0)
  const [problemCount, setProblemCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')
  const [activeContest, setActiveContest] = useState<Contest | null>(null)
  const [upcomingContest, setUpcomingContest] = useState<Contest | null>(null)
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      // Sync contest statuses
      try {
        await api.post('/contests/sync')
      } catch {}

      try {
        // Fetch dashboard data
        const { data } = await api.get('/user/dashboard');
        setStreak(data.stats.streak);
        setProblemCount(data.stats.solved);
        setSessions(data.recentSessions || []);

        try {
          const res = await api.get('/problems/daily')
          setDailyProblem(res.data.problem)
        } catch {
          if (data.recentProblems && data.recentProblems.length > 0) {
            setDailyProblem(data.recentProblems[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }

      // Fetch contests
      try {
        const res = await api.get('/contests')
        const contests: Contest[] = res.data.contests || []
        setActiveContest(contests.find(c => c.status === 'active') || null)
        setUpcomingContest(contests.find(c => c.status === 'upcoming') || null)
      } catch {}
    }

    fetchData()

    // Time left until midnight
    const updateTimer = () => {
      const now = new Date()
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(`${h}h ${m}m`)
    }
    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [user])

  const diffColor = (d: string) => ({
    easy: 'badge-easy',
    medium: 'badge-medium',
    hard: 'badge-hard',
  }[d?.toLowerCase()] || '')

  const scoreColor = (s: number | null) => {
    if (!s) return 'text-[var(--text-disabled)]'
    return s >= 80 ? 'text-[var(--success)]' : s >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
  }

  return (
    <div className="space-y-4">

      {/* Hero greeting */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Hey, {firstName} 👋</h1>
        <p className="text-[var(--text-secondary)] text-sm">Ready to ace your next interview?</p>
      </div>

      {/* Stats row */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] px-6 py-4 flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-xl font-bold text-[var(--text-primary)]">{streak}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Day Streak 🔥</div>
        </div>
        <div className="w-px h-6 bg-[var(--border-subtle)]" />
        <div className="text-center">
          <div className="text-xl font-bold text-[var(--text-primary)]">{problemCount}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Problems Solved</div>
        </div>
        <div className="w-px h-6 bg-[var(--border-subtle)]" />
        <div className="text-center">
          <div className="text-xl font-bold text-[var(--text-primary)]">{sessions.length}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Interviews Done</div>
        </div>
      </div>

      {/* Active Contest Banner */}
      {activeContest && (
        <div
          onClick={() => navigate(`/contest/${activeContest.id}`)}
          className="bg-[var(--bg-surface)] border border-[var(--success-border)] rounded-[var(--radius-lg)] p-4 flex items-center justify-between cursor-pointer hover:border-[var(--border-strong)] transition-colors duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--success-dim)] rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-[var(--success)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="badge badge-active">● Live Now</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">{activeContest.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                <Clock size={11} />
                <ContestCountdown endTime={activeContest.end_time} /> remaining
              </div>
            </div>
          </div>
          <button className="btn btn-primary flex-shrink-0">
            Enter <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Upcoming Contest Banner */}
      {upcomingContest && !activeContest && (
        <div
          onClick={() => navigate('/contest')}
          className="bg-[var(--bg-surface)] border border-[var(--info-border)] rounded-[var(--radius-lg)] p-4 flex items-center justify-between cursor-pointer hover:border-[var(--border-strong)] transition-colors duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--info-dim)] rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-[var(--info)]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="badge badge-upcoming">◷ Upcoming</span>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">{upcomingContest.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                Starts in <ContestStartCountdown startTime={upcomingContest.start_time} />
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-[var(--info)]" />
        </div>
      )}

      {/* Question of the Day */}
      {dailyProblem && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--border-strong)] transition-colors duration-150">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] flex items-center gap-1.5">
                  <Calendar size={12} /> Question of the Day
                </span>
                <span className={`badge capitalize ${diffColor(dailyProblem.difficulty)}`}>
                  {dailyProblem.difficulty}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">{dailyProblem.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {dailyProblem.topics?.slice(0, 3).map(t => (
                  <span key={t} className="badge badge-topic">{t}</span>
                ))}
                {dailyProblem.companies?.slice(0, 2).map(c => (
                  <span key={c} className="text-xs bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-[var(--radius-sm)]">{c}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><Clock size={11} /> {timeLeft} left to solve</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/problems/${dailyProblem.slug}`)}
              className="btn btn-primary ml-6 flex-shrink-0"
            >
              Solve now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/problems')}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-lg)] p-5 text-left transition-colors duration-150 group"
        >
          <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-[var(--radius-md)] flex items-center justify-center mb-3">
            <Code size={16} className="text-[var(--accent)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Start Practicing</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">200+ problems across all topics and companies</p>
          <div className="flex items-center gap-1 text-[var(--accent)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Browse Problems <ArrowRight size={14} />
          </div>
        </button>

        <button
          onClick={() => navigate('/interview/new')}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-lg)] p-5 text-left transition-colors duration-150 group"
        >
          <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-[var(--radius-md)] flex items-center justify-center mb-3">
            <Mic size={16} className="text-[var(--accent)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Mock Interview</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-4">AI-powered interviews tailored to your target company</p>
          <div className="flex items-center gap-1 text-[var(--accent)] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Start Interview <ArrowRight size={14} />
          </div>
        </button>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Recent Interviews</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <button onClick={() => navigate('/profile')} className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]">View all →</button>
          </div>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] px-4 py-3 flex items-center justify-between transition-colors duration-150">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">{s.company}</span>
                    <span className="text-[var(--border-strong)]">·</span>
                    <span className="text-sm text-[var(--text-secondary)]">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[var(--text-muted)] capitalize">{s.round_type?.replace('_', ' ')}</span>
                    <span className="text-xs text-[var(--text-disabled)]">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`text-xl font-bold ${scoreColor(s.overall_score)}`}>
                  {s.overall_score ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No contest fallback banner */}
      {!activeContest && !upcomingContest && (
        <div
          onClick={() => navigate('/contest')}
          className="bg-[var(--bg-surface)] border border-[var(--accent-border)] rounded-[var(--radius-lg)] p-4 flex items-center justify-between cursor-pointer hover:border-[var(--border-strong)] transition-colors duration-150"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--accent-dim)] rounded-[var(--radius-md)] flex items-center justify-center">
              <Trophy size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-sm">Weekly Contest</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">No active contest — check back soon or schedule one</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[var(--accent)]" />
        </div>
      )}
    </div>
  )
}
