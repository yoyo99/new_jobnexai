import React from 'react';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { Network } from '../src/components/Network';
import { useAuth } from '../src/stores/auth';
import { supabase } from '../src/lib/supabase';

jest.mock('../src/stores/auth');
jest.mock('../src/lib/supabase');

describe('Network Component', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockSupabase = supabase as jest.Mocked<any>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser });

    const fromMock = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: [], error: null } as any),
      update: jest.fn().mockResolvedValue({ data: [], error: null } as any),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockResolvedValue({ data: [], error: null } as any),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null } as any),
    };

    (mockSupabase.from as jest.Mock).mockReturnValue(fromMock);

    (mockSupabase.channel as jest.Mock).mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    });
  });

  test('renders network component', () => {
    render(<Network />);
    expect(screen.getByText(/réseau professionnel/i)).toBeInTheDocument();
    expect(screen.getByText(/connexions/i)).toBeInTheDocument();
    expect(screen.getByText(/messages/i)).toBeInTheDocument();
  });
});