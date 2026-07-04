import { useState } from 'react'
import axios from 'axios'
import { Upload, Loader, CheckCircle, XCircle, AlertCircle, BookOpen, TrendingUp } from 'lucide-react'

interface Analysis {
  matchScore: number
  currentStrengths: string[]
  missingSkills: string[]
  projectsToAdd: string[]
  irrelevantItems: string[]
  resumeImprovements: string[]
  studyRoadmap: { topic: string; priority: string; resources: string }[]
  summary: string
}

export default function Preparation() {
  const [resumeText, setResumeText] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setFileName(file.name)
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/resume/upload`, formData)
      setResumeText(res.data.resumeText)
    } catch {
      alert('Failed to parse PDF')
    }
    setUploading(false)
  }

  const handleAnalyze = async () => {
    if (!resumeText || !targetRole) return
    setLoading(true)
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/resume/analyze`, {
        resumeText, targetRole, targetCompany
      })
      setAnalysis(res.data.analysis)
    } catch {
      alert('Failed to analyze resume')
    }
    setLoading(false)
  }

  const priorityColor = (p: string) => ({
    high: 'text-red-400 bg-red-400/10',
    medium: 'text-amber-400 bg-amber-400/10',
    low: 'text-green-400 bg-green-400/10'
  }[p] || 'text-[#555555] bg-[#1a1a1a]')

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-green-400' : s >= 60 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Check Your Preparation</h1>
        <p className="text-[#666666] text-sm mt-1">Upload your resume and get AI-powered gap analysis</p>
      </div>

      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-2">Resume (PDF)</label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#222222] hover:border-[#444444] rounded-xl p-8 cursor-pointer transition-colors">
            <Upload size={24} className="text-[#444444] mb-2" />
            <span className="text-sm text-[#555555]">
              {uploading ? 'Parsing PDF...' : fileName ? fileName : 'Click to upload PDF'}
            </span>
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          </label>
          {resumeText && (
            <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle size={12} /> Resume parsed successfully
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-2">Target Role *</label>
          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white transition-colors placeholder-[#444444]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#555555] uppercase tracking-widest block mb-2">Target Company (optional)</label>
          <input
            type="text"
            value={targetCompany}
            onChange={e => setTargetCompany(e.target.value)}
            placeholder="e.g. Google, Amazon"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white transition-colors placeholder-[#444444]"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !resumeText || !targetRole}
          className="w-full bg-white hover:bg-gray-100 disabled:opacity-50 text-black font-semibold rounded-xl py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader size={14} className="animate-spin" /> Analyzing...</> : 'Analyze My Resume'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-white">Resume Match Score</h2>
              <p className="text-sm text-[#555555] mt-1 max-w-sm">{analysis.summary}</p>
            </div>
            <div className={`text-6xl font-black ${scoreColor(analysis.matchScore)}`}>
              {analysis.matchScore}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-400 flex items-center gap-1 mb-3">
                <CheckCircle size={14} /> Current Strengths
              </h3>
              <ul className="space-y-1.5">
                {analysis.currentStrengths.map((s, i) => (
                  <li key={i} className="text-xs text-[#666666] flex items-start gap-1.5">
                    <span className="text-green-400 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
              <h3 className="text-sm font-medium text-red-400 flex items-center gap-1 mb-3">
                <XCircle size={14} /> Missing Skills
              </h3>
              <ul className="space-y-1.5">
                {analysis.missingSkills.map((s, i) => (
                  <li key={i} className="text-xs text-[#666666] flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-sm font-medium text-indigo-400 flex items-center gap-1 mb-3">
              <TrendingUp size={14} /> Projects to Build
            </h3>
            <ul className="space-y-1.5">
              {analysis.projectsToAdd.map((p, i) => (
                <li key={i} className="text-xs text-[#666666] flex items-start gap-1.5">
                  <span className="text-indigo-400 mt-0.5">→</span>{p}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-sm font-medium text-amber-400 flex items-center gap-1 mb-3">
              <AlertCircle size={14} /> Remove / De-emphasize
            </h3>
            <ul className="space-y-1.5">
              {analysis.irrelevantItems.map((item, i) => (
                <li key={i} className="text-xs text-[#666666] flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">×</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-1 mb-3">
              <BookOpen size={14} /> Study Roadmap
            </h3>
            <div className="space-y-2">
              {analysis.studyRoadmap.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-[#1a1a1a] rounded-lg">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${priorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-white">{item.topic}</div>
                    <div className="text-xs text-[#555555] mt-0.5">{item.resources}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}