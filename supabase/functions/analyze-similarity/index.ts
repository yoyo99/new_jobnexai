import OpenAI from 'npm:openai@4'
import { getCorsHeaders } from '../_shared/cors.ts'
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const MAX_INPUT_CHARS = 20000

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { headers: getCorsHeaders(origin), status: 405 })
  }

  try {
    const requestId = crypto.randomUUID()
    const body = await req.json()
    const text1 = typeof body?.text1 === 'string' ? body.text1.trim() : ''
    const text2 = typeof body?.text2 === 'string' ? body.text2.trim() : ''

    // Basic validation
    if (!text1 || !text2 || text1.length > MAX_INPUT_CHARS || text2.length > MAX_INPUT_CHARS) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', requestId }),
        { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' }, status: 422 }
      )
    }

    // Use OpenAI embeddings to calculate similarity (batch in a single call)
    const embeddings = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: [text1, text2],
    })

    // Calculate cosine similarity between embeddings
    const vector1 = embeddings.data[0].embedding
    const vector2 = embeddings.data[1].embedding
    const similarity = cosineSimilarity(vector1, vector2)

    return new Response(
      JSON.stringify({ similarity, requestId }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const requestId = crypto.randomUUID()
    console.error('analyze-similarity error', { requestId, error })
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', requestId }),
      {
        headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (!Array.isArray(vector1) || !Array.isArray(vector2)) return 0
  if (vector1.length === 0 || vector2.length === 0) return 0
  if (vector1.length !== vector2.length) return 0

  let dotProduct = 0
  let sumSq1 = 0
  let sumSq2 = 0
  for (let i = 0; i < vector1.length; i++) {
    const v1 = vector1[i]
    const v2 = vector2[i]
    dotProduct += v1 * v2
    sumSq1 += v1 * v1
    sumSq2 += v2 * v2
  }

  const magnitude1 = Math.sqrt(sumSq1)
  const magnitude2 = Math.sqrt(sumSq2)
  if (magnitude1 === 0 || magnitude2 === 0) return 0
  return dotProduct / (magnitude1 * magnitude2)
}