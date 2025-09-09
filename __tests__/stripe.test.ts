import { createCheckoutSession, createPortalSession } from '@/lib/stripe'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '@/lib/supabase'

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}))

describe('Stripe Functions', () => {
  const mockUserId = 'test-user-id'
  const mockPriceId = 'price_123'
  const mockCustomerId = 'cus_123'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(loadStripe as any).mockResolvedValue({
      redirectToCheckout: jest.fn().mockResolvedValue({ error: null } as any),
    })
  })

  test('creates checkout session successfully', async () => {
    const mockSessionId = 'cs_123'
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: { sessionId: mockSessionId },
      error: null,
    })

    await createCheckoutSession(mockUserId, mockPriceId)

    expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', {
      body: { priceId: mockPriceId, userId: mockUserId },
    })
    expect(loadStripe).toHaveBeenCalled()
  })

  test('handles checkout session error', async () => {
    const error = new Error('Failed to create session')
    ;(supabase.functions.invoke as any).mockRejectedValue(error)

    await expect(createCheckoutSession(mockUserId, mockPriceId)).rejects.toThrow('Failed to create session')
  })

  test('creates portal session successfully', async () => {
    const mockUrl = 'https://billing.stripe.com/session'
    ;(supabase.functions.invoke as any).mockResolvedValue({
      data: { url: mockUrl },
      error: null,
    })

    const windowSpy = jest.spyOn(window, 'location', 'get');
    delete (window as any).location
    window.location = { href: '' } as any

    await createPortalSession(mockCustomerId)

    expect(supabase.functions.invoke).toHaveBeenCalledWith('create-portal-session', {
      body: { customerId: mockCustomerId },
    })
    expect(window.location.href).toBe(mockUrl)

    windowSpy.mockRestore()
  })

  test('handles portal session error', async () => {
    const error = new Error('Failed to create portal session')
    ;(supabase.functions.invoke as any).mockRejectedValue(error)

    await expect(createPortalSession(mockCustomerId)).rejects.toThrow('Failed to create portal session')
  })
})