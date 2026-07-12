import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/ui/Logo";
import {
  ArrowRight,
  Mic,
  FileText,
  BarChart2,
  CheckCircle,
  Zap,
  Target,
  Sun,
  Moon,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "AI Mock Interviews",
    desc: "Company-specific interviews powered by LLaMA. Behavioral, technical, system design — all rounds covered.",
  },
  {
    icon: Target,
    title: "Multi-Parameter Scoring",
    desc: "STAR framework + clarity, depth, relevance scores. Know exactly where you stand after every answer.",
  },
  {
    icon: FileText,
    title: "Resume Gap Analysis",
    desc: "Upload your resume, get a match score, missing skills, projects to build, and a personalized study roadmap.",
  },
  {
    icon: BarChart2,
    title: "Progress Analytics",
    desc: "Track your scores over time. Radar charts, session history, weak area detection — all in one place.",
  },
  {
    icon: CheckCircle,
    title: "Question Bank",
    desc: "500+ real interview questions from Google, Meta, Amazon, Microsoft. Filter by company, type, difficulty.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    desc: "Get detailed feedback on every answer — strengths, weaknesses, ideal answer — immediately after submission.",
  },
];

const companies = [
  "Google",
  "Meta",
  "Amazon",
  "Microsoft",
  "Apple",
  "Netflix",
  "Flipkart",
  "Swiggy",
  "Zomato",
];

const stats = [
  { value: "500+", label: "Interview Questions" },
  { value: "AI", label: "Powered Scoring" },
  { value: "6+", label: "Score Parameters" },
  { value: "Free", label: "Forever" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<"dark" | "light">(
    () => (localStorage.getItem("prepai-theme") as "dark" | "light") || "dark"
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("prepai-theme", next);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-[var(--nav-height)] flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all duration-150"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 px-4 py-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium px-4 py-2 rounded-[var(--radius-md)] transition-all duration-150"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-full)] px-4 py-1.5 text-sm text-[var(--text-secondary)] mb-8">
            <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse" />
            AI-powered · Free forever · No credit card needed
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-6">
            Practice What
            <br />
            <span className="text-[var(--accent)]">Companies Actually Ask</span>
          </h1>

          <p className="text-[var(--text-secondary)] text-base max-w-lg mx-auto mb-10 leading-relaxed">
            AI mock interviews tailored to your resume and target company. Get
            scored on 6 parameters. Know exactly what to fix.{" "}
            <strong className="text-[var(--text-primary)]">
              Stop guessing. Start preparing smart.
            </strong>
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-all duration-150 flex items-center gap-2"
            >
              Start Practicing Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-all duration-150"
            >
              View Question Bank →
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)] py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center">
          {stats.map(({ value, label }, i) => (
            <div key={label} className="flex items-center">
              <div className="text-center px-8">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
              </div>
              {i < stats.length - 1 && <div className="w-px h-8 bg-[var(--border-subtle)]" />}
            </div>
          ))}
        </div>
      </section>

      {/* Companies marquee */}
      <section className="py-12 overflow-hidden">
        <div className="flex items-center gap-2 max-w-4xl mx-auto px-6 mb-6">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Prep for top companies
          </span>
          <div className="flex-1 h-px bg-[var(--border-subtle)]" />
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
          <div className="flex overflow-hidden">
            <div
              className="flex gap-4 flex-shrink-0"
              style={{ animation: "marquee 20s linear infinite" }}
            >
              {[...companies, ...companies, ...companies].map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-sm px-4 py-1.5 rounded-[var(--radius-full)] flex-shrink-0 whitespace-nowrap"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Everything you need to{" "}
              <span className="text-[var(--accent)]">get hired</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-base">
              No fluff. Just the tools that actually move the needle.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 hover:border-[var(--border-strong)] transition-colors duration-150 shadow-[var(--shadow-xs)]"
              >
                <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-[var(--radius-md)] flex items-center justify-center mb-3">
                  <Icon size={16} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-12 shadow-[var(--shadow-sm)]">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to ace your next interview?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Join thousands of students preparing smarter with PrepAI.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-all duration-150 inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-6 px-6 bg-[var(--bg-base)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <p className="text-[var(--text-muted)] text-sm">
            "Practice like it's real. Perform like a pro."
          </p>
          <p className="text-[var(--text-muted)] text-sm">© 2026 PrepAI</p>
        </div>
      </footer>
    </div>
  );
}
