import { Router } from 'express'
import { executeCode } from '../services/executor'
import { Contest, ContestParticipant, ContestSubmission } from '../models/Contest'
import { Problem } from '../models/Problem'
import { User } from '../models/User'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

function normalizeInput(input: any): string {
  if (!input) return ''
  const str = String(input).trim()
  return str.replace(/\[([^\]]*)\]/g, (_, contents) => {
    const items = contents.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    return `${items.length}\n${items.join(' ')}`
  })
}

function fuzzyMatch(actual: string, expected: string): boolean {
  if (!actual || !expected) return false
  const norm = (s: string) => s.trim().toLowerCase().replace(/[\[\]]/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
  if (norm(actual) === norm(expected)) return true
  const aNum = parseFloat(actual.trim())
  const eNum = parseFloat(expected.trim())
  if (!isNaN(aNum) && !isNaN(eNum) && Math.abs(aNum - eNum) < 0.001) return true
  return false
}

// Get all contests
router.get('/', async (req, res) => {
  try {
    const contests = await Contest.find().sort({ start_time: -1 })
    res.json({ contests })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contests' })
  }
})

// Get single contest with problems
router.get('/:id', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
    if (!contest) return res.status(404).json({ error: 'Contest not found' })

    // Fetch problems
    const problems = await Problem.find({ _id: { $in: contest.problems } }).select('id title slug difficulty category')

    // Sort by difficulty
    const sorted = (problems || []).sort((a: any, b: any) => {
      const order: any = { Easy: 1, Medium: 2, Hard: 3 }
      return order[a.difficulty] - order[b.difficulty]
    })

    res.json({ contest, problems: sorted })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contest' })
  }
})

// Join contest
router.post('/:id/join', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    const contestId = req.params.id

    let participant = await ContestParticipant.findOne({ user_id: userId, contest_id: contestId })
    if (!participant) {
      participant = new ContestParticipant({ user_id: userId, contest_id: contestId })
      await participant.save()
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to join contest' })
  }
})

// Submit solution during contest
router.post('/:id/submit', authenticate, async (req: AuthRequest, res) => {
  try {
    const { problemId, code, language, testCases, startTime } = req.body
    const userId = req.user?.id
    const contestId = req.params.id
    const results = []
    let allPassed = true

    for (const tc of testCases) {
      const normalizedInput = normalizeInput(tc.input)
      const result = await executeCode(code, language, normalizedInput)
      const actualOutput = result.stdout?.trim() || ''
      const passed = fuzzyMatch(actualOutput, String(tc.expected_output || '').trim())
      if (!passed) allPassed = false
      results.push({
        input: tc.input,
        expected: tc.expected_output,
        actual: actualOutput || result.stderr,
        passed,
        stderr: result.stderr
      })
    }

    const status = allPassed ? 'Accepted' : 'Wrong Answer'
    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    const score = allPassed ? Math.max(100 - Math.floor(timeTaken / 60), 10) : 0

    // Save submission
    const submission = new ContestSubmission({
      user_id: userId,
      contest_id: contestId,
      problem_id: problemId,
      code, language, status, score
    })
    await submission.save()

    // Update participant score if accepted
    if (allPassed) {
      const participant = await ContestParticipant.findOne({ user_id: userId, contest_id: contestId })
      if (participant) {
        participant.score = (participant.score || 0) + score
        await participant.save()
      }
    }

    res.json({ status: status.toLowerCase().replace(' ', '_'), results, score })
  } catch (err) {
    console.error('Contest submit error:', err)
    res.status(500).json({ error: 'Failed to submit' })
  }
})

// Get leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const participants = await ContestParticipant.find({ contest_id: req.params.id })
      .populate('user_id', 'username email')
      .sort({ score: -1 })
      
    // Transform to match old format
    const leaderboard = participants.map(p => ({
      user_id: p.user_id._id,
      total_score: p.score,
      joined_at: p.joined_at,
      profiles: {
        username: (p.user_id as any).username,
        email: (p.user_id as any).email
      }
    }))

    res.json({ leaderboard })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// Create contest (admin only)
router.post('/create', authenticate, async (req: AuthRequest, res) => {
  try {
    const { title, description, startTime } = req.body
    const userId = req.user?.id

    // Check admin
    const user = await User.findById(userId)
    if (!user?.is_admin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + 90 * 60 * 1000)
    const now = new Date()
    const status = start <= now ? 'active' : 'upcoming'

    // Pick 4 problems — 1 easy, 2 medium, 1 hard
    const easy = await Problem.find({ difficulty: 'Easy' }).limit(20)
    const medium = await Problem.find({ difficulty: 'Medium' }).limit(20)
    const hard = await Problem.find({ difficulty: 'Hard' }).limit(20)

    const pick = (arr: any[], n: number) => {
      const shuffled = [...(arr || [])].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, n).map((p: any) => p._id)
    }

    const problemIds = [
      ...pick(easy, 1),
      ...pick(medium, 2),
      ...pick(hard, 1),
    ]

    const contest = new Contest({
      title,
      description: description || `${title} — 4 problems, 90 minutes`,
      start_time: start,
      end_time: end,
      status,
      problems: problemIds,
    })
    
    await contest.save()

    res.json({ contest })
  } catch (err) {
    console.error('Create contest error:', err)
    res.status(500).json({ error: 'Failed to create contest' })
  }
})

// Sync contest statuses
router.post('/sync', async (req, res) => {
  try {
    const now = new Date()
    
    // Update upcoming to active
    await Contest.updateMany(
      { status: 'upcoming', start_time: { $lte: now } },
      { $set: { status: 'active' } }
    )
    
    // Update active to completed
    await Contest.updateMany(
      { status: 'active', end_time: { $lte: now } },
      { $set: { status: 'completed' } }
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync' })
  }
})

export default router