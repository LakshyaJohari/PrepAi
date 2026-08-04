import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

interface Feedback {
  overallScore: number;
  star: { situation: number; task: number; action: number; result: number };
  parameters: {
    clarity: number;
    technicalDepth: number;
    relevance: number;
    confidence: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  idealAnswer: string;
  verdict: string;
}

interface ScoredTurn {
  question: string;
  answer: string;
  feedback: Feedback;
}

export default function InterviewResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [scores, setScores] = useState<ScoredTurn[]>([]);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await api.get(`/interview/${id}`);
        const { interview } = res.data;
        setConfig(interview.config || {});
        
        // Reconstruct scores from transcript
        const transcript = interview.transcript || [];
        const reconstructedScores = [];
        for (let i = 0; i < transcript.length; i += 2) {
          reconstructedScores.push({
            question: transcript[i].content,
            feedback: transcript[i].ai_feedback,
            answer: transcript[i+1]?.content || ''
          });
        }
        setScores(reconstructedScores);
      } catch {
        alert("Failed to load interview");
        navigate('/profile');
      }
      setLoading(false);
    };
    if (id) fetchInterview();
  }, [id, navigate]);

  const avgScore = scores.length
    ? Math.round(
        scores.reduce((a, s) => a + s.feedback.overallScore, 0) / scores.length,
      )
    : 0;

  const scoreColor = (s: number) =>
    s >= 80 ? "text-[var(--success)]" : s >= 60 ? "text-[var(--warning)]" : "text-[var(--danger)]";

  const barColor = (s: number) =>
    s >= 8 ? "bg-[var(--success)]" : s >= 5 ? "bg-[var(--warning)]" : "bg-[var(--danger)]";

  const verdictColor = (v: string) =>
    ({
      strong: "text-[var(--success)]",
      good: "text-[var(--teal)]",
      needs_work: "text-[var(--warning)]",
      poor: "text-[var(--danger)]",
    })[v] || "text-[var(--text-muted)]";

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">Scoring your answers...</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Interview Report</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {config.company} · {config.role} · {config.roundType?.replace("_", " ")}
          </p>
        </div>
        <div className="text-center">
          <div className={`text-5xl font-bold ${scoreColor(avgScore)}`}>
            {avgScore}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">Overall Score</div>
        </div>
      </div>

      {/* Per question */}
      <div className="space-y-3">
        {scores.map((s, i) => (
          <div
            key={i}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[var(--bg-elevated)] transition-colors duration-150"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Q{i + 1}
                </span>
                <span className="text-sm text-[var(--text-primary)] font-medium line-clamp-1">
                  {s.question}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-sm font-bold ${scoreColor(s.feedback.overallScore)}`}
                >
                  {s.feedback.overallScore}/100
                </span>
                <span
                  className={`text-xs font-medium capitalize ${verdictColor(s.feedback.verdict)}`}
                >
                  {s.feedback.verdict?.replace("_", " ")}
                </span>
              </div>
            </button>

            {expanded === i && (
              <div className="px-4 pb-4 space-y-4 border-t border-[var(--border-subtle)] pt-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-1">
                    Your Answer
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                    {s.answer}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">
                    STAR Breakdown
                  </p>
                  <div className="space-y-2">
                    {Object.entries(s.feedback.star).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-muted)] w-16 capitalize">
                          {key}
                        </span>
                        <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor(val)} rounded-full`}
                            style={{ width: `${val * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[var(--text-primary)] w-8">
                          {val}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">
                    Parameters
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(s.feedback.parameters).map(([key, val]) => (
                      <div key={key} className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                        <div className="text-xs text-[var(--text-muted)] capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </div>
                        <div
                          className={`text-lg font-bold ${scoreColor(val * 10)}`}
                        >
                          {val}/10
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--success)] mb-2 flex items-center gap-1">
                      <CheckCircle size={12} /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {s.feedback.strengths?.map((str, j) => (
                        <li
                          key={j}
                          className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5"
                        >
                          <span className="text-[var(--success)] mt-0.5">•</span>
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--danger)] mb-2 flex items-center gap-1">
                      <XCircle size={12} /> Weaknesses
                    </p>
                    <ul className="space-y-1">
                      {s.feedback.weaknesses?.map((w, j) => (
                        <li
                          key={j}
                          className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5"
                        >
                          <span className="text-[var(--danger)] mt-0.5">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--warning)] mb-2 flex items-center gap-1">
                    <AlertCircle size={12} /> How to Improve
                  </p>
                  <ul className="space-y-1">
                    {s.feedback.improvements?.map((imp, j) => (
                      <li
                        key={j}
                        className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5"
                      >
                        <TrendingUp
                          size={10}
                          className="text-[var(--warning)] mt-0.5 flex-shrink-0"
                        />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[var(--accent-dim)] border border-[var(--accent-border)] rounded-[var(--radius-md)] p-3">
                  <p className="text-xs font-semibold text-[var(--accent)] mb-1">
                    Ideal Answer
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {s.feedback.idealAnswer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/interview/new")}
          className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150"
        >
          <RotateCcw size={14} /> Try Again
        </button>
        <button
          onClick={() => navigate("/history")}
          className="px-4 py-2 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all duration-150"
        >
          View History
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] border border-[var(--border-default)] hover:text-[var(--text-primary)] transition-all duration-150"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
