import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../lib/supabase";
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

export default function InterviewScore() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { turns, company, role, roundType, difficulty } = state || {};
  const [scores, setScores] = useState<ScoredTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/interview/score`,
          {
            turns,
            role,
            company,
            roundType,
          },
        );
        const scoredTurns = res.data.scores;
        setScores(scoredTurns);

        const avg = Math.round(
          scoredTurns.reduce(
            (a: number, s: ScoredTurn) => a + s.feedback.overallScore,
            0,
          ) / scoredTurns.length,
        );

        const { data: session } = await supabase
          .from("sessions")
          .insert({
            user_id: user?.id,
            company,
            role,
            round_type: roundType,
            difficulty: difficulty.toLowerCase(),
            status: "completed",
            overall_score: avg,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (session) {
          await supabase.from("turns").insert(
            scoredTurns.map((t: ScoredTurn, i: number) => ({
              session_id: session.id,
              question_index: i,
              question: t.question,
              question_type: roundType,
              user_answer: t.answer,
              ai_feedback: t.feedback,
            })),
          );
        }
        // After saving turns, update streak
        const today = new Date().toISOString().split("T")[0];
        const { data: profile } = await supabase
          .from("profiles")
          .select("streak, last_solved")
          .eq("id", user?.id)
          .single();

        if (profile) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];

          let newStreak = profile.streak || 0;

          if (profile.last_solved === today) {
            // Already solved today, no change
          } else if (profile.last_solved === yesterdayStr) {
            // Solved yesterday, increment streak
            newStreak += 1;
          } else {
            // Streak broken, reset to 1
            newStreak = 1;
          }

          await supabase
            .from("profiles")
            .update({ streak: newStreak, last_solved: today })
            .eq("id", user?.id);
        }
      } catch {
        alert("Failed to score interview");
      }
      setLoading(false);
    };
    if (turns?.length) fetchScores();
  }, []);

  const avgScore = scores.length
    ? Math.round(
        scores.reduce((a, s) => a + s.feedback.overallScore, 0) / scores.length,
      )
    : 0;

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-400" : s >= 60 ? "text-amber-400" : "text-red-400";

  const barColor = (s: number) =>
    s >= 8 ? "bg-green-400" : s >= 5 ? "bg-amber-400" : "bg-red-400";

  const verdictColor = (v: string) =>
    ({
      strong: "text-green-400",
      good: "text-teal-400",
      needs_work: "text-amber-400",
      poor: "text-red-400",
    })[v] || "text-[#555555]";

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#555555] text-sm">Scoring your answers...</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Interview Report</h1>
          <p className="text-sm text-[#555555] mt-1">
            {company} · {role} · {roundType?.replace("_", " ")}
          </p>
        </div>
        <div className="text-center">
          <div className={`text-6xl font-black ${scoreColor(avgScore)}`}>
            {avgScore}
          </div>
          <div className="text-xs text-[#444444] mt-1">Overall Score</div>
        </div>
      </div>

      {/* Per question */}
      <div className="space-y-3">
        {scores.map((s, i) => (
          <div
            key={i}
            className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#444444]">
                  Q{i + 1}
                </span>
                <span className="text-sm text-white font-medium line-clamp-1">
                  {s.question}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-sm font-black ${scoreColor(s.feedback.overallScore)}`}
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
              <div className="px-4 pb-4 space-y-4 border-t border-[#1a1a1a] pt-4">
                <div>
                  <p className="text-xs font-medium text-[#444444] uppercase tracking-widest mb-1">
                    Your Answer
                  </p>
                  <p className="text-sm text-[#888888] bg-[#1a1a1a] rounded-lg p-3">
                    {s.answer}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#444444] uppercase tracking-widest mb-2">
                    STAR Breakdown
                  </p>
                  <div className="space-y-2">
                    {Object.entries(s.feedback.star).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-[#555555] w-16 capitalize">
                          {key}
                        </span>
                        <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor(val)} rounded-full`}
                            style={{ width: `${val * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-white w-8">
                          {val}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#444444] uppercase tracking-widest mb-2">
                    Parameters
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(s.feedback.parameters).map(([key, val]) => (
                      <div key={key} className="bg-[#1a1a1a] rounded-lg p-2.5">
                        <div className="text-xs text-[#555555] capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </div>
                        <div
                          className={`text-lg font-black ${scoreColor(val * 10)}`}
                        >
                          {val}/10
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                      <CheckCircle size={12} /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {s.feedback.strengths?.map((str, j) => (
                        <li
                          key={j}
                          className="text-xs text-[#666666] flex items-start gap-1.5"
                        >
                          <span className="text-green-400 mt-0.5">•</span>
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                      <XCircle size={12} /> Weaknesses
                    </p>
                    <ul className="space-y-1">
                      {s.feedback.weaknesses?.map((w, j) => (
                        <li
                          key={j}
                          className="text-xs text-[#666666] flex items-start gap-1.5"
                        >
                          <span className="text-red-400 mt-0.5">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-amber-400 mb-2 flex items-center gap-1">
                    <AlertCircle size={12} /> How to Improve
                  </p>
                  <ul className="space-y-1">
                    {s.feedback.improvements?.map((imp, j) => (
                      <li
                        key={j}
                        className="text-xs text-[#666666] flex items-start gap-1.5"
                      >
                        <TrendingUp
                          size={10}
                          className="text-amber-400 mt-0.5 flex-shrink-0"
                        />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <p className="text-xs font-medium text-white mb-1">
                    Ideal Answer
                  </p>
                  <p className="text-xs text-[#666666]">
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
          className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <RotateCcw size={14} /> Try Again
        </button>
        <button
          onClick={() => navigate("/history")}
          className="px-5 py-2.5 rounded-xl text-sm text-[#888888] border border-[#1a1a1a] hover:border-[#333333] hover:text-white transition-colors"
        >
          View History
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2.5 rounded-xl text-sm text-[#888888] border border-[#1a1a1a] hover:border-[#333333] hover:text-white transition-colors"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
