import { randomUUID } from 'node:crypto'

const baseUrl = process.env.NETIFY_BASE_URL || 'http://localhost:3002'
const apiKey = process.env.NETIFY_API_KEY
const jobId = process.env.JOB_ID || randomUUID()
const pdfUrl = process.env.PDF_URL
const userId = process.env.USER_ID || 'demo-user'
const prompt = process.env.NETIFY_PROMPT || 'Create a clear narrated training video.'

if (!apiKey) {
  console.error('Set NETIFY_API_KEY to your Netify API key.')
  process.exit(1)
}

if (!pdfUrl) {
  console.error('Set PDF_URL to a public or signed PDF URL.')
  process.exit(1)
}

const authHeaders = { Authorization: `Bearer ${apiKey}` }

const start = await fetch(`${baseUrl}/api/render`, {
  method: 'POST',
  headers: {
    ...authHeaders,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ jobId, pdfUrl, userId, prompt }),
})

if (!start.ok) {
  throw new Error(`Render request failed: HTTP ${start.status} ${await start.text()}`)
}

console.log('Job accepted:', await start.json())
console.log(`Streaming progress for ${jobId}`)

const events = await fetch(`${baseUrl}/api/events/${encodeURIComponent(jobId)}`, {
  headers: authHeaders,
})

if (!events.ok || !events.body) {
  throw new Error(`Event stream failed: HTTP ${events.status} ${await events.text()}`)
}

const reader = events.body.pipeThrough(new TextDecoderStream()).getReader()
let buffer = ''

while (true) {
  const { value, done } = await reader.read()
  if (done) break
  buffer += value

  const chunks = buffer.split('\n\n')
  buffer = chunks.pop() || ''

  for (const chunk of chunks) {
    const line = chunk.split('\n').find((part) => part.startsWith('data: '))
    if (!line) continue

    const event = JSON.parse(line.slice(6))
    console.log(`${event.pct}% ${event.message}`)

    if (event.pct === 100) {
      console.log('Done. Retrieve the final MP4 from your configured video storage.')
      process.exit(0)
    }

    if (event.pct < 0) {
      throw new Error(event.message)
    }
  }
}
