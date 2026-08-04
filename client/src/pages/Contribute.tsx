import { useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'

const topicOptions = ['Array', 'String', 'LinkedList', 'Tree', 'Graph', 'Dynamic Programming', 'Binary Search', 'Stack', 'Heap', 'Greedy', 'Backtracking', 'Two Pointers', 'Sliding Window', 'Trie', 'Bit Manipulation', 'Math', 'Sorting', 'Hashing']
const companyOptions = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Apple', 'Netflix', 'Adobe', 'Uber', 'Flipkart', 'Swiggy', 'Zomato', 'Atlassian', 'Salesforce', 'Oracle', 'Goldman Sachs']
const difficulties = ['easy', 'medium', 'hard']

interface Example {
  input: string
  output: string
  explanation: string
}

interface TestCase {
  input: string
  expected_output: string
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4)
}

const inputClass = "w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5"
const cardClass = "bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5"

const difficultyStyle: Record<string, string> = {
  easy: 'bg-[var(--success-dim)] text-[var(--success)] border border-[var(--success-border)]',
  medium: 'bg-[var(--warning-dim)] text-[var(--warning)] border border-[var(--warning-border)]',
  hard: 'bg-[var(--danger-dim)] text-[var(--danger)] border border-[var(--danger-border)]',
}

export default function Contribute() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)

  // Form state
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [description, setDescription] = useState('')
  const [constraints, setConstraints] = useState('')
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [examples, setExamples] = useState<Example[]>([{ input: '', output: '', explanation: '' }])
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '' },
    { input: '', expected_output: '' },
    { input: '', expected_output: '' },
  ])
  const [hints, setHints] = useState<string[]>([''])

  const toggleTopic = (t: string) => {
    setSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const toggleCompany = (c: string) => {
    setSelectedCompanies(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const addExample = () => setExamples(prev => [...prev, { input: '', output: '', explanation: '' }])
  const removeExample = (i: number) => setExamples(prev => prev.filter((_, idx) => idx !== i))
  const updateExample = (i: number, field: keyof Example, val: string) => {
    setExamples(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex))
  }

  const addTestCase = () => setTestCases(prev => [...prev, { input: '', expected_output: '' }])
  const removeTestCase = (i: number) => setTestCases(prev => prev.filter((_, idx) => idx !== i))
  const updateTestCase = (i: number, field: keyof TestCase, val: string) => {
    setTestCases(prev => prev.map((tc, idx) => idx === i ? { ...tc, [field]: val } : tc))
  }

  const addHint = () => setHints(prev => [...prev, ''])
  const removeHint = (i: number) => setHints(prev => prev.filter((_, idx) => idx !== i))
  const updateHint = (i: number, val: string) => setHints(prev => prev.map((h, idx) => idx === i ? val : h))

  const validateStep = (s: number) => {
    if (s === 1) return title.trim() && description.trim() && selectedTopics.length > 0 && selectedCompanies.length > 0
    if (s === 2) return examples.every(e => e.input && e.output)
    if (s === 3) return testCases.filter(tc => tc.input && tc.expected_output).length >= 2
    return true
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      await api.post('/problems', {
        title: title.trim(),
        slug: slugify(title),
        difficulty,
        description: description.trim(),
        constraints: constraints.trim(),
        examples: examples.filter(e => e.input && e.output),
        test_cases: testCases.filter(tc => tc.input && tc.expected_output),
        hints: hints.filter(h => h.trim()),
        topics: selectedTopics,
        companies: selectedCompanies,
      })
      setSuccess(true)
    } catch (err) {
      alert('Failed to submit problem. Please try again.')
    }
    setSubmitting(false)
  }

  if (success) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Problem Submitted!</h1>
      <p className="text-[var(--text-secondary)] mb-2">Your problem has been submitted for review.</p>
      <p className="text-[var(--text-muted)] text-sm mb-8">Once approved by our team, it will appear in the problem bank for everyone to solve.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/problems')} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2 rounded-[var(--radius-md)] text-sm transition-all duration-150">
          Browse Problems
        </button>
        <button onClick={() => { setSuccess(false); setStep(1); setTitle(''); setDescription('') }} className="bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] px-4 py-2 rounded-[var(--radius-md)] text-sm transition-all duration-150">
          Submit Another
        </button>
      </div>
    </div>
  )

  const steps = ['Basic Info', 'Examples', 'Test Cases', 'Hints & Review']

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Contribute a Problem</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Help grow the PrepAI problem bank. All submissions are reviewed before going live.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-150 ${i + 1 < step ? 'bg-[var(--success)] text-white' : i + 1 === step ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'}`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i + 1 < step ? 'bg-[var(--success)]' : 'bg-[var(--border-subtle)]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Problem Details</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Problem Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Two Sum, Maximum Subarray" />
              </div>

              <div>
                <label className={labelClass}>Difficulty *</label>
                <div className="flex gap-3">
                  {difficulties.map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-medium capitalize transition-colors duration-150 ${
                        difficulty === d
                          ? difficultyStyle[d]
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Problem Description *</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`${inputClass} resize-none h-32`}
                  placeholder="Describe the problem clearly. Include context, what the user needs to find/return, and any special conditions."
                />
              </div>

              <div>
                <label className={labelClass}>Constraints</label>
                <textarea
                  value={constraints}
                  onChange={e => setConstraints(e.target.value)}
                  className={`${inputClass} resize-none h-20`}
                  placeholder="e.g. 1 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9"
                />
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Topics *</h2>
            <div className="flex flex-wrap gap-2">
              {topicOptions.map(t => (
                <button key={t} onClick={() => toggleTopic(t)}
                  className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs transition-colors duration-150 ${selectedTopics.includes(t) ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent-border)]' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >{t}</button>
              ))}
            </div>
            {selectedTopics.length > 0 && <p className="text-xs text-[var(--text-muted)] mt-2">Selected: {selectedTopics.join(', ')}</p>}
          </div>

          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Companies *</h2>
            <div className="flex flex-wrap gap-2">
              {companyOptions.map(c => (
                <button key={c} onClick={() => toggleCompany(c)}
                  className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs transition-colors duration-150 ${selectedCompanies.includes(c) ? 'bg-[var(--accent)] text-white font-medium' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Examples */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Add 2-3 examples that illustrate the problem. These are shown to users while solving.</p>
          {examples.map((ex, i) => (
            <div key={i} className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">Example {i + 1}</h3>
                {examples.length > 1 && (
                  <button onClick={() => removeExample(i)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors duration-150"><X size={16} /></button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Input *</label>
                  <input value={ex.input} onChange={e => updateExample(i, 'input', e.target.value)} className={inputClass} placeholder="e.g. nums = [2,7,11,15], target = 9" />
                </div>
                <div>
                  <label className={labelClass}>Output *</label>
                  <input value={ex.output} onChange={e => updateExample(i, 'output', e.target.value)} className={inputClass} placeholder="e.g. [0,1]" />
                </div>
                <div>
                  <label className={labelClass}>Explanation</label>
                  <input value={ex.explanation} onChange={e => updateExample(i, 'explanation', e.target.value)} className={inputClass} placeholder="e.g. nums[0] + nums[1] = 9, so we return [0, 1]" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addExample} className="w-full border border-dashed border-[var(--border-default)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-[var(--radius-lg)] py-3 text-sm transition-colors duration-150 flex items-center justify-center gap-2">
            <Plus size={14} /> Add Example
          </button>
        </div>
      )}

      {/* Step 3 — Test Cases */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-[var(--warning-dim)] border border-[var(--warning-border)] rounded-[var(--radius-md)] p-3">
            <p className="text-xs text-[var(--warning)]">⚠️ Test cases are used to judge submissions. Make sure inputs and outputs are exact and unambiguous. Add at least 3 test cases including edge cases.</p>
          </div>
          {testCases.map((tc, i) => (
            <div key={i} className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                  Test Case {i + 1}
                  {i >= 2 && <span className="ml-2 text-xs text-[var(--accent)] bg-[var(--accent-dim)] px-2 py-0.5 rounded-[var(--radius-full)]">Hidden</span>}
                </h3>
                {testCases.length > 2 && (
                  <button onClick={() => removeTestCase(i)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors duration-150"><X size={16} /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Input *</label>
                  <textarea value={tc.input} onChange={e => updateTestCase(i, 'input', e.target.value)} className={`${inputClass} resize-none h-20 font-mono text-xs`} placeholder="Exact input as program would receive via stdin" />
                </div>
                <div>
                  <label className={labelClass}>Expected Output *</label>
                  <textarea value={tc.expected_output} onChange={e => updateTestCase(i, 'expected_output', e.target.value)} className={`${inputClass} resize-none h-20 font-mono text-xs`} placeholder="Exact expected output" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addTestCase} className="w-full border border-dashed border-[var(--border-default)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-[var(--radius-lg)] py-3 text-sm transition-colors duration-150 flex items-center justify-center gap-2">
            <Plus size={14} /> Add Test Case
          </button>
        </div>
      )}

      {/* Step 4 — Hints & Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Hints (Optional)</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Add hints that users can reveal one by one when stuck.</p>
            <div className="space-y-3">
              {hints.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h}
                    onChange={e => updateHint(i, e.target.value)}
                    className={inputClass}
                    placeholder={`Hint ${i + 1} — e.g. Think about using a hash map`}
                  />
                  {hints.length > 1 && (
                    <button onClick={() => removeHint(i)} className="text-[var(--text-muted)] hover:text-[var(--danger)] flex-shrink-0"><X size={16} /></button>
                  )}
                </div>
              ))}
              <button onClick={addHint} className="flex items-center gap-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors duration-150">
                <Plus size={12} /> Add hint
              </button>
            </div>
          </div>

          {/* Review summary */}
          <div className={cardClass}>
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Review Summary</h2>
            <div className="space-y-0">
              <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">Title</span>
                <span className="text-xs text-[var(--text-primary)] font-medium">{title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">Difficulty</span>
                <span className={`text-xs font-semibold capitalize ${difficulty === 'easy' ? 'text-[var(--success)]' : difficulty === 'medium' ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>{difficulty}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">Topics</span>
                <span className="text-xs text-[var(--text-primary)]">{selectedTopics.join(', ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">Companies</span>
                <span className="text-xs text-[var(--text-primary)]">{selectedCompanies.join(', ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">Examples</span>
                <span className="text-xs text-[var(--text-primary)]">{examples.filter(e => e.input).length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">Test Cases</span>
                <span className="text-xs text-[var(--text-primary)]">{testCases.filter(tc => tc.input).length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-xs text-[var(--text-muted)]">Hints</span>
                <span className="text-xs text-[var(--text-primary)]">{hints.filter(h => h).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
            <p className="text-xs text-[var(--text-muted)]">By submitting, you confirm this is your original problem or you have rights to share it. Your problem will be reviewed before going live on PrepAI.</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-4 py-2 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] border border-[var(--border-default)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-all duration-150"
        >
          ← Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!validateStep(step)}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold disabled:opacity-30 transition-all duration-150"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-[var(--radius-md)] text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold disabled:opacity-50 transition-all duration-150 flex items-center gap-2"
          >
            {submitting ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : '🚀 Submit Problem'}
          </button>
        )}
      </div>
    </div>
  )
}
