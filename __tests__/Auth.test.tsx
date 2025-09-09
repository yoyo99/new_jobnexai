import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auth from '../src/components/Auth';
import { AuthService } from '@/lib/auth-service';
import { MemoryRouter, useNavigate } from 'react-router-dom';

// Mock the AuthService
jest.mock('@/lib/auth-service');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Auth Component', () => {
  const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

  test('renders login form by default', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  test('switches to sign up form', () => {
    renderComponent();
    fireEvent.click(screen.getByText(/créer un compte/i));
    expect(screen.getByPlaceholderText(/nom complet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /créer un compte/i })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    mockAuthService.signIn.mockResolvedValue({ user: { id: '123' } as any, error: null });
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    mockAuthService.signIn.mockResolvedValue({ user: null, error: { message: errorMessage } as any });
    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});