import { useState } from 'react'
import api from '../lib/api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const { setUser } = useAuthStore()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', { email, password, name })
      localStorage.setItem('prepai-token', res.data.token)
      setUser(res.data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8 w-full max-w-md shadow-[var(--shadow-md)]">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Create account</h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Start your interview prep journey</p>
        {error && <div className="bg-[var(--danger-dim)] border border-[var(--danger-border)] text-[var(--danger)] text-sm rounded-[var(--radius-md)] p-3 mb-4">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150"
              placeholder="Lakshya Johari"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--radius-md)] py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-[var(--text-muted)] text-sm text-center mt-4">
          Already have an account? <Link to="/login" className="text-[var(--accent)] hover:text-[var(--accent-hover)]">Login</Link>
        </p>
      </div>
    </div>
  )
}
