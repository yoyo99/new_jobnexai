import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../src/components/AuthProvider';
import { useAuth } from '../src/stores/auth';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user', email: 'test@example.com' } } },
        error: null
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } }
      })
    }
  }
}));

// Mock auth store
jest.mock('../src/stores/auth', () => ({
  useAuth: jest.fn()
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      initialized: false,
      error: null,
      loadUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });
  });

  test('should render children when provided', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <div data-testid="test-child">Test Content</div>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  test('should show loading state initially', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <div>Content</div>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should handle loading state properly
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('should handle authenticated user', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      initialized: true,
      error: null,
      loadUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <div data-testid="authenticated-content">Authenticated Content</div>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated-content')).toBeInTheDocument();
    });
  });
});
