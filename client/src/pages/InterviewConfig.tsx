import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Mic, Brain, Layout } from 'lucide-react'

const companies = ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix', 'Flipkart', 'Swiggy', 'Zomato', 'Startup']

const roundTypes = [
  { value: 'behavioral', label: 'Behavioral', icon: Mic, desc: 'Leadership, teamwork, conflict resolution' },
  { value: 'technical', label: 'Technical', icon: Brain, desc: 'DSA, system concepts, problem solving' },
  { value: 'system_design', label: 'System Design', icon: Layout, desc: 'Architecture, scalability, trade-offs' },
]

const difficulties = ['Easy', 'Medium', 'Hard']

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
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/interview/start`, {
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">New Mock Interview</h1>
        <p className="text-[#666666] text-sm mt-1">Configure your interview session</p>
      </div>

      {/* Company */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
        <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-3">Company</label>
        <div className="flex flex-wrap gap-2">
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setCompany(c)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                company === c
                  ? 'bg-white text-black font-medium'
                  : 'bg-[#1a1a1a] text-[#888888] hover:text-white hover:bg-[#222222]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Role */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
        <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-3">Role</label>
        <input
          type="text"
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white transition-colors placeholder-[#444444]"
          placeholder="e.g. Software Engineer, Product Manager"
        />
      </div>

      {/* Round Type */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
        <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-3">Round Type</label>
        <div className="grid grid-cols-3 gap-3">
          {roundTypes.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => setRoundType(value)}
              className={`p-4 rounded-xl border-2 text-left transition-colors ${
                roundType === value
                  ? 'border-white bg-white/5'
                  : 'border-[#1a1a1a] hover:border-[#333333]'
              }`}
            >
              <Icon size={18} className={roundType === value ? 'text-white' : 'text-[#555555]'} />
              <div className={`font-medium text-sm mt-2 ${roundType === value ? 'text-white' : 'text-[#888888]'}`}>{label}</div>
              <div className="text-xs text-[#555555] mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
        <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-3">Difficulty</label>
        <div className="flex gap-3">
          {difficulties.map(d => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                difficulty === d
                  ? d === 'Easy' ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                  : d === 'Medium' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                  : 'bg-red-400/20 text-red-400 border border-red-400/30'
                  : 'bg-[#1a1a1a] text-[#555555] border border-transparent hover:border-[#333333]'
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
        className="w-full bg-white hover:bg-gray-100 disabled:opacity-50 text-black font-semibold rounded-xl py-3 text-sm transition-colors"
      >
        {loading ? 'Starting interview...' : 'Start Interview →'}
      </button>
    </div>
  )
}