import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);
const companies = [
  "Google",
  "Meta",
  "Amazon",
  "Microsoft",
  "Apple",
  "Netflix",
  "Adobe",
  "Uber",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Atlassian",
  "Salesforce",
  "Oracle",
  "Goldman Sachs",
];

const topicBatches = [
  { topic: "Array", difficulty: "easy", count: 8 },
  { topic: "Array", difficulty: "medium", count: 10 },
  { topic: "String", difficulty: "easy", count: 6 },
  { topic: "String", difficulty: "medium", count: 8 },
  { topic: "LinkedList", difficulty: "medium", count: 8 },
  { topic: "LinkedList", difficulty: "hard", count: 4 },
  { topic: "Tree", difficulty: "medium", count: 10 },
  { topic: "Tree", difficulty: "hard", count: 6 },
  { topic: "Graph", difficulty: "medium", count: 8 },
  { topic: "Graph", difficulty: "hard", count: 6 },
  { topic: "Dynamic Programming", difficulty: "medium", count: 10 },
  { topic: "Dynamic Programming", difficulty: "hard", count: 8 },
  { topic: "Binary Search", difficulty: "easy", count: 6 },
  { topic: "Binary Search", difficulty: "medium", count: 6 },
  { topic: "Stack", difficulty: "easy", count: 4 },
  { topic: "Stack", difficulty: "medium", count: 6 },
  { topic: "Heap", difficulty: "medium", count: 6 },
  { topic: "Heap", difficulty: "hard", count: 4 },
  { topic: "Greedy", difficulty: "medium", count: 8 },
  { topic: "Greedy", difficulty: "hard", count: 4 },
  { topic: "Backtracking", difficulty: "medium", count: 6 },
  { topic: "Backtracking", difficulty: "hard", count: 4 },
  { topic: "Two Pointers", difficulty: "easy", count: 6 },
  { topic: "Two Pointers", difficulty: "medium", count: 6 },
  { topic: "Sliding Window", difficulty: "medium", count: 8 },
  { topic: "Trie", difficulty: "medium", count: 4 },
  { topic: "Trie", difficulty: "hard", count: 4 },
  { topic: "Bit Manipulation", difficulty: "easy", count: 4 },
  { topic: "Bit Manipulation", difficulty: "medium", count: 6 },
  { topic: "Math", difficulty: "easy", count: 6 },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getRandomCompanies(): string[] {
  const shuffled = [...companies].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.floor(Math.random() * 4) + 2);
}

async function generateProblems(
  topic: string,
  difficulty: string,
  count: number,
): Promise<any[]> {
  const prompt = `Generate ${count} unique coding interview problems about ${topic} with ${difficulty} difficulty.

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "title": "unique problem title",
    "description": "clear problem description with context, 2-3 paragraphs",
    "examples": [
      { "input": "example input", "output": "example output", "explanation": "why this output" },
      { "input": "example input 2", "output": "example output 2", "explanation": "why this output" }
    ],
    "constraints": "1 <= n <= 10^5, etc",
    "test_cases": [
      { "input": "exact test input", "expected_output": "exact expected output" },
      { "input": "exact test input 2", "expected_output": "exact expected output 2" },
      { "input": "edge case input", "expected_output": "edge case output" }
    ],
    "hints": ["hint 1", "hint 2"],
    "topics": ["${topic}", "additional related topic"]
  }
]

Important rules:
- All problems must be UNIQUE and DIFFERENT from each other
- Test cases must have exact, unambiguous inputs and outputs
- Problems should be realistic coding interview questions
- Difficulty should match: easy=straightforward, medium=requires insight, hard=complex algorithm
- descriptions should be detailed and clear`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const text = completion.choices[0].message.content || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const startIdx = cleaned.indexOf("[");
    const endIdx = cleaned.lastIndexOf("]");
    if (startIdx === -1 || endIdx === -1)
      throw new Error("No JSON array found");
    const jsonStr = cleaned.substring(startIdx, endIdx + 1);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`Failed to parse problems for ${topic} ${difficulty}:`, err);
    return [];
  }
}

async function seed() {
  console.log("🌱 Starting problem seed...");
  let totalSeeded = 0;
  const usedSlugs = new Set<string>();

  for (const batch of topicBatches) {
    console.log(
      `\n📦 Generating ${batch.count} ${batch.difficulty} ${batch.topic} problems...`,
    );

    try {
      const problems = await generateProblems(
        batch.topic,
        batch.difficulty,
        batch.count,
      );

      for (const p of problems) {
        if (!p.title || !p.description) continue;

        let slug = slugify(p.title);
        // Make slug unique if duplicate
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        }
        usedSlugs.add(slug);

        const { error } = await supabase.from("problems_bank").insert({
          title: p.title,
          slug,
          difficulty: batch.difficulty,
          description: p.description,
          examples: p.examples || [],
          constraints: p.constraints || "",
          test_cases: p.test_cases || [],
          companies: getRandomCompanies(),
          topics: p.topics || [batch.topic],
          hints: p.hints || [],
        });

        if (error) {
          console.error(`❌ Failed to insert "${p.title}":`, error.message);
        } else {
          totalSeeded++;
          console.log(`✅ [${totalSeeded}] ${p.title}`);
        }
      }

      // Rate limit delay between batches
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(
        `❌ Batch failed for ${batch.topic} ${batch.difficulty}:`,
        err,
      );
    }
  }

  console.log(`\n🎉 Done! Seeded ${totalSeeded} problems.`);
  process.exit(0);
}

seed();
