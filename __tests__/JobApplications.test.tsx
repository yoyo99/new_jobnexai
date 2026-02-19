import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { JobApplications } from '../JobApplications'
import { useAuth } from '../src/stores/auth'
import { supabase } from '../lib/supabase'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock auth store
jest.mock('../src/stores/auth', () => ({
  useAuth: jest.fn()
}))

// Mock supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

describe('JobApplications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should show loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' }
    })

    // Mock supabase to return a pending promise
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockImplementation(() => new Promise(() => {}))
        })
      })
    })

    render(
      <QueryClientProvider client={queryClient}>
        <JobApplications />
      </QueryClientProvider>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  test('should show error state when query fails', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' }
    })

    // Mock supabase to throw an error
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(new Error('Test error'))
        })
      })
    })

    render(
      <QueryClientProvider client={queryClient}>
        <JobApplications />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load applications. Please refresh the page.')).toBeInTheDocument()
    })
  })

  test('should show empty state when no applications', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' }
    })

    // Mock supabase to return empty data
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    })

    render(
      <QueryClientProvider client={queryClient}>
        <JobApplications />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Suivi des candidatures')).toBeInTheDocument()
      expect(screen.getByText('Nouvelle candidature')).toBeInTheDocument()
    })
  })

  test('should show applications when data is loaded', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        job: {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'Remote',
          url: 'https://example.com'
        },
        status: 'applied' as const,
        notes: 'Exciting opportunity',
        applied_at: '2023-01-01T00:00:00Z',
        next_step_date: '2023-01-15T00:00:00Z',
        next_step_type: 'technical' as const,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    ]

    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' }
    })

    // Mock supabase to return application data
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockApplications, error: null })
        })
      })
    })

    render(
      <QueryClientProvider client={queryClient}>
        <JobApplications />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('Postulées')).toBeInTheDocument()
    })
  })

  test('should not load applications when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null
    })

    render(
      <QueryClientProvider client={queryClient}>
        <JobApplications />
      </QueryClientProvider>
    )

    expect(screen.getByText('Suivi des candidatures')).toBeInTheDocument()
  })
})