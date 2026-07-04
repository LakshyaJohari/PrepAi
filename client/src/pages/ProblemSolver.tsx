import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
    <div className="border-b border-[#1a1a1a]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#888888] hover:text-white transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" /> Hint {index + 1}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-4 pb-3 text-sm text-[#cccccc]">{hint}</div>}
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
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/problems/${slug}`,
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
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/problems/${problem.id}/run`,
        { code, language, testCases: problem.test_cases.slice(0, 2) },
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
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/problems/${problem.id}/submit`,
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

  const diffColor = (d: string) =>
    ({
      easy: "text-green-400",
      medium: "text-amber-400",
      hard: "text-red-400",
    })[d] || "";

  const diffBg = (d: string) =>
    ({
      easy: "bg-green-400/10 text-green-400",
      medium: "bg-amber-400/10 text-amber-400",
      hard: "bg-red-400/10 text-red-400",
    })[d] || "";

  if (loading)
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!problem) return null;

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-black select-none">
      {/* Top navbar */}
      <div className="h-11 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/problems")}
            className="text-[#555555] hover:text-white transition-colors p-1"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-white text-sm font-semibold">
            {problem.title}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${diffBg(problem.difficulty)} capitalize`}
          >
            {problem.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[#555555] text-xs mr-2">
            <Clock size={12} />
            <span>{formatTime(timeElapsed)}</span>
          </div>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#444444] cursor-pointer"
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
            className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222222] border border-[#2a2a2a] disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            {running ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play size={12} className="text-green-400" />
                Run
              </>
            )}
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting || running}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-100 disabled:opacity-40 text-black font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
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
          className="flex flex-col border-r border-[#1a1a1a] overflow-hidden flex-shrink-0"
        >
          {/* Left tabs */}
          <div className="flex border-b border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0">
            {(["description", "hints", "submissions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setLeftTab(t)}
                className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 ${leftTab === t ? "text-white border-white" : "text-[#555555] border-transparent hover:text-[#888888]"}`}
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
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${diffBg(problem.difficulty)} capitalize`}
                  >
                    {problem.difficulty}
                  </span>
                  {problem.topics?.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-[#1a1a1a] text-[#666666] px-2.5 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <div className="text-sm text-[#cccccc] leading-7 whitespace-pre-wrap">
                  {problem.description}
                </div>

                {/* Examples */}
                {problem.examples?.map((ex, i) => (
                  <div key={i}>
                    <p className="text-sm font-bold text-white mb-2">
                      Example {i + 1}:
                    </p>
                    <div className="bg-[#111111] rounded-lg p-4 font-mono text-sm space-y-1 border-l-2 border-[#2a2a2a]">
                      <div>
                        <span className="text-white font-bold">Input: </span>
                        <span className="text-[#cccccc]">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-white font-bold">Output: </span>
                        <span className="text-[#cccccc]">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="pt-1">
                          <span className="text-white font-bold">
                            Explanation:{" "}
                          </span>
                          <span className="text-[#888888]">
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
                    <p className="text-sm font-bold text-white mb-2">
                      Constraints:
                    </p>
                    <div className="bg-[#111111] rounded-lg p-4">
                      {problem.constraints.split("\n").map((c, i) => (
                        <div
                          key={i}
                          className="text-sm text-[#cccccc] font-mono"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Companies — collapsible */}
                <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setCompaniesOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm text-amber-400 hover:bg-[#111111] transition-colors"
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
                        <span
                          key={c}
                          className="text-xs bg-[#1a1a1a] text-[#666666] px-2.5 py-1 rounded-full"
                        >
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
                  <div className="p-8 text-center text-[#444444] text-sm">
                    No hints available
                  </div>
                )}
              </div>
            )}

            {leftTab === "submissions" && (
              <div className="p-8 text-center text-[#444444] text-sm">
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
          className="w-1 bg-[#1a1a1a] hover:bg-indigo-500/50 cursor-col-resize transition-colors flex-shrink-0"
        />

        {/* RIGHT — Editor + Test cases */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor info bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#0a0a0a] border-b border-[#1a1a1a] flex-shrink-0">
            <span className="text-xs text-[#444444]">
              Read input from stdin · Print output to stdout
            </span>
            <button
              onClick={() => setCode(getDefaultCode(language, problem))}
              className="flex items-center gap-1 text-xs text-[#555555] hover:text-white transition-colors"
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

          {/* Bottom panel — Testcase / Result */}
          <div className="h-56 border-t border-[#1a1a1a] bg-[#0a0a0a] flex flex-col flex-shrink-0">
            {/* Bottom tabs */}
            <div className="flex items-center border-b border-[#1a1a1a] flex-shrink-0">
              <button
                onClick={() => setBottomTab("testcase")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${bottomTab === "testcase" ? "text-white border-white" : "text-[#555555] border-transparent hover:text-[#888888]"}`}
              >
                <CheckCircle size={12} /> Testcase
              </button>
              <button
                onClick={() => setBottomTab("result")}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${bottomTab === "result" ? "text-white border-white" : "text-[#555555] border-transparent hover:text-[#888888]"}`}
              >
                <Play size={12} /> Test Result
              </button>

              {/* Status + AI tab */}
              {status && status !== "run" && (
                <div className="ml-auto flex items-center gap-3 pr-4">
                  {aiFeedback && (
                    <div className="flex bg-[#111111] rounded-lg p-0.5">
                      <button
                        onClick={() => setResultSubTab("results")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${resultSubTab === "results" ? "bg-white text-black font-medium" : "text-[#555555]"}`}
                      >
                        Results
                      </button>
                      <button
                        onClick={() => setResultSubTab("ai")}
                        className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${resultSubTab === "ai" ? "bg-white text-black font-medium" : "text-[#555555]"}`}
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
                    <div key={i} className="bg-[#111111] rounded-lg p-3">
                      <p className="text-xs text-[#555555] mb-2">
                        Case {i + 1}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#444444] mb-1">Input</p>
                          <code className="text-xs text-white font-mono bg-black/40 px-2 py-1 rounded block whitespace-pre">
                            {tc.input}
                          </code>
                        </div>
                        <div>
                          <p className="text-xs text-[#444444] mb-1">
                            Expected Output
                          </p>
                          <code className="text-xs text-green-400 font-mono bg-black/40 px-2 py-1 rounded block">
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
                    <div className="flex items-center justify-center h-full text-[#444444] text-sm">
                      You must run your code first
                    </div>
                  )}

                  {(running || submitting) && (
                    <div className="flex items-center justify-center h-full gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-[#555555] text-sm">
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
                          <span className="text-blue-400 font-bold">
                            Run Complete
                          </span>
                        ) : status === "accepted" ? (
                          <span className="text-green-400 font-bold text-lg">
                            ✓ Accepted
                          </span>
                        ) : status === "wrong_answer" ? (
                          <span className="text-red-400 font-bold text-lg">
                            ✗ Wrong Answer
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold">
                            Runtime Error
                          </span>
                        )}
                        <span className="text-xs text-[#444444]">
                          {passedCount}/{results.length} testcases passed
                        </span>
                      </div>

                      {/* Per test case */}
                      {results.map((r, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 border ${r.passed ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {r.passed ? (
                              <CheckCircle
                                size={13}
                                className="text-green-400"
                              />
                            ) : (
                              <XCircle size={13} className="text-red-400" />
                            )}
                            <span
                              className={`text-xs font-medium ${r.passed ? "text-green-400" : "text-red-400"}`}
                            >
                              Case {i + 1} — {r.passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                            <div>
                              <p className="text-[#444444] mb-0.5">Input</p>
                              <code className="text-white bg-black/30 px-2 py-1 rounded block whitespace-pre">
                                {r.input}
                              </code>
                            </div>
                            <div>
                              <p className="text-[#444444] mb-0.5">Expected</p>
                              <code className="text-green-400 bg-black/30 px-2 py-1 rounded block">
                                {r.expected}
                              </code>
                            </div>
                            <div>
                              <p className="text-[#444444] mb-0.5">Output</p>
                              <code
                                className={`bg-black/30 px-2 py-1 rounded block ${r.passed ? "text-green-400" : "text-red-400"}`}
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
                        <div className="bg-[#111111] rounded-lg p-3">
                          <p className="text-xs text-[#444444] mb-1">
                            Time Complexity
                          </p>
                          <p className="text-sm font-bold text-indigo-400 font-mono">
                            {aiFeedback.timeComplexity}
                          </p>
                        </div>
                        <div className="bg-[#111111] rounded-lg p-3">
                          <p className="text-xs text-[#444444] mb-1">
                            Space Complexity
                          </p>
                          <p className="text-sm font-bold text-teal-400 font-mono">
                            {aiFeedback.spaceComplexity}
                          </p>
                        </div>
                      </div>
                      <div className="bg-[#111111] rounded-lg p-3">
                        <p className="text-xs text-[#444444] mb-1">
                          Your Approach
                        </p>
                        <p className="text-xs text-[#cccccc]">
                          {aiFeedback.approach}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#111111] rounded-lg p-3">
                          <p className="text-xs text-green-400 font-medium mb-2">
                            ✓ Strengths
                          </p>
                          {aiFeedback.strengths?.map((s, i) => (
                            <p key={i} className="text-xs text-[#888888] mb-1">
                              • {s}
                            </p>
                          ))}
                        </div>
                        <div className="bg-[#111111] rounded-lg p-3">
                          <p className="text-xs text-amber-400 font-medium mb-2">
                            ↑ Improvements
                          </p>
                          {aiFeedback.improvements?.map((s, i) => (
                            <p key={i} className="text-xs text-[#888888] mb-1">
                              • {s}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                        <p className="text-xs text-indigo-400 font-medium mb-1">
                          Optimal Approach ({aiFeedback.optimalComplexity})
                        </p>
                        <p className="text-xs text-[#cccccc]">
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
