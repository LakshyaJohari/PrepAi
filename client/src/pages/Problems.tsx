import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
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

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems`, { params })
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
    easy: 'text-green-400',
    medium: 'text-amber-400',
    hard: 'text-red-400',
  }[d] || 'text-[#555555]')

  const diffBg = (d: string) => ({
    easy: 'bg-green-400/10 text-green-400',
    medium: 'bg-amber-400/10 text-amber-400',
    hard: 'bg-red-400/10 text-red-400',
  }[d] || '')

  const filterBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs transition-colors ${active ? 'bg-white text-black font-medium' : 'bg-[#1a1a1a] text-[#666666] hover:text-white'}`

  const easyCount = problems.filter(p => p.difficulty === 'easy').length
  const medCount = problems.filter(p => p.difficulty === 'medium').length
  const hardCount = problems.filter(p => p.difficulty === 'hard').length

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Problems</h1>
          <p className="text-[#666666] text-sm mt-1">{problems.length} problems · {easyCount} easy · {medCount} medium · {hardCount} hard</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProblems()}
            placeholder="Search problems..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white placeholder-[#444444]"
          />
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#444444] flex items-center gap-1"><Filter size={12} /> Difficulty:</span>
          {difficulties.map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={filterBtn(difficulty === d)}>
              {d === 'All' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Topics */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#444444]">Topic:</span>
          {topics.map(t => (
            <button key={t} onClick={() => setTopic(t)} className={filterBtn(topic === t)}>{t}</button>
          ))}
        </div>

        {/* Companies */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#444444]">Company:</span>
          {companies.map(c => (
            <button key={c} onClick={() => setCompany(c)} className={filterBtn(company === c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Problems table */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#111111] border-b border-[#1a1a1a]">
            <tr>
              <th className="text-left text-xs text-[#444444] uppercase tracking-widest px-5 py-3">#</th>
              <th className="text-left text-xs text-[#444444] uppercase tracking-widest px-5 py-3">Title</th>
              <th className="text-left text-xs text-[#444444] uppercase tracking-widest px-5 py-3">Difficulty</th>
              <th className="text-left text-xs text-[#444444] uppercase tracking-widest px-5 py-3">Topics</th>
              <th className="text-left text-xs text-[#444444] uppercase tracking-widest px-5 py-3">Companies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111111]">
            {loading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-5 py-3">
                    <div className="h-4 bg-[#1a1a1a] rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[#444444] text-sm">
                  No problems found
                </td>
              </tr>
            ) : (
              paginated.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/problems/${p.slug}`)}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3.5 text-sm text-[#444444]">
                    {(page - 1) * perPage + i + 1}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-white group-hover:text-indigo-400 transition-colors font-medium">
                      {p.title}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold capitalize ${diffColor(p.difficulty)}`}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {p.topics?.slice(0, 2).map(t => (
                        <span key={t} className="text-xs bg-[#1a1a1a] text-[#666666] px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {p.companies?.slice(0, 2).map(c => (
                        <span key={c} className="text-xs bg-[#1a1a1a] text-[#555555] px-2 py-0.5 rounded-full">
                          {c}
                        </span>
                      ))}
                      {p.companies?.length > 2 && (
                        <span className="text-xs text-[#444444]">+{p.companies.length - 2}</span>
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a1a]">
            <span className="text-xs text-[#444444]">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-[#666666] hover:text-white rounded-lg disabled:opacity-30 transition-colors"
              >
                ← Prev
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${page === pageNum ? 'bg-white text-black font-medium' : 'bg-[#1a1a1a] text-[#666666] hover:text-white'}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-[#1a1a1a] text-[#666666] hover:text-white rounded-lg disabled:opacity-30 transition-colors"
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