import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginWithGoogle } from '../../src/components/LoginWithGoogle';

// Mock de useSupabaseConfig
const mockSignInWithOAuth = jest.fn();
jest.mock('../../src/hooks/useSupabaseConfig', () => ({
  getSupabase: () => ({
    auth: {
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

// Mock de useAuth
const mockSetUser = jest.fn();
jest.mock('../../src/stores/auth', () => ({
  useAuth: () => ({
    setUser: mockSetUser,
  }),
}));

describe('LoginWithGoogle Component', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    mockSignInWithOAuth.mockReset();
    // Mock de window.location
    delete window.location;
    window.location = { origin: 'http://localhost:3000', href: '' } as any;
  });

  test('renders Google login button', () => {
    render(<LoginWithGoogle />);
    
    const button = screen.getByText('Continuer avec Google');
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  test('shows loading state when clicked', () => {
    render(<LoginWithGoogle />);
    
    const button = screen.getByText('Continuer avec Google');
    fireEvent.click(button);
    
    // Vérifie que l'état de chargement est affiché
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('calls Supabase auth with correct parameters', () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    });
    
    render(<LoginWithGoogle />);
    fireEvent.click(screen.getByText('Continuer avec Google'));
    
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  });

  test('redirects to Google auth URL on success', () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth' },
      error: null,
    });
    
    render(<LoginWithGoogle />);
    fireEvent.click(screen.getByText('Continuer avec Google'));
    
    // Vérifie que la redirection a eu lieu
    expect(window.location.href).toBe('https://accounts.google.com/o/oauth2/auth');
  });

  test('shows error message on failure', async () => {
    mockSignInWithOAuth.mockRejectedValue(new Error('Google auth failed'));
    
    render(<LoginWithGoogle />);
    fireEvent.click(screen.getByText('Continuer avec Google'));
    
    // Attend que l'erreur soit affichée
    const errorMessage = await screen.findByText('Échec de la connexion avec Google');
    expect(errorMessage).toBeInTheDocument();
  });

  test('button is disabled while loading', () => {
    mockSignInWithOAuth.mockImplementation(() => new Promise(() => {}));
    
    render(<LoginWithGoogle />);
    const button = screen.getByText('Continuer avec Google');
    fireEvent.click(button);
    
    expect(button).toBeDisabled();
  });
});