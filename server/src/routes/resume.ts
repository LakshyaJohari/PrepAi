import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import { analyzeResume, generateResumeQuestions } from '../services/gemini'
import { authenticate, AuthRequest } from '../middleware/auth'

// @ts-ignore
const PDFParser = require('pdf2json')

const router = Router()

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('PDF only'))
  }
})

function parsePDF(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1)
    pdfParser.on('pdfParser_dataError', (err: any) => reject(err))
    pdfParser.on('pdfParser_dataReady', () => {
      const text = pdfParser.getRawTextContent()
      resolve(text)
    })
    pdfParser.loadPDF(filePath)
  })
}

router.post('/upload', authenticate, upload.single('resume'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const filePath = req.file.path
    console.log('Parsing PDF:', filePath)
    const resumeText = await parsePDF(filePath)
    console.log('Parsed text length:', resumeText.length)
    fs.unlinkSync(filePath)
    res.json({ resumeText, pages: 1 })
  } catch (err) {
    console.error('Resume upload error:', err)
    res.status(500).json({ error: 'Failed to parse resume' })
  }
})

router.post('/analyze', authenticate, async (req: AuthRequest, res) => {
  try {
    const { resumeText, targetRole, targetCompany } = req.body
    const analysis = await analyzeResume(resumeText, targetRole, targetCompany)
    res.json({ analysis })
  } catch (err) {
    console.error('Resume analysis error:', err)
    res.status(500).json({ error: 'Failed to analyze resume' })
  }
})

router.post('/questions', authenticate, async (req: AuthRequest, res) => {
  try {
    const { resumeText, role, company } = req.body
    const result = await generateResumeQuestions(resumeText, role, company)
    res.json(result)
  } catch (err) {
    console.error('Resume questions error:', err)
    res.status(500).json({ error: 'Failed to generate questions' })
  }
})

export default router