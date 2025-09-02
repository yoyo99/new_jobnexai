import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

// Initialize i18n for tests
i18n.init({
  lng: 'fr',
  resources: {
    fr: { translation: {} },
    en: { translation: {} }
  },
  interpolation: { escapeValue: false }
});

// Common test wrapper with all providers
export const renderWithProviders = (component: React.ReactElement, options?: RenderOptions) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>,
    options
  );
};

// Mock user data for tests
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  subscription_status: 'active'
};

// Mock job data for tests
export const mockJob = {
  id: 1,
  title: 'Software Engineer',
  company: 'Tech Corp',
  location: 'Paris',
  salary_min: 50000,
  salary_max: 70000,
  description: 'Great opportunity for a developer',
  url: 'https://indeed.com/job/123',
  scraped_at: new Date().toISOString()
};

// Mock Supabase responses
export const mockSupabaseSuccess = (data: any) => ({
  data,
  error: null
});

export const mockSupabaseError = (message: string) => ({
  data: null,
  error: { message }
});

// Common mock setup for Supabase
export const setupSupabaseMocks = () => {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue(mockSupabaseSuccess({ user: mockUser })),
      signOut: jest.fn().mockResolvedValue(mockSupabaseSuccess({})),
      updateUser: jest.fn().mockResolvedValue(mockSupabaseSuccess({ user: mockUser }))
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockSupabaseSuccess([mockJob]))
          }),
          single: jest.fn().mockResolvedValue(mockSupabaseSuccess(mockUser))
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockSupabaseSuccess([mockJob]))
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue(mockSupabaseSuccess([mockUser]))
      })
    }),
    functions: {
      invoke: jest.fn().mockResolvedValue(mockSupabaseSuccess({ session_id: 'test-session' }))
    }
  };
};
