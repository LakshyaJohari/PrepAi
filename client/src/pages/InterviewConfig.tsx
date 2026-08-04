import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Mic, Brain, Layout } from 'lucide-react'

const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Flipkart', 'Swiggy', 'Zomato', 'Startup']

const roundTypes = [
  { value: 'behavioral', label: 'Behavioral', icon: Mic, desc: 'Leadership, teamwork, conflict resolution' },
  { value: 'technical', label: 'Technical', icon: Brain, desc: 'DSA, system concepts, problem solving' },
  { value: 'system_design', label: 'System Design', icon: Layout, desc: 'Architecture, scalability, trade-offs' },
]

const difficulties = ['Easy', 'Medium', 'Hard']

const difficultyStyle: Record<string, string> = {
  Easy: 'bg-[var(--success-dim)] text-[var(--success)] border border-[var(--success-border)]',
  Medium: 'bg-[var(--warning-dim)] text-[var(--warning)] border border-[var(--warning-border)]',
  Hard: 'bg-[var(--danger-dim)] text-[var(--danger)] border border-[var(--danger-border)]',
}

export default function InterviewConfig() {
  const navigate = useNavigate()
  const [company, setCompany] = useState('Google')
  const [role, setRole] = useState('Software Engineer')
  const [roundType, setRoundType] = useState('behavioral')
  const [difficulty, setDifficulty] = useState('Medium')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const sessionId = crypto.randomUUID()
      const res = await api.post(`/interview/start`, {
        sessionId, company, role, roundType, difficulty: difficulty.toLowerCase()
      })
      navigate('/interview/session', {
        state: { sessionId, company, role, roundType, difficulty, firstQuestion: res.data.question }
      })
    } catch {
      alert('Failed to start interview. Check if server is running.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">New Mock Interview</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Configure your interview session</p>
      </div>

      {/* Company */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-3">Company</label>
        <div className="flex flex-wrap gap-2">
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setCompany(c)}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-colors duration-150 ${
                company === c
                  ? 'bg-[var(--accent)] text-white font-medium'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Role */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-3">Role</label>
        <input
          type="text"
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
          placeholder="e.g. Software Engineer, Product Manager"
        />
      </div>

      {/* Round Type */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-3">Round Type</label>
        <div className="grid grid-cols-3 gap-3">
          {roundTypes.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => setRoundType(value)}
              className={`p-4 rounded-[var(--radius-lg)] border text-left transition-colors duration-150 ${
                roundType === value
                  ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
              }`}
            >
              <Icon size={18} className={roundType === value ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
              <div className={`font-medium text-sm mt-2 ${roundType === value ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-3">Difficulty</label>
        <div className="flex gap-3">
          {difficulties.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-150 ${
                difficulty === d
                  ? difficultyStyle[d]
                  : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={loading || !role}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold rounded-[var(--radius-md)] py-3 text-sm transition-all duration-150"
      >
        {loading ? 'Starting interview...' : 'Start Interview →'}
      </button>
    </div>
  )
}
