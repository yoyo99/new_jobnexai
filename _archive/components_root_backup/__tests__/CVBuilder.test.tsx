import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { CVBuilder } from '../CVBuilder'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'

vi.mock('../../stores/auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(),
    })),
  },
}))

describe('CVBuilder Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: { id: 'test-user-id' },
    })
  })

  test('renders CV builder form', () => {
    render(<CVBuilder />)
    expect(screen.getByText(/créateur de cv/i)).toBeInTheDocument()
    expect(screen.getByText(/formation/i)).toBeInTheDocument()
    expect(screen.getByText(/expérience professionnelle/i)).toBeInTheDocument()
    expect(screen.getByText(/compétences/i)).toBeInTheDocument()
  })

  test('adds new education item', () => {
    render(<CVBuilder />)
    const addButton = screen.getAllByText(/ajouter/i)[0]
    fireEvent.click(addButton)
    expect(screen.getByPlaceholderText(/titre du diplôme/i)).toBeInTheDocument()
  })

  test('saves CV successfully', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({
      upsert: upsertMock,
    })

    render(<CVBuilder />)
    const saveButton = screen.getByText(/enregistrer le cv/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalled()
    })
  })
})