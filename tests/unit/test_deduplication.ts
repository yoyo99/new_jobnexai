// Unit test for deduplication logic
// Tests hash generation, duplicate detection, and grouping algorithms

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  generateJobHash, 
  groupJobsByHash, 
  selectPrimaryJobs, 
  markDuplicates,
  DeduplicationResult 
} from '../../src/lib/deduplication-utils';

describe('Deduplication Logic Unit Tests', () => {
  const sampleJobs = [
    {
      id: 'job-1',
      title: 'Senior Software Engineer',
      company: 'TechCorp',
      location: 'Paris, France',
      description: 'Develop scalable web applications using React and Node.js',
      url: 'https://techcorp.com/jobs/123',
      postedAt: '2024-01-15T10:00:00Z',
      scrapedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'job-2',
      title: 'Senior Software Engineer',
      company: 'TechCorp',
      location: 'Paris, France',
      description: 'Develop scalable web applications using React and Node.js',
      url: 'https://linkedin.com/jobs/view/456',
      postedAt: '2024-01-15T10:00:00Z',
      scrapedAt: '2024-01-15T10:31:00Z'
    },
    {
      id: 'job-3',
      title: 'Senior Software Engineer',
      company: 'TechCorp',
      location: 'Paris, FR', // Different formatting
      description: 'Develop scalable web applications using React and Node.js',
      url: 'https://indeed.com/jobs/789',
      postedAt: '2024-01-15T10:00:00Z',
      scrapedAt: '2024-01-15T10:32:00Z'
    },
    {
      id: 'job-4',
      title: 'Frontend Developer',
      company: 'WebAgency',
      location: 'Lyon, France',
      description: 'Build responsive user interfaces with modern CSS',
      url: 'https://webagency.com/jobs/321',
      postedAt: '2024-01-14T15:00:00Z',
      scrapedAt: '2024-01-15T11:00:00Z'
    },
    {
      id: 'job-5',
      title: 'Senior Software Engineer',
      company: 'TechCorp Paris', // Slightly different company name
      location: 'Paris, France',
      description: 'Develop scalable web applications using React and Node.js',
      url: 'https://glassdoor.com/jobs/654',
      postedAt: '2024-01-15T09:00:00Z', // Earlier posting
      scrapedAt: '2024-01-15T10:33:00Z'
    }
  ];

  describe('Hash Generation', () => {
    it('should generate consistent hashes for identical jobs', () => {
      const job1 = sampleJobs[0];
      const job2 = sampleJobs[1];
      
      const hash1 = generateJobHash(job1.title, job1.company, job1.location);
      const hash2 = generateJobHash(job2.title, job2.company, job2.location);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });

    it('should generate different hashes for different jobs', () => {
      const job1 = sampleJobs[0];
      const job4 = sampleJobs[3];
      
      const hash1 = generateJobHash(job1.title, job1.company, job1.location);
      const hash2 = generateJobHash(job4.title, job4.company, job4.location);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle whitespace and case differences', () => {
      const hash1 = generateJobHash('Senior Engineer', 'TechCorp', 'Paris');
      const hash2 = generateJobHash('  Senior Engineer  ', 'TECHCORP', 'paris');
      
      expect(hash1).toBe(hash2);
    });

    it('should handle null/undefined values gracefully', () => {
      const hash1 = generateJobHash('Developer', null, undefined);
      const hash2 = generateJobHash('Developer', '', '');
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be deterministic across multiple calls', () => {
      const job = sampleJobs[0];
      const hashes = Array.from({ length: 10 }, () => 
        generateJobHash(job.title, job.company, job.location)
      );
      
      expect(hashes.every(hash => hash === hashes[0])).toBe(true);
    });
  });

  describe('Job Grouping', () => {
    it('should group jobs by hash correctly', () => {
      const jobsWithHashes = sampleJobs.map(job => ({
        ...job,
        deduplicationHash: generateJobHash(job.title, job.company, job.location)
      }));
      
      const groups = groupJobsByHash(jobsWithHashes);
      
      // Should have 3 groups: TechCorp jobs (3), WebAgency job (1), TechCorp Paris job (1)
      expect(Object.keys(groups)).toHaveLength(3);
      
      // Find the TechCorp group
      const techCorpHash = generateJobHash('Senior Software Engineer', 'TechCorp', 'Paris');
      expect(groups[techCorpHash]).toHaveLength(3);
      
      // Verify all TechCorp jobs are in the same group
      const techCorpGroup = groups[techCorpHash];
      expect(techCorpGroup.map(j => j.id)).toContain('job-1');
      expect(techCorpGroup.map(j => j.id)).toContain('job-2');
      expect(techCorpGroup.map(j => j.id)).toContain('job-3');
    });

    it('should handle empty job list', () => {
      const groups = groupJobsByHash([]);
      expect(groups).toEqual({});
    });

    it('should handle jobs without hashes', () => {
      const jobsWithoutHashes = sampleJobs.map(job => ({ ...job }));
      
      expect(() => {
        groupJobsByHash(jobsWithoutHashes);
      }).toThrow('Job missing deduplication hash');
    });
  });

  describe('Primary Job Selection', () => {
    it('should select earliest scraped job as primary', () => {
      const duplicateGroup = [
        sampleJobs[0], // scraped at 10:30:00
        sampleJobs[1], // scraped at 10:31:00
        sampleJobs[2]  // scraped at 10:32:00
      ];
      
      const primary = selectPrimaryJobs(duplicateGroup);
      
      expect(primary).toHaveLength(1);
      expect(primary[0].id).toBe('job-1'); // Earliest scraped
    });

    it('should handle ties by selecting first in array', () => {
      const sameTimeJobs = [
        { ...sampleJobs[0], scrapedAt: '2024-01-15T10:30:00Z' },
        { ...sampleJobs[1], scrapedAt: '2024-01-15T10:30:00Z' }
      ];
      
      const primary = selectPrimaryJobs(sameTimeJobs);
      
      expect(primary).toHaveLength(1);
      expect(primary[0].id).toBe('job-1');
    });

    it('should return single job for non-duplicate group', () => {
      const singleJob = [sampleJobs[3]];
      
      const primary = selectPrimaryJobs(singleJob);
      
      expect(primary).toHaveLength(1);
      expect(primary[0].id).toBe('job-4');
    });

    it('should prefer earlier posting date when scrape times are equal', () => {
      const sameScrapeTimeJobs = [
        { ...sampleJobs[0], postedAt: '2024-01-15T10:00:00Z', scrapedAt: '2024-01-15T10:30:00Z' },
        { ...sampleJobs[1], postedAt: '2024-01-15T09:00:00Z', scrapedAt: '2024-01-15T10:30:00Z' }
      ];
      
      const primary = selectPrimaryJobs(sameScrapeTimeJobs);
      
      expect(primary[0].id).toBe('job-2'); // Earlier posting date
    });
  });

  describe('Duplicate Marking', () => {
    it('should mark duplicates correctly', () => {
      const primaryJob = sampleJobs[0];
      const duplicateJobs = [sampleJobs[1], sampleJobs[2]];
      
      const marked = markDuplicates(primaryJob, duplicateJobs);
      
      expect(marked.primary).toEqual({
        ...primaryJob,
        isDuplicate: false,
        duplicateOfId: null
      });
      
      expect(marked.duplicates).toHaveLength(2);
      marked.duplicates.forEach((duplicate, index) => {
        expect(duplicate.isDuplicate).toBe(true);
        expect(duplicate.duplicateOfId).toBe(primaryJob.id);
        expect(duplicate.processingStatus).toBe('deduplicated');
      });
    });

    it('should handle empty duplicate list', () => {
      const primaryJob = sampleJobs[0];
      
      const marked = markDuplicates(primaryJob, []);
      
      expect(marked.duplicates).toHaveLength(0);
      expect(marked.primary.isDuplicate).toBe(false);
    });
  });

  describe('Complete Deduplication Workflow', () => {
    it('should deduplicate mixed job list correctly', () => {
      const result = deduplicateJobs(sampleJobs) as DeduplicationResult;
      
      expect(result.deduplicated).toHaveLength(3); // One job per unique hash
      expect(result.duplicates).toHaveLength(2);
      
      // Verify no duplicates in deduplicated list
      const dedupedHashes = result.deduplicated.map(j => j.deduplicationHash);
      expect(new Set(dedupedHashes).size).toBe(dedupedHashes.length);
      
      // Verify all duplicates are marked correctly
      result.duplicates.forEach(duplicate => {
        expect(duplicate.isDuplicate).toBe(true);
        expect(duplicate.duplicateOfId).toBeDefined();
        expect(result.deduplicated.some(primary => 
          primary.id === duplicate.duplicateOfId
        )).toBe(true);
      });
      
      // Verify primary jobs are not marked as duplicates
      result.deduplicated.forEach(primary => {
        expect(primary.isDuplicate).toBe(false);
        expect(primary.duplicateOfId).toBeNull();
      });
    });

    it('should preserve original job order for non-duplicates', () => {
      const uniqueJobs = [sampleJobs[0], sampleJobs[3], sampleJobs[4]];
      
      const result = deduplicateJobs(uniqueJobs) as DeduplicationResult;
      
      expect(result.deduplicated).toHaveLength(3);
      expect(result.deduplicated.map(j => j.id)).toEqual(['job-1', 'job-4', 'job-5']);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should handle large job lists efficiently', () => {
      const largeJobList = Array.from({ length: 1000 }, (_, i) => ({
        id: `job-${i}`,
        title: `Software Engineer ${i}`,
        company: 'TechCorp',
        location: 'Paris, France',
        description: 'Job description',
        url: `https://example.com/job/${i}`,
        postedAt: '2024-01-15T10:00:00Z',
        scrapedAt: `2024-01-15T10:${String(i).padStart(2, '0')}:00Z`
      }));
      
      const startTime = Date.now();
      const result = deduplicateJobs(largeJobList) as DeduplicationResult;
      const endTime = Date.now();
      
      // Should complete within reasonable time (< 1 second for 1000 jobs)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.deduplicated).toHaveLength(1000); // All unique
      expect(result.duplicates).toHaveLength(0);
    });

    it('should provide deduplication statistics', () => {
      const result = deduplicateJobs(sampleJobs) as DeduplicationResult;
      
      expect(result.statistics).toBeDefined();
      expect(result.statistics.totalJobs).toBe(5);
      expect(result.statistics.uniqueJobs).toBe(3);
      expect(result.statistics.duplicatesRemoved).toBe(2);
      expect(result.statistics.duplicateRate).toBeCloseTo(0.4, 1); // 2/5 = 40%
    });
  });

  describe('Edge Cases', () => {
    it('should handle jobs with missing required fields', () => {
      const incompleteJobs = [
        { id: 'job-1', title: 'Developer', company: '', location: null },
        { id: 'job-2', title: null, company: 'TechCorp', location: 'Paris' },
        { id: 'job-3', title: 'Developer', company: 'TechCorp', location: undefined }
      ];
      
      expect(() => {
        deduplicateJobs(incompleteJobs);
      }).not.toThrow();
      
      const result = deduplicateJobs(incompleteJobs) as DeduplicationResult;
      expect(result.deduplicated.length + result.duplicates.length).toBe(3);
    });

    it('should handle jobs with special characters', () => {
      const specialJobs = [
        {
          id: 'job-1',
          title: 'Développeur Senior @ C++/Python',
          company: 'TechCorp™',
          location: 'Paris, Île-de-France',
          description: 'Special chars test',
          url: 'https://example.com/1',
          postedAt: '2024-01-15T10:00:00Z',
          scrapedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 'job-2',
          title: 'développeur senior @ c++/python', // Different case
          company: 'techcorp™',
          location: 'paris, île-de-france',
          description: 'Special chars test',
          url: 'https://example.com/2',
          postedAt: '2024-01-15T10:00:00Z',
          scrapedAt: '2024-01-15T10:31:00Z'
        }
      ];
      
      const result = deduplicateJobs(specialJobs) as DeduplicationResult;
      
      expect(result.deduplicated).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should handle extremely long job titles', () => {
      const longTitle = 'Senior '.repeat(100) + 'Software Engineer';
      const longJobs = [
        { ...sampleJobs[0], title: longTitle },
        { ...sampleJobs[1], title: longTitle }
      ];
      
      const result = deduplicateJobs(longJobs) as DeduplicationResult;
      
      expect(result.deduplicated).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
    });
  });
});

// Helper function for complete workflow test (will be implemented in deduplication-utils.ts)
function deduplicateJobs(jobs: any[]): DeduplicationResult | any[] {
  // This is a placeholder - the actual implementation will be in deduplication-utils.ts
  // For now, return empty array to make the test fail (proper TDD)
  return [];
}
