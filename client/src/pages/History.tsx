import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
      const { data: s } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const { data: p } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id)
        .order('solved_at', { ascending: false })
      setSessions(s || [])
      setProblems(p || [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const scoreColor = (s: number | null) => {
    if (!s) return 'text-[#444444]'
    return s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
  }

  const diffColor = (d: string) => ({
    easy: 'bg-green-400/10 text-green-400',
    medium: 'bg-amber-400/10 text-amber-400',
    hard: 'bg-red-400/10 text-red-400',
  }[d?.toLowerCase()] || '')

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-black text-white">History</h1>
        <p className="text-[#666666] text-sm mt-1">{sessions.length} sessions · {problems.length} problems</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${tab === 'sessions' ? 'bg-white text-black font-medium' : 'text-[#666666] hover:text-white'}`}
        >
          <Clock size={14} /> Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setTab('problems')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${tab === 'problems' ? 'bg-white text-black font-medium' : 'text-[#666666] hover:text-white'}`}
        >
          <Code size={14} /> Problems ({problems.length})
        </button>
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div className="space-y-2">
          {sessions.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-12 text-center">
              <Clock size={32} className="text-[#333333] mx-auto mb-3" />
              <p className="text-[#555555] text-sm">No sessions yet</p>
              <button
                onClick={() => navigate('/interview/new')}
                className="mt-4 bg-white text-black text-sm px-4 py-2 rounded-xl font-medium"
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
                className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-xl p-4 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{s.company}</span>
                    <span className="text-[#333333]">·</span>
                    <span className="text-sm text-[#666666]">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor(s.difficulty)}`}>{s.difficulty}</span>
                    <span className="text-xs text-[#444444] capitalize">{s.round_type?.replace('_', ' ')}</span>
                    <span className="text-xs text-[#333333]">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-black ${scoreColor(s.overall_score)}`}>
                    {s.overall_score ?? '—'}
                  </div>
                  <span className="text-xs text-[#444444] opacity-0 group-hover:opacity-100 transition-opacity">View report →</span>
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
            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-12 text-center">
              <Code size={32} className="text-[#333333] mx-auto mb-3" />
              <p className="text-[#555555] text-sm">No problems logged yet</p>
              <button
                onClick={() => navigate('/problems')}
                className="mt-4 bg-white text-black text-sm px-4 py-2 rounded-xl font-medium"
              >
                Log a Problem
              </button>
            </div>
          ) : (
            problems.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProblem(p)}
                className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-xl p-4 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.difficulty === 'easy' ? 'bg-green-400' : p.difficulty === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#444444]">{p.platform}</span>
                      <span className="text-[#333333]">·</span>
                      <span className="text-xs text-[#444444]">{p.topic}</span>
                      {p.time_taken && <>
                        <span className="text-[#333333]">·</span>
                        <span className="text-xs text-[#444444]">{p.time_taken}m</span>
                      </>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${diffColor(p.difficulty)}`}>
                    {p.difficulty}
                  </span>
                  <span className="text-xs text-[#444444]">{new Date(p.solved_at).toLocaleDateString()}</span>
                  <span className="text-xs text-[#444444] opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Problem detail modal */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4" onClick={() => setSelectedProblem(null)}>
          <div className="bg-[#0D0D0D] border border-[#222222] rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white">{selectedProblem.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${diffColor(selectedProblem.difficulty)}`}>
                    {selectedProblem.difficulty}
                  </span>
                  <span className="text-xs text-[#444444]">{selectedProblem.platform}</span>
                  <span className="text-xs text-[#444444]">{selectedProblem.topic}</span>
                </div>
              </div>
              <button onClick={() => setSelectedProblem(null)} className="text-[#555555] hover:text-white text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between bg-[#1a1a1a] rounded-xl p-3">
                <span className="text-xs text-[#555555]">Solved on</span>
                <span className="text-xs text-white">{new Date(selectedProblem.solved_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {selectedProblem.time_taken && (
                <div className="flex justify-between bg-[#1a1a1a] rounded-xl p-3">
                  <span className="text-xs text-[#555555]">Time taken</span>
                  <span className="text-xs text-white">{selectedProblem.time_taken} minutes</span>
                </div>
              )}
              {selectedProblem.notes && (
                <div className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-xs text-[#555555] mb-1">Notes</p>
                  <p className="text-sm text-white">{selectedProblem.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}