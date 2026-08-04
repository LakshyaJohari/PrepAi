import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { Problem } from '../models/Problem';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prepai';

const topics = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 
  'Dynamic Programming', 'Two Pointers', 'Sliding Window', 
  'Binary Search', 'Stack', 'Queue', 'Backtracking', 
  'Greedy', 'Bit Manipulation', 'Math'
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    let totalInserted = 0;

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      console.log(`[${i + 1}/${topics.length}] Generating problems for ${topic}...`);
      
      const prompt = `
You are an expert Data Structures and Algorithms instructor. 
Generate exactly 10 high-quality coding problems for the topic: "${topic}".
The difficulty distribution MUST BE exactly: 3 Easy, 4 Medium, 3 Hard.

Output a JSON object with a single key "problems" containing an array of objects.
Each object must follow this exact schema:
{
  "id": "unique-slug-string",
  "title": "Problem Title",
  "slug": "unique-slug-string",
  "difficulty": "Easy" | "Medium" | "Hard",
  "description": "Detailed markdown string explaining the problem, like LeetCode.",
  "examples": [
    {
      "input": "string representation of input",
      "output": "string representation of output",
      "explanation": "Brief explanation"
    }
  ],
  "constraints": "Markdown string of constraints, e.g. - 1 <= nums.length <= 10^5",
  "test_cases": [
    {
      "input": "string representation of input",
      "expected_output": "string representation of expected output"
    }
  ],
  "companies": ["Google", "Meta"],
  "topics": ["${topic}"]
}
Ensure exactly 10 items in the array. Output ONLY valid JSON.
`;
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile', 
          temperature: 0.2,
          response_format: { type: "json_object" } 
        });

        const content = chatCompletion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        const problems = parsed.problems || [];

        if (!Array.isArray(problems) || problems.length === 0) {
          console.warn(`No problems returned for ${topic}`);
          continue;
        }

        console.log(`Generated ${problems.length} problems for ${topic}. Inserting...`);
        
        for (const p of problems) {
          p.category = "Algorithms";
          delete p.id;
          await Problem.findOneAndUpdate(
            { slug: p.slug },
            { $set: p },
            { upsert: true, new: true }
          );
          totalInserted++;
        }
      } catch (e) {
        console.error(`Error on topic ${topic}:`, e);
      }
      
      // Wait a few seconds to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`Seeding complete! Upserted ${totalInserted} total problems.`);
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
