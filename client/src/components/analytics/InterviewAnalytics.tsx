import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { Mic, Target, TrendingUp, Award, Brain } from 'lucide-react'
import { getChartColors, getTooltipStyle } from '../../lib/chartConfig'

interface Session {
  overall_score: number | null
  created_at: string
  company: string
  role: string
  round_type: string
  difficulty: string
}

interface Turn {
  ai_feedback: any
}

const card = "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5"


function ReadinessMeter({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
  const label = score >= 75 ? 'Interview Ready' : score >= 50 ? 'Getting There' : 'Needs Practice'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[var(--text-primary)]">{score}%</span>
          <span className="text-xs text-[var(--text-muted)] mt-0.5">ready</span>
        </div>
      </div>
      <span style={{ color }} className="text-sm font-bold mt-2">{label}</span>
    </div>
  )
}

export default function InterviewAnalytics({ sessions, turns }: { sessions: Session[], turns: Turn[] }) {
  const chartColors = getChartColors()
  const tooltipStyle = getTooltipStyle()

  const avgScore = sessions.filter(s => s.overall_score).length
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.filter(s => s.overall_score).length)
    : 0

  const bestScore = sessions.length ? Math.max(...sessions.map(s => s.overall_score || 0)) : 0

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

  const avgParams = turns.reduce((acc, t) => {
    const p = t.ai_feedback?.parameters
    if (!p) return acc
    return {
      clarity: acc.clarity + (p.clarity || 0),
      technicalDepth: acc.technicalDepth + (p.technicalDepth || 0),
      relevance: acc.relevance + (p.relevance || 0),
      confidence: acc.confidence + (p.confidence || 0),
      count: acc.count + 1
    }
  }, { clarity: 0, technicalDepth: 0, relevance: 0, confidence: 0, count: 0 })

  const radarData = [
    { subject: 'Situation', value: avgStar.count > 0 ? +(avgStar.situation / avgStar.count).toFixed(1) : 0 },
    { subject: 'Task', value: avgStar.count > 0 ? +(avgStar.task / avgStar.count).toFixed(1) : 0 },
    { subject: 'Action', value: avgStar.count > 0 ? +(avgStar.action / avgStar.count).toFixed(1) : 0 },
    { subject: 'Result', value: avgStar.count > 0 ? +(avgStar.result / avgStar.count).toFixed(1) : 0 },
    { subject: 'Clarity', value: avgParams.count > 0 ? +(avgParams.clarity / avgParams.count).toFixed(1) : 0 },
    { subject: 'Depth', value: avgParams.count > 0 ? +(avgParams.technicalDepth / avgParams.count).toFixed(1) : 0 },
    { subject: 'Confidence', value: avgParams.count > 0 ? +(avgParams.confidence / avgParams.count).toFixed(1) : 0 },
  ]

  const scoreTrend = sessions.filter(s => s.overall_score).map((s, i) => ({
    name: `#${i + 1}`,
    score: s.overall_score,
    date: new Date(s.created_at).toLocaleDateString()
  }))

  const roundBreakdown = Object.entries(
    sessions.reduce((acc, s) => {
      const key = s.round_type?.replace('_', ' ') || 'other'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }))

  const companyBreakdown = Object.entries(
    sessions.reduce((acc, s) => {
      acc[s.company] = (acc[s.company] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }))

  const weakAreas = turns.reduce((acc, t) => {
    const params = t.ai_feedback?.parameters
    if (!params) return acc
    Object.entries(params).forEach(([key, val]) => {
      if (!acc[key]) acc[key] = { total: 0, count: 0 }
      acc[key].total += val as number
      acc[key].count += 1
    })
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  const weakAreasList = Object.entries(weakAreas)
    .map(([key, { total, count }]) => ({ name: key.replace(/([A-Z])/g, ' $1'), avg: +(total / count).toFixed(1) }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)

  const aiInsights = [
    avgScore < 60 && '💡 Your overall scores need improvement. Focus on structuring answers better.',
    avgStar.count > 0 && avgStar.action / avgStar.count < 6 && '⚡ Action component is your weakest STAR element. Be more specific about what YOU did.',
    avgParams.count > 0 && avgParams.technicalDepth / avgParams.count < 6 && '🔧 Technical depth is low. Include more specifics, metrics and technical decisions.',
    avgParams.count > 0 && avgParams.confidence / avgParams.count < 6 && '🎯 Confidence scores are low. Practice speaking clearly and avoid filler words.',
    sessions.length < 3 && '📈 Complete more interviews to get better insights and track your progress.',
    sessions.length >= 3 && avgScore >= 70 && '🌟 Great performance! You are interview-ready. Keep practicing to maintain consistency.',
  ].filter(Boolean)

  const scoreColor = (s: number) => s >= 80 ? 'text-[var(--success)]' : s >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'

  const summaryCards = [
    { label: 'Total Interviews', value: sessions.length, icon: Mic },
    { label: 'Avg Score', value: avgScore || '—', icon: Target },
    { label: 'Best Score', value: bestScore || '—', icon: Award },
    { label: 'Questions Done', value: turns.length, icon: TrendingUp },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.02 }}
            className={`${card} transition-colors duration-150 hover:border-[var(--border-strong)]`}
          >
            <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-[var(--radius-md)] flex items-center justify-center mb-3">
              <Icon size={16} className="text-[var(--accent)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Readiness + Radar */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`${card} flex flex-col items-center justify-center`}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 self-start">Interview Readiness</h3>
          <ReadinessMeter score={avgScore} />
        </div>
        <div className={card}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Performance Radar</h3>
          {radarData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={chartColors.grid} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: chartColors.text }} />
                <Radar dataKey="value" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-[var(--text-disabled)] text-sm">Complete interviews to see radar</div>}
        </div>
      </div>

      {/* Score trend */}
      <div className={card}>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Score Trend</h3>
        {scoreTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={scoreTrend}>
              <CartesianGrid strokeDasharray="2 2" stroke={chartColors.grid} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartColors.text }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartColors.text }} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke={chartColors.primary} strokeWidth={2} dot={{ fill: chartColors.primary, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-40 flex items-center justify-center text-[var(--text-disabled)] text-sm">No data yet</div>}
      </div>

      {/* Round + Company breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className={card}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">By Round Type</h3>
          {roundBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={roundBreakdown} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: chartColors.text }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: chartColors.text }} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-32 flex items-center justify-center text-[var(--text-disabled)] text-sm">No data</div>}
        </div>

        <div className={card}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">By Company</h3>
          {companyBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={companyBreakdown} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: chartColors.text }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: chartColors.text }} width={80} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill={chartColors.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-32 flex items-center justify-center text-[var(--text-disabled)] text-sm">No data</div>}
        </div>
      </div>

      {/* Weak areas */}
      {weakAreasList.length > 0 && (
        <div className={card}>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">⚠️ Weak Areas</h3>
          <div className="grid grid-cols-3 gap-3">
            {weakAreasList.map(({ name, avg }) => (
              <div key={name} className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                <div className="text-xs text-[var(--text-muted)] capitalize mb-1">{name}</div>
                <div className={`text-xl font-bold ${scoreColor(avg * 10)}`}>{avg}/10</div>
                <div className="mt-2 h-1 bg-[var(--bg-overlay)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--danger)] rounded-full" style={{ width: `${avg * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div className={card}>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Recent Interviews</h3>
        {sessions.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm text-center py-6">No interviews yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Company', 'Role', 'Round', 'Difficulty', 'Score', 'Date'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sessions.slice(0, 8).map((s, i) => (
                <tr key={i} className="hover:bg-[var(--bg-elevated)] transition-colors duration-150">
                  <td className="py-2.5 pr-4 text-sm text-[var(--text-primary)]">{s.company}</td>
                  <td className="py-2.5 pr-4 text-sm text-[var(--text-secondary)]">{s.role}</td>
                  <td className="py-2.5 pr-4 text-xs text-[var(--text-muted)] capitalize">{s.round_type?.replace('_', ' ')}</td>
                  <td className="py-2.5 pr-4 text-xs capitalize text-[var(--text-muted)]">{s.difficulty}</td>
                  <td className={`py-2.5 pr-4 text-sm font-bold ${scoreColor(s.overall_score || 0)}`}>{s.overall_score ?? '—'}</td>
                  <td className="py-2.5 text-xs text-[var(--text-muted)]">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className={`${card} border-[var(--accent-border)]`}>
          <h3 className="text-sm font-medium text-[var(--accent)] flex items-center gap-2 mb-4">
            <Brain size={16} /> AI Coach Insights
          </h3>
          <div className="space-y-2">
            {aiInsights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3 text-sm text-[var(--text-secondary)]"
              >
                {insight}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
