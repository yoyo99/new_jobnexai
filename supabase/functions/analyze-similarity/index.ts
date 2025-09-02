import OpenAI from 'npm:openai@4'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text1, text2 } = await req.json()

    // Use OpenAI embeddings to calculate similarity
    const [embedding1, embedding2] = await Promise.all([
      openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text1,
      }),
      openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text2,
      })
    ])

    // Calculate cosine similarity between embeddings
    const vector1 = embedding1.data[0].embedding
    const vector2 = embedding2.data[0].embedding
    const similarity = cosineSimilarity(vector1, vector2)

    return new Response(
      JSON.stringify({ similarity }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function cosineSimilarity(vector1: number[], vector2: number[]): number {
  const dotProduct = vector1.reduce((acc, val, i) => acc + val * vector2[i], 0)
  const magnitude1 = Math.sqrt(vector1.reduce((acc, val) => acc + val * val, 0))
  const magnitude2 = Math.sqrt(vector2.reduce((acc, val) => acc + val * val, 0))
  return dotProduct / (magnitude1 * magnitude2)
}