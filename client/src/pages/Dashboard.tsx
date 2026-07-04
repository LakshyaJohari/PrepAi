import { useAuthStore } from '../store/authStore'
import { Mic, ArrowRight, Trophy, Code, Calendar, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import axios from 'axios'

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
  return <span className="font-mono font-bold text-amber-400">{timeLeft}</span>
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
  return <span className="font-mono font-bold text-blue-400">{timeLeft}</span>
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
        await axios.post(`${import.meta.env.VITE_API_URL}/api/contests/sync`)
      } catch {}

      // Fetch recent sessions
      const { data: s } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)
      setSessions(s || [])

      // Fetch profile streak
      const { data: p } = await supabase
        .from('profiles')
        .select('streak')
        .eq('id', user.id)
        .single()
      setStreak(p?.streak || 0)

      // Fetch problem count
      const { count } = await supabase
        .from('problems')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      setProblemCount(count || 0)

      // Fetch daily problem
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems/daily`)
        setDailyProblem(res.data.problem)
      } catch {
        const { data: pb } = await supabase
          .from('problems_bank')
          .select('id, title, slug, difficulty, topics, companies')
          .limit(1)
          .single()
        setDailyProblem(pb)
      }

      // Fetch contests
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/contests`)
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
    easy: 'text-green-400 bg-green-400/10 border-green-400/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    hard: 'text-red-400 bg-red-400/10 border-red-400/20',
  }[d?.toLowerCase()] || '')

  const scoreColor = (s: number | null) => {
    if (!s) return 'text-[#444444]'
    return s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Hero greeting */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-black text-white mb-2">Hey, {firstName} 👋</h1>
        <p className="text-[#666666] text-lg">Ready to ace your next interview?</p>
        <div className="flex items-center justify-center gap-8 mt-6">
          <div className="text-center">
            <div className="text-2xl font-black text-blue-400">{streak}</div>
            <div className="text-xs text-[#555555] mt-0.5">Day Streak 🔥</div>
          </div>
          <div className="w-px h-8 bg-[#1a1a1a]" />
          <div className="text-center">
            <div className="text-2xl font-black text-teal-400">{problemCount}</div>
            <div className="text-xs text-[#555555] mt-0.5">Problems Solved</div>
          </div>
          <div className="w-px h-8 bg-[#1a1a1a]" />
          <div className="text-center">
            <div className="text-2xl font-black text-indigo-400">{sessions.length}</div>
            <div className="text-xs text-[#555555] mt-0.5">Interviews Done</div>
          </div>
        </div>
      </div>

      {/* Active Contest Banner */}
      {activeContest && (
        <div
          onClick={() => navigate(`/contest/${activeContest.id}`)}
          className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-green-500/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">● Live Now</span>
              </div>
              <h3 className="font-bold text-white">{activeContest.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#555555] mt-0.5">
                <Clock size={11} />
                <ContestCountdown endTime={activeContest.end_time} /> remaining
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition-colors flex-shrink-0">
            Enter <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Upcoming Contest Banner */}
      {upcomingContest && !activeContest && (
        <div
          onClick={() => navigate('/contest')}
          className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">◷ Upcoming</span>
              </div>
              <h3 className="font-bold text-white">{upcomingContest.title}</h3>
              <div className="flex items-center gap-1.5 text-xs text-[#555555] mt-0.5">
                Starts in <ContestStartCountdown startTime={upcomingContest.start_time} />
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-blue-400" />
        </div>
      )}

      {/* Question of the Day */}
      {dailyProblem && (
        <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#333333] transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} /> Question of the Day
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${diffColor(dailyProblem.difficulty)}`}>
                  {dailyProblem.difficulty}
                </span>
              </div>
              <h2 className="text-xl font-black text-white mb-3">{dailyProblem.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {dailyProblem.topics?.slice(0, 3).map(t => (
                  <span key={t} className="text-xs bg-[#1a1a1a] text-[#666666] px-2.5 py-1 rounded-full">{t}</span>
                ))}
                {dailyProblem.companies?.slice(0, 2).map(c => (
                  <span key={c} className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-[#444444]">
                <span className="flex items-center gap-1"><Clock size={11} /> {timeLeft} left to solve</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/problems/${dailyProblem.slug}`)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors ml-6 flex-shrink-0"
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
          className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-2xl p-6 text-left transition-colors group"
        >
          <div className="w-10 h-10 bg-teal-400/10 rounded-xl flex items-center justify-center mb-4">
            <Code size={20} className="text-teal-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-1">Start Practicing</h3>
          <p className="text-sm text-[#555555] mb-4">200+ problems across all topics and companies</p>
          <div className="flex items-center gap-1 text-teal-400 text-sm font-medium group-hover:gap-2 transition-all">
            Browse Problems <ArrowRight size={14} />
          </div>
        </button>

        <button
          onClick={() => navigate('/interview/new')}
          className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-2xl p-6 text-left transition-colors group"
        >
          <div className="w-10 h-10 bg-indigo-400/10 rounded-xl flex items-center justify-center mb-4">
            <Mic size={20} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-1">Mock Interview</h3>
          <p className="text-sm text-[#555555] mb-4">AI-powered interviews tailored to your target company</p>
          <div className="flex items-center gap-1 text-indigo-400 text-sm font-medium group-hover:gap-2 transition-all">
            Start Interview <ArrowRight size={14} />
          </div>
        </button>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-[#555555] uppercase tracking-widest">Recent Interviews</h2>
            <button onClick={() => navigate('/profile')} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
          </div>
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-xl p-4 flex items-center justify-between transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{s.company}</span>
                    <span className="text-[#333333]">·</span>
                    <span className="text-sm text-[#666666]">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#444444] capitalize">{s.round_type?.replace('_', ' ')}</span>
                    <span className="text-xs text-[#333333]">{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className={`text-xl font-black ${scoreColor(s.overall_score)}`}>
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
          className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-5 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Trophy size={20} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Weekly Contest</h3>
              <p className="text-xs text-[#555555] mt-0.5">No active contest — check back soon or schedule one</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-indigo-400" />
        </div>
      )}
    </div>
  )
}