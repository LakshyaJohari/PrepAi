import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Interview } from '../models/Interview';
import { Submission } from '../models/Submission';
import { Problem } from '../models/Problem';

const router = Router();

// Get dashboard stats
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    // Total interviews
    const interviewCount = await Interview.countDocuments({ user_id: userId });
    
    // User profile for streaks
    const user = await User.findById(userId).select('streak best_streak');
    
    // Recent interviews
    const recentSessions = await Interview.find({ user_id: userId }).sort({ createdAt: -1 }).limit(3);

    // Solved problems count
    const solvedCount = await Submission.countDocuments({ user_id: userId, status: 'Accepted' });
    
    // Recent problems (Question of the Day fallback)
    const recentProblems = await Problem.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        interviews: interviewCount,
        streak: user?.streak || 0,
        solved: solvedCount
      },
      recentSessions: recentSessions.map(s => ({
        id: s._id,
        company: s.config?.company || 'Unknown',
        role: s.config?.role || 'Unknown',
        round_type: s.config?.roundType || 'General',
        difficulty: s.config?.difficulty || 'Medium',
        overall_score: s.score,
        created_at: s.createdAt
      })),
      recentProblems
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get analytics
router.get('/analytics', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const interviews = await Interview.find({ user_id: userId }).sort({ createdAt: 1 });
    
    const sessions = [];
    const turns = [];

    for (const interview of interviews) {
      sessions.push({
        id: interview._id,
        company: interview.config?.company || 'Unknown',
        role: interview.config?.role || 'Unknown',
        round_type: interview.config?.roundType || 'General',
        overall_score: interview.score,
        created_at: interview.createdAt
      });

      if (interview.transcript) {
        for (const msg of interview.transcript) {
          if (msg.role === 'ai' && msg.ai_feedback) {
            turns.push({ ai_feedback: msg.ai_feedback, session_id: interview._id });
          }
        }
      }
    }

    res.json({ sessions, turns });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get user history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    const interviews = await Interview.find({ user_id: userId }).sort({ createdAt: -1 });
    const submissions = await Submission.find({ user_id: userId }).populate('problem_id', 'title difficulty').sort({ createdAt: -1 });
    
    res.json({
      interviews,
      submissions: submissions.map(s => ({
        id: s._id,
        problem: (s.problem_id as any)?.title,
        difficulty: (s.problem_id as any)?.difficulty,
        status: s.status,
        created_at: s.createdAt,
        language: s.language
      }))
    });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const interviews = await Interview.find({ user_id: userId });
    const solved = await Submission.countDocuments({ user_id: userId, status: 'Accepted' });
    
    let totalTurns = 0;
    interviews.forEach(interview => {
      totalTurns += (interview.transcript?.length || 0);
    });

    res.json({
      profile: user,
      stats: {
        interviews: interviews.length,
        solved,
        turns: totalTurns
      }
    });
  } catch (err) {
    console.error('Profile get error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { username } = req.body;
    
    const user = await User.findByIdAndUpdate(userId, { username }, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
