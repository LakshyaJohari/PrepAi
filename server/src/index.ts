import dns from 'dns'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import interviewRouter from './routes/interview'
import resumeRouter from './routes/resume'
import problemsRouter from './routes/problems'
// @ts-ignore
import contestRouter from './routes/contests'
dotenv.config()

// Some networks (campus/corporate) blackhole outbound IPv6 while allowing
// IPv4, which makes Node's fetch (undici) hang until timeout on APIs that
// publish AAAA records (e.g. Groq, which sits behind Cloudflare). Prefer
// IPv4 resolution so those requests don't race a dead IPv6 route first.
dns.setDefaultResultOrder('ipv4first')

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