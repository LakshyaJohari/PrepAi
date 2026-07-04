import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import { useAuthStore } from '../store/authStore'
import { Trophy, Clock, CheckCircle, XCircle, ChevronLeft, Send, Play, Users } from 'lucide-react'

interface Problem {
  id: string
  title: string
  slug: string
  difficulty: string
  topics: string[]
  description?: string
  examples?: any[]
  constraints?: string
  test_cases?: any[]
}

interface Contest {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
}

interface LeaderboardEntry {
  user_id: string
  total_score: number
  profiles: { username: string; email: string }
}

function Timer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [urgent, setUrgent] = useState(false)

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('00:00:00'); return }
      setUrgent(diff < 600000) // red when < 10 min
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
    }
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [endTime])

  return (
    <span className={`font-mono font-bold text-sm ${urgent ? 'text-red-400' : 'text-white'}`}>
      {timeLeft}
    </span>
  )
}

const defaultCode = {
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Write your solution here
    return 0;
}`,
  python: `import sys
data = sys.stdin.read().split()
# Write your solution here`,
}

const diffColor = (d: string) => ({
  easy: 'text-green-400',
  medium: 'text-amber-400',
  hard: 'text-red-400',
}[d] || '')

const diffBg = (d: string) => ({
  easy: 'bg-green-400/10 text-green-400',
  medium: 'bg-amber-400/10 text-amber-400',
  hard: 'bg-red-400/10 text-red-400',
}[d] || '')

export default function ContestRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [contest, setContest] = useState<Contest | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [code, setCode] = useState(defaultCode.cpp)
  const [language, setLanguage] = useState('cpp')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set())
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTab, setActiveTab] = useState<'problems' | 'leaderboard'>('problems')
  const [bottomTab, setBottomTab] = useState<'testcase' | 'result'>('testcase')
  const [joined, setJoined] = useState(false)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/contests/${id}`)
        setContest(res.data.contest)
        setProblems(res.data.problems)
        if (res.data.problems.length > 0) {
          selectProblem(res.data.problems[0])
        }
      } catch {
        navigate('/contest')
      }
      setLoading(false)
    }
    fetchContest()
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [id])

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/contests/${id}/leaderboard`)
      setLeaderboard(res.data.leaderboard || [])
    } catch {}
  }

  const joinContest = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/contests/${id}/join`, { userId: user?.id })
      setJoined(true)
    } catch {}
  }

  const selectProblem = async (p: Problem) => {
    if (p.test_cases) {
      setSelectedProblem(p)
    } else {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems/${p.slug}`)
        setSelectedProblem(res.data.problem)
      } catch {}
    }
    setResults([])
    setStatus(null)
    setScore(null)
    setCode(defaultCode[language as keyof typeof defaultCode])
  }

  const handleRun = async () => {
    if (!selectedProblem) return
    setRunning(true)
    setResults([])
    setBottomTab('result')
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/problems/${selectedProblem.id}/run`,
        { code, language, testCases: selectedProblem.test_cases?.slice(0, 2) }
      )
      setResults(res.data.results || [])
      setStatus('run')
    } catch {}
    setRunning(false)
  }

  const handleSubmit = async () => {
    if (!selectedProblem || !user) return
    setSubmitting(true)
    setBottomTab('result')
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/contests/${id}/submit`,
        {
          userId: user.id,
          problemId: selectedProblem.id,
          code, language,
          testCases: selectedProblem.test_cases,
          problemTitle: selectedProblem.title,
          startTime,
        }
      )
      setResults(res.data.results || [])
      setStatus(res.data.status)
      setScore(res.data.score)
      if (res.data.status === 'accepted') {
        setSolvedProblems(prev => new Set([...prev, selectedProblem.id]))
        fetchLeaderboard()
      }
    } catch {}
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!joined && contest?.status === 'active') return (
    <div className="max-w-2xl mx-auto text-center py-20">
      <Trophy size={48} className="text-indigo-400 mx-auto mb-4" />
      <h1 className="text-3xl font-black text-white mb-2">{contest.title}</h1>
      <p className="text-[#666666] mb-2">{problems.length} problems · 90 minutes</p>
      <div className="flex items-center justify-center gap-2 text-amber-400 mb-8">
        <Clock size={16} />
        <Timer endTime={contest.end_time} /> remaining
      </div>
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-6 mb-6 text-left">
        <h3 className="font-bold text-white mb-3">Problems</h3>
        {problems.map((p, i) => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
            <span className="text-sm text-white">{i + 1}. {p.title}</span>
            <span className={`text-xs font-bold capitalize ${diffColor(p.difficulty)}`}>{p.difficulty}</span>
          </div>
        ))}
      </div>
      <button
        onClick={joinContest}
        className="bg-white hover:bg-gray-100 text-black font-bold px-8 py-3 rounded-xl text-sm transition-colors"
      >
        Start Contest →
      </button>
    </div>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-black">
      {/* Top bar */}
      <div className="h-11 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contest')} className="text-[#555555] hover:text-white">
            <ChevronLeft size={16} />
          </button>
          <span className="text-white font-bold text-sm">{contest?.title}</span>
        </div>
        <div className="flex items-center gap-4">
          {contest && <Timer endTime={contest.end_time} />}
          <select
            value={language}
            onChange={e => { setLanguage(e.target.value); setCode(defaultCode[e.target.value as keyof typeof defaultCode]) }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
          </select>
          <button
            onClick={handleRun}
            disabled={running || submitting}
            className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] text-white px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40"
          >
            {running ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Play size={12} className="text-green-400" />}
            Run
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || running}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-40"
          >
            {submitting ? <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" /> : <Send size={12} />}
            Submit
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Problem list + description */}
        <div className="w-[42%] flex flex-col border-r border-[#1a1a1a] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0">
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'problems' ? 'text-white border-white' : 'text-[#555555] border-transparent'}`}
            >
              Problems
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'leaderboard' ? 'text-white border-white' : 'text-[#555555] border-transparent'}`}
            >
              <Trophy size={12} /> Leaderboard
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'problems' && (
              <div>
                {/* Problem list */}
                <div className="border-b border-[#1a1a1a]">
                  {problems.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => selectProblem(p)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors border-b border-[#111111] last:border-0 ${selectedProblem?.id === p.id ? 'bg-white/[0.04]' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {solvedProblems.has(p.id) ? (
                          <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                        ) : (
                          <span className="text-xs text-[#444444] w-4">{i + 1}.</span>
                        )}
                        <span className={`text-sm font-medium ${selectedProblem?.id === p.id ? 'text-white' : 'text-[#cccccc]'}`}>
                          {p.title}
                        </span>
                      </div>
                      <span className={`text-xs font-bold capitalize flex-shrink-0 ${diffColor(p.difficulty)}`}>
                        {p.difficulty}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Problem description */}
                {selectedProblem && (
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${diffBg(selectedProblem.difficulty)}`}>
                        {selectedProblem.difficulty}
                      </span>
                      {selectedProblem.topics?.map(t => (
                        <span key={t} className="text-xs bg-[#1a1a1a] text-[#666666] px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <div className="text-sm text-[#cccccc] leading-7 whitespace-pre-wrap">{selectedProblem.description}</div>
                    {selectedProblem.examples?.map((ex, i) => (
                      <div key={i}>
                        <p className="text-sm font-bold text-white mb-2">Example {i + 1}:</p>
                        <div className="bg-[#111111] rounded-lg p-4 font-mono text-sm space-y-1 border-l-2 border-[#2a2a2a]">
                          <div><span className="text-white font-bold">Input: </span><span className="text-[#cccccc]">{ex.input}</span></div>
                          <div><span className="text-white font-bold">Output: </span><span className="text-[#cccccc]">{ex.output}</span></div>
                          {ex.explanation && <div><span className="text-white font-bold">Explanation: </span><span className="text-[#888888]">{ex.explanation}</span></div>}
                        </div>
                      </div>
                    ))}
                    {selectedProblem.constraints && (
                      <div>
                        <p className="text-sm font-bold text-white mb-2">Constraints:</p>
                        <div className="bg-[#111111] rounded-lg p-3 text-xs text-[#cccccc] font-mono whitespace-pre-wrap">{selectedProblem.constraints}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="p-4">
                <div className="space-y-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-[#444444] text-sm text-center py-8">No submissions yet</p>
                  ) : leaderboard.map((entry, i) => (
                    <div key={entry.user_id} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-amber-400/10 border border-amber-400/20' : 'bg-[#111111]'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black w-6 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-[#C0C0C0]' : i === 2 ? 'text-amber-700' : 'text-[#444444]'}`}>
                          {i + 1}
                        </span>
                        <span className="text-sm text-white font-medium">
                          {entry.profiles?.username || entry.profiles?.email?.split('@')[0] || 'User'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-indigo-400">{entry.total_score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Editor + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] border-b border-[#1a1a1a] flex-shrink-0">
            <span className="text-xs text-[#444444]">Read input from stdin · Print output to stdout</span>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={val => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                padding: { top: 10 },
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                automaticLayout: true,
              }}
            />
          </div>

          {/* Bottom panel */}
          <div className="h-52 border-t border-[#1a1a1a] bg-[#0a0a0a] flex flex-col flex-shrink-0">
            <div className="flex items-center border-b border-[#1a1a1a] flex-shrink-0">
              <button onClick={() => setBottomTab('testcase')} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${bottomTab === 'testcase' ? 'text-white border-white' : 'text-[#555555] border-transparent'}`}>
                Testcase
              </button>
              <button onClick={() => setBottomTab('result')} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${bottomTab === 'result' ? 'text-white border-white' : 'text-[#555555] border-transparent'}`}>
                Test Result
              </button>
              {status === 'accepted' && score !== null && (
                <span className="ml-auto mr-4 text-xs text-green-400 font-bold">+{score} pts</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {bottomTab === 'testcase' && selectedProblem && (
                <div className="space-y-3">
                  {selectedProblem.test_cases?.slice(0, 2).map((tc: any, i: number) => (
                    <div key={i} className="bg-[#111111] rounded-lg p-3">
                      <p className="text-xs text-[#555555] mb-2">Case {i + 1}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#444444] mb-1">Input</p>
                          <code className="text-xs text-white font-mono bg-black/40 px-2 py-1 rounded block">{tc.input}</code>
                        </div>
                        <div>
                          <p className="text-xs text-[#444444] mb-1">Expected</p>
                          <code className="text-xs text-green-400 font-mono bg-black/40 px-2 py-1 rounded block">{tc.expected_output}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {bottomTab === 'result' && (
                <>
                  {!status && !running && !submitting && (
                    <div className="flex items-center justify-center h-full text-[#444444] text-sm">Run your code first</div>
                  )}
                  {(running || submitting) && (
                    <div className="flex items-center justify-center h-full gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-[#555555] text-sm">{running ? 'Running...' : 'Submitting...'}</span>
                    </div>
                  )}
                  {status && results.map((r, i) => (
                    <div key={i} className={`rounded-lg p-3 mb-2 border ${r.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {r.passed ? <CheckCircle size={13} className="text-green-400" /> : <XCircle size={13} className="text-red-400" />}
                        <span className={`text-xs font-medium ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {status === 'run' ? `Case ${i + 1}` : status === 'accepted' ? '✓ Accepted' : '✗ Wrong Answer'} — {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                        <div><p className="text-[#444444] mb-0.5">Input</p><code className="text-white bg-black/30 px-2 py-1 rounded block">{r.input}</code></div>
                        <div><p className="text-[#444444] mb-0.5">Expected</p><code className="text-green-400 bg-black/30 px-2 py-1 rounded block">{r.expected}</code></div>
                        <div><p className="text-[#444444] mb-0.5">Output</p><code className={`bg-black/30 px-2 py-1 rounded block ${r.passed ? 'text-green-400' : 'text-red-400'}`}>{r.actual || 'No output'}</code></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}