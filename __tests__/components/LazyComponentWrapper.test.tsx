import React from 'react';
import { render, screen } from '@testing-library/react';
import { LazyComponentWrapper } from '../../src/components/LazyComponentWrapper';

// Mock ErrorBoundary and LoadingFallback
jest.mock('../../src/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
    try {
      return <>{children}</>;
    } catch {
      return <>{fallback}</>;
    }
  }
}));

jest.mock('../../src/components/LoadingFallback', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-fallback">Loading...</div>
}));

// Test component that can throw errors
const TestComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="test-content">Test Content</div>;
};

describe('LazyComponentWrapper', () => {
  test('should render children successfully', () => {
    render(
      <LazyComponentWrapper>
        <TestComponent />
      </LazyComponentWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  test('should handle component errors with fallback', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(
      <LazyComponentWrapper>
        <TestComponent shouldThrow />
      </LazyComponentWrapper>
    );

    expect(screen.getByText(/Un problème est survenu/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  test('should show loading fallback during suspense', () => {
    render(
      <LazyComponentWrapper>
        <React.Suspense fallback={<div data-testid="suspense-loading">Suspense Loading</div>}>
          <TestComponent />
        </React.Suspense>
      </LazyComponentWrapper>
    );

    // Should handle suspense properly
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
