import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import interviewRouter from './routes/interview'
import resumeRouter from './routes/resume'
import problemsRouter from './routes/problems'
// @ts-ignore
import contestRouter from './routes/contests'
dotenv.config()

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PrepAI server running' })
})

app.use('/api/interview', interviewRouter)
app.use('/api/resume', resumeRouter)
app.use('/api/problems', problemsRouter)
app.use('/api/contests', contestRouter)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))