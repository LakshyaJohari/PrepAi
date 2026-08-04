import { useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Clock, Code } from 'lucide-react'

interface Session {
  id: string
  company: string
  role: string
  round_type: string
  difficulty: string
  overall_score: number | null
  created_at: string
}

interface Problem {
  id: string
  title: string
  platform: string
  difficulty: string
  topic: string
  time_taken: number | null
  notes: string
  solved_at: string
}

export default function History() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [tab, setTab] = useState<'sessions' | 'problems'>('sessions')
  const [loading, setLoading] = useState(true)
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const { data } = await api.get('/user/history')
        setSessions(data.interviews.map((i: any) => ({
          id: i._id,
          company: i.config?.company || 'Unknown',
          role: i.config?.role || 'Unknown',
          round_type: i.config?.roundType || 'General',
          difficulty: i.config?.difficulty || 'Medium',
          overall_score: i.score,
          created_at: i.createdAt
        })))
        setProblems(data.submissions.map((s: any) => ({
          id: s.id,
          title: s.problem || 'Unknown Problem',
          platform: 'PrepAI',
          difficulty: s.difficulty || 'Medium',
          topic: s.language || 'Code',
          time_taken: null,
          notes: s.status,
          solved_at: s.created_at
        })))
      } catch (err) {
        console.error('Failed to fetch history:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [user])

  const scoreColor = (s: number | null) => {
    if (!s) return 'text-[var(--text-disabled)]'
    return s >= 80 ? 'text-[var(--success)]' : s >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
  }

  const diffColor = (d: string) => ({
    easy: 'bg-[var(--success-dim)] text-[var(--success)]',
    medium: 'bg-[var(--warning-dim)] text-[var(--warning)]',
    hard: 'bg-[var(--danger-dim)] text-[var(--danger)]',
  }[d?.toLowerCase()] || '')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">History</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{sessions.length} sessions · {problems.length} problems</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-1 w-fit">
        <button
          onClick={() => setTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm transition-colors duration-150 ${tab === 'sessions' ? 'bg-[var(--accent)] text-white font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Clock size={14} /> Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setTab('problems')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm transition-colors duration-150 ${tab === 'problems' ? 'bg-[var(--accent)] text-white font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
        >
          <Code size={14} /> Problems ({problems.length})
        </button>
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <Clock size={32} className="text-[var(--text-disabled)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] text-sm">No sessions yet</p>
              <button
                onClick={() => navigate('/interview/new')}
                className="mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm px-4 py-2 rounded-[var(--radius-md)] font-medium transition-all duration-150"
              >
                Start Interview
              </button>
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => navigate('/interview/score', {
                  state: {
                    sessionId: s.id,
                    company: s.company,
                    role: s.role,
                    roundType: s.round_type,
                    difficulty: s.difficulty,
                    turns: [],
                    fromHistory: true
                  }
                })}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] px-4 py-3 flex items-center justify-between transition-colors duration-150 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] text-sm">{s.company}</span>
                    <span className="text-[var(--border-strong)]">·</span>
                    <span className="text-sm text-[var(--text-secondary)]">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-[var(--radius-sm)] ${diffColor(s.difficulty)}`}>{s.difficulty}</span>
                    <span className="text-xs text-[var(--text-muted)] capitalize">{s.round_type?.replace('_', ' ')}</span>
                    <span className="text-xs text-[var(--text-disabled)]">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-bold ${scoreColor(s.overall_score)}`}>
                    {s.overall_score ?? '—'}
                  </div>
                  <span className="text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-150">View report →</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Problems tab */}
      {tab === 'problems' && (
        <div className="space-y-2">
          {problems.length === 0 ? (
            <div className="py-12 text-center">
              <Code size={32} className="text-[var(--text-disabled)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)] text-sm">No problems logged yet</p>
              <button
                onClick={() => navigate('/problems')}
                className="mt-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm px-4 py-2 rounded-[var(--radius-md)] font-medium transition-all duration-150"
              >
                Log a Problem
              </button>
            </div>
          ) : (
            problems.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProblem(p)}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] px-4 py-3 flex items-center justify-between transition-colors duration-150 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.difficulty === 'easy' ? 'bg-[var(--success)]' : p.difficulty === 'medium' ? 'bg-[var(--warning)]' : 'bg-[var(--danger)]'}`} />
                  <div>
                    <p className="text-[var(--text-primary)] text-sm font-medium">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--text-muted)]">{p.platform}</span>
                      <span className="text-[var(--border-strong)]">·</span>
                      <span className="text-xs text-[var(--text-muted)]">{p.topic}</span>
                      {p.time_taken && <>
                        <span className="text-[var(--border-strong)]">·</span>
                        <span className="text-xs text-[var(--text-muted)]">{p.time_taken}m</span>
                      </>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge capitalize ${p.difficulty === 'easy' ? 'badge-easy' : p.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'}`}>
                    {p.difficulty}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{new Date(p.solved_at).toLocaleDateString()}</span>
                  <span className="text-xs text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-150">View →</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Problem detail modal */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setSelectedProblem(null)}>
          <div className="bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedProblem.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge capitalize ${selectedProblem.difficulty === 'easy' ? 'badge-easy' : selectedProblem.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'}`}>
                    {selectedProblem.difficulty}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{selectedProblem.platform}</span>
                  <span className="text-xs text-[var(--text-muted)]">{selectedProblem.topic}</span>
                </div>
              </div>
              <button onClick={() => setSelectedProblem(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                <span className="text-xs text-[var(--text-muted)]">Solved on</span>
                <span className="text-xs text-[var(--text-primary)]">{new Date(selectedProblem.solved_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {selectedProblem.time_taken && (
                <div className="flex justify-between bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                  <span className="text-xs text-[var(--text-muted)]">Time taken</span>
                  <span className="text-xs text-[var(--text-primary)]">{selectedProblem.time_taken} minutes</span>
                </div>
              )}
              {selectedProblem.notes && (
                <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Notes</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedProblem.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
