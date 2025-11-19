import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Settings } from '../Settings'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { useTranslation } from 'react-i18next'

vi.mock('../../stores/auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(),
    })),
  },
}))

describe('Settings Component', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({ user: mockUser })
    ;(useTranslation as any).mockReturnValue({
      t: (key: string) => key,
      i18n: {
        language: 'fr',
        changeLanguage: vi.fn(),
      },
    })
  })

  test('renders settings component', () => {
    render(<Settings />)
    expect(screen.getByText(/paramètres/i)).toBeInTheDocument()
    expect(screen.getByText(/sécurité/i)).toBeInTheDocument()
    expect(screen.getByText(/notifications/i)).toBeInTheDocument()
    expect(screen.getByText(/confidentialité/i)).toBeInTheDocument()
    expect(screen.getByText(/langue/i)).toBeInTheDocument()
  })

  test('updates security settings', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({
      upsert: upsertMock,
    })

    render(<Settings />)

    // Activer l'authentification à deux facteurs
    const mfaToggle = screen.getByText(/authentification à deux facteurs/i)
      .parentElement?.querySelector('button')
    fireEvent.click(mfaToggle!)

    // Sauvegarder les paramètres
    const saveButton = screen.getByText(/enregistrer les paramètres/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith({
        user_id: mockUser.id,
        security: expect.objectContaining({
          enable_mfa: true,
        }),
        updated_at: expect.any(String),
      })
    })
  })

  test('updates notification settings', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({
      upsert: upsertMock,
    })

    render(<Settings />)

    // Aller à l'onglet notifications
    const notificationsTab = screen.getByText(/notifications/i)
    fireEvent.click(notificationsTab)

    // Activer les notifications par email
    const emailToggle = screen.getByText(/notifications par email/i)
      .parentElement?.querySelector('button')
    fireEvent.click(emailToggle!)

    // Sauvegarder les paramètres
    const saveButton = screen.getByText(/enregistrer les paramètres/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalledWith({
        user_id: mockUser.id,
        notifications: expect.objectContaining({
          email_notifications: true,
        }),
        updated_at: expect.any(String),
      })
    })
  })

  test('changes language', () => {
    render(<Settings />)

    // Aller à l'onglet langue
    const languageTab = screen.getByText(/langue/i)
    fireEvent.click(languageTab)

    // Changer la langue
    const englishButton = screen.getByText('English')
    fireEvent.click(englishButton)

    expect(useTranslation().i18n.changeLanguage).toHaveBeenCalledWith('en')
  })
})