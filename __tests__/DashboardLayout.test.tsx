import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { DashboardLayout } from '../src/components/DashboardLayout';
import { useAuth } from '../src/stores/auth';

// Mock child components
jest.mock('../src/components/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div>LanguageSwitcher</div> }));
jest.mock('../src/components/NotificationCenter', () => ({ NotificationCenter: () => <div>NotificationCenter</div> }));

jest.mock('../src/stores/auth', () => ({
  useAuth: jest.fn()
}));

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null })
    }
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

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

i18n.init({
  lng: 'fr',
  resources: { fr: { translation: {} }, en: { translation: {} } },
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

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn()
    });
  });

  test('should render navigation menu', () => {
    renderWithProviders(<DashboardLayout />);
    
    expect(screen.getByText(/dashboard.nav.dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.nav.jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.nav.cv/i)).toBeInTheDocument();
  });

  test('should handle navigation clicks', () => {
    renderWithProviders(<DashboardLayout />);
    
    const jobsLink = screen.getByText(/dashboard.nav.jobs/i);
    fireEvent.click(jobsLink);
    
    expect(window.location.pathname).toBe('/');
  });

  test('should display user email in header', () => {
    renderWithProviders(<DashboardLayout />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('should handle logout', async () => {
    const mockSignOut = jest.fn();
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'test@example.com' },
      loading: false,
      signIn: jest.fn(),
      signOut: mockSignOut,
      signUp: jest.fn()
    });

    renderWithProviders(<DashboardLayout />);
    
    const logoutButton = screen.getByText(/dashboard.logout/i);
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  test('should show mobile menu toggle', () => {
    renderWithProviders(<DashboardLayout />);
    
    const menuToggle = screen.getByLabelText(/dashboard.mobileMenu/i);
    expect(menuToggle).toBeInTheDocument();
  });
});
