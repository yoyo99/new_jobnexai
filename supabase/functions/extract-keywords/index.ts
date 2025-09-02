// Import necessary modules
import OpenAI from 'npm:openai@4'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'


// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

// Define common CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define the limit for the number of call
const MAX_CALL_PER_MINUTE = 100

// Define the structure of the expected keywords response
interface KeywordsResponse {
  keywords: string[]
}

// Define the structure of a generic error response
interface ErrorResponse {
  error: string,
  code?: number
}

// Function to extract keywords from a given text using OpenAI's GPT-4
async function extractKeywordsFromOpenAI(text: string): Promise<KeywordsResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: `You are a language expert tasked with extracting the most relevant keywords from a given text. Your goal is to identify and list the essential terms that best represent the text's main themes and concepts. Return a JSON array of strings containing a maximum of 10 keywords.` },
      { role: 'user', content: text }
    ],

// Function to validate the input data
function validateInput(data: any): { success: boolean, error?: string } {
  if (!data.text || typeof data.text !== 'string') {
    return { success: false, error: 'Invalid or missing text' }
  }
  return { success: true }
}

// Function to verify the JWT token and extract the user ID
async function verifyToken(req: Request): Promise<{userId: string | null, error: string | null}> {
  // Retrieve the Authorization header from the request
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { userId: null, error: 'Missing Authorization header' }
  }
  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1]
  if (!token) {
    return { userId: null, error: 'Missing token' }
  }
  // Create a Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  // Retrieve the user from Supabase using the provided token
  const { data: user, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user.user) {
    return { userId: null, error: authError?.message || 'Invalid token' }
  }
  // Return the user ID
  return { userId: user.user.id, error: null}
}

 // Keep track of the number of calls
 let callCount = 0
 // Reset the call count each minute
 setInterval(() => {
  callCount = 0
 }, 60000)
 // Function to handle the call count
 function handleCallCount() {
   callCount++
   if (callCount >= MAX_CALL_PER_MINUTE) {
     console.error('Too many requests')
     throw new Error('Too many requests')
   }
 }

// Function to extract keywords
async function extractKeywords(text: string): Promise<KeywordsResponse> {

 // Manage the call count
 handleCallCount()

 return extractKeywordsFromOpenAI(text)
}



Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify the JWT token and extract the user ID
  const { userId, error: tokenError } = await verifyToken(req)
  if (tokenError || !userId) {
    const response: ErrorResponse = { error: tokenError || 'Unauthorized', code: 401 }
    return new Response(JSON.stringify(response), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
  }

  try {
    // Parse the request body and validate the input
    const body = await req.json()
    const { success, error: validationError } = validateInput(body)
    if (!success) {
      const response: ErrorResponse = { error: validationError || 'Bad Request', code: 400 }
      return new Response(JSON.stringify(response), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const { text } = body
    // Extract keywords from the text
    const keywordsResponse = await extractKeywords(text)
    // Return the keywords in the response
    return new Response(JSON.stringify(keywordsResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })    
  } catch (error) {
    // Log the error and return a detailed error response
    console.error('Error:', error)

    const response: ErrorResponse = {
      error: error.message || 'Internal Server Error',
      code: 500,
    }
    return new Response(JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
