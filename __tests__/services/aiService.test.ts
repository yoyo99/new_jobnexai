import '@testing-library/jest-dom';

// Mock AI service functions
describe('AI Service Functions', () => {
  test('analyzeCV extracts key information', () => {
    const analyzeCV = (cvText: string) => {
      const skills = cvText.match(/skills?:\s*([^.\n]+)/i)?.[1]?.split(',').map(s => s.trim()) || [];
      const experience = cvText.match(/(\d+)\s*years?\s*experience/i)?.[1] || '0';
      const education = cvText.match(/education:\s*([^.\n]+)/i)?.[1] || '';
      
      return {
        skills,
        experience: parseInt(experience),
        education,
        summary: cvText.substring(0, 100) + '...'
      };
    };

    const mockCVText = 'John Doe. Skills: JavaScript, React, Node.js. 5 years experience in web development. Education: Computer Science degree.';
    const analysis = analyzeCV(mockCVText);
    
    expect(analysis.skills).toContain('JavaScript');
    expect(analysis.skills).toContain('React');
    expect(analysis.experience).toBe(5);
    expect(analysis.education).toContain('Computer Science');
  });

  test('generateJobRecommendations scores jobs', () => {
    const generateJobRecommendations = (userProfile: any, jobs: any[]) => {
      return jobs.map(job => {
        const skillMatches = userProfile.skills.filter((skill: string) =>
          job.requirements.some((req: string) => 
            req.toLowerCase().includes(skill.toLowerCase())
          )
        ).length;
        
        const score = Math.min(100, (skillMatches / job.requirements.length) * 100);
        
        return {
          ...job,
          matchScore: Math.round(score)
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
    };

    const userProfile = {
      skills: ['JavaScript', 'React', 'Python']
    };
    
    const jobs = [
      { id: '1', title: 'Frontend Dev', requirements: ['JavaScript', 'React', 'CSS'] },
      { id: '2', title: 'Backend Dev', requirements: ['Python', 'Django', 'PostgreSQL'] },
      { id: '3', title: 'Full Stack', requirements: ['JavaScript', 'Python', 'React', 'Node.js'] }
    ];
    
    const recommendations = generateJobRecommendations(userProfile, jobs);
    
    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].matchScore).toBeGreaterThanOrEqual(recommendations[1].matchScore);
    expect(recommendations[1].matchScore).toBeGreaterThanOrEqual(recommendations[2].matchScore);
  });

  test('optimizeCVForJob suggests improvements', () => {
    const optimizeCVForJob = (cv: any, job: any) => {
      const missingSkills = job.requirements.filter((req: string) =>
        !cv.skills.some((skill: string) => 
          skill.toLowerCase().includes(req.toLowerCase())
        )
      );
      
      const suggestions = missingSkills.map(skill => 
        `Consider highlighting your ${skill} experience`
      );
      
      return {
        score: Math.round(((job.requirements.length - missingSkills.length) / job.requirements.length) * 100),
        suggestions,
        missingSkills
      };
    };

    const cv = { skills: ['JavaScript', 'React'] };
    const job = { requirements: ['JavaScript', 'React', 'TypeScript', 'Node.js'] };
    
    const optimization = optimizeCVForJob(cv, job);
    
    expect(optimization.score).toBe(50); // 2 out of 4 requirements
    expect(optimization.missingSkills).toContain('TypeScript');
    expect(optimization.missingSkills).toContain('Node.js');
    expect(optimization.suggestions).toHaveLength(2);
  });
});
