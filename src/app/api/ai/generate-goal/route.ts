import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prompt } = await req.json()
    if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Fallback mock for demo without API key
      return NextResponse.json({
        goal: {
          title: `Improve ${prompt.substring(0, 40)}`,
          description: `Systematically enhance ${prompt} through measurable KPIs and quarterly milestones.`,
          thrustArea: 'Efficiency',
          uom: 'PERCENTAGE',
          target: 25,
          weightage: 15,
          deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      })
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
        max_tokens: 500,
        system: `You are GoalIQ. Generate a SMART enterprise goal from the user's input.
Return ONLY valid JSON (no markdown fences) with:
{
  "title": "string (max 80 chars, action-oriented)",
  "description": "string (1-2 sentences, professional)",
  "thrustArea": "one of: Revenue Growth|Customer Success|Product Delivery|Efficiency|Development|Innovation|People & Culture|Compliance & Risk|Technology|Market Expansion",
  "uom": "NUMERIC|PERCENTAGE|TIMELINE|ZERO_BASED",
  "target": number,
  "weightage": number (10-25),
  "deadline": "YYYY-MM-DD within next 12 months"
}`,
        messages: [{ role: 'user', content: `Generate a SMART goal for: "${prompt}"` }],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Anthropic API Error:', data)
      // Fallback mock
      return NextResponse.json({
        goal: {
          title: `Improve ${prompt.substring(0, 40)}`,
          description: `Systematically enhance ${prompt} through measurable KPIs and quarterly milestones.`,
          thrustArea: 'Efficiency',
          uom: 'PERCENTAGE',
          target: 25,
          weightage: 15,
          deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      })
    }
    const text = data.content?.[0]?.text || '{}'
    const goal = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ goal })
  } catch (err) {
    console.error('Goal generator error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
