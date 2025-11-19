import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Auth } from '../Auth'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders login form', () => {
    render(<Auth />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  test('handles successful login', async () => {
    const navigate = vi.fn()
    ;(useNavigate as any).mockReturnValue(navigate)
    ;(supabase.auth.signInWithPassword as any).mockResolvedValue({ error: null })

    render(<Auth />)

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('handles login error', async () => {
    const error = new Error('Invalid credentials')
    ;(supabase.auth.signInWithPassword as any).mockRejectedValue(error)

    render(<Auth />)

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument()
    })
  })
})