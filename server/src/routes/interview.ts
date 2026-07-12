import { Router } from 'express'
import { conductInterview, scoreAnswer } from '../services/gemini'

const router = Router()

// In-memory session history store
const sessionHistories = new Map<string, { role: string; content: string }[]>()

// Start a new interview session
router.post('/start', async (req, res) => {
  try {
    const { sessionId, company, role, roundType, difficulty, resumeContext } = req.body

    // Initialize empty history for this session
    sessionHistories.set(sessionId, [])

    // Get first question from Gemini
    const firstQuestion = await conductInterview(
      company, role, roundType, difficulty, [], resumeContext
    )

    // Store AI response in history
    sessionHistories.get(sessionId)!.push({ role: 'assistant', content: firstQuestion })

    res.json({ question: firstQuestion })
  } catch (err) {
  console.error('Interview start error:', err)
  res.status(500).json({ error: 'Failed to start interview', details: String(err) })
}
})

// Submit an answer and get next question
router.post('/answer', async (req, res) => {
  try {
    const { sessionId, answer, company, role, roundType, difficulty, resumeContext } = req.body

    const history = sessionHistories.get(sessionId) || []

    // Add user answer to history
    history.push({ role: 'user', content: answer })

    // Get next question/response from Gemini
    const nextQuestion = await conductInterview(
      company, role, roundType, difficulty, history, resumeContext
    )

    // Add AI response to history
    history.push({ role: 'assistant', content: nextQuestion })
    sessionHistories.set(sessionId, history)

    res.json({ question: nextQuestion, history })
  } catch (err) {
    console.error('Interview answer error:', err)
    res.status(500).json({ error: 'Failed to process answer', details: String(err) })
  }
})

// Score all answers at end of session
router.post('/score', async (req, res) => {
  try {
    const { turns, role, company, roundType } = req.body
    const scores = []

    for (const turn of turns) {
      const score = await scoreAnswer(turn.question, turn.answer, role, company, roundType)
      scores.push({ ...turn, feedback: score })
    }

    res.json({ scores })
  } catch (err) {
    console.error('Interview score error:', err)
    res.status(500).json({ error: 'Failed to score interview', details: String(err) })
  }
})

export default router