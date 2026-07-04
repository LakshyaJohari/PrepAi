import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

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

const inputClass = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white transition-colors placeholder-[#444444]"
const labelClass = "text-xs font-medium text-[#555555] uppercase tracking-widest block mb-1.5"
const cardClass = "bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5"

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
      const { error } = await supabase.from('problems_bank').insert({
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
        contributed_by: user.id,
        status: 'pending',
      })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      alert('Failed to submit problem. Please try again.')
    }
    setSubmitting(false)
  }

  if (success) return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-black text-white mb-3">Problem Submitted!</h1>
      <p className="text-[#666666] mb-2">Your problem has been submitted for review.</p>
      <p className="text-[#444444] text-sm mb-8">Once approved by our team, it will appear in the problem bank for everyone to solve.</p>
      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/problems')} className="bg-white text-black font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-colors">
          Browse Problems
        </button>
        <button onClick={() => { setSuccess(false); setStep(1); setTitle(''); setDescription('') }} className="border border-[#222222] text-white px-6 py-2.5 rounded-xl text-sm hover:border-[#444444] transition-colors">
          Submit Another
        </button>
      </div>
    </div>
  )

  const steps = ['Basic Info', 'Examples', 'Test Cases', 'Hints & Review']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Contribute a Problem</h1>
        <p className="text-[#666666] text-sm mt-1">Help grow the PrepAI problem bank. All submissions are reviewed before going live.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i + 1 < step ? 'bg-green-500 text-black' : i + 1 === step ? 'bg-white text-black' : 'bg-[#1a1a1a] text-[#555555]'}`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-white' : 'text-[#555555]'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px mx-2 ${i + 1 < step ? 'bg-green-500/50' : 'bg-[#1a1a1a]'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h2 className="font-bold text-white mb-4">Problem Details</h2>
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
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                        difficulty === d
                          ? d === 'easy' ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                          : d === 'medium' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                          : 'bg-red-400/20 text-red-400 border border-red-400/30'
                          : 'bg-[#1a1a1a] text-[#555555] border border-transparent'
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
            <h2 className="font-bold text-white mb-4">Topics *</h2>
            <div className="flex flex-wrap gap-2">
              {topicOptions.map(t => (
                <button key={t} onClick={() => toggleTopic(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedTopics.includes(t) ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-[#1a1a1a] text-[#666666] hover:text-white'}`}
                >{t}</button>
              ))}
            </div>
            {selectedTopics.length > 0 && <p className="text-xs text-[#444444] mt-2">Selected: {selectedTopics.join(', ')}</p>}
          </div>

          <div className={cardClass}>
            <h2 className="font-bold text-white mb-4">Companies *</h2>
            <div className="flex flex-wrap gap-2">
              {companyOptions.map(c => (
                <button key={c} onClick={() => toggleCompany(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedCompanies.includes(c) ? 'bg-white text-black font-medium' : 'bg-[#1a1a1a] text-[#666666] hover:text-white'}`}
                >{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Examples */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-[#666666]">Add 2-3 examples that illustrate the problem. These are shown to users while solving.</p>
          {examples.map((ex, i) => (
            <div key={i} className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Example {i + 1}</h3>
                {examples.length > 1 && (
                  <button onClick={() => removeExample(i)} className="text-[#444444] hover:text-red-400 transition-colors"><X size={16} /></button>
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
          <button onClick={addExample} className="w-full border border-dashed border-[#2a2a2a] hover:border-[#444444] text-[#555555] hover:text-white rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Add Example
          </button>
        </div>
      )}

      {/* Step 3 — Test Cases */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-xs text-amber-400">⚠️ Test cases are used to judge submissions. Make sure inputs and outputs are exact and unambiguous. Add at least 3 test cases including edge cases.</p>
          </div>
          {testCases.map((tc, i) => (
            <div key={i} className={cardClass}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">
                  Test Case {i + 1}
                  {i >= 2 && <span className="ml-2 text-xs text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">Hidden</span>}
                </h3>
                {testCases.length > 2 && (
                  <button onClick={() => removeTestCase(i)} className="text-[#444444] hover:text-red-400 transition-colors"><X size={16} /></button>
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
          <button onClick={addTestCase} className="w-full border border-dashed border-[#2a2a2a] hover:border-[#444444] text-[#555555] hover:text-white rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> Add Test Case
          </button>
        </div>
      )}

      {/* Step 4 — Hints & Review */}
      {step === 4 && (
        <div className="space-y-5">
          <div className={cardClass}>
            <h2 className="font-bold text-white mb-4">Hints (Optional)</h2>
            <p className="text-xs text-[#555555] mb-4">Add hints that users can reveal one by one when stuck.</p>
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
                    <button onClick={() => removeHint(i)} className="text-[#444444] hover:text-red-400 flex-shrink-0"><X size={16} /></button>
                  )}
                </div>
              ))}
              <button onClick={addHint} className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus size={12} /> Add hint
              </button>
            </div>
          </div>

          {/* Review summary */}
          <div className={cardClass}>
            <h2 className="font-bold text-white mb-4">Review Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Title</span>
                <span className="text-xs text-white font-medium">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Difficulty</span>
                <span className={`text-xs font-bold capitalize ${difficulty === 'easy' ? 'text-green-400' : difficulty === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>{difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Topics</span>
                <span className="text-xs text-white">{selectedTopics.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Companies</span>
                <span className="text-xs text-white">{selectedCompanies.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Examples</span>
                <span className="text-xs text-white">{examples.filter(e => e.input).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Test Cases</span>
                <span className="text-xs text-white">{testCases.filter(tc => tc.input).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#555555]">Hints</span>
                <span className="text-xs text-white">{hints.filter(h => h).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
            <p className="text-xs text-[#555555]">By submitting, you confirm this is your original problem or you have rights to share it. Your problem will be reviewed before going live on PrepAI.</p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-5 py-2.5 rounded-xl text-sm text-[#666666] border border-[#1a1a1a] hover:border-[#333333] hover:text-white disabled:opacity-30 transition-colors"
        >
          ← Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!validateStep(step)}
            className="px-5 py-2.5 rounded-xl text-sm bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {submitting ? <><div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" /> Submitting...</> : '🚀 Submit Problem'}
          </button>
        )}
      </div>
    </div>
  )
}