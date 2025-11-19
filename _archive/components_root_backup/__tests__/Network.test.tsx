import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Network } from '../Network'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'

vi.mock('../../stores/auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: [] }),
            })),
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}))

describe('Network Component', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({ user: mockUser })
  })

  test('renders network component', () => {
    render(<Network />)
    expect(screen.getByText(/réseau professionnel/i)).toBeInTheDocument()
    expect(screen.getByText(/connexions/i)).toBeInTheDocument()
    expect(screen.getByText(/messages/i)).toBeInTheDocument()
  })

  test('loads connections on mount', async () => {
    const mockConnections = [
      {
        id: '1',
        user_id: mockUser.id,
        connected_user_id: 'other-user',
        status: 'accepted',
        connected_user: {
          full_name: 'John Doe',
          title: 'Developer',
          company: 'Tech Corp',
        },
      },
    ]

    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({ data: mockConnections }),
        }),
      }),
    })

    render(<Network />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Developer')).toBeInTheDocument()
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    })
  })

  test('sends message', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
      insert: insertMock,
    })

    render(<Network />)

    // Sélectionner un contact et envoyer un message
    const messageInput = screen.getByPlaceholderText(/écrivez votre message/i)
    fireEvent.change(messageInput, { target: { value: 'Hello!' } })
    const sendButton = screen.getByText(/envoyer/i)
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith({
        sender_id: mockUser.id,
        content: 'Hello!',
        receiver_id: expect.any(String),
      })
    })
  })

  test('accepts connection request', async () => {
    const updateMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({
      update: updateMock,
    })

    render(<Network />)

    const acceptButton = screen.getByText(/accepter/i)
    fireEvent.click(acceptButton)

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({
        status: 'accepted',
      })
    })
  })
})