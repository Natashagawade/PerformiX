import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, history } = await req.json()

    // Fetch user's goals for context
    const goals = await prisma.goal.findMany({
      where: user.role === 'EMPLOYEE' ? { ownerId: user.id }
        : user.role === 'MANAGER' ? { owner: { managerId: user.id } }
        : {},
      include: { checkIns: { orderBy: { quarter: 'desc' }, take: 1 } },
      take: 20,
    })

    const goalsContext = goals.map(g => {
      const ci = g.checkIns[0]
      const pct = ci ? Math.min(100, Math.round((ci.actualAchieved / g.target) * 100)) : 0
      return `• "${g.title}" (${g.thrustArea}): ${pct}% complete, target=${g.target}, weight=${g.weightage}%, status=${g.status}, deadline=${g.deadline.toISOString().split('T')[0]}`
    }).join('\n')

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: `You are GoalIQ, an expert enterprise performance intelligence AI embedded in PerformiX.
User: ${user.name} (${user.role})
Current goals:
${goalsContext}

Be concise, data-driven, and actionable. Reference specific goals. Use markdown bold for emphasis. Keep responses under 200 words unless a detailed report is requested.`,
        messages: [
          ...(history || []),
          { role: 'user', content: message },
        ],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Anthropic API Error:', data)
      return NextResponse.json({ reply: 'I am currently operating in demo mode and cannot generate a dynamic response right now. Please check your AI service configuration.' })
    }
    const reply = data.content?.[0]?.text || 'Unable to generate a response.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('GoalIQ API error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
