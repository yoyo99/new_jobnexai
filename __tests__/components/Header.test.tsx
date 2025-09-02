import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../../src/components/Header';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}));

// Mock auth store
jest.mock('../../src/stores/auth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    logout: jest.fn(),
  })),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  test('renders header with navigation', () => {
    renderWithRouter(<Header />);
    
    // Check for common header elements
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  test('renders logo or brand name', () => {
    renderWithRouter(<Header />);
    
    // Look for logo or brand text
    const logoElement = screen.queryByText(/jobnex/i) || screen.queryByRole('img');
    expect(logoElement).toBeTruthy();
  });

  test('renders navigation links', () => {
    renderWithRouter(<Header />);
    
    // Check for navigation elements
    const navElement = screen.queryByRole('navigation');
    expect(navElement).toBeTruthy();
  });
});
