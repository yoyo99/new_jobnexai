import '@testing-library/jest-dom';

// Test formatting utility functions
describe('Formatter Utilities', () => {
  test('formatSalary displays salary ranges correctly', () => {
    const formatSalary = (salary: string | number) => {
      if (typeof salary === 'number') {
        return `€${salary.toLocaleString()}`;
      }
      if (salary.includes('-')) {
        const [min, max] = salary.split('-');
        return `€${parseInt(min).toLocaleString()} - €${parseInt(max).toLocaleString()}`;
      }
      return `€${parseInt(salary).toLocaleString()}`;
    };

    expect(formatSalary(50000)).toBe('€50,000');
    expect(formatSalary('40000-60000')).toBe('€40,000 - €60,000');
    expect(formatSalary('45000')).toBe('€45,000');
  });

  test('formatDate handles different date formats', () => {
    const formatDate = (date: string | Date, locale = 'fr-FR') => {
      return new Date(date).toLocaleDateString(locale);
    };

    const testDate = '2025-01-15';
    expect(formatDate(testDate)).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDate(testDate, 'en-US')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  test('formatJobType standardizes job type display', () => {
    const formatJobType = (type: string) => {
      const typeMap: Record<string, string> = {
        'full-time': 'Temps plein',
        'part-time': 'Temps partiel',
        'contract': 'Contrat',
        'internship': 'Stage',
        'freelance': 'Freelance'
      };
      return typeMap[type.toLowerCase()] || type;
    };

    expect(formatJobType('full-time')).toBe('Temps plein');
    expect(formatJobType('PART-TIME')).toBe('Temps partiel');
    expect(formatJobType('remote')).toBe('remote');
  });

  test('formatExperience converts years to readable format', () => {
    const formatExperience = (years: number) => {
      if (years === 0) return 'Débutant';
      if (years === 1) return '1 an d\'expérience';
      if (years < 5) return `${years} ans d\'expérience`;
      return `${years}+ ans d\'expérience`;
    };

    expect(formatExperience(0)).toBe('Débutant');
    expect(formatExperience(1)).toBe('1 an d\'expérience');
    expect(formatExperience(3)).toBe('3 ans d\'expérience');
    expect(formatExperience(8)).toBe('8+ ans d\'expérience');
  });
});
