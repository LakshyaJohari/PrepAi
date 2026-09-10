import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 20_000, // fail fast instead of hanging on the SDK's 1-minute default
  maxRetries: 1,
})

const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'

// Generic text generation
export async function generateText(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1024,
  })
  return completion.choices[0].message.content || ''
}

// Parse JSON safely
export function parseJSON<T>(text: string): T {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1) {
    const jsonSubstring = text.substring(firstBrace, lastBrace + 1)
    return JSON.parse(jsonSubstring)
  }
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

// Interview conductor
export async function conductInterview(
  company: string,
  role: string,
  roundType: string,
  difficulty: string,
  history: { role: string; content: string }[],
  resumeContext: string = ''
): Promise<string> {
  const systemPrompt = `You are a senior interviewer at ${company} conducting a ${roundType} interview for a ${role} position (difficulty: ${difficulty}).

Rules:
1. Ask one question at a time. Never ask two questions together.
2. If the answer is vague or too brief, ask ONE specific follow-up to probe deeper.
3. After a satisfactory answer, transition naturally to the next question.
4. Stay in character as a ${company} interviewer throughout.
5. Never give hints or confirm if an answer is correct.
6. After 6 questions total, end with exactly: "That concludes our interview today. Thank you for your time."
7. Do not break character or explain your reasoning.

${resumeContext ? `Candidate resume context:\n${resumeContext}` : ''}`

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }))
  ]

  // If no history, ask first question
  if (history.length === 0) {
    messages.push({ role: 'user', content: 'Please begin the interview.' })
  }

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 512,
  })

  return completion.choices[0].message.content || ''
}

// Score answer
export async function scoreAnswer(
  question: string,
  answer: string,
  role: string,
  company: string,
  roundType: string
): Promise<object> {
  const prompt = `You are an expert interview coach. Score this interview answer across multiple parameters.

Question: ${question}
Candidate Answer: ${answer}
Context: ${role} role at ${company}, ${roundType} round

Return ONLY valid JSON, no markdown, no explanation:
{
  "overallScore": <0-100>,
  "star": {
    "situation": <0-10>,
    "task": <0-10>,
    "action": <0-10>,
    "result": <0-10>
  },
  "parameters": {
    "clarity": <0-10>,
    "technicalDepth": <0-10>,
    "relevance": <0-10>,
    "confidence": <0-10>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>"],
  "idealAnswer": "<2-3 sentence example of a strong answer>",
  "verdict": "strong"
}`

  const text = await generateText(prompt)
  return parseJSON(text)
}

// Resume gap analysis
export async function analyzeResume(
  resumeText: string,
  targetRole: string,
  targetCompany: string = ''
): Promise<object> {
  const prompt = `You are a career coach and technical recruiter. Analyze this resume for the target role.

Resume:
${resumeText}

Target Role: ${targetRole}
${targetCompany ? `Target Company: ${targetCompany}` : ''}

Return ONLY valid JSON, no markdown:
{
  "matchScore": <0-100>,
  "currentStrengths": ["<strength>"],
  "missingSkills": ["<skill to add>"],
  "projectsToAdd": ["<project idea relevant to role>"],
  "irrelevantItems": ["<item to remove or de-emphasize>"],
  "resumeImprovements": ["<specific resume tip>"],
  "studyRoadmap": [
    { "topic": "<topic>", "priority": "high", "resources": "<suggested resource>" }
  ],
  "summary": "<2-3 sentence overall assessment>"
}`

  const text = await generateText(prompt)
  return parseJSON(text)
}

// Generate questions from resume
export async function generateResumeQuestions(
  resumeText: string,
  role: string,
  company: string
): Promise<object> {
  const prompt = `You are a technical interviewer. Generate 10 targeted interview questions based on this resume.

Resume: ${resumeText}
Role: ${role}
Company: ${company}

Return ONLY valid JSON, no markdown:
{
  "questions": [
    {
      "question": "<question>",
      "type": "behavioral",
      "difficulty": "medium",
      "basedOn": "<what in the resume triggered this question>"
    }
  ]
}`

  const text = await generateText(prompt)
  return parseJSON(text)
}