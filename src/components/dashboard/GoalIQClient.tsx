'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Loader2, User, Bot, Zap, TrendingUp, AlertTriangle, FileText } from 'lucide-react'
import type { User as UserType, Goal } from '@/types'

type GoalFull = Goal & { checkIns: { actualAchieved: number; quarter: string }[]; owner: { name: string } }

interface Props { user: UserType; goals: GoalFull[] }

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date }

const QUICK_PROMPTS: { icon: React.ElementType; label: string; prompt: string }[] = [
  { icon: TrendingUp, label: 'Analyze my goal health', prompt: 'Analyze the health of my current goals and give me a detailed assessment with specific recommendations.' },
  { icon: AlertTriangle, label: 'Identify risks', prompt: 'Which of my goals are at risk of not being completed? What specific actions should I take?' },
  { icon: FileText, label: 'Draft Q2 summary', prompt: 'Write a professional Q2 performance summary I can share with my manager, based on my current progress.' },
  { icon: Zap, label: 'Quick wins', prompt: 'What are the easiest goals I should focus on now to boost my completion rate quickly?' },
  { icon: Sparkles, label: 'Improve goal quality', prompt: 'Review my goals and suggest how to make them more measurable and aligned with best practices.' },
  { icon: TrendingUp, label: 'Forecast Q3', prompt: 'Based on my Q2 trends, forecast my likely completion rate for Q3 and what I need to do differently.' },
]

export default function GoalIQClient({ user, goals }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hello, ${user.name.split(' ')[0]}! I'm **GoalIQ**, your AI performance intelligence assistant.\n\nI have context on your ${goals.length} active goals and can help you with:\n• Goal health analysis and risk identification\n• Quarterly performance summaries\n• Actionable improvement recommendations\n• Completion forecasting\n\nWhat would you like to explore?`,
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      const reply = data.reply || 'Unable to get a response. Please try again.'
      setMessages(m => [...m, { role: 'assistant', content: reply, timestamp: new Date() }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Please check your network and try again.', timestamp: new Date() }])
    } finally { setLoading(false) }
  }

  const renderContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n• /g, '<br/>• ')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="p-6 max-w-3xl flex flex-col" style={{ height: 'calc(100vh - 52px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-9 h-9 bg-[#111] rounded-xl flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        <div>
          <h1 className="text-[16px] font-semibold text-[#111] tracking-tight">GoalIQ</h1>
          <p className="text-[11px] text-[#aaa]">AI Performance Intelligence · {goals.length} goals in context</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-1 rounded-full font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> claude-3.5-sonnet
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        {QUICK_PROMPTS.map((p) => {
          const Icon = p.icon
          return (
            <button key={p.label} onClick={() => send(p.prompt)} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e5e5e5] rounded-full text-[11px] text-[#444] hover:border-[#d4d4d4] hover:bg-[#fafafa] transition-all disabled:opacity-50">
              <Icon className="w-3 h-3 text-[#aaa]" />
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white border border-[#e5e5e5] rounded-xl mb-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
        <div className="p-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-[#111]' : 'bg-[#f2f2f2] border border-[#e5e5e5]'}`}>
                  {m.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-[#777]" />}
                </div>
                <div className={`flex-1 max-w-[85%] ${m.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div className={`px-4 py-3 rounded-xl text-[12px] leading-relaxed ${m.role === 'user' ? 'bg-[#111] text-white' : 'bg-[#f8f8f8] border border-[#e5e5e5] text-[#444]'}`}
                    dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
                  <div className="text-[9px] text-[#ccc] mt-1 px-1">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#f2f2f2] border border-[#e5e5e5] flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#777]" />
              </div>
              <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[#aaa] animate-spin" />
                <span className="text-[11px] text-[#aaa]">GoalIQ is analyzing…</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder="Ask GoalIQ anything about your goals, performance, or team…"
          className="input flex-1 text-[12px]" disabled={loading} />
        <button onClick={() => send(input)} disabled={loading || !input.trim()} className="btn-primary flex-shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-[#ccc] text-center mt-2 flex-shrink-0">GoalIQ · Powered by Claude · Responses may vary</p>
    </div>
  )
}
