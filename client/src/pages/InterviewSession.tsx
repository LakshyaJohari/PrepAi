import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Mic, MicOff, Send } from 'lucide-react'

interface Turn {
  question: string
  answer: string
}

export default function InterviewSession() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { sessionId, company, role, roundType, difficulty, firstQuestion } = state || {}

  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion || '')
  const [answer, setAnswer] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(1)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      recognitionRef.current.onresult = (event: any) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setAnswer(transcript)
      }
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim()) return
    setLoading(true)

    const newTurn: Turn = { question: currentQuestion, answer }
    const updatedTurns = [...turns, newTurn]
    setTurns(updatedTurns)
    setAnswer('')

    if (currentQuestion.toLowerCase().includes('concludes') ||
      currentQuestion.toLowerCase().includes('thank you for your time') ||
      questionIndex >= 6) {
      navigate('/interview/score', {
        state: { turns: updatedTurns, company, role, roundType, difficulty, sessionId }
      })
      return
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/interview/answer`, {
        sessionId, answer, company, role, roundType, difficulty: difficulty.toLowerCase()
      })
      setCurrentQuestion(res.data.question)
      setQuestionIndex(prev => prev + 1)
    } catch {
      alert('Failed to get next question')
    }
    setLoading(false)
  }

  const handleEnd = () => {
    navigate('/interview/score', {
      state: { turns, company, role, roundType, difficulty, sessionId }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">{company} — {role}</h1>
          <p className="text-sm text-[#666666] capitalize mt-0.5">{roundType?.replace('_', ' ')} · {difficulty}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#555555]">Q{questionIndex} of 6</span>
          <div className="w-24 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(questionIndex / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Past turns */}
      {turns.length > 0 && (
        <div className="space-y-3">
          {turns.map((turn, i) => (
            <div key={i} className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
              <p className="text-xs text-indigo-400 font-medium mb-1">Q{i + 1}</p>
              <p className="text-sm text-[#888888] mb-2">{turn.question}</p>
              <p className="text-xs text-[#555555] bg-[#1a1a1a] rounded-lg p-2">{turn.answer}</p>
            </div>
          ))}
        </div>
      )}

      {/* Current question */}
      <div className="bg-[#0D0D0D] border border-white/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-white/10 text-white text-xs font-medium px-2 py-0.5 rounded-full">Current Question</span>
        </div>
        <p className="text-white font-medium leading-relaxed">{currentQuestion}</p>
      </div>

      {/* Answer input */}
      <div className="bg-[#0D0D0D] border border-[#1a1a1a] rounded-xl p-4">
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here or use the mic..."
          className="w-full bg-transparent text-white text-sm resize-none focus:outline-none min-h-32 placeholder-[#444444]"
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                isListening
                  ? 'bg-red-400/20 text-red-400'
                  : 'bg-[#1a1a1a] text-[#888888] hover:text-white'
              }`}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              {isListening ? 'Stop' : 'Voice'}
            </button>
            <span className="text-xs text-[#444444]">{answer.length} chars</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleEnd}
              className="px-3 py-1.5 text-sm text-[#555555] hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors"
            >
              End Session
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-black px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Thinking...' : <><Send size={14} /> Submit</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}