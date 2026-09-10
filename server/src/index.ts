import dns from 'dns'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import interviewRouter from './routes/interview'
import resumeRouter from './routes/resume'
import problemsRouter from './routes/problems'
// @ts-ignore
import contestRouter from './routes/contests'
import authRouter from './routes/auth'
import userRouter from './routes/user'

dotenv.config()

// Some networks (campus/corporate) blackhole outbound IPv6 while allowing
// IPv4, which makes Node's fetch (undici) hang until timeout on APIs that
dns.setDefaultResultOrder('ipv4first')
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (e) {
  console.warn('Could not set custom DNS servers', e)
}

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PrepAI server running' })
})

app.use('/api/auth', authRouter)
app.use('/auth', authRouter)
app.use('/api/user', userRouter)
app.use('/user', userRouter)
app.use('/api/interview', interviewRouter)
app.use('/interview', interviewRouter)
app.use('/api/resume', resumeRouter)
app.use('/resume', resumeRouter)
app.use('/api/problems', problemsRouter)
app.use('/problems', problemsRouter)
app.use('/api/contests', contestRouter)
app.use('/contests', contestRouter)

const PORT = process.env.PORT || 3001

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prepai')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });