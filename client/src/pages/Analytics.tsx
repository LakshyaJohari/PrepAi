import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { TrendingUp, Award, Target, Zap } from 'lucide-react'
import { getChartColors, getTooltipStyle } from '../lib/chartConfig'

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
      try {
        const { data } = await api.get('/user/analytics')
        setSessions(data.sessions || [])
        setTurns(data.turns || [])
      } catch (err) {
        console.error('Analytics fetch error:', err)
      }
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
      <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const chartColors = getChartColors()
  const tooltipStyle = getTooltipStyle()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Analytics</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Track your interview performance over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: Target },
          { label: 'Avg Score', value: avgScore || '—', icon: TrendingUp },
          { label: 'Best Score', value: bestScore || '—', icon: Award },
          { label: 'Questions Done', value: turns.length, icon: Zap },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--border-strong)] transition-colors duration-150">
            <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-[var(--radius-md)] flex items-center justify-center mb-3">
              <Icon size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Score over time */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Score Over Time</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="2 2" stroke={chartColors.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartColors.text }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartColors.text }} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="score" stroke={chartColors.primary} strokeWidth={2} dot={{ fill: chartColors.primary, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-disabled)] text-sm">No data yet</div>
          )}
        </div>

        {/* STAR radar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">STAR Analysis</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: chartColors.text }} />
                <Radar dataKey="value" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-[var(--text-disabled)] text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Sessions table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">All Sessions</h2>
        </div>
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No sessions yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-elevated)]">
              <tr>
                {['Company', 'Round', 'Score', 'Date'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sessions.map((s, i) => (
                <tr key={i} className="hover:bg-[var(--bg-elevated)] transition-colors duration-150">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{s.company}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)] capitalize">{s.round_type?.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm font-bold">
                    <span className={s.overall_score && s.overall_score >= 80 ? 'text-[var(--success)]' : s.overall_score && s.overall_score >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}>
                      {s.overall_score || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
