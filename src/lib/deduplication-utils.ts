// Deduplication utilities for job scraping
// Provides hash generation and duplicate detection algorithms

import { createHash } from 'crypto';

export interface JobWithHash {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  url: string;
  postedAt: string;
  scrapedAt: string;
  deduplicationHash: string;
  isDuplicate?: boolean;
  duplicateOfId?: string | null;
  processingStatus?: 'raw' | 'processed' | 'deduplicated' | 'merged' | 'rejected';
}

export interface DeduplicationStatistics {
  totalJobs: number;
  uniqueJobs: number;
  duplicatesRemoved: number;
  duplicateRate: number;
}

export interface DeduplicationResult {
  deduplicated: JobWithHash[];
  duplicates: JobWithHash[];
  statistics: DeduplicationStatistics;
}

export interface DuplicateGroup {
  primary: JobWithHash;
  duplicates: JobWithHash[];
}

/**
 * Generate a consistent hash for job deduplication
 * Uses title, company, and location (normalized)
 */
export function generateJobHash(
  title: string | null | undefined,
  company: string | null | undefined,
  location: string | null | undefined
): string {
  // Normalize inputs: trim whitespace, lowercase, handle null/undefined
  const normalizedTitle = normalizeString(title);
  const normalizedCompany = normalizeString(company);
  const normalizedLocation = normalizeString(location);

  // Create hash input
  const hashInput = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`;
  
  // Generate SHA-256 hash
  return createHash('sha256').update(hashInput, 'utf8').digest('hex');
}

/**
 * Normalize string for consistent hashing
 */
function normalizeString(input: string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }
  
  return input.trim().toLowerCase();
}

/**
 * Group jobs by their deduplication hash
 */
export function groupJobsByHash(jobs: JobWithHash[]): Record<string, JobWithHash[]> {
  const groups: Record<string, JobWithHash[]> = {};
  
  for (const job of jobs) {
    if (!job.deduplicationHash) {
      throw new Error('Job missing deduplication hash');
    }
    
    const hash = job.deduplicationHash;
    if (!groups[hash]) {
      groups[hash] = [];
    }
    groups[hash].push(job);
  }
  
  return groups;
}

/**
 * Select primary job from a group of duplicates
 * Prefers earliest scraped job, then earliest posted job
 */
export function selectPrimaryJobs(jobs: JobWithHash[]): JobWithHash[] {
  if (jobs.length === 0) {
    return [];
  }
  
  if (jobs.length === 1) {
    return [jobs[0]];
  }
  
  // Sort by scraped date (earliest first), then by posted date
  const sortedJobs = [...jobs].sort((a, b) => {
    const scrapeTimeA = new Date(a.scrapedAt).getTime();
    const scrapeTimeB = new Date(b.scrapedAt).getTime();
    
    if (scrapeTimeA !== scrapeTimeB) {
      return scrapeTimeA - scrapeTimeB;
    }
    
    // If scrape times are equal, use posted date
    const postedTimeA = new Date(a.postedAt).getTime();
    const postedTimeB = new Date(b.postedAt).getTime();
    
    return postedTimeA - postedTimeB;
  });
  
  return [sortedJobs[0]!];
}

/**
 * Mark duplicates in relation to primary job
 */
export function markDuplicates(
  primaryJob: JobWithHash, 
  duplicateJobs: JobWithHash[]
): { primary: JobWithHash; duplicates: JobWithHash[] } {
  const markedPrimary: JobWithHash = {
    ...primaryJob,
    isDuplicate: false,
    duplicateOfId: null
  };
  
  const markedDuplicates: JobWithHash[] = duplicateJobs.map(duplicate => ({
    ...duplicate,
    isDuplicate: true,
    duplicateOfId: primaryJob.id,
    processingStatus: 'deduplicated' as const
  }));
  
  return {
    primary: markedPrimary,
    duplicates: markedDuplicates
  };
}

/**
 * Complete deduplication workflow
 * Takes array of jobs and returns deduplicated result
 */
export function deduplicateJobs(jobs: any[]): DeduplicationResult {
  if (jobs.length === 0) {
    return {
      deduplicated: [],
      duplicates: [],
      statistics: {
        totalJobs: 0,
        uniqueJobs: 0,
        duplicatesRemoved: 0,
        duplicateRate: 0
      }
    };
  }
  
  // Add deduplication hashes to all jobs
  const jobsWithHashes: JobWithHash[] = jobs.map(job => ({
    ...job,
    deduplicationHash: generateJobHash(job.title, job.company, job.location)
  }));
  
  // Group jobs by hash
  const groups = groupJobsByHash(jobsWithHashes);
  
  const deduplicated: JobWithHash[] = [];
  const duplicates: JobWithHash[] = [];
  
  // Process each group
  for (const [hash, group] of Object.entries(groups)) {
    if (group.length === 1) {
      // No duplicates
      const job = group[0]!;
      deduplicated.push({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
        postedAt: job.postedAt,
        scrapedAt: job.scrapedAt,
        deduplicationHash: job.deduplicationHash,
        isDuplicate: false,
        duplicateOfId: null,
        processingStatus: job.processingStatus || 'raw',
        processingErrors: job.processingErrors
      });
    } else {
      // Handle duplicates
      const primaryJobs = selectPrimaryJobs(group);
      const primaryJob = primaryJobs[0]!;
      const duplicateJobs = group.filter(job => job.id !== primaryJob.id);
      
      const marked = markDuplicates(primaryJob, duplicateJobs);
      
      deduplicated.push(marked.primary);
      duplicates.push(...marked.duplicates);
    }
  }
  
  // Calculate statistics
  const statistics: DeduplicationStatistics = {
    totalJobs: jobs.length,
    uniqueJobs: deduplicated.length,
    duplicatesRemoved: duplicates.length,
    duplicateRate: jobs.length > 0 ? duplicates.length / jobs.length : 0
  };
  
  return {
    deduplicated,
    duplicates,
    statistics
  };
}

/**
 * Find similar jobs using fuzzy matching (optional enhancement)
 */
export function findSimilarJobs(
  targetJob: JobWithHash, 
  candidateJobs: JobWithHash[], 
  threshold: number = 0.8
): JobWithHash[] {
  // This is a placeholder for future fuzzy matching implementation
  // Could use Levenshtein distance or other similarity algorithms
  return [];
}

/**
 * Calculate similarity score between two job titles
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  // Simple similarity based on common words
  const words1 = new Set(normalizeString(title1).split(/\s+/));
  const words2 = new Set(normalizeString(title2).split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Check if two locations refer to the same place
 */
export function areSimilarLocations(loc1: string | undefined, loc2: string | undefined): boolean {
  if (!loc1 || !loc2) {
    return false;
  }
  
  const normalized1 = normalizeString(loc1);
  const normalized2 = normalizeString(loc2);
  
  // Exact match
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Handle common variations (e.g., "Paris, France" vs "Paris, FR")
  const cityPattern = /^([a-z\s]+),?\s*(france|fr|île-de-france)?$/i;
  
  const match1 = normalized1.match(cityPattern);
  const match2 = normalized2.match(cityPattern);
  
  if (match1 && match2) {
    return match1[1].trim() === match2[1].trim();
  }
  
  return false;
}

/**
 * Validate deduplication result consistency
 */
export function validateDeduplicationResult(result: DeduplicationResult): boolean {
  const { deduplicated, duplicates, statistics } = result;
  
  // Check statistics consistency
  if (statistics.totalJobs !== deduplicated.length + duplicates.length) {
    return false;
  }
  
  if (statistics.uniqueJobs !== deduplicated.length) {
    return false;
  }
  
  if (statistics.duplicatesRemoved !== duplicates.length) {
    return false;
  }
  
  // Check no duplicates in deduplicated list
  const dedupedHashes = deduplicated.map(job => job.deduplicationHash);
  if (new Set(dedupedHashes).size !== dedupedHashes.length) {
    return false;
  }
  
  // Check all deduplicated jobs are marked as non-duplicates
  if (deduplicated.some(job => job.isDuplicate === true)) {
    return false;
  }
  
  // Check all duplicates are properly marked
  if (duplicates.some(duplicate => 
    duplicate.isDuplicate !== true || 
    duplicate.duplicateOfId === null ||
    duplicate.duplicateOfId === undefined
  )) {
    return false;
  }
  
  // Check all duplicates reference existing primary jobs
  const primaryIds = new Set(deduplicated.map(job => job.id));
  if (duplicates.some(duplicate => !primaryIds.has(duplicate.duplicateOfId!))) {
    return false;
  }
  
  return true;
}
