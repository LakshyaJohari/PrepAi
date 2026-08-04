import { useState, useEffect } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import Logo from '../components/ui/Logo'
import { useGoogleLogin } from '@react-oauth/google';



function MonitorAnimation() {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedCode, setDisplayedCode] = useState("");

  const codeLines = [
    "> Initializing PrepAI...",
    "> Loading AI engine...",
    "> Scanning resume...",
    "> Building questions...",
    "> Mock interview ready!",
    "> Let's get you hired ✓",
  ];

  useEffect(() => {
    if (!isHovered) {
      setDisplayedCode("");
      return;
    }
    let currentLine = 0;
    let currentChar = 0;
    let current = "";

    const interval = setInterval(() => {
      const line = codeLines[currentLine];
      if (!line) {
        clearInterval(interval);
        return;
      }
      current += line[currentChar];
      setDisplayedCode(current);
      currentChar++;
      if (currentChar >= line.length) {
        current += "\n";
        setDisplayedCode(current);
        currentChar = 0;
        currentLine++;
        if (currentLine >= codeLines.length) clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      className="flex flex-col items-center cursor-pointer no-transition"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="monitor-screen w-64 h-44 border-4 border-[#333333] rounded-[var(--radius-lg)] overflow-hidden shadow-2xl relative">
        <div className="absolute top-2 left-3 w-8 h-1.5 bg-white/10 rounded-full" />
        <div className="p-4 font-mono h-full">
          {!isHovered && !displayedCode ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <div className="w-2 h-5 bg-[#3DD68C] animate-pulse" />
              <p className="text-[#555555] text-xs"></p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap leading-5 text-xs">
              {displayedCode}
              {isHovered && (
                <span className="inline-block w-1.5 h-3.5 bg-[#3DD68C] animate-pulse ml-0.5 align-middle" />
              )}
            </pre>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />
      </div>
      <div className="w-4 h-5 bg-[#333333] mx-auto" />
      <div className="w-24 h-2.5 bg-[#333333] rounded-full mx-auto" />

    </div>
  );
}

export default function Login() {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("prepai-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const { initAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('prepai-token', res.data.token);
        await initAuth();
        navigate("/dashboard");
      } else if (mode === "register") {
        const res = await api.post('/auth/register', { email, password, username: name });
        localStorage.setItem('prepai-token', res.data.token);
        await initAuth();
        navigate("/dashboard");
      } else if (mode === "forgot") {
        // Mock forgot password for now since custom auth doesn't have it implemented yet
        setMessage("Password reset feature coming soon!");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Authentication failed");
    }

    setLoading(false);
  };

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const res = await api.post('/auth/google', { access_token: tokenResponse.access_token });
        localStorage.setItem('prepai-token', res.data.token);
        await initAuth();
        navigate("/dashboard");
      } catch (err: any) {
        setError(err.response?.data?.error || err.response?.data?.details || "Google authentication failed on server");
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      setError("Google sign-in failed.");
      console.error(errorResponse);
    }
  });

  const titles = {
    login: {
      heading: "Welcome Back",
      sub: "Sign in to continue your prep journey",
    },
    register: {
      heading: "Create Account",
      sub: "Start your interview prep for free",
    },
    forgot: {
      heading: "Forgot Password",
      sub: "Enter your email to reset your password",
    },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] overflow-hidden flex shadow-[var(--shadow-lg)]">
        {/* Left panel */}
        <div className="w-1/2 bg-[var(--bg-elevated)] p-12 flex flex-col border-r border-[var(--border-subtle)]">
          <Logo size="lg" />
          <div className="flex-1 flex flex-col items-center justify-center gap-6 my-8">
            <MonitorAnimation />
            <p className="text-[var(--text-secondary)] text-sm text-center mt-4 italic">
              "Practice like it's real. Perform like a pro."
            </p>
          </div>
          <div className="flex gap-6 text-center justify-center">
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">500+</div>
              <div className="text-xs text-[var(--text-muted)]">Questions</div>
            </div>
            <div className="w-px bg-[var(--border-subtle)]" />
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">AI</div>
              <div className="text-xs text-[var(--text-muted)]">Powered</div>
            </div>
            <div className="w-px bg-[var(--border-subtle)]" />
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">Free</div>
              <div className="text-xs text-[var(--text-muted)]">Forever</div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-1/2 bg-[var(--bg-surface)] p-12 flex flex-col justify-center">
          {/* Mode tabs */}
          {mode !== "forgot" && (
            <div className="flex bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-1 mb-8">
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
                className={`flex-1 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 ${
                  mode === "login"
                    ? "bg-[var(--bg-overlay)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError("");
                  setMessage("");
                }}
                className={`flex-1 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 ${
                  mode === "register"
                    ? "bg-[var(--bg-overlay)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                Register
              </button>
            </div>
          )}

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
            {titles[mode].heading}
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">{titles[mode].sub}</p>

          {error && (
            <div className="bg-[var(--danger-dim)] border border-[var(--danger-border)] text-[var(--danger)] text-sm rounded-[var(--radius-md)] p-3 mb-4">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-[var(--success-dim)] border border-[var(--success-border)] text-[var(--success)] text-sm rounded-[var(--radius-md)] p-3 mb-4">
              {message}
            </div>
          )}

          {/* Google OAuth */}
          {mode !== "forgot" && (
            <>
              <button
                onClick={() => handleGoogle()}
                className="w-full flex items-center justify-center gap-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium rounded-[var(--radius-md)] py-2.5 text-sm transition-all duration-150 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    fill="#4285F4"
                    d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                  />
                  <path
                    fill="#34A853"
                    d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"
                  />
                  <path
                    fill="#EA4335"
                    d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                <span className="text-[var(--text-muted)] text-xs">
                  or sign in with email
                </span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
                  placeholder="Lakshya Johari"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-10 pr-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-[var(--radius-md)] pl-10 pr-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-border)] transition-all duration-150 placeholder-[var(--text-muted)]"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-semibold rounded-[var(--radius-md)] py-2.5 text-sm transition-all duration-150 mt-2"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "register"
                    ? "Create Account"
                    : "Send Reset Email"}
            </button>
          </form>

          {mode === "login" && (
            <button
              onClick={() => {
                setMode("forgot");
                setError("");
                setMessage("");
              }}
              className="text-[var(--accent)] hover:text-[var(--accent-hover)] text-xs text-center mt-4 w-full"
            >
              Forgot your password?
            </button>
          )}

          {mode === "forgot" && (
            <button
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs text-center mt-4 w-full"
            >
              ← Back to login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
