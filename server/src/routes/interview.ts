import { Router } from 'express'
import { conductInterview, scoreAnswer } from '../services/gemini'
import { Interview } from '../models/Interview'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// In-memory session history store (for active sessions)
const sessionHistories = new Map<string, { role: string; content: string }[]>()

// Start a new interview session
router.post('/start', authenticate, async (req: AuthRequest, res) => {
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
router.post('/answer', authenticate, async (req: AuthRequest, res) => {
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

// Score all answers at end of session and save to db
router.post('/score', authenticate, async (req: AuthRequest, res) => {
  try {
    const { turns, role, company, roundType, difficulty } = req.body
    const userId = req.user?.id
    const scores = []

    for (const turn of turns) {
      const score = await scoreAnswer(turn.question, turn.answer, role, company, roundType)
      scores.push({ ...turn, feedback: score })
    }

    const avgScore = scores.length
      ? Math.round(scores.reduce((a: number, s: any) => a + s.feedback.overallScore, 0) / scores.length)
      : 0

    // Format transcript for the Interview model
    const transcript = []
    for (const s of scores) {
      transcript.push({ role: 'assistant', content: s.question, ai_feedback: s.feedback })
      transcript.push({ role: 'user', content: s.answer })
    }

    // Save interview
    const interview = new Interview({
      user_id: userId,
      config: { company, role, roundType, difficulty: difficulty?.toLowerCase() || 'medium' },
      transcript,
      score: avgScore,
      status: 'completed'
    })
    await interview.save()

    // Update streak
    if (userId) {
      import('../models/User').then(async ({ User }) => {
        const today = new Date().toISOString().split('T')[0]
        const user = await User.findById(userId)
        
        if (user) {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          
          let newStreak = user.streak || 0
          if (user.last_solved === today) {
            // Already solved today
          } else if (user.last_solved === yesterdayStr) {
            newStreak += 1
          } else {
            newStreak = 1
          }
          
          user.streak = newStreak
          user.last_solved = today
          user.best_streak = Math.max(newStreak, user.best_streak || 0)
          await user.save()
        }
      })
    }

    res.json({ scores, interviewId: interview._id })
  } catch (err) {
    console.error('Interview score error:', err)
    res.status(500).json({ error: 'Failed to score interview', details: String(err) })
  }
})

// Save interview session
router.post('/save', authenticate, async (req: AuthRequest, res) => {
  try {
    const { config, questions, transcript, feedback, score, status } = req.body
    const userId = req.user?.id

    const interview = new Interview({
      user_id: userId,
      config,
      questions,
      transcript,
      feedback,
      score,
      status: status || 'completed'
    })

    await interview.save()

    res.json({ interview })
  } catch (err) {
    console.error('Interview save error:', err)
    res.status(500).json({ error: 'Failed to save interview' })
  }
})

// Get interview by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user_id: req.user?.id })
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' })
    }
    res.json({ interview })
  } catch (err) {
    console.error('Fetch interview error:', err)
    res.status(500).json({ error: 'Failed to fetch interview' })
  }
})

export default router