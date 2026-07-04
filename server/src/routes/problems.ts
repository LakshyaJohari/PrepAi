import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "../services/gemini";
import { executeCode } from "../services/executor";

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

function normalizeInput(input: any): string {
  if (!input) return "";
  return String(input).trim();
}

function normalizeOutput(output: any): string {
  if (!output) return "";
  return String(output).trim();
}

function fuzzyMatch(actual: string, expected: string): boolean {
  if (!actual || !expected) return false;

  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[\[\]]/g, "") // remove brackets
      .replace(/,/g, " ") // commas to spaces
      .replace(/\s+/g, " ") // multiple spaces to one
      .trim();

  if (norm(actual) === norm(expected)) return true;

  // Try comparing as sets of tokens
  const aTokens = norm(actual).split(" ").sort();
  const eTokens = norm(expected).split(" ").sort();
  if (JSON.stringify(aTokens) === JSON.stringify(eTokens)) return true;

  // Try numeric comparison
  const aNum = parseFloat(actual.trim());
  const eNum = parseFloat(expected.trim());
  if (!isNaN(aNum) && !isNaN(eNum) && Math.abs(aNum - eNum) < 0.001)
    return true;

  return false;
}
// Get all problems with filters
router.get("/", async (req, res) => {
  try {
    const { company, topic, difficulty, search } = req.query;
    let query = supabase
      .from("problems_bank")
      .select("id, title, slug, difficulty, companies, topics, created_at")
      .eq("status", "approved");

    if (difficulty) query = query.eq("difficulty", difficulty);
    if (company) query = query.contains("companies", [company]);
    if (topic) query = query.contains("topics", [topic]);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query.order("created_at", {
      ascending: true,
    });
    if (error) throw error;
    res.json({ problems: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

// Get daily problem
router.get("/daily", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("daily_problem")
      .select("id, title, slug, difficulty, topics, companies")
      .single();
    if (error) throw error;
    res.json({ problem: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily problem" });
  }
});

// Get single problem by slug
router.get("/:slug", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("problems_bank")
      .select("*")
      .eq("slug", req.params.slug)
      .single();
    if (error) throw error;
    res.json({ problem: data });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch problem" });
  }
});

// Run code against visible test cases only
router.post("/:id/run", async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    const results = [];

    for (const tc of testCases.slice(0, 2)) {
      const normalizedInput = String(tc.input || "").trim();
      console.log("Input:", normalizedInput);

      const result = await executeCode(code, language, normalizedInput);
      console.log("Output:", result.stdout);
      console.log("Error:", result.stderr || result.error);

      const actualOutput = result.stdout?.trim() || "";
      const expectedOutput = normalizeOutput(tc.expected_output?.trim() || "");
      const passed = fuzzyMatch(
        actualOutput,
        normalizeOutput(tc.expected_output),
      );
      results.push({
        input: tc.input,
        expected: expectedOutput,
        actual: actualOutput || result.stderr || result.error,
        passed,
        stderr: result.stderr || result.error,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error("Run error:", err);
    res.status(500).json({ error: "Failed to run code" });
  }
});

// Submit solution
router.post("/:id/submit", async (req, res) => {
  try {
    const { code, language, userId, testCases, problemTitle } = req.body;
    const results = [];
    let allPassed = true;

    for (const tc of testCases) {
      const normalizedInput = String(tc.input || "").trim();
      const result = await executeCode(code, language, normalizedInput);

      const actualOutput = result.stdout?.trim() || "";
      const expectedOutput = normalizeOutput(tc.expected_output?.trim() || "");
      const passed = fuzzyMatch(
        actualOutput,
        normalizeOutput(tc.expected_output),
      );

      if (!passed) allPassed = false;

      results.push({
        input: tc.input,
        expected: expectedOutput,
        actual: actualOutput || result.stderr || result.error,
        passed,
        stderr: result.stderr || result.error,
      });
    }

    const status = allPassed ? "accepted" : "wrong_answer";

    // Save submission
    await supabase.from("submissions").insert({
      user_id: userId,
      problem_id: req.params.id,
      problem_title: problemTitle,
      code,
      language,
      status,
    });

    // Update streak if accepted
    if (allPassed && userId) {
      const today = new Date().toISOString().split("T")[0];
      const { data: profile } = await supabase
        .from("profiles")
        .select("streak, last_solved, best_streak")
        .eq("id", userId)
        .single();

      if (profile) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        let newStreak = profile.streak || 0;

        if (profile.last_solved === today) {
          // already solved today
        } else if (profile.last_solved === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        await supabase
          .from("profiles")
          .update({
            streak: newStreak,
            last_solved: today,
            best_streak: Math.max(newStreak, profile.best_streak || 0),
          })
          .eq("id", userId);
      }
    }

    // AI feedback if accepted
    let aiFeedback = null;
    if (allPassed) {
      const aiPrompt = `Analyze this ${language} solution for "${problemTitle}":

\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON:
{
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "approach": "brief description",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "optimalApproach": "optimal solution description",
  "optimalComplexity": "O(?)",
  "tips": ["tip 1", "tip 2"]
}`;

      try {
        const aiText = await generateText(aiPrompt);
        const cleaned = aiText.replace(/```json|```/g, "").trim();
        aiFeedback = JSON.parse(cleaned);
      } catch {
        aiFeedback = null;
      }
    }

    res.json({ status, results, aiFeedback });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Failed to submit" });
  }
});

export default router;
