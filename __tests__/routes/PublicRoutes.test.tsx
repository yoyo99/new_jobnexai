import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { PublicRoutes } from '../../src/routes/PublicRoutes';
import i18n from 'i18next';

// Mock all lazy-loaded components
jest.mock('../../src/pages/LandingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="landing-page">Landing Page</div>
}));

jest.mock('../../src/components/SupabaseAuth', () => ({
  __esModule: true,
  default: () => <div data-testid="auth-page">Auth Page</div>
}));

jest.mock('../../src/pages/PricingPage', () => ({
  __esModule: true,
  default: () => <div data-testid="pricing-page">Pricing Page</div>
}));

jest.mock('../../src/components/PrivacyPolicy', () => ({
  __esModule: true,
  default: () => <div data-testid="privacy-page">Privacy Policy</div>
}));

jest.mock('../../src/components/pages/FeaturesPage', () => ({
  __esModule: true,
  default: () => <div data-testid="features-page">Features Page</div>
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

i18n.init({
  lng: 'fr',
  resources: { fr: { translation: {} }, en: { translation: {} } },
  interpolation: { escapeValue: false }
});

const renderWithProviders = (initialRoute = '/') => {
  window.history.pushState({}, 'Test page', initialRoute);
  
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <PublicRoutes />
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('PublicRoutes', () => {
  test('should render landing page for root route', () => {
    renderWithProviders('/');
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  test('should render auth page for login route', () => {
    renderWithProviders('/login');
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  test('should render pricing page', () => {
    renderWithProviders('/pricing');
    expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
  });

  test('should render privacy policy page', () => {
    renderWithProviders('/privacy');
    expect(screen.getByTestId('privacy-page')).toBeInTheDocument();
  });

  test('should render features page', () => {
    renderWithProviders('/features');
    expect(screen.getByTestId('features-page')).toBeInTheDocument();
  });
});
