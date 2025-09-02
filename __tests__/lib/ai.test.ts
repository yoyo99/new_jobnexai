import '@testing-library/jest-dom';

// Test AI utility functions
describe('AI Utility Functions', () => {
  test('analyzeJobMatch calculates compatibility score', () => {
    const analyzeJobMatch = (cv: any, job: any) => {
      // Simple mock implementation
      const skills = cv.skills || [];
      const requiredSkills = job.requirements || [];
      
      if (skills.length === 0 || requiredSkills.length === 0) return 0;
      
      const matches = skills.filter((skill: string) => 
        requiredSkills.some((req: string) => 
          req.toLowerCase().includes(skill.toLowerCase())
        )
      ).length;
      
      return Math.round((matches / requiredSkills.length) * 100);
    };

    const mockCV = {
      skills: ['JavaScript', 'React', 'Node.js']
    };
    
    const mockJob = {
      requirements: ['JavaScript', 'React', 'TypeScript']
    };
    
    const score = analyzeJobMatch(mockCV, mockJob);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('extractKeywords from job description', () => {
    const extractKeywords = (text: string) => {
      const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      return text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word))
        .slice(0, 10);
    };

    const jobDescription = 'We are looking for a skilled JavaScript developer with React experience';
    const keywords = extractKeywords(jobDescription);
    
    expect(keywords).toContain('javascript');
    expect(keywords).toContain('developer');
    expect(keywords).toContain('react');
    expect(keywords).toContain('experience');
  });

  test('generateCoverLetterPrompt creates structured prompt', () => {
    const generateCoverLetterPrompt = (cv: any, job: any) => {
      return `Generate a cover letter for ${cv.name} applying to ${job.title} at ${job.company}. 
Skills: ${cv.skills?.join(', ') || 'N/A'}
Requirements: ${job.requirements?.join(', ') || 'N/A'}`;
    };

    const mockCV = {
      name: 'John Doe',
      skills: ['JavaScript', 'React']
    };
    
    const mockJob = {
      title: 'Frontend Developer',
      company: 'Tech Corp',
      requirements: ['JavaScript', 'React', 'CSS']
    };
    
    const prompt = generateCoverLetterPrompt(mockCV, mockJob);
    
    expect(prompt).toContain('John Doe');
    expect(prompt).toContain('Frontend Developer');
    expect(prompt).toContain('Tech Corp');
    expect(prompt).toContain('JavaScript, React');
  });
});
