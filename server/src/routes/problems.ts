import { Router } from "express";
import { generateText } from "../services/gemini";
import { executeCode } from "../services/executor";
import { Problem } from "../models/Problem";
import { Submission } from "../models/Submission";
import { User } from "../models/User";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

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
    
    let filter: any = {};
    if (difficulty) filter.difficulty = difficulty;
    if (company) filter.category = new RegExp(company as string, 'i'); // Or create a separate companies field
    if (topic) filter.category = new RegExp(topic as string, 'i'); 
    if (search) filter.title = new RegExp(search as string, 'i');

    filter.status = { $ne: 'pending' };
    const problems = await Problem.find(filter).select("id title slug difficulty category createdAt").sort({ createdAt: 1 });
    res.json({ problems });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily problem" });
  }
});

// Get daily problem (mock logic for now, gets first problem or random)
router.get("/daily", async (req, res) => {
  try {
    const problem = await Problem.findOne().select("id title slug difficulty category");
    res.json({ problem });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily problem" });
  }
});

// Get single problem by slug
router.get("/:slug", async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json({ problem });
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
      const result = await executeCode(code, language, normalizedInput);
      
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
router.post("/:id/submit", authenticate, async (req: AuthRequest, res) => {
  try {
    const { code, language, testCases, problemTitle } = req.body;
    const userId = req.user?.id;
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

    const status = allPassed ? "Accepted" : "Wrong Answer";

    // Save submission
    const submission = new Submission({
      user_id: userId,
      problem_id: req.params.id,
      code,
      language,
      status,
    });
    await submission.save();

    // Update streak if accepted
    if (allPassed && userId) {
      const today = new Date().toISOString().split("T")[0];
      const user = await User.findById(userId);

      if (user) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        let newStreak = user.streak || 0;

        if (user.last_solved === today) {
          // already solved today
        } else if (user.last_solved === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        user.streak = newStreak;
        user.last_solved = today;
        user.best_streak = Math.max(newStreak, user.best_streak || 0);
        await user.save();
      }
    }

    // AI feedback if accepted
    let aiFeedback = null;
    if (allPassed) {
      const aiPrompt = `Analyze this ${language} solution for "${problemTitle}":\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn ONLY valid JSON:\n{\n  "timeComplexity": "O(?)",\n  "spaceComplexity": "O(?)",\n  "approach": "brief description",\n  "strengths": ["strength 1", "strength 2"],\n  "improvements": ["improvement 1", "improvement 2"],\n  "optimalApproach": "optimal solution description",\n  "optimalComplexity": "O(?)",\n  "tips": ["tip 1", "tip 2"]\n}`;

      try {
        const aiText = await generateText(aiPrompt);
        const cleaned = aiText.replace(/```json|```/g, "").trim();
        aiFeedback = JSON.parse(cleaned);
      } catch {
        aiFeedback = null;
      }
    }

    res.json({ status: status.toLowerCase().replace(' ', '_'), results, aiFeedback });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: 'Server error analyzing code' });
  }
});

// Contribute a problem
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, slug, difficulty, description, constraints, examples, test_cases, hints, topics, companies } = req.body;
    const newProblem = new Problem({
      title,
      slug,
      difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      category: topics && topics.length > 0 ? topics[0] : 'General',
      description,
      constraints,
      examples,
      test_cases,
      hints,
      topics,
      companies,
      status: 'pending',
      contributed_by: req.user?.id
    });
    await newProblem.save();
    res.status(201).json({ problem: newProblem });
  } catch (error) {
    console.error('Contribute error:', error);
    res.status(500).json({ error: 'Server error saving problem contribution' });
  }
});

export default router;
