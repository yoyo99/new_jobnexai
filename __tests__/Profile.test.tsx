import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import Profile from '../src/components/Profile';

// Mock Supabase
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      }),
      updateUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              full_name: 'Test User',
              phone: '+33123456789'
            },
            error: null
          })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: { id: 'test-user-id' },
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

describe('Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render profile form', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText(/profile.title/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });

  test('should handle profile update', async () => {
    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      const saveButton = screen.getByText(/profile.save/i);
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/profile.updateSuccess/i)).toBeInTheDocument();
    });
  });

  test('should handle update errors', async () => {
    const mockSupabase = require('../src/lib/supabase').supabase;
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              full_name: 'Test User'
            },
            error: null
          })
        })
      })
    });

    renderWithProviders(<Profile />);
    
    await waitFor(() => {
      const saveButton = screen.getByText(/profile.save/i);
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/profile.updateError/i)).toBeInTheDocument();
    });
  });
});
