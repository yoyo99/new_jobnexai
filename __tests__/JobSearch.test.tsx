import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import JobSearch from '../src/components/JobSearch';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 1,
                  title: 'Software Engineer',
                  company: 'Tech Corp',
                  location: 'Paris',
                  salary_min: 50000,
                  salary_max: 70000,
                  description: 'Great opportunity',
                  url: 'https://example.com/job1',
                  scraped_at: new Date().toISOString()
                }
              ],
              error: null
            })
          })
        })
      })
    }),
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { session_id: 'test-session' },
        error: null
      })
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

describe('JobSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render search form', () => {
    renderWithProviders(<JobSearch />);
    
    expect(screen.getByPlaceholderText(/jobSearch.searchPlaceholder/i)).toBeInTheDocument();
    expect(screen.getByText(/jobSearch.startScraping/i)).toBeInTheDocument();
  });

  test('should handle search input', () => {
    renderWithProviders(<JobSearch />);
    
    const searchInput = screen.getByPlaceholderText(/jobSearch.searchPlaceholder/i);
    fireEvent.change(searchInput, { target: { value: 'React Developer' } });
    
    expect(searchInput).toHaveValue('React Developer');
  });

  test('should start scraping when button clicked', async () => {
    renderWithProviders(<JobSearch />);
    
    const scrapingButton = screen.getByText(/jobSearch.startScraping/i);
    fireEvent.click(scrapingButton);
    
    await waitFor(() => {
      expect(screen.getByText(/jobSearch.scrapingInProgress/i)).toBeInTheDocument();
    });
  });

  test('should display job results', async () => {
    renderWithProviders(<JobSearch />);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });
  });

  test('should handle empty results', async () => {
    const mockSupabase = require('../src/lib/supabase').supabase;
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })
    });

    renderWithProviders(<JobSearch />);
    
    await waitFor(() => {
      expect(screen.getByText(/jobSearch.noResults/i)).toBeInTheDocument();
    });
  });
});
