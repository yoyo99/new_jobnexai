import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from '../../src/pages/NotFoundPage';

describe('NotFoundPage Component', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
  });

  test('renders the 404 heading', () => {
    const headingElement = screen.getByRole('heading', { name: /404/i });
    expect(headingElement).toBeInTheDocument();
  });

  test('renders the main error message', () => {
    const paragraphElement = screen.getByText(/Désolé, la page que vous cherchez n'existe pas./i);
    expect(paragraphElement).toBeInTheDocument();
  });

  test('renders a link to go back to the homepage', () => {
    const linkElement = screen.getByRole('link', { name: /Retour à l'accueil/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/');
  });
});
