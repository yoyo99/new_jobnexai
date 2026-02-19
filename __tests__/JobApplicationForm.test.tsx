import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { JobApplicationForm } from '../JobApplicationForm'
import { useAuth } from '../src/stores/auth'
import { supabase } from '../lib/supabase'

// Mock auth store
jest.mock('../src/stores/auth', () => ({
  useAuth: jest.fn()
}))

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: {}, error: null })
    }))
  }
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const mockOnSubmit = jest.fn()
const mockOnClose = jest.fn()

describe('JobApplicationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' }
    })
  })

  test('should render form with all fields', () => {
    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    expect(screen.getByText('Nouvelle candidature')).toBeInTheDocument()
    expect(screen.getByLabelText('Statut')).toBeInTheDocument()
    expect(screen.getByLabelText('Notes')).toBeInTheDocument()
    expect(screen.getByLabelText('Prochaine étape')).toBeInTheDocument()
    expect(screen.getByText('Créer la candidature')).toBeInTheDocument()
  })

  test('should show validation error when status is not selected', async () => {
    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    // Remove the default value
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: '' } })
    
    fireEvent.click(screen.getByText('Créer la candidature'))
    
    await waitFor(() => {
      expect(screen.getByText('Le statut est obligatoire')).toBeInTheDocument()
    })
  })

  test('should show validation error when notes exceed 2000 characters', async () => {
    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    const longText = 'a'.repeat(2001)
    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: longText } })
    
    fireEvent.click(screen.getByText('Créer la candidature'))
    
    await waitFor(() => {
      expect(screen.getByText('Les notes ne peuvent pas dépasser 2000 caractères')).toBeInTheDocument()
    })
  })

  test('should show validation error when date is in the past', async () => {
    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    // Set a date in the past
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const pastDateString = pastDate.toISOString().split('T')[0]
    
    fireEvent.change(screen.getByLabelText('Prochaine étape'), { target: { value: pastDateString } })
    
    fireEvent.click(screen.getByText('Créer la candidature'))
    
    await waitFor(() => {
      expect(screen.getByText('La date ne peut pas être dans le passé')).toBeInTheDocument()
    })
  })

  test('should submit form successfully with valid data', async () => {
    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    fireEvent.change(screen.getByLabelText('Notes'), { target: { value: 'Test notes' } })
    fireEvent.click(screen.getByText('Créer la candidature'))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  test('should not submit when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null
    })

    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    fireEvent.click(screen.getByText('Créer la candidature'))
    
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  test('should close form when cancel button is clicked', () => {
    render(
      <JobApplicationForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        jobId="test-job-id"
      />
    )

    fireEvent.click(screen.getByText('Annuler'))
    expect(mockOnClose).toHaveBeenCalled()
  })
})