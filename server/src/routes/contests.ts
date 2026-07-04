import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { executeCode } from '../services/executor'

const router = Router()
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

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
    const { data, error } = await supabase
      .from('contests')
      .select('*')
      .order('start_time', { ascending: false })
    if (error) throw error
    res.json({ contests: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contests' })
  }
})

// Get single contest with problems
router.get('/:id', async (req, res) => {
  try {
    const { data: contest, error } = await supabase
      .from('contests')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) throw error

    // Fetch problems
    const { data: problems } = await supabase
      .from('problems_bank')
      .select('id, title, slug, difficulty, topics')
      .in('id', contest.problem_ids || [])

    // Sort by difficulty
    const sorted = (problems || []).sort((a: any, b: any) => {
      const order: any = { easy: 1, medium: 2, hard: 3 }
      return order[a.difficulty] - order[b.difficulty]
    })

    res.json({ contest, problems: sorted })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contest' })
  }
})

// Join contest
router.post('/:id/join', async (req, res) => {
  try {
    const { userId } = req.body
    const { error } = await supabase
      .from('contest_participants')
      .upsert({ user_id: userId, contest_id: req.params.id })
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to join contest' })
  }
})

// Submit solution during contest
router.post('/:id/submit', async (req, res) => {
  try {
    const { userId, problemId, code, language, testCases, problemTitle, startTime } = req.body
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

    const status = allPassed ? 'accepted' : 'wrong_answer'
    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
    const score = allPassed ? Math.max(100 - Math.floor(timeTaken / 60), 10) : 0

    // Save submission
    await supabase.from('contest_submissions').insert({
      user_id: userId,
      contest_id: req.params.id,
      problem_id: problemId,
      code, language, status, score,
      time_taken: timeTaken,
    })

    // Update participant score if accepted
    if (allPassed) {
      const { data: existing } = await supabase
        .from('contest_participants')
        .select('total_score')
        .eq('user_id', userId)
        .eq('contest_id', req.params.id)
        .single()

      await supabase
        .from('contest_participants')
        .update({ total_score: (existing?.total_score || 0) + score })
        .eq('user_id', userId)
        .eq('contest_id', req.params.id)
    }

    res.json({ status, results, score })
  } catch (err) {
    console.error('Contest submit error:', err)
    res.status(500).json({ error: 'Failed to submit' })
  }
})

// Get leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contest_participants')
      .select('user_id, total_score, joined_at, profiles(username, email)')
      .eq('contest_id', req.params.id)
      .order('total_score', { ascending: false })
    if (error) throw error
    res.json({ leaderboard: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})
// Create contest (admin only)
router.post('/create', async (req, res) => {
  try {
    const { title, description, startTime, userId } = req.body

    // Check admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (!profile?.is_admin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const start = new Date(startTime)
    const end = new Date(start.getTime() + 90 * 60 * 1000)
    const now = new Date()
    const status = start <= now ? 'active' : 'upcoming'

    // Pick 4 problems — 1 easy, 2 medium, 1 hard
    const { data: easy } = await supabase
      .from('problems_bank')
      .select('id')
      .eq('difficulty', 'easy')
      .eq('status', 'approved')
      .limit(20)

    const { data: medium } = await supabase
      .from('problems_bank')
      .select('id')
      .eq('difficulty', 'medium')
      .eq('status', 'approved')
      .limit(20)

    const { data: hard } = await supabase
      .from('problems_bank')
      .select('id')
      .eq('difficulty', 'hard')
      .eq('status', 'approved')
      .limit(20)

    const pick = (arr: any[], n: number) => {
      const shuffled = [...(arr || [])].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, n).map((p: any) => p.id)
    }

    const problemIds = [
      ...pick(easy || [], 1),
      ...pick(medium || [], 2),
      ...pick(hard || [], 1),
    ]

    const { data: contest, error } = await supabase
      .from('contests')
      .insert({
        title,
        description: description || `${title} — 4 problems, 90 minutes`,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status,
        problem_ids: problemIds,
      })
      .select()
      .single()

    if (error) throw error
    res.json({ contest })
  } catch (err) {
    console.error('Create contest error:', err)
    res.status(500).json({ error: 'Failed to create contest' })
  }
})

// Sync contest statuses
router.post('/sync', async (req, res) => {
  try {
    await supabase.rpc('update_contest_status')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync' })
  }
})
export default router