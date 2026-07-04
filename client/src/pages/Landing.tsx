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
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "AI Mock Interviews",
    desc: "Company-specific interviews powered by LLaMA. Behavioral, technical, system design — all rounds covered.",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  {
    icon: Target,
    title: "Multi-Parameter Scoring",
    desc: "STAR framework + clarity, depth, relevance scores. Know exactly where you stand after every answer.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: FileText,
    title: "Resume Gap Analysis",
    desc: "Upload your resume, get a match score, missing skills, projects to build, and a personalized study roadmap.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
  {
    icon: BarChart2,
    title: "Progress Analytics",
    desc: "Track your scores over time. Radar charts, session history, weak area detection — all in one place.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: CheckCircle,
    title: "Question Bank",
    desc: "500+ real interview questions from Google, Meta, Amazon, Microsoft. Filter by company, type, difficulty.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    desc: "Get detailed feedback on every answer — strengths, weaknesses, ideal answer — immediately after submission.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="md" dark={true} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-sm bg-white text-black font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#222222] rounded-full px-4 py-1.5 text-sm text-[#888888] mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-powered · Free forever · No credit card needed
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            Practice What
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Companies Actually Ask
            </span>
          </h1>

          <p className="text-[#888888] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            AI mock interviews tailored to your resume and target company. Get
            scored on 6 parameters. Know exactly what to fix.{" "}
            <strong className="text-white">
              Stop guessing. Start preparing smart.
            </strong>
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors text-sm flex items-center gap-2"
            >
              Start Practicing Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="border border-[#333333] text-white font-medium px-8 py-3.5 rounded-xl hover:border-[#555555] transition-colors text-sm"
            >
              View Question Bank →
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1a1a1a] bg-[#080808] py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black text-white">{value}</div>
              <div className="text-sm text-[#666666] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Companies marquee */}
      <section className="py-12 overflow-hidden">
        <p className="text-[#555555] text-sm mb-6 uppercase tracking-widest text-center">
          Prep for top companies
        </p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
          <div className="flex overflow-hidden">
            <div
              className="flex gap-4 flex-shrink-0"
              style={{ animation: "marquee 20s linear infinite" }}
            >
              {[...companies, ...companies, ...companies].map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center bg-[#111111] border border-[#222222] text-[#888888] text-sm px-6 py-2.5 rounded-full flex-shrink-0 whitespace-nowrap"
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
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
                get hired
              </span>
            </h2>
            <p className="text-[#666666] text-lg">
              No fluff. Just the tools that actually move the needle.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#333333] transition-colors"
              >
                <div
                  className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}
                >
                  <Icon size={20} className={color} />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-[#666666] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center bg-[#0D0D0D] border border-[#222222] rounded-3xl p-12">
          <h2 className="text-3xl font-black mb-4">
            Ready to ace your next interview?
          </h2>
          <p className="text-[#666666] mb-8">
            Join thousands of students preparing smarter with PrepAI.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-white text-black font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors text-sm inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" dark={true} />
          <p className="text-[#444444] text-sm">
            "Practice like it's real. Perform like a pro."
          </p>
          <p className="text-[#444444] text-sm">© 2026 PrepAI</p>
        </div>
      </footer>
    </div>
  );
}
