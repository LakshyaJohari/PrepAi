import { useState } from 'react'

import { useAuthStore } from '../store/authStore'
import { Bookmark, BookmarkCheck, Search } from 'lucide-react'

const seedQuestions = [
  { question: 'Tell me about a time you had to make a difficult decision with incomplete information.', company: 'Google', role: 'Software Engineer', type: 'behavioral', difficulty: 'medium' },
  { question: 'Design a URL shortening service like bit.ly.', company: 'Amazon', role: 'Software Engineer', type: 'system_design', difficulty: 'hard' },
  { question: 'How would you find the longest palindromic substring?', company: 'Meta', role: 'Software Engineer', type: 'technical', difficulty: 'medium' },
  { question: 'Describe a situation where you had to lead a team through a major change.', company: 'Amazon', role: 'Software Engineer', type: 'behavioral', difficulty: 'medium' },
  { question: 'Design a distributed cache system.', company: 'Google', role: 'Software Engineer', type: 'system_design', difficulty: 'hard' },
  { question: 'How do you handle disagreements with your manager?', company: 'Microsoft', role: 'Software Engineer', type: 'behavioral', difficulty: 'easy' },
  { question: 'Implement LRU Cache with O(1) get and put operations.', company: 'Meta', role: 'Software Engineer', type: 'technical', difficulty: 'hard' },
  { question: 'Tell me about your most challenging project.', company: 'Apple', role: 'Software Engineer', type: 'behavioral', difficulty: 'easy' },
  { question: 'Design a notification system for millions of users.', company: 'Netflix', role: 'Software Engineer', type: 'system_design', difficulty: 'hard' },
  { question: 'How would you detect a cycle in a linked list?', company: 'Google', role: 'Software Engineer', type: 'technical', difficulty: 'easy' },
  { question: 'Describe a time you failed and what you learned.', company: 'Amazon', role: 'Software Engineer', type: 'behavioral', difficulty: 'medium' },
  { question: 'Design Twitter\'s trending topics feature.', company: 'Meta', role: 'Software Engineer', type: 'system_design', difficulty: 'hard' },
  { question: 'What is the difference between process and thread?', company: 'Microsoft', role: 'Software Engineer', type: 'technical', difficulty: 'easy' },
  { question: 'How do you prioritize tasks when everything seems urgent?', company: 'Google', role: 'Software Engineer', type: 'behavioral', difficulty: 'easy' },
  { question: 'Implement a function to serialize and deserialize a binary tree.', company: 'Amazon', role: 'Software Engineer', type: 'technical', difficulty: 'hard' },
]

const companies = ['All', 'Google', 'Meta', 'Amazon', 'Apple', 'Microsoft', 'Netflix']
const types = ['All', 'behavioral', 'technical', 'system_design']
const difficulties = ['All', 'easy', 'medium', 'hard']

export default function QuestionBank() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('All')
  const [type, setType] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [saved, setSaved] = useState<string[]>([])

  const filtered = seedQuestions.filter(q => {
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase())
    const matchCompany = company === 'All' || q.company === company
    const matchType = type === 'All' || q.type === type
    const matchDiff = difficulty === 'All' || q.difficulty === difficulty
    return matchSearch && matchCompany && matchType && matchDiff
  })

  const toggleSave = async (q: typeof seedQuestions[0]) => {
    const key = q.question
    if (saved.includes(key)) {
      setSaved(prev => prev.filter(s => s !== key))
    } else {
      setSaved(prev => [...prev, key])
      // api.post('/problems/save', ...)
    }
  }

  const typeColor = (t: string) => ({
    behavioral: 'bg-[var(--accent-dim)] text-[var(--accent)]',
    technical: 'bg-[var(--teal-dim)] text-[var(--teal)]',
    system_design: 'bg-[var(--info-dim)] text-[var(--info)]',
  }[t] || 'bg-[var(--bg-elevated)] text-[var(--text-muted)]')

  const diffColor = (d: string) => ({
    easy: 'bg-[var(--success-dim)] text-[var(--success)]',
    medium: 'bg-[var(--warning-dim)] text-[var(--warning)]',
    hard: 'bg-[var(--danger-dim)] text-[var(--danger)]',
  }[d] || '')

  const filterBtn = (active: boolean) =>
    `px-2.5 py-1 rounded-[var(--radius-sm)] text-xs transition-colors duration-150 border ${
      active
        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]'
    }`

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Question Bank</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{filtered.length} questions</p>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {companies.map(c => (
              <button key={c} onClick={() => setCompany(c)} className={filterBtn(company === c)}>{c}</button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {types.map(t => (
              <button key={t} onClick={() => setType(t)} className={`${filterBtn(type === t)} capitalize`}>{t.replace('_', ' ')}</button>
            ))}
          </div>
          <div className="flex gap-1">
            {difficulties.map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`${filterBtn(difficulty === d)} capitalize`}>{d}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-2">
        {filtered.map((q, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[var(--radius-md)] p-4 flex items-start justify-between gap-4 transition-colors duration-150">
            <div className="flex-1">
              <p className="text-sm text-[var(--text-primary)] mb-2">{q.question}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">{q.company}</span>
                <span className={`text-xs px-2 py-0.5 rounded-[var(--radius-sm)] ${typeColor(q.type)}`}>{q.type.replace('_', ' ')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-[var(--radius-sm)] ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
              </div>
            </div>
            <button
              onClick={() => toggleSave(q)}
              className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 mt-0.5"
            >
              {saved.includes(q.question)
                ? <BookmarkCheck size={18} className="text-[var(--accent)]" />
                : <Bookmark size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}