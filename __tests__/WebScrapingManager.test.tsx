import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import WebScrapingManager from '../src/components/WebScrapingManager';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { session_id: 'test-session-123' },
        error: null
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [
              {
                id: 1,
                title: 'React Developer',
                company: 'Tech Startup',
                location: 'Remote',
                salary_min: 45000,
                salary_max: 65000,
                url: 'https://indeed.com/job/123',
                scraped_at: new Date().toISOString()
              }
            ],
            error: null
          })
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

describe('WebScrapingManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render scraping form', () => {
    renderWithProviders(<WebScrapingManager />);
    
    expect(screen.getByText(/webScraping.title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/webScraping.keywordsPlaceholder/i)).toBeInTheDocument();
  });

  test('should handle keyword input', () => {
    renderWithProviders(<WebScrapingManager />);
    
    const keywordInput = screen.getByPlaceholderText(/webScraping.keywordsPlaceholder/i);
    fireEvent.change(keywordInput, { target: { value: 'React, JavaScript' } });
    
    expect(keywordInput).toHaveValue('React, JavaScript');
  });

  test('should start scraping process', async () => {
    renderWithProviders(<WebScrapingManager />);
    
    const keywordInput = screen.getByPlaceholderText(/webScraping.keywordsPlaceholder/i);
    fireEvent.change(keywordInput, { target: { value: 'React Developer' } });
    
    const startButton = screen.getByText(/webScraping.startScraping/i);
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/webScraping.scrapingStarted/i)).toBeInTheDocument();
    });
  });

  test('should display scraped jobs', async () => {
    renderWithProviders(<WebScrapingManager />);
    
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
      expect(screen.getByText('Tech Startup')).toBeInTheDocument();
    });
  });

  test('should handle scraping errors', async () => {
    const mockSupabase = require('../src/lib/supabase').supabase;
    mockSupabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Scraping failed' }
    });

    renderWithProviders(<WebScrapingManager />);
    
    const startButton = screen.getByText(/webScraping.startScraping/i);
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/webScraping.error/i)).toBeInTheDocument();
    });
  });
});
