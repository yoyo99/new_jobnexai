import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../src/lib/supabase';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  test('should create Supabase client with correct configuration', () => {
    const mockClient = {
      auth: { getUser: jest.fn() },
      from: jest.fn()
    };
    
    mockCreateClient.mockReturnValue(mockClient as any);
    
    // Import after mocking
    require('../../src/lib/supabase');
    
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    );
  });

  test('should handle missing environment variables', () => {
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    
    // Should not throw when environment variables are missing
    expect(() => require('../../src/lib/supabase')).not.toThrow();
  });

  test('should export supabase client', () => {
    expect(supabase).toBeDefined();
  });
});
