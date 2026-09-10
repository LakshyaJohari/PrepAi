import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Editor from "@monaco-editor/react";
import { useAuthStore } from "../store/authStore";
import {
  ChevronLeft,
  Play,
  Send,
  Lightbulb,
  CheckCircle,
  XCircle,
  Brain,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string;
  test_cases: { input: string; expected_output: string }[];
  companies: string[];
  topics: string[];
  hints: string[];
}

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  stderr: string;
}

interface AIFeedback {
  timeComplexity: string;
  spaceComplexity: string;
  approach: string;
  strengths: string[];
  improvements: string[];
  optimalApproach: string;
  optimalComplexity: string;
  tips: string[];
}

const getDefaultCode = (language: string, problem: Problem | null): string => {
  const exampleInput = problem?.examples?.[0]?.input || "";
  const exampleOutput = problem?.examples?.[0]?.output || "";

  const comment = exampleInput
    ? `// Example input: ${exampleInput}\n// Example output: ${exampleOutput}\n\n`
    : "";

  const templates: Record<string, string> = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Example input: ${exampleInput}
    // Example output: ${exampleOutput}

    // Input format: arrays like [1,2,3] are sent as:
    //   Line 1: n (size)
    //   Line 2: space-separated elements

    // e.g for array input:
    // int n; cin >> n;
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++) cin >> arr[i];

    // Write your solution here

    // Print output
    // cout << answer << endl;

    return 0;
}`,
    python: `import sys
data = sys.stdin.read().split()
idx = 0

${comment}# Read your input here
# e.g: n = int(data[idx]); idx += 1
#      arr = list(map(int, data[idx:idx+n])); idx += n

def solve():
    # Write your solution here
    pass

print(solve())`,
    java: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

        ${comment.split("\n").join("\n        ")}// Read your input here
        // e.g: int n = Integer.parseInt(br.readLine().trim());
        //      int[] arr = Arrays.stream(br.readLine().split(" "))
        //                        .mapToInt(Integer::parseInt).toArray();

        // Write your solution here

        // Print output
        // System.out.println(answer);
    }
}`,
    javascript: `process.stdin.resume();
process.stdin.setEncoding('utf8');
let inputData = '';
process.stdin.on('data', d => inputData += d);
process.stdin.on('end', () => {
    const lines = inputData.trim().split('\\n');
    const tokens = lines[0].trim().split(/\\s+/);

    ${comment.split("\n").join("\n    ")}// Read your input here
    // e.g: const n = parseInt(tokens[0]);
    //      const arr = lines[1].split(' ').map(Number);

    // Write your solution here

    // Print output
    // console.log(answer);
});`,
  };
  return templates[language] || templates.cpp;
};

const languages = [
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
];

function HintItem({ hint, index }: { hint: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border-subtle)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 text-left"
      >
        <span className="flex items-center gap-2">
          <Lightbulb size={14} className="text-[var(--warning)]" /> Hint {index + 1}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-4 pb-3 text-sm text-[var(--text-primary)]">{hint}</div>}
    </div>
  );
}

export default function ProblemSolver() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [aiFeedback, setAIFeedback] = useState<AIFeedback | null>(null);
  const [leftTab, setLeftTab] = useState<
    "description" | "hints" | "submissions"
  >("description");
  const [bottomTab, setBottomTab] = useState<"testcase" | "result">("testcase");
  const [resultSubTab, setResultSubTab] = useState<"results" | "ai">("results");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(42);
  const dragging = useRef(false);
  useEffect(() => {
    if (problem) setCode(getDefaultCode(language, problem));
  }, [problem]);
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(
          `/problems/${slug}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('prepai-token')}` } }
        );
        setProblem(res.data.problem);
        setTimerActive(true);
      } catch {
        navigate("/problems");
      }
      setLoading(false);
    };
    fetchProblem();
  }, [slug]);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(getDefaultCode(lang, problem));
  };

  const handleRun = async () => {
    if (!problem) return;
    setRunning(true);
    setResults([]);
    setStatus(null);
    setAIFeedback(null);
    setBottomTab("result");

    try {
      const res = await api.post(
        `/problems/${problem.id}/run`,
        { code, language, testCases: problem.test_cases.slice(0, 2) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('prepai-token')}` } }
      );
      setResults(res.data.results || []);
      setStatus("run");
    } catch {
      setStatus("error");
    }
    setRunning(false);
  };

  const handleSubmit = async () => {
    if (!problem || !user) return;
    setSubmitting(true);
    setResults([]);
    setStatus(null);
    setAIFeedback(null);
    setTimerActive(false);
    setBottomTab("result");

    try {
      const res = await api.post(
        `/problems/${problem.id}/submit`,
        {
          code,
          language,
          userId: user.id,
          testCases: problem.test_cases,
          problemTitle: problem.title,
        },
      );
      setResults(res.data.results || []);
      setStatus(res.data.status);
      if (res.data.aiFeedback) setAIFeedback(res.data.aiFeedback);
    } catch {
      setStatus("error");
    }
    setSubmitting(false);
  };

  // Drag to resize panels
  const handleMouseDown = () => {
    dragging.current = true;
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      if (pct > 25 && pct < 70) setLeftWidth(pct);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const diffBg = (d: string) =>
    ({
      easy: "badge-easy",
      medium: "badge-medium",
      hard: "badge-hard",
    })[d] || "";

  if (loading)
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!problem) return null;

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="flex flex-col h-[calc(100vh-var(--nav-height))] bg-[var(--bg-base)] select-none">
      {/* Top navbar */}
      <div className="h-[var(--nav-height)] bg-[var(--bg-base)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/problems")}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150 p-1"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[var(--text-primary)] text-sm font-semibold">
            {problem.title}
          </span>
          <span className={`badge capitalize ${diffBg(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-xs font-mono mr-2">
            <Clock size={12} />
            <span>{formatTime(timeElapsed)}</span>
          </div>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs px-3 py-1.5 rounded-[var(--radius-md)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={running || submitting}
            className="flex items-center gap-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--border-default)] border border-[var(--border-default)] disabled:opacity-40 text-[var(--text-primary)] font-medium px-3 py-1.5 rounded-[var(--radius-md)] text-xs transition-all duration-150"
          >
            {running ? (
              <>
                <div className="w-3 h-3 border border-[var(--text-primary)] border-t-transparent rounded-full animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play size={12} className="text-[var(--success)]" />
                Run
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || running}
            className="flex items-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 text-white font-semibold px-3 py-1.5 rounded-[var(--radius-md)] text-xs transition-all duration-150"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Submitting
              </>
            ) : (
              <>
                <Send size={12} />
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Problem description */}
        <div
          style={{ width: `${leftWidth}%` }}
          className="flex flex-col border-r border-[var(--border-subtle)] overflow-hidden flex-shrink-0 bg-[var(--bg-base)]"
        >
          {/* Left tabs */}
          <div className="flex border-b border-[var(--border-subtle)] flex-shrink-0">
            {(["description", "hints", "submissions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors duration-150 border-b-2 ${leftTab === t ? "text-[var(--text-primary)] border-[var(--accent)]" : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === "description" && (
              <div className="p-5 space-y-5">
                {/* Difficulty + topics */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge capitalize ${diffBg(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                  {problem.topics?.map((t) => (
                    <span key={t} className="badge badge-topic">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="text-sm text-[var(--text-secondary)] leading-7 whitespace-pre-wrap">
                  {problem.description}
                </div>

                {/* Examples */}
                {problem.examples?.map((ex, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Example {i + 1}:
                    </p>
                    <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-4 font-mono text-sm space-y-1 border-l-2 border-[var(--border-strong)]">
                      <div>
                        <span className="text-[var(--text-primary)] font-semibold">Input: </span>
                        <span className="text-[var(--text-secondary)]">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-primary)] font-semibold">Output: </span>
                        <span className="text-[var(--text-secondary)]">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="pt-1">
                          <span className="text-[var(--text-primary)] font-semibold">
                            Explanation:{" "}
                          </span>
                          <span className="text-[var(--text-muted)]">
                            {ex.explanation}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Constraints */}
                {problem.constraints && (
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Constraints:
                    </p>
                    <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-md)] p-3">
                      {problem.constraints.split("\n").map((c, i) => (
                        <div
                          key={i}
                          className="text-xs text-[var(--text-secondary)] font-mono"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies — collapsible */}
                <div className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
                  <button
                    onClick={() => setCompaniesOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--warning)] hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {" "}
                      Companies
                    </span>
                    {companiesOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {companiesOpen && (
                    <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                      {problem.companies?.map((c) => (
                        <span key={c} className="badge badge-topic">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {leftTab === "hints" && (
              <div>
                {problem.hints?.length > 0 ? (
                  problem.hints.map((h, i) => (
                    <HintItem key={i} hint={h} index={i} />
                  ))
                ) : (
                  <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                    No hints available
                  </div>
                )}
              </div>
            )}

            {leftTab === "submissions" && (
              <div className="p-8 text-center text-[var(--text-muted)] text-sm">
                {status
                  ? "Submit your solution to see it here"
                  : "No submissions yet"}
              </div>
            )}
          </div>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-[var(--border-subtle)] hover:bg-[var(--accent)] cursor-col-resize transition-colors duration-150 flex-shrink-0"
        />

        {/* RIGHT — Editor + Test cases */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor + info bar — forced dark regardless of theme */}
          <div
            data-theme="dark"
            style={{ colorScheme: "dark" }}
            className="no-transition flex-1 flex flex-col overflow-hidden bg-[var(--bg-code)] min-h-0"
          >
            {/* Editor info bar */}
            <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--bg-code)] border-b border-[var(--border-subtle)] flex-shrink-0">
              <span className="text-xs text-[var(--text-muted)]">
                Read input from stdin · Print output to stdout
              </span>
              <button
                onClick={() => setCode(getDefaultCode(language, problem))}
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150"
              >
                <RotateCcw size={11} /> Reset
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={language === "cpp" ? "cpp" : language}
                value={code}
                onChange={(val) => setCode(val || "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  padding: { top: 10 },
                  fontFamily: "JetBrains Mono, Fira Code, Consolas, monospace",
                  tabSize: 4,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Bottom panel — Testcase / Result */}
          <div className="h-56 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex flex-col flex-shrink-0">
            {/* Bottom tabs */}
            <div className="flex items-center border-b border-[var(--border-subtle)] flex-shrink-0">
              <button
                onClick={() => setBottomTab("testcase")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors duration-150 ${bottomTab === "testcase" ? "text-[var(--text-primary)] border-[var(--accent)]" : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"}`}
              >
                <CheckCircle size={12} /> Testcase
              </button>
              <button
                onClick={() => setBottomTab("result")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors duration-150 ${bottomTab === "result" ? "text-[var(--text-primary)] border-[var(--accent)]" : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"}`}
              >
                <Play size={12} /> Test Result
              </button>

              {/* Status + AI tab */}
              {status && status !== "run" && (
                <div className="ml-auto flex items-center gap-3 pr-4">
                  {aiFeedback && (
                    <div className="flex bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-0.5">
                      <button
                        onClick={() => setResultSubTab("results")}
                        className={`px-3 py-1 text-xs rounded-[var(--radius-sm)] transition-colors duration-150 ${resultSubTab === "results" ? "bg-[var(--accent)] text-white font-medium" : "text-[var(--text-muted)]"}`}
                      >
                        Results
                      </button>
                      <button
                        onClick={() => setResultSubTab("ai")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded-[var(--radius-sm)] transition-colors duration-150 ${resultSubTab === "ai" ? "bg-[var(--accent)] text-white font-medium" : "text-[var(--text-muted)]"}`}
                      >
                        <Brain size={11} /> AI Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {bottomTab === "testcase" && (
                <div className="space-y-3">
                  {problem?.test_cases?.slice(0, 2).map((tc, i) => (
                    <div key={i} className="bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-3 border border-[var(--border-subtle)]">
                      <p className="text-xs text-[var(--text-muted)] mb-2">
                        Case {i + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[var(--text-muted)] mb-1">Input</p>
                          <code className="text-xs text-[var(--text-primary)] font-mono bg-black/40 px-2 py-1 rounded block whitespace-pre">
                            {tc.input}
                          </code>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-muted)] mb-1">
                            Expected Output
                          </p>
                          <code className="text-xs text-[var(--success)] font-mono bg-black/40 px-2 py-1 rounded block">
                            {tc.expected_output}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {bottomTab === "result" && (
                <>
                  {!status && !running && (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                      You must run your code first
                    </div>
                  )}

                  {(running || submitting) && (
                    <div className="flex items-center justify-center h-full gap-3">
                      <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[var(--text-muted)] text-sm">
                        {running
                          ? "Running test cases..."
                          : "Submitting solution..."}
                      </span>
                    </div>
                  )}

                  {status && resultSubTab === "results" && (
                    <div className="space-y-3">
                      {/* Overall status */}
                      <div className="flex items-center gap-3">
                        {status === "run" ? (
                          <span className="text-[var(--info)] font-semibold">
                            Run Complete
                          </span>
                        ) : status === "accepted" ? (
                          <span className="text-[var(--success)] font-semibold text-lg">
                            ✓ Accepted
                          </span>
                        ) : status === "wrong_answer" ? (
                          <span className="text-[var(--danger)] font-semibold text-lg">
                            ✗ Wrong Answer
                          </span>
                        ) : (
                          <span className="text-[var(--warning)] font-semibold">
                            Runtime Error
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)]">
                          {passedCount}/{results.length} testcases passed
                        </span>
                      </div>

                      {/* Per test case */}
                      {results.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-[var(--radius-md)] p-3 border ${r.passed ? "border-[var(--success-border)] bg-[var(--success-dim)]" : "border-[var(--danger-border)] bg-[var(--danger-dim)]"}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {r.passed ? (
                              <CheckCircle
                                size={13}
                                className="text-[var(--success)]"
                              />
                            ) : (
                              <XCircle size={13} className="text-[var(--danger)]" />
                            )}
                            <span
                              className={`text-xs font-medium ${r.passed ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                            >
                              Case {i + 1} — {r.passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                            <div>
                              <p className="text-[var(--text-muted)] mb-0.5">Input</p>
                              <code className="text-[var(--text-primary)] bg-black/30 px-2 py-1 rounded block whitespace-pre">
                                {r.input}
                              </code>
                            </div>
                            <div>
                              <p className="text-[var(--text-muted)] mb-0.5">Expected</p>
                              <code className="text-[var(--success)] bg-black/30 px-2 py-1 rounded block">
                                {r.expected}
                              </code>
                            </div>
                            <div>
                              <p className="text-[var(--text-muted)] mb-0.5">Output</p>
                              <code
                                className={`bg-black/30 px-2 py-1 rounded block ${r.passed ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
                              >
                                {r.actual || r.stderr || "No output"}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {status && aiFeedback && resultSubTab === "ai" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-3">
                          <p className="text-xs text-[var(--text-muted)] mb-1">
                            Time Complexity
                          </p>
                          <p className="text-sm font-semibold text-[var(--accent)] font-mono">
                            {aiFeedback.timeComplexity}
                          </p>
                        </div>
                        <div className="bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-3">
                          <p className="text-xs text-[var(--text-muted)] mb-1">
                            Space Complexity
                          </p>
                          <p className="text-sm font-semibold text-[var(--teal)] font-mono">
                            {aiFeedback.spaceComplexity}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-3">
                        <p className="text-xs text-[var(--text-muted)] mb-1">
                          Your Approach
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {aiFeedback.approach}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-3">
                          <p className="text-xs text-[var(--success)] font-medium mb-2">
                            ✓ Strengths
                          </p>
                          {aiFeedback.strengths?.map((s, i) => (
                            <p key={i} className="text-xs text-[var(--text-secondary)] mb-1">
                              • {s}
                            </p>
                          ))}
                        </div>
                        <div className="bg-[var(--bg-overlay)] rounded-[var(--radius-md)] p-3">
                          <p className="text-xs text-[var(--warning)] font-medium mb-2">
                            ↑ Improvements
                          </p>
                          {aiFeedback.improvements?.map((s, i) => (
                            <p key={i} className="text-xs text-[var(--text-secondary)] mb-1">
                              • {s}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[var(--accent-dim)] border border-[var(--accent-border)] rounded-[var(--radius-md)] p-3">
                        <p className="text-xs text-[var(--accent)] font-medium mb-1">
                          Optimal Approach ({aiFeedback.optimalComplexity})
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {aiFeedback.optimalApproach}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
