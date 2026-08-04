import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Search, Filter } from 'lucide-react'

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
  companies: string[]
  topics: string[]
}

const companies = ['All', 'Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Adobe', 'Uber', 'Flipkart', 'Swiggy', 'Zomato', 'Atlassian', 'Salesforce', 'Oracle', 'Goldman Sachs']
const topics = ['All', 'Array', 'String', 'LinkedList', 'Tree', 'Graph', 'Dynamic Programming', 'Binary Search', 'Stack', 'Heap', 'Greedy', 'Backtracking', 'Two Pointers', 'Sliding Window', 'Trie', 'Bit Manipulation', 'Math']
const difficulties = ['All', 'easy', 'medium', 'hard']

export default function Problems() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('All')
  const [topic, setTopic] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [page, setPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    fetchProblems()
  }, [company, topic, difficulty])

  const fetchProblems = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (company !== 'All') params.company = company
      if (topic !== 'All') params.topic = topic
      if (difficulty !== 'All') params.difficulty = difficulty
      if (search) params.search = search

      const res = await api.get(`/problems`, { params })
      setProblems(res.data.problems || [])
      setPage(1)
    } catch (err) {
      console.error('Failed to fetch problems')
    }
    setLoading(false)
  }

  const filtered = problems.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const diffColor = (d: string) => ({
    easy: 'text-[var(--success)]',
    medium: 'text-[var(--warning)]',
    hard: 'text-[var(--danger)]',
  }[d] || 'text-[var(--text-muted)]')

  const filterBtn = (active: boolean) =>
    `px-2.5 py-1 rounded-[var(--radius-sm)] text-xs transition-colors duration-150 border ${
      active
        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
    }`

  const easyCount = problems.filter(p => p.difficulty === 'easy').length
  const medCount = problems.filter(p => p.difficulty === 'medium').length
  const hardCount = problems.filter(p => p.difficulty === 'hard').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Problems</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{problems.length} problems · {easyCount} easy · {medCount} medium · {hardCount} hard</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProblems()}
            placeholder="Search problems..."
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
          />
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Filter size={12} /> Difficulty:</span>
          {difficulties.map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={filterBtn(difficulty === d)}>
              {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Topics */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">Topic:</span>
          {topics.map(t => (
            <button key={t} onClick={() => setTopic(t)} className={filterBtn(topic === t)}>{t}</button>
          ))}
        </div>

        {/* Companies */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">Company:</span>
          {companies.map(c => (
            <button key={c} onClick={() => setCompany(c)} className={filterBtn(company === c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Problems table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] px-5 py-3">#</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] px-5 py-3">Title</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] px-5 py-3">Difficulty</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] px-5 py-3">Topics</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] px-5 py-3">Companies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-3">
                    <div className="h-4 bg-[var(--bg-elevated)] rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[var(--text-muted)] text-sm">
                  No problems found
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/problems/${p.slug}`)}
                  className="hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors duration-150 group"
                >
                  <td className="px-5 py-3.5 text-sm text-[var(--text-muted)]">
                    {(page - 1) * perPage + i + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-150 font-medium">
                      {p.title}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold capitalize ${diffColor(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {p.topics?.slice(0, 2).map(t => (
                        <span key={t} className="badge badge-topic">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {p.companies?.slice(0, 2).map(c => (
                        <span key={c} className="badge badge-topic">
                          {c}
                        </span>
                      ))}
                      {p.companies?.length > 2 && (
                        <span className="text-xs text-[var(--text-muted)]">+{p.companies.length - 2}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)]">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] disabled:opacity-30 transition-colors duration-150"
              >
                ← Prev
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] transition-colors duration-150 ${page === pageNum ? 'bg-[var(--accent)] text-white font-medium' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)] disabled:opacity-30 transition-colors duration-150"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
