import '@testing-library/jest-dom';
import 'openai/shims/node';

// Set up environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_OPENAI_API_KEY = 'test-openai-key';

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    href: 'http://localhost:3000/',
    reload: jest.fn()
  },
  writable: true
});
