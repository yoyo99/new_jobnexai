import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthCallback from '../../../pages/auth/callback';

// Mock de useSupabaseConfig
const mockGetSession = jest.fn();
const mockUpsert = jest.fn();
jest.mock('../../../src/hooks/useSupabaseConfig', () => ({
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
    },
    from: (table: string) => ({
      upsert: mockUpsert,
    }),
  }),
}));

// Mock de useAuth
const mockSetUser = jest.fn();
jest.mock('../../../src/stores/auth', () => ({
  useAuth: () => ({
    setUser: mockSetUser,
  }),
}));

// Mock de useRouter
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('AuthCallback Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading spinner on initial render', () => {
    render(<AuthCallback />);
    
    expect(screen.getByText('Finalisation de la connexion...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('redirects to login if no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    
    render(<AuthCallback />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('sets user and redirects to dashboard on successful callback', async () => {
    const mockUser = {
      id: 'google-123',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    };
    
    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    
    mockUpsert.mockResolvedValue({ error: null });
    
    render(<AuthCallback />);
    
    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(mockUser);
      expect(mockUpsert).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        display_name: mockUser.user_metadata.full_name,
        avatar_url: mockUser.user_metadata.avatar_url,
        auth_provider: 'google',
        last_login: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles database errors gracefully', async () => {
    const mockUser = {
      id: 'google-123',
      email: 'test@example.com',
      user_metadata: {},
    };
    
    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    
    mockUpsert.mockResolvedValue({ error: new Error('DB error') });
    

    
    // Mock console.error to avoid test output pollution
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<AuthCallback />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('DB error:', expect.any(Error));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    
    console.error = originalError;
  });

  test('redirects to login with error on auth failure', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Invalid session'),
    });
    
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    
    // Mock console.error
    const originalError = console.error;
    console.error = jest.fn();
    
    render(<AuthCallback />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Auth callback error:', expect.any(Error));
      expect(pushMock).toHaveBeenCalledWith('/login?error=auth_failed');
    });
    
    console.error = originalError;
  });
});