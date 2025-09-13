// Import Stripe library
import Stripe from 'stripe';
// Import the verify function from the djwt library to handle JWT verification
import { jwtVerify } from 'jose';

// Define an interface for the JWT data to specify the structure
interface JWTData {
  sub: string
}

// Create a new instance of the Stripe API client using the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
// Retrieve the JWT secret key from the environment variables
const jwtSecret = process.env.JWT_SECRET!

// Define the CORS headers for the HTTP responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define an interface for the response data of the createPortalSession function
interface createPortalSessionResponse {
  url?: string
  error?: string
  code?: number
}

// Function to validate the input 'customerId'
function validateInput(customerId: string): void {
  // Check if 'customerId' is missing
  if (!customerId) {
    throw { error: 'Missing customerId', code: 400 }
  }
  // Check if 'customerId' is not a string
  if (typeof customerId !== 'string') {
    throw { error: 'Invalid customerId', code: 400 }
  }
}

// Middleware function to authenticate the user
async function authenticate(headers: Record<string, string | undefined>): Promise<string> {
  // Get the Authorization header
  const authHeader = headers['authorization']
  // Check if Authorization header is missing
  if (!authHeader) {
    throw { error: 'Missing Authorization header', code: 401 }
  }
  // Extract the token from the Authorization header
  const token = authHeader.split(' ')[1]
  // Verify the token
  const { payload: jwtData } = await jwtVerify(token, new TextEncoder().encode(jwtSecret), { algorithms: ['HS512'] }) as { payload: JWTData }
  // Check if the token is valid
  if (!jwtData.sub) {
    throw { error: 'Invalid token', code: 401 }
  }
  // Return the user id
  return jwtData.sub
}

// Main Deno server function
export async function handler(event, context) {
  const { default: Stripe } = await import('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // Parse headers and body for Netlify
  const headers: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), typeof v === 'string' ? v : undefined])
  );
  const method = event.httpMethod;
  const reqBody = event.body ? JSON.parse(event.body) : {};

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: 'ok',
    };
  }

  // Try to authenticate the user
  try {
    await authenticate(headers);
  } catch (error) {
    return {
      statusCode: error.code || 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.error || error.message || 'Invalid Token', code: error.code || 401 })
    };
  }

  try {
    const { customerId }: { customerId: string } = reqBody;
    validateInput(customerId);

    // Récupère l'URL d'origine pour le retour (si non dispo, fallback sur /)
    const origin = (headers['origin'] || headers['referer'] || '') as string;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin.replace(/\/$/, '')}/app/billing`,
    });

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url } as createPortalSessionResponse),
    };
  } catch (error) {
    // Gestion des erreurs
    const message = error.error || error.message || 'Internal Server Error';
    const code = error.code || 500;
    console.error('Error:', message, error);
    return {
      statusCode: code,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: message, code } as createPortalSessionResponse),
    };
  }
};