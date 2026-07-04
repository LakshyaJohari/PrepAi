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

  const statusColor = (s: string) => ({
    active: 'text-green-400 bg-green-400/10 border-green-400/20',
    upcoming: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    ended: 'text-[#555555] bg-[#1a1a1a] border-[#2a2a2a]',
  }[s] || '')

  const statusLabel = (s: string) => ({
    active: '● Live',
    upcoming: '◷ Upcoming',
    ended: '✓ Ended',
  }[s] || s)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeContests = contests.filter(c => c.status === 'active')
  const upcomingContests = contests.filter(c => c.status === 'upcoming')
  const endedContests = contests.filter(c => c.status === 'ended')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Contest</h1>
          <p className="text-[#666666] text-sm mt-1">Compete with peers in timed coding challenges</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/contest/schedule')}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
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
          className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-2xl p-6 cursor-pointer hover:border-green-500/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-green-400 bg-green-400/10 border-green-400/20">
                  ● Live Now
                </span>
                <span className="text-xs text-[#555555]">{c.problem_ids?.length || 0} problems · 90 min</span>
              </div>
              <h2 className="text-xl font-black text-white mb-1">{c.title}</h2>
              <p className="text-sm text-[#888888] mb-4">{c.description}</p>
              <div className="flex items-center gap-1.5 text-amber-400 text-sm">
                <Clock size={14} />
                <span className="font-mono font-bold"><CountdownTimer endTime={c.end_time} /></span>
                <span className="text-[#555555] text-xs">remaining</span>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors ml-6 flex-shrink-0">
              Enter Contest <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ))}

      {/* Upcoming contests */}
      {upcomingContests.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-[#555555] uppercase tracking-widest mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcomingContests.map(c => (
              <div key={c.id} className="bg-[#0D0D0D] border border-blue-500/20 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-blue-400 bg-blue-400/10 border-blue-400/20">◷ Upcoming</span>
                  </div>
                  <h3 className="font-bold text-white">{c.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[#555555]">
                    <span>{c.problem_ids?.length || 0} problems</span>
                    <span>Starts: {new Date(c.start_time).toLocaleString()}</span>
                    <span className="text-blue-400">
                      In <StartCountdown startTime={c.start_time} />
                    </span>
                  </div>
                </div>
                <Trophy size={20} className="text-[#333333]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past contests */}
      {endedContests.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-[#555555] uppercase tracking-widest mb-3">Past Contests</h2>
          <div className="space-y-2">
            {endedContests.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/contest/${c.id}`)}
                className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border text-[#555555] bg-[#1a1a1a] border-[#2a2a2a]">✓ Ended</span>
                  </div>
                  <h3 className="font-medium text-[#888888]">{c.title}</h3>
                  <div className="text-xs text-[#444444] mt-0.5">
                    {new Date(c.start_time).toLocaleDateString()} · {c.problem_ids?.length || 0} problems
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#333333] group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {contests.length === 0 && (
        <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-16 text-center">
          <Trophy size={40} className="text-[#333333] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Contests Yet</h2>
          <p className="text-[#555555] text-sm mb-6">Check back soon for upcoming contests</p>
          {isAdmin && (
            <button
              onClick={() => navigate('/contest/schedule')}
              className="bg-white text-black font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors"
            >
              Schedule First Contest
            </button>
          )}
        </div>
      )}
    </div>
  )
}