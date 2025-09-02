import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { Footer } from '../../src/components/Footer';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  test('renders footer element', () => {
    renderWithRouter(<Footer />);
    
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
  });

  test('contains copyright information', () => {
    renderWithRouter(<Footer />);
    
    // Look for copyright text or year
    const copyrightElement = screen.queryByText(/©|copyright|2025/i);
    expect(copyrightElement).toBeTruthy();
  });

  test('contains footer links', () => {
    renderWithRouter(<Footer />);
    
    // Check for footer navigation links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
