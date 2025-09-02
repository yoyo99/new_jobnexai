import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Test basic utility components that don't require complex dependencies

describe('Basic Component Tests', () => {
  test('renders basic button component', () => {
    const Button = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
      <button onClick={onClick} data-testid="button">
        {children}
      </button>
    );
    
    render(<Button>Click me</Button>);
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('renders basic card component', () => {
    const Card = ({ title, content }: { title: string; content: string }) => (
      <div data-testid="card" className="card">
        <h2 data-testid="card-title">{title}</h2>
        <p data-testid="card-content">{content}</p>
      </div>
    );
    
    render(<Card title="Test Title" content="Test Content" />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent('Test Title');
    expect(screen.getByTestId('card-content')).toHaveTextContent('Test Content');
  });

  test('renders basic form input', () => {
    const Input = ({ placeholder, value }: { placeholder: string; value?: string }) => (
      <input 
        data-testid="input"
        placeholder={placeholder}
        value={value}
        onChange={() => {}}
      />
    );
    
    render(<Input placeholder="Enter text" value="test value" />);
    expect(screen.getByTestId('input')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toHaveValue('test value');
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });
});
