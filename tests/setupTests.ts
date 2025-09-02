import '@testing-library/jest-dom';

// Mock import.meta for Jest environment
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_OPENAI_API_KEY: 'test-openai-key'
      }
    }
  }
});

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    href: 'http://localhost:3000/',
    reload: jest.fn()
  },
  writable: true
});
