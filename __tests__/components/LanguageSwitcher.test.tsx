import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock LanguageSwitcher component
const LanguageSwitcher = () => {
  const [language, setLanguage] = React.useState('en');
  
  return (
    <div data-testid="language-switcher">
      <select 
        data-testid="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
      </select>
      <span data-testid="current-language">{language}</span>
    </div>
  );
};

describe('LanguageSwitcher Component', () => {
  test('renders language selector', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('language-select')).toBeInTheDocument();
  });

  test('changes language when option is selected', () => {
    render(<LanguageSwitcher />);
    
    const select = screen.getByTestId('language-select');
    fireEvent.change(select, { target: { value: 'fr' } });
    
    expect(screen.getByTestId('current-language')).toHaveTextContent('fr');
  });

  test('displays available language options', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });
});
