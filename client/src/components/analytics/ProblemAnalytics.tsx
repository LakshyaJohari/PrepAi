import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { Code, Zap, Target, TrendingUp, Brain, Award } from 'lucide-react'

interface Problem {
  difficulty: string
  topic: string
  platform: string
  time_taken: number | null
  solved_at: string
  notes: string
}

const card = "bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5"
const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }

function HeatmapCalendar({ problems }: { problems: Problem[] }) {
  const today = new Date()
  const weeks = 26
  const days: { date: string; count: number }[] = []

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const count = problems.filter(p => p.solved_at.split('T')[0] === dateStr).length
    days.push({ date: dateStr, count })
  }

  const grouped: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) grouped.push(days.slice(i, i + 7))

  const months: { label: string; col: number }[] = []
  grouped.forEach((week, wi) => {
    const month = new Date(week[0].date).toLocaleString('default', { month: 'short' }).toUpperCase()
    if (wi === 0 || month !== months[months.length - 1]?.label) {
      months.push({ label: month, col: wi })
    }
  })

  const cellColor = (count: number) => {
    if (count === 0) return '#1a1a1a'
    if (count === 1) return '#134e4a'
    if (count === 2) return '#0f766e'
    return '#14b8a6'
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex gap-1 mb-1 ml-0">
          {grouped.map((_, wi) => {
            const m = months.find(m => m.col === wi)
            return (
              <div key={wi} className="w-3 text-center">
                {m && <span className="text-[9px] text-[#444444]">{m.label}</span>}
              </div>
            )
          })}
        </div>
        <div className="flex gap-1">
          {grouped.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <motion.div
                  key={di}
                  whileHover={{ scale: 1.4 }}
                  title={`${day.date}: ${day.count} solved`}
                  className="w-3 h-3 rounded-sm cursor-pointer"
                  style={{ background: cellColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-[#444444]">Less</span>
          {['#1a1a1a', '#134e4a', '#0f766e', '#14b8a6'].map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-[10px] text-[#444444]">More</span>
        </div>
      </div>
    </div>
  )
}

export default function ProblemAnalytics({ problems }: { problems: Problem[] }) {
  const easy = problems.filter(p => p.difficulty === 'easy').length
  const medium = problems.filter(p => p.difficulty === 'medium').length
  const hard = problems.filter(p => p.difficulty === 'hard').length
  const avgTime = problems.filter(p => p.time_taken).length
    ? Math.round(problems.reduce((a, p) => a + (p.time_taken || 0), 0) / problems.filter(p => p.time_taken).length)
    : 0

  const activeDays = [...new Set(problems.map(p => p.solved_at.split('T')[0]))].length

  // Streak calculation
  const sortedDates = [...new Set(problems.map(p => p.solved_at.split('T')[0]))].sort()
  let streak = 0
  let bestStreak = 0
  let cur = 0
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { cur = 1 }
    else {
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      cur = diff === 1 ? cur + 1 : 1
    }
    bestStreak = Math.max(bestStreak, cur)
  }
  const today = new Date().toISOString().split('T')[0]
  streak = sortedDates[sortedDates.length - 1] === today ? cur : 0

  const diffData = [
    { name: 'Easy', value: easy, color: '#10b981' },
    { name: 'Medium', value: medium, color: '#f59e0b' },
    { name: 'Hard', value: hard, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const topicData = Object.entries(
    problems.reduce((acc, p) => { acc[p.topic] = (acc[p.topic] || 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))

  const platformData = Object.entries(
    problems.reduce((acc, p) => { acc[p.platform] = (acc[p.platform] || 0) + 1; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const dailyData = (() => {
    const byDate: Record<string, number> = {}
    problems.forEach(p => {
      const date = p.solved_at.split('T')[0]
      byDate[date] = (byDate[date] || 0) + 1
    })
    return Object.entries(byDate).slice(-14).map(([date, count]) => ({
      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count
    }))
  })()

  const weeklyData = (() => {
    const byWeek: Record<string, number> = {}
    problems.forEach(p => {
      const d = new Date(p.solved_at)
      const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', { month: 'short' })}`
      byWeek[week] = (byWeek[week] || 0) + 1
    })
    return Object.entries(byWeek).slice(-8).map(([name, count]) => ({ name, count }))
  })()

  const weakTopics = topicData.slice(-3).reverse()

  const aiInsights = [
    problems.length === 0 && '🚀 Start logging problems to get personalized insights.',
    hard > medium && '💡 You attempt many hard problems. Make sure you\'re solid on medium first.',
    avgTime > 45 && '⏱️ Your average solve time is high. Practice timed sessions to improve speed.',
    easy > medium + hard && '📈 You\'re solving mostly easy problems. Challenge yourself with more mediums.',
    streak === 0 && problems.length > 0 && '🔥 Your streak is broken. Solve a problem today to restart it.',
    streak >= 7 && '🌟 Amazing streak! Keep the momentum going.',
    topicData[0] && `📊 Your strongest topic is ${topicData[0].name} with ${topicData[0].count} problems solved.`,
    weakTopics[0] && `⚠️ Practice more ${weakTopics[0].name} problems — it\'s your least covered topic.`,
  ].filter(Boolean)

  const summaryCards = [
    { label: 'Total Solved', value: problems.length, icon: Code, color: 'text-teal-400', bg: 'bg-teal-400/10' },
    { label: 'Easy', value: easy, icon: Target, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Medium', value: medium, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Hard', value: hard, icon: Award, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'Avg Time', value: avgTime ? `${avgTime}m` : '—', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Active Days', value: activeDays, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-3">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.02 }}
            className={`${card} transition-colors`}
          >
            <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={14} className={color} />
            </div>
            <div className="text-xl font-black text-white">{value}</div>
            <div className="text-xs text-[#555555] mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Streak cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Current Streak', value: streak, color: streak > 0 ? 'text-blue-400' : 'text-[#444444]' },
          { label: 'Best Streak', value: bestStreak, color: 'text-teal-400' },
          { label: 'Active Days', value: activeDays, color: 'text-teal-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${card} text-center`}>
            <div className={`text-4xl font-black ${color} mb-1`}>{value}</div>
            <div className="text-xs text-[#555555] uppercase tracking-widest">{label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className={card}>
        <h3 className="text-sm font-medium text-[#888888] mb-4">🔥 Activity Heatmap</h3>
        <HeatmapCalendar problems={problems} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className={card}>
          <h3 className="text-sm font-medium text-[#888888] mb-4">Daily Submissions</h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#555555' }} />
                <YAxis tick={{ fontSize: 11, fill: '#555555' }} />
                <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-40 flex items-center justify-center text-[#333333] text-sm">No data yet</div>}
        </div>

        <div className={card}>
          <h3 className="text-sm font-medium text-[#888888] mb-4">Difficulty Distribution</h3>
          {diffData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={diffData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                  label={({ name, value }) => `${name} ${value}`}>
                  {diffData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-40 flex items-center justify-center text-[#333333] text-sm">No data yet</div>}
        </div>
      </div>

      {/* Topic mastery */}
      <div className={card}>
        <h3 className="text-sm font-medium text-[#888888] mb-4">Topic Mastery</h3>
        {topicData.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {topicData.map(({ name, count }) => (
              <div key={name} className="bg-[#1a1a1a] rounded-xl p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white font-medium">{name}</span>
                  <span className="text-xs text-teal-400 font-bold">{count} solved</span>
                </div>
                <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((count / problems.length) * 100 * 3, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-teal-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-[#333333] text-sm text-center py-4">No topics yet</p>}
      </div>

      {/* Platform + Weekly */}
      <div className="grid grid-cols-2 gap-4">
        <div className={card}>
          <h3 className="text-sm font-medium text-[#888888] mb-4">By Platform</h3>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                  label={({ name, value }) => `${name} ${value}`}>
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={['#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-32 flex items-center justify-center text-[#333333] text-sm">No data</div>}
        </div>

        <div className={card}>
          <h3 className="text-sm font-medium text-[#888888] mb-4">Weekly Progress</h3>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#555555' }} />
                <YAxis tick={{ fontSize: 11, fill: '#555555' }} />
                <Tooltip contentStyle={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-32 flex items-center justify-center text-[#333333] text-sm">No data</div>}
        </div>
      </div>

      {/* Weakest topics */}
      {weakTopics.length > 0 && (
        <div className={card}>
          <h3 className="text-sm font-medium text-[#888888] mb-4">⚠️ Least Practiced Topics</h3>
          <div className="grid grid-cols-3 gap-3">
            {weakTopics.map(({ name, count }) => (
              <div key={name} className="bg-[#1a1a1a] rounded-xl p-3">
                <div className="text-sm text-white font-medium mb-1">{name}</div>
                <div className="text-xs text-red-400">{count} solved</div>
                <button className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">Practice Now →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent submissions */}
      <div className={card}>
        <h3 className="text-sm font-medium text-[#888888] mb-4">Recent Submissions</h3>
        {problems.length === 0 ? (
          <p className="text-[#444444] text-sm text-center py-6">No problems logged yet</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {['Problem', 'Difficulty', 'Topic', 'Platform', 'Time', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs text-[#444444] uppercase tracking-widest pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {problems.slice(0, 8).map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-4 text-sm text-white">{p.notes ? (
                    <span title={p.notes}>{p.notes.substring(0, 25)}{p.notes.length > 25 ? '...' : ''}</span>
                  ) : '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-bold capitalize px-2 py-0.5 rounded-full ${
                      p.difficulty === 'easy' ? 'bg-green-400/10 text-green-400' :
                      p.difficulty === 'medium' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-red-400/10 text-red-400'
                    }`}>{p.difficulty}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-[#555555]">{p.topic}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#555555]">{p.platform}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#555555]">{p.time_taken ? `${p.time_taken}m` : '—'}</td>
                  <td className="py-2.5 text-xs text-[#444444]">{new Date(p.solved_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className={`${card} border-teal-500/20`}>
          <h3 className="text-sm font-medium text-teal-400 flex items-center gap-2 mb-4">
            <Brain size={16} /> AI Coach Insights
          </h3>
          <div className="space-y-2">
            {aiInsights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1a] rounded-xl p-3 text-sm text-[#888888]"
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