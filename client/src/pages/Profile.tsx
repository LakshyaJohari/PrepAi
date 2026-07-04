import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
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

  const cellColor = (count: number) => {
    if (count === 0) return "#1a1a1a";
    if (count === 1) return "#312e81";
    if (count === 2) return "#4338ca";
    return "#6366f1";
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
                  <span className="text-[9px] text-[#444444]">{m.label}</span>
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
                  className="w-3 h-3 rounded-sm cursor-pointer hover:scale-125 transition-transform"
                  style={{ background: cellColor(day.count) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-2 justify-end">
          <span className="text-[10px] text-[#444444]">Less</span>
          {["#1a1a1a", "#312e81", "#4338ca", "#6366f1"].map((c, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ background: c }}
            />
          ))}
          <span className="text-[10px] text-[#444444]">More</span>
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
      const { data: s } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      const { data: p } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", userId)
        .order("solved_at", { ascending: true });
      const { data: t } = await supabase
        .from("turns")
        .select("ai_feedback, session_id");
      setSessions(s || []);
      setProblems(p || []);
      setTurns(t || []);
      setLoaded(true);
    };
    fetchData();
  }, [userId]);

  if (!loaded)
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-1 w-fit">
        <button
          onClick={() => setAnalyticsTab("problems")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${analyticsTab === "problems" ? "bg-white text-black font-medium" : "text-[#666666] hover:text-white"}`}
        >
          📊 Problem Analytics
        </button>
        <button
          onClick={() => setAnalyticsTab("interviews")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${analyticsTab === "interviews" ? "bg-white text-black font-medium" : "text-[#666666] hover:text-white"}`}
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
      if (!user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      const { data: s } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const { data: pr } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false });
      setProfile(p);
      setNewUsername(p?.username || user.email?.split("@")[0] || "");
      setSessions(s || []);
      setProblems(pr || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSaveUsername = async () => {
    await supabase
      .from("profiles")
      .update({ username: newUsername })
      .eq("id", user?.id);
    setProfile((prev) => (prev ? { ...prev, username: newUsername } : prev));
    setEditing(false);
  };

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
    if (!s) return "text-[#444444]";
    return s >= 80
      ? "text-green-400"
      : s >= 60
        ? "text-amber-400"
        : "text-red-400";
  };

  const diffColor = (d: string) =>
    ({
      easy: "text-green-400",
      medium: "text-amber-400",
      hard: "text-red-400",
    })[d?.toLowerCase()] || "text-[#555555]";

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
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-4 sticky top-20">
          <div className="flex items-center gap-3 p-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
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
                    className="bg-[#1a1a1a] border border-[#333] rounded-lg px-2 py-1 text-white text-xs focus:outline-none w-24"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="text-green-400"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm">
                    {profile?.username || user?.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[#444444] hover:text-white"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              )}
              <div className="text-xs text-[#555555] truncate max-w-32">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1a1a1a] mb-2" />

          <div className="space-y-0.5">
            {sideLinks.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                  activeTab === id
                    ? "bg-white/10 text-white font-medium"
                    : "text-[#666666] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="h-px bg-[#1a1a1a] my-2" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#666666] hover:text-red-400 hover:bg-red-400/5 transition-colors"
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
            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white flex items-center gap-2">
                  🔥 Activity
                </h2>
                <span className="text-xs text-[#444444]">Last 6 months</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center border-r border-[#1a1a1a]">
                  <div
                    className={`text-3xl font-black mb-1 ${streakActive ? "text-blue-400" : "text-white"}`}
                  >
                    {profile?.streak || 0}
                  </div>
                  <div className="text-xs text-[#555555] uppercase tracking-widest">
                    Current Streak
                  </div>
                </div>
                <div className="text-center border-r border-[#1a1a1a]">
                  <div className="text-3xl font-black text-indigo-400 mb-1">
                    {profile?.best_streak || 0}
                  </div>
                  <div className="text-xs text-[#555555] uppercase tracking-widest">
                    Best Streak
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-indigo-400 mb-1">
                    {activeDays}
                  </div>
                  <div className="text-xs text-[#555555] uppercase tracking-widest">
                    Active Days
                  </div>
                </div>
              </div>
              <ActivityHeatmap sessions={sessions} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">By Round Type</h3>
                <div className="space-y-3">
                  {Object.entries(roundBreakdown).map(([type, count]) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#888888] capitalize">
                          {type.replace("_", " ")}
                        </span>
                        <span className="text-white">{count}</span>
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${(count / sessions.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-[#444444] text-xs">No sessions yet</p>
                  )}
                </div>
              </div>

              <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#555555]">
                      Total Sessions
                    </span>
                    <span className="text-white font-bold">
                      {sessions.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#555555]">Avg Score</span>
                    <span className={`font-bold ${scoreColor(avgScore)}`}>
                      {avgScore || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#555555]">Best Score</span>
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
                    <span className="text-xs text-[#555555]">
                      Problems Solved
                    </span>
                    <span className="text-teal-400 font-bold">
                      {problems.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Recent Sessions</h3>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  View all →
                </button>
              </div>
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#444444] w-20">
                      {s.company}
                    </span>
                    <span className="text-sm text-white">{s.role}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-bold uppercase ${diffColor(s.difficulty)}`}
                    >
                      {s.difficulty}
                    </span>
                    <span className="text-xs text-[#444444]">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-sm font-black ${scoreColor(s.overall_score)}`}
                    >
                      {s.overall_score ?? "—"}
                    </span>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-[#444444] text-sm text-center py-4">
                  No sessions yet
                </p>
              )}
            </div>
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4">Interview Sessions</h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-[#444444] w-20">
                        {s.company}
                      </span>
                      <span className="text-sm text-white">{s.role}</span>
                      <span className="text-xs text-[#444444] capitalize">
                        {s.round_type?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs font-bold uppercase ${diffColor(s.difficulty)}`}
                      >
                        {s.difficulty}
                      </span>
                      <span className="text-xs text-[#444444]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-sm font-black ${scoreColor(s.overall_score)}`}
                      >
                        {s.overall_score ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-[#444444] text-sm text-center py-8">
                    No sessions yet
                  </p>
                )}
              </div>
            </div>

            <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4">Problems Solved</h2>
              <div className="space-y-2">
                {problems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProblem(p)}
                    className="flex items-center justify-between py-3 border-b border-[#1a1a1a] last:border-0 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${p.difficulty === "easy" ? "bg-green-400" : p.difficulty === "medium" ? "bg-amber-400" : "bg-red-400"}`}
                      />
                      <span className="text-sm text-white">{p.title}</span>
                      <span className="text-xs text-[#444444]">{p.topic}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold uppercase ${diffColor(p.difficulty)}`}
                      >
                        {p.difficulty}
                      </span>
                      <span className="text-xs text-[#444444]">
                        {new Date(p.solved_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && (
                  <p className="text-[#444444] text-sm text-center py-8">
                    No problems logged yet
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved tab */}
        {activeTab === "saved" && (
          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
            <h2 className="font-bold text-white mb-4">Saved Questions</h2>
            <p className="text-[#444444] text-sm text-center py-8">
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
          <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-5">
            <h2 className="font-bold text-white mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#555555] uppercase tracking-widest block mb-1.5">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    defaultValue={
                      profile?.username || user?.email?.split("@")[0]
                    }
                    id="username-input"
                    className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-white"
                    placeholder="Your display name"
                  />
                  <button
                    onClick={async () => {
                      const input = document.getElementById(
                        "username-input",
                      ) as HTMLInputElement;
                      const newName = input.value.trim();
                      if (!newName) return;
                      await supabase
                        .from("profiles")
                        .update({ username: newName })
                        .eq("id", user?.id);
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
                    className="bg-white hover:bg-gray-100 text-black font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#555555] uppercase tracking-widest block mb-1.5">
                  Email
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-xl px-4 py-2.5 text-[#555555] text-sm cursor-not-allowed"
                />
                <p className="text-xs text-[#444444] mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <label className="text-xs text-[#555555] uppercase tracking-widest block mb-1.5">
                  Member Since
                </label>
                <p className="text-sm text-white">
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          onClick={() => setSelectedProblem(null)}
        >
          <div
            className="bg-[#0D0D0D] border border-[#222222] rounded-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-white">
                  {selectedProblem.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs font-bold capitalize ${diffColor(selectedProblem.difficulty)}`}
                  >
                    {selectedProblem.difficulty}
                  </span>
                  <span className="text-xs text-[#444444]">
                    {selectedProblem.platform}
                  </span>
                  <span className="text-xs text-[#444444]">
                    {selectedProblem.topic}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="text-[#555555] hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between bg-[#1a1a1a] rounded-xl p-3">
                <span className="text-xs text-[#555555]">Solved on</span>
                <span className="text-xs text-white">
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
                <div className="flex justify-between bg-[#1a1a1a] rounded-xl p-3">
                  <span className="text-xs text-[#555555]">Time taken</span>
                  <span className="text-xs text-white">
                    {selectedProblem.time_taken} minutes
                  </span>
                </div>
              )}
              {selectedProblem.notes && (
                <div className="bg-[#1a1a1a] rounded-xl p-3">
                  <p className="text-xs text-[#555555] mb-1">Notes</p>
                  <p className="text-sm text-white">{selectedProblem.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
