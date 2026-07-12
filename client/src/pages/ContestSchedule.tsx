import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { Trophy, Calendar, Clock } from 'lucide-react'

export default function ContestSchedule() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title || !startTime) return
    setLoading(true)
    setError('')
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/contests/create`, {
        title,
        description,
        startTime,
        userId: user?.id,
      })
      setSuccess(true)
      setTimeout(() => navigate('/contest'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create contest')
    }
    setLoading(false)
  }

  // Get min datetime (now)
  const minDateTime = new Date().toISOString().slice(0, 16)

  if (success) return (
    <div className="max-w-xl mx-auto text-center py-20">
      <div className="text-6xl mb-4">🏆</div>
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Contest Scheduled!</h2>
      <p className="text-[var(--text-secondary)]">Redirecting to contest page...</p>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Schedule Contest</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Create a new coding contest. Problems are auto-selected.</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4">
        {error && (
          <div className="bg-[var(--danger-dim)] border border-[var(--danger-border)] text-[var(--danger)] text-sm rounded-[var(--radius-md)] p-3">
            {error}
          </div>
        )}

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
            Contest Title *
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
            placeholder="e.g. PrepAI Weekly Contest 3"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)] resize-none h-20"
            placeholder="Brief description of the contest..."
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
            Start Time *
          </label>
          <input
            type="datetime-local"
            value={startTime}
            min={minDateTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150"
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">Contest runs for 90 minutes from start time</p>
        </div>

        {/* Preview */}
        {startTime && (
          <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4 space-y-2 border border-[var(--border-subtle)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">Preview</p>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-[var(--accent)]" />
              <span className="text-[var(--text-primary)]">Starts: {new Date(startTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-[var(--warning)]" />
              <span className="text-[var(--text-primary)]">Ends: {new Date(new Date(startTime).getTime() + 90 * 60 * 1000).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy size={14} className="text-[var(--teal)]" />
              <span className="text-[var(--text-primary)]">4 problems auto-selected (1 Easy, 2 Medium, 1 Hard)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`badge ${new Date(startTime) <= new Date() ? 'badge-active' : 'badge-upcoming'}`}>
                {new Date(startTime) <= new Date() ? '● Live immediately' : '◷ Scheduled'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !title || !startTime}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold rounded-[var(--radius-md)] py-2.5 text-sm transition-all duration-150 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
          ) : (
            <><Trophy size={16} /> Schedule Contest</>
          )}
        </button>
      </div>

      <div className="bg-[var(--warning-dim)] border border-[var(--warning-border)] rounded-[var(--radius-md)] p-3">
        <p className="text-xs text-[var(--warning)] font-medium mb-1">Admin Only Feature</p>
        <p className="text-xs text-[var(--text-secondary)]">Only admin users can create contests. Problems are automatically selected from the problem bank — 1 easy, 2 medium, 1 hard.</p>
      </div>
    </div>
  )
}
