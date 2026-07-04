import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { TrendingUp, Award, Target, Zap } from 'lucide-react'

interface Session {
  overall_score: number | null
  created_at: string
  company: string
  round_type: string
}

interface Turn {
  ai_feedback: any
}

export default function Analytics() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<Session[]>([])
  const [turns, setTurns] = useState<Turn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: s } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })
      const { data: t } = await supabase
        .from('turns')
        .select('ai_feedback, session_id')
      setSessions(s || [])
      setTurns(t || [])
      setLoading(false)
    }
    if (user) fetchData()
  }, [user])

  const chartData = sessions
    .filter(s => s.overall_score)
    .map((s, i) => ({
      name: `S${i + 1}`,
      score: s.overall_score,
      date: new Date(s.created_at).toLocaleDateString()
    }))

  const avgStar = turns.reduce((acc, t) => {
    const star = t.ai_feedback?.star
    if (!star) return acc
    return {
      situation: acc.situation + (star.situation || 0),
      task: acc.task + (star.task || 0),
      action: acc.action + (star.action || 0),
      result: acc.result + (star.result || 0),
      count: acc.count + 1
    }
  }, { situation: 0, task: 0, action: 0, result: 0, count: 0 })

  const radarData = avgStar.count > 0 ? [
    { subject: 'Situation', value: +(avgStar.situation / avgStar.count).toFixed(1) },
    { subject: 'Task', value: +(avgStar.task / avgStar.count).toFixed(1) },
    { subject: 'Action', value: +(avgStar.action / avgStar.count).toFixed(1) },
    { subject: 'Result', value: +(avgStar.result / avgStar.count).toFixed(1) },
  ] : []

  const avgScore = sessions.filter(s => s.overall_score).length
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.filter(s => s.overall_score).length)
    : 0

  const bestScore = sessions.length
    ? Math.max(...sessions.map(s => s.overall_score || 0))
    : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Analytics</h1>
        <p className="text-[#666666] text-sm mt-1">Track your interview performance over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
          { label: 'Avg Score', value: avgScore || '—', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Best Score', value: bestScore || '—', icon: Award, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Questions Done', value: turns.length, icon: Zap, color: 'text-teal-400', bg: 'bg-teal-400/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5 hover:border-[#333333] transition-colors">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-xs text-[#555555] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Score over time */}
        <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-[#888888] mb-4">Score Over Time</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555555' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#555555' }} />
                <Tooltip
                  contentStyle={{ background: '#0D0D0D', border: '1px solid #222222', borderRadius: 8 }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#888888' }}
                />
                <Line type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={2} dot={{ fill: '#ffffff', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#333333] text-sm">No data yet</div>
          )}
        </div>

        {/* STAR radar */}
        <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
          <h2 className="text-sm font-medium text-[#888888] mb-4">STAR Analysis</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#555555' }} />
                <Radar dataKey="value" stroke="#ffffff" fill="#ffffff" fillOpacity={0.1} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#333333] text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Sessions table */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#1a1a1a]">
          <h2 className="text-sm font-medium text-[#888888]">All Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-[#444444] text-sm">No sessions yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#111111]">
              <tr>
                {['Company', 'Round', 'Score', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#444444] px-4 py-3 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {sessions.map((s, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{s.company}</td>
                  <td className="px-4 py-3 text-sm text-[#555555] capitalize">{s.round_type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm font-black">
                    <span className={s.overall_score && s.overall_score >= 80 ? 'text-green-400' : s.overall_score && s.overall_score >= 60 ? 'text-amber-400' : 'text-red-400'}>
                      {s.overall_score || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#444444]">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}