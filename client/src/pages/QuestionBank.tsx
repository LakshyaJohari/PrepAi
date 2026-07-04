import { useState } from 'react'
import { supabase } from '../lib/supabase'
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
      await supabase.from('saved_questions').insert({
        user_id: user?.id,
        question: q.question,
        company: q.company,
        role: q.role,
        type: q.type,
        difficulty: q.difficulty,
      })
    }
  }

  const typeColor = (t: string) => ({
    behavioral: 'bg-indigo-400/10 text-indigo-400',
    technical: 'bg-teal-400/10 text-teal-400',
    system_design: 'bg-purple-400/10 text-purple-400',
  }[t] || 'bg-[#1a1a1a] text-[#555555]')

  const diffColor = (d: string) => ({
    easy: 'bg-green-400/10 text-green-400',
    medium: 'bg-amber-400/10 text-amber-400',
    hard: 'bg-red-400/10 text-red-400',
  }[d] || '')

  const filterBtn = (active: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs transition-colors ${active ? 'bg-white text-black font-medium' : 'bg-[#1a1a1a] text-[#666666] hover:text-white'}`

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-black text-white">Question Bank</h1>
        <p className="text-[#666666] text-sm mt-1">{filtered.length} questions</p>
      </div>

      {/* Filters */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444444]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder-[#444444]"
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
          <div key={i} className="bg-[#0D0D0D] border border-[#1a1a1a] hover:border-[#333333] rounded-xl p-4 flex items-start justify-between gap-4 transition-colors">
            <div className="flex-1">
              <p className="text-sm text-white mb-2">{q.question}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#444444]">{q.company}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor(q.type)}`}>{q.type.replace('_', ' ')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
              </div>
            </div>
            <button
              onClick={() => toggleSave(q)}
              className="flex-shrink-0 text-[#444444] hover:text-white transition-colors mt-0.5"
            >
              {saved.includes(q.question)
                ? <BookmarkCheck size={18} className="text-indigo-400" />
                : <Bookmark size={18} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}