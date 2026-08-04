import { useState } from 'react'
import api from '../lib/api'
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
      const res = await api.post(`/resume/upload`, formData)
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
      const res = await api.post(`/resume/analyze`, {
        resumeText, targetRole, targetCompany
      })
      setAnalysis(res.data.analysis)
    } catch {
      alert('Failed to analyze resume')
    }
    setLoading(false)
  }

  const priorityBadge = (p: string) => ({
    high: 'bg-[var(--danger-dim)] text-[var(--danger)]',
    medium: 'bg-[var(--warning-dim)] text-[var(--warning)]',
    low: 'bg-[var(--success-dim)] text-[var(--success)]'
  }[p] || 'bg-[var(--bg-elevated)] text-[var(--text-muted)]')

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-[var(--success)]' : s >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Check Your Preparation</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Upload your resume and get AI-powered gap analysis</p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-2">Resume (PDF)</label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent)] rounded-[var(--radius-lg)] p-8 cursor-pointer transition-colors duration-150">
            <Upload size={24} className="text-[var(--text-muted)] mb-2" />
            <span className="text-sm text-[var(--text-muted)]">
              {uploading ? 'Parsing PDF...' : fileName ? fileName : 'Click to upload PDF'}
            </span>
            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          </label>
          {resumeText && (
            <p className="text-xs text-[var(--success)] mt-2 flex items-center gap-1">
              <CheckCircle size={12} /> Resume parsed successfully
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-2">Target Role *</label>
          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. Software Engineer, Data Scientist"
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-2">Target Company (optional)</label>
          <input
            type="text"
            value={targetCompany}
            onChange={e => setTargetCompany(e.target.value)}
            placeholder="e.g. Google, Amazon"
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !resumeText || !targetRole}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold rounded-[var(--radius-md)] py-2.5 text-sm transition-all duration-150 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader size={14} className="animate-spin" /> Analyzing...</> : 'Analyze My Resume'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">Resume Match Score</h2>
              <p className="text-sm text-[var(--text-muted)] mt-1 max-w-sm">{analysis.summary}</p>
            </div>
            <div className={`text-5xl font-bold ${scoreColor(analysis.matchScore)}`}>
              {analysis.matchScore}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
              <h3 className="text-sm font-medium text-[var(--success)] flex items-center gap-1 mb-3">
                <CheckCircle size={14} /> Current Strengths
              </h3>
              <ul className="space-y-1.5">
                {analysis.currentStrengths.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                    <span className="text-[var(--success)] mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
              <h3 className="text-sm font-medium text-[var(--danger)] flex items-center gap-1 mb-3">
                <XCircle size={14} /> Missing Skills
              </h3>
              <ul className="space-y-1.5">
                {analysis.missingSkills.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                    <span className="text-[var(--danger)] mt-0.5">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
            <h3 className="text-sm font-medium text-[var(--accent)] flex items-center gap-1 mb-3">
              <TrendingUp size={14} /> Projects to Build
            </h3>
            <ul className="space-y-1.5">
              {analysis.projectsToAdd.map((p, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                  <span className="text-[var(--accent)] mt-0.5">→</span>{p}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
            <h3 className="text-sm font-medium text-[var(--warning)] flex items-center gap-1 mb-3">
              <AlertCircle size={14} /> Remove / De-emphasize
            </h3>
            <ul className="space-y-1.5">
              {analysis.irrelevantItems.map((item, i) => (
                <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
                  <span className="text-[var(--warning)] mt-0.5">×</span>{item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1 mb-3">
              <BookOpen size={14} /> Study Roadmap
            </h3>
            <div className="space-y-2">
              {analysis.studyRoadmap.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-md)]">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-[var(--radius-sm)] flex-shrink-0 ${priorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-[var(--text-primary)]">{item.topic}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.resources}</div>
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
