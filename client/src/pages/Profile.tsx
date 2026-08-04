import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  CheckSquare,
  Bookmark,
  BarChart2,
  Clock,
  Settings,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InterviewAnalytics from "../components/analytics/InterviewAnalytics";
import ProblemAnalytics from "../components/analytics/ProblemAnalytics";

interface ProfileData {
  username: string;
  email: string;
  streak: number;
  best_streak: number;
  last_solved: string;
  created_at: string;
}

interface Session {
  id: string;
  company: string;
  role: string;
  round_type: string;
  difficulty: string;
  overall_score: number | null;
  created_at: string;
}

interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  time_taken: number | null;
  notes: string;
  solved_at: string;
}

function ActivityHeatmap({ sessions }: { sessions: Session[] }) {
  const today = new Date();
  const weeks = 26;
  const days: { date: string; count: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = sessions.filter(
      (s) => s.created_at.split("T")[0] === dateStr,
    ).length;
    days.push({ date: dateStr, count });
  }

  const grouped: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) grouped.push(days.slice(i, i + 7));

  const months: { label: string; col: number }[] = [];
  grouped.forEach((week, wi) => {
    const month = new Date(week[0].date)
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    if (wi === 0 || month !== months[months.length - 1]?.label)
      months.push({ label: month, col: wi });
  });

  const cellClass = (count: number) => {
    if (count === 0) return "heatmap-empty";
    if (count === 1) return "heatmap-l1";
    if (count === 2) return "heatmap-l2";
    return "heatmap-l3";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex gap-1 mb-1">
          {grouped.map((_, wi) => {
            const m = months.find((m) => m.col === wi);
            return (
              <div key={wi} className="w-3 text-center">
                {m && (
                  <span className="text-[9px] text-[var(--text-muted)]">{m.label}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-1">
          {grouped.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} sessions`}
                  className={`w-3 h-3 rounded-sm cursor-pointer hover:scale-125 transition-transform duration-150 ${cellClass(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-[var(--text-muted)]">Less</span>
          {["heatmap-empty", "heatmap-l1", "heatmap-l2", "heatmap-l3"].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-[var(--text-muted)]">More</span>
        </div>
      </div>
    </div>
  );
}

function AnalyticsSection({ userId }: { userId: string }) {
  const [analyticsTab, setAnalyticsTab] = useState<"problems" | "interviews">(
    "problems",
  );
  const [sessions, setSessions] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [turns, setTurns] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, analyticsRes] = await Promise.all([
          api.get('/user/history'),
          api.get('/user/analytics')
        ])
        
        setSessions(analyticsRes.data.sessions || [])
        setTurns(analyticsRes.data.turns || [])
        
        setProblems(histRes.data.submissions.map((s: any) => ({
          id: s.id,
          title: s.problem || 'Unknown Problem',
          platform: 'PrepAI',
          difficulty: s.difficulty || 'Medium',
          topic: s.language || 'Code',
          time_taken: null,
          notes: s.status,
          solved_at: s.created_at
        })))
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      }
      setLoaded(true)
    }
    fetchData()
  }, [userId])

  if (!loaded)
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-1 w-fit">
        <button
          onClick={() => setAnalyticsTab("problems")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm transition-colors duration-150 ${analyticsTab === "problems" ? "bg-[var(--accent)] text-white font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          📊 Problem Analytics
        </button>
        <button
          onClick={() => setAnalyticsTab("interviews")}
          className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm transition-colors duration-150 ${analyticsTab === "interviews" ? "bg-[var(--accent)] text-white font-medium" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          🎤 Interview Analytics
        </button>
      </div>

      <AnimatePresence mode="wait">
        {analyticsTab === "problems" ? (
          <ProblemAnalytics key="problems" problems={problems} />
        ) : (
          <InterviewAnalytics
            key="interviews"
            sessions={sessions}
            turns={turns}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      try {
        const [profileRes, histRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/user/history')
        ])

        const p = profileRes.data.profile
        setProfile({
          username: p.username,
          email: p.email,
          streak: p.streak,
          best_streak: p.best_streak,
          last_solved: p.last_solved,
          created_at: p.createdAt
        })
        setNewUsername(p.username || user.email?.split("@")[0] || "")

        setSessions(histRes.data.interviews.map((i: any) => ({
          id: i._id,
          company: i.config?.company || 'Unknown',
          role: i.config?.role || 'Unknown',
          round_type: i.config?.roundType || 'General',
          difficulty: i.config?.difficulty || 'Medium',
          overall_score: i.score,
          created_at: i.createdAt
        })))

        setProblems(histRes.data.submissions.map((s: any) => ({
          id: s.id,
          title: s.problem || 'Unknown Problem',
          platform: 'PrepAI',
          difficulty: s.difficulty || 'Medium',
          topic: s.language || 'Code',
          time_taken: null,
          notes: s.status,
          solved_at: s.created_at
        })))
      } catch (err) {
        console.error('Failed to fetch profile data:', err)
      }
      setLoading(false)
    }
    fetchData()
  }, [user])

  const handleSaveUsername = async () => {
    try {
      await api.put('/user/profile', { username: newUsername })
      setProfile((prev) => (prev ? { ...prev, username: newUsername } : prev))
    } catch (err) {
      console.error('Failed to update username', err)
    }
    setEditing(false)
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const today = new Date().toISOString().split("T")[0];
  const streakActive = profile?.last_solved === today;
  const avgScore = sessions.filter((s) => s.overall_score).length
    ? Math.round(
        sessions.reduce((a, s) => a + (s.overall_score || 0), 0) /
          sessions.filter((s) => s.overall_score).length,
      )
    : 0;
  const activeDays = [
    ...new Set(sessions.map((s) => s.created_at.split("T")[0])),
  ].length;

  const scoreColor = (s: number | null) => {
    if (!s) return "text-[var(--text-disabled)]";
    return s >= 80
      ? "text-[var(--success)]"
      : s >= 60
        ? "text-[var(--warning)]"
        : "text-[var(--danger)]";
  };

  const diffColor = (d: string) =>
    ({
      easy: "text-[var(--success)]",
      medium: "text-[var(--warning)]",
      hard: "text-[var(--danger)]",
    })[d?.toLowerCase()] || "text-[var(--text-muted)]";

  const roundBreakdown = sessions.reduce(
    (acc, s) => {
      const key = s.round_type || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sideLinks = [
    { id: "activity", icon: CheckSquare, label: "Activity" },
    { id: "history", icon: Clock, label: "History" },
    { id: "saved", icon: Bookmark, label: "Saved" },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 sticky top-20">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-semibold text-lg">
              {(profile?.username || user?.email || "?")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div>
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none w-24"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="text-[var(--success)]"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-[var(--danger)]"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[var(--text-primary)] text-sm">
                    {profile?.username || user?.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              )}
              <div className="text-xs text-[var(--text-muted)] truncate max-w-32">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--border-subtle)] mb-2" />

          <div className="space-y-0.5">
            {sideLinks.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-colors duration-150 text-left ${
                  activeTab === id
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="h-px bg-[var(--border-subtle)] my-2" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger-dim)] transition-colors duration-150"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-4">
        {/* Activity tab */}
        {activeTab === "activity" && (
          <>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  🔥 Activity
                </h2>
                <span className="text-xs text-[var(--text-muted)]">Last 6 months</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center border-r border-[var(--border-subtle)]">
                  <div
                    className={`text-3xl font-bold mb-1 ${streakActive ? "text-[var(--info)]" : "text-[var(--text-primary)]"}`}
                  >
                    {profile?.streak || 0}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Current Streak
                  </div>
                </div>
                <div className="text-center border-r border-[var(--border-subtle)]">
                  <div className="text-3xl font-bold text-[var(--teal)] mb-1">
                    {profile?.best_streak || 0}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Best Streak
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--accent)] mb-1">
                    {activeDays}
                  </div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    Active Days
                  </div>
                </div>
              </div>
              <ActivityHeatmap sessions={sessions} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">By Round Type</h3>
                <div className="space-y-3">
                  {Object.entries(roundBreakdown).map(([type, count]) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] capitalize">
                          {type.replace("_", " ")}
                        </span>
                        <span className="text-[var(--text-primary)]">{count as number}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full"
                          style={{
                            width: `${((count as number) / sessions.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-[var(--text-muted)] text-xs">No sessions yet</p>
                  )}
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">
                      Total Sessions
                    </span>
                    <span className="text-[var(--text-primary)] font-bold">
                      {sessions.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">Avg Score</span>
                    <span className={`font-bold ${scoreColor(avgScore)}`}>
                      {avgScore || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">Best Score</span>
                    <span
                      className={`font-bold ${scoreColor(Math.max(...sessions.map((s) => s.overall_score || 0)))}`}
                    >
                      {sessions.length
                        ? Math.max(
                            ...sessions.map((s) => s.overall_score || 0),
                          ) || "—"
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--text-muted)]">
                      Problems Solved
                    </span>
                    <span className="text-[var(--teal)] font-bold">
                      {problems.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--text-primary)]">Recent Sessions</h3>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  View all →
                </button>
              </div>
              {sessions.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/interview/result/${s.id}`)}
                  className="flex items-center justify-between py-3 px-3 -mx-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--text-muted)] w-20">
                      {s.company}
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-semibold uppercase ${diffColor(s.difficulty)}`}
                    >
                      {s.difficulty}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-sm font-bold ${scoreColor(s.overall_score)}`}
                    >
                      {s.overall_score ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-[var(--text-muted)] text-sm text-center py-4">
                  No sessions yet
                </p>
              )}
            </div>
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">Interview Sessions</h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/interview/result/${s.id}`)}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[var(--text-muted)] w-20">
                        {s.company}
                      </span>
                      <span className="text-sm text-[var(--text-primary)]">{s.role}</span>
                      <span className="text-xs text-[var(--text-muted)] capitalize">
                        {s.round_type?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-semibold uppercase ${diffColor(s.difficulty)}`}
                      >
                        {s.difficulty}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-sm font-bold ${scoreColor(s.overall_score)}`}
                      >
                        {s.overall_score ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-[var(--text-muted)] text-sm text-center py-8">
                    No sessions yet
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">Problems Solved</h2>
              <div className="space-y-2">
                {problems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProblem(p)}
                    className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${p.difficulty === "easy" ? "bg-[var(--success)]" : p.difficulty === "medium" ? "bg-[var(--warning)]" : "bg-[var(--danger)]"}`}
                      />
                      <span className="text-sm text-[var(--text-primary)]">{p.title}</span>
                      <span className="text-xs text-[var(--text-muted)]">{p.topic}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold uppercase ${diffColor(p.difficulty)}`}
                      >
                        {p.difficulty}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(p.solved_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && (
                  <p className="text-[var(--text-muted)] text-sm text-center py-8">
                    No problems logged yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved tab */}
        {activeTab === "saved" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Saved Questions</h2>
            <p className="text-[var(--text-muted)] text-sm text-center py-8">
              Coming soon
            </p>
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "analytics" && (
          <AnalyticsSection userId={user?.id || ""} />
        )}

        {/* Settings tab */}
        {activeTab === "settings" && (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    defaultValue={
                      profile?.username || user?.email?.split("@")[0]
                    }
                    id="username-input"
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150"
                    placeholder="Your display name"
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById(
                        "username-input",
                      ) as HTMLInputElement;
                      const newName = input.value.trim();
                      if (!newName) return;
                      await api.put('/user/profile', { username: newName })
                      setProfile((prev) =>
                        prev ? { ...prev, username: newName } : prev,
                      );
                      // Update auth store so navbar reflects immediately
                      if (user) {
                        const { setUser } = useAuthStore.getState();
                        setUser({ ...user, name: newName });
                      }
                      alert("Username updated!");
                    }}
                    className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-4 py-2.5 rounded-[var(--radius-md)] text-sm transition-all duration-150"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
                  Email
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-muted)] text-sm cursor-not-allowed"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
                  Member Since
                </label>
                <p className="text-sm text-[var(--text-primary)]">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Problem detail modal */}
      {selectedProblem && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedProblem(null)}
        >
          <div
            className="bg-[var(--bg-overlay)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {selectedProblem.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-semibold capitalize ${diffColor(selectedProblem.difficulty)}`}
                  >
                    {selectedProblem.difficulty}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {selectedProblem.platform}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {selectedProblem.topic}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                <span className="text-xs text-[var(--text-muted)]">Solved on</span>
                <span className="text-xs text-[var(--text-primary)]">
                  {new Date(selectedProblem.solved_at).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </span>
              </div>
              {selectedProblem.time_taken && (
                <div className="flex justify-between bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                  <span className="text-xs text-[var(--text-muted)]">Time taken</span>
                  <span className="text-xs text-[var(--text-primary)]">
                    {selectedProblem.time_taken} minutes
                  </span>
                </div>
              )}
              {selectedProblem.notes && (
                <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                  <p className="text-xs text-[var(--text-muted)] mb-1">Notes</p>
                  <p className="text-sm text-[var(--text-primary)]">{selectedProblem.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
