import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import Dashboard from '../src/components/Dashboard';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { id: 1, title: 'Software Engineer', company: 'Tech Corp', status: 'applied' },
            { id: 2, title: 'Frontend Developer', company: 'Web Co', status: 'interview' }
          ],
          error: null
        })
      })
    })
  }
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

// Initialize minimal i18n for tests
i18n.init({
  lng: 'fr',
  resources: {
    fr: { translation: {} },
    en: { translation: {} }
  },
  interpolation: { escapeValue: false }
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render dashboard with user stats', async () => {
    renderWithProviders(<Dashboard />);
    
    // Verify dashboard elements are present
    expect(screen.getByText(/dashboard.welcome/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard.stats/i)).toBeInTheDocument();
    });
  });

  test('should display job applications count', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      // Should show applications count
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  test('should handle loading state', () => {
    renderWithProviders(<Dashboard />);
    
    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('should handle error state gracefully', async () => {
    // Mock error response
    const mockSupabase = require('../src/lib/supabase').supabase;
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      })
    });

    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard.error/i)).toBeInTheDocument();
    });
  });
});
