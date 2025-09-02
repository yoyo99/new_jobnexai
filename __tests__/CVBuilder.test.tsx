import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import CVBuilder from '../src/components/cv/CVBuilder';

// Mock auth store
jest.mock('../src/stores/auth', () => ({
  useAuth: jest.fn(),
}));

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn(),
        }),
      }),
    }),
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

const { useAuth } = require('../src/stores/auth');

i18n.init({
  lng: 'fr',
  resources: { fr: { translation: {} }, en: { translation: {} } },
  interpolation: { escapeValue: false }
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <div data-testid="test-wrapper">
          {children}
        </div>
      </I18nextProvider>
    </BrowserRouter>
  );
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

describe('CVBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it('should render CV builder form', async () => {
    render(
      <TestWrapper>
        <CVBuilder />
      </TestWrapper>
    );
    expect(screen.getByText(/créateur de cv/i)).toBeInTheDocument()
    expect(screen.getByText(/formation/i)).toBeInTheDocument()
    expect(screen.getByText(/expérience professionnelle/i)).toBeInTheDocument()
    expect(screen.getByText(/compétences/i)).toBeInTheDocument()
  })

  it('should add new education item', async () => {
    render(
      <TestWrapper>
        <CVBuilder />
      </TestWrapper>
    );
    render(<CVBuilder />)
    const addButton = screen.getAllByText(/ajouter/i)[0]
    fireEvent.click(addButton)
    expect(screen.getByPlaceholderText(/titre du diplôme/i)).toBeInTheDocument()
  })

  test('saves CV successfully', async () => {
    const mockSupabase = require('../src/lib/supabase').supabase;
    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    mockSupabase.from.mockReturnValue({
      upsert: upsertMock,
    })

    render(<CVBuilder />)
    const saveButton = screen.getByText(/enregistrer le cv/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(upsertMock).toHaveBeenCalled()
    })
  })
})