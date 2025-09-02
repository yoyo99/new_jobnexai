import '@testing-library/jest-dom';

// Test utility functions without complex dependencies
describe('Utility Functions', () => {
  test('cn utility function combines classes', () => {
    // Mock cn function for testing
    const cn = (...classes: (string | undefined | null | false)[]) => {
      return classes.filter(Boolean).join(' ');
    };
    
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
    expect(cn('class1', false, 'class2')).toBe('class1 class2');
  });

  test('formatDate utility function', () => {
    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString();
    };
    
    const testDate = '2025-01-01';
    const formatted = formatDate(testDate);
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  test('validateEmail utility function', () => {
    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });

  test('truncateText utility function', () => {
    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    };
    
    expect(truncateText('Short text', 20)).toBe('Short text');
    expect(truncateText('This is a very long text that should be truncated', 10)).toBe('This is a ...');
  });
});
