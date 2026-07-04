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
      <h2 className="text-2xl font-black text-white mb-2">Contest Scheduled!</h2>
      <p className="text-[#666666]">Redirecting to contest page...</p>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Schedule Contest</h1>
        <p className="text-[#666666] text-sm mt-1">Create a new coding contest. Problems are auto-selected.</p>
      </div>

      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-6 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-1.5">
            Contest Title *
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white placeholder-[#444444]"
            placeholder="e.g. PrepAI Weekly Contest 3"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-1.5">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white placeholder-[#444444] resize-none h-20"
            placeholder="Brief description of the contest..."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-1.5">
            Start Time *
          </label>
          <input
            type="datetime-local"
            value={startTime}
            min={minDateTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white"
          />
          <p className="text-xs text-[#444444] mt-1">Contest runs for 90 minutes from start time</p>
        </div>

        {/* Preview */}
        {startTime && (
          <div className="bg-[#111111] rounded-xl p-4 space-y-2">
            <p className="text-xs text-[#555555] uppercase tracking-widest mb-2">Preview</p>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-indigo-400" />
              <span className="text-white">Starts: {new Date(startTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-amber-400" />
              <span className="text-white">Ends: {new Date(new Date(startTime).getTime() + 90 * 60 * 1000).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy size={14} className="text-teal-400" />
              <span className="text-white">4 problems auto-selected (1 Easy, 2 Medium, 1 Hard)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${new Date(startTime) <= new Date() ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400'}`}>
                {new Date(startTime) <= new Date() ? '● Live immediately' : '◷ Scheduled'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !title || !startTime}
          className="w-full bg-white hover:bg-gray-100 disabled:opacity-50 text-black font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Creating...</>
          ) : (
            <><Trophy size={16} /> Schedule Contest</>
          )}
        </button>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-xs text-amber-400 font-medium mb-1">Admin Only Feature</p>
        <p className="text-xs text-[#888888]">Only admin users can create contests. Problems are automatically selected from the problem bank — 1 easy, 2 medium, 1 hard.</p>
      </div>
    </div>
  )
}