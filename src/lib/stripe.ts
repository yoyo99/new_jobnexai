import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

// Initialize stripe in an async function instead of using top-level await
let stripe: Awaited<ReturnType<typeof loadStripe>> | null = null;

// Initialize stripe in an async function
const initStripe = async () => {
  stripe = await loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY!)
}

// Initialize stripe immediately
initStripe()

export async function createCheckoutSession(userId: string, priceId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: { priceId, userId }
    })

    if (error) throw error

    const { sessionId } = data
    if (!stripe) throw new Error('Stripe not loaded')
    
    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
    if (stripeError) throw stripeError
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export { stripe }