// Scraping Service Interfaces
// Base interfaces for the n8n scraping system integration

export interface ScrapingSearchCriteria {
  search?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: 'junior' | 'mid' | 'senior' | 'not_specified';
  salaryMin?: number;
  salaryMax?: number;
  remote?: 'remote' | 'hybrid' | 'onsite';
  currency?: string;
}

export interface ScrapingSession {
  id: string;
  userId: string;
  searchCriteria: ScrapingSearchCriteria;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  jobsFound: number;
  jobsDeduplicated: number;
  errorMessage?: string;
  metadata: Record<string, any>;
  triggerToWebhookMs?: number;
  webhookToCompletionMs?: number;
}

export interface ScrapingSource {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  apiEndpoint?: string;
  authType: 'api_key' | 'oauth' | 'basic' | 'none';
  isActive: boolean;
  rateLimitRequestsPerMinute: number;
  rateLimitBurstSize: number;
  maxRetries: number;
  retryBackoffMs: number;
  requiresProxy: boolean;
  proxyRotationEnabled: boolean;
  successRate: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
}

export interface JobRaw {
  id: string;
  session_id: string; // Matches scraped_jobs.session_id
  site_name: string; // Matches scraped_jobs.site_name
  title: string;
  company: string;
  location?: string;
  salary?: string;
  contract_type?: string;
  experience_level?: string;
  description?: string;
  url: string;
  posted_date?: string; // Matches scraped_jobs.posted_date
  scraped_at: string; // Matches scraped_jobs.scraped_at
  created_at: string; // Matches scraped_jobs.created_at
  
  // New fields from migration
  title_normalized?: string;
  company_normalized?: string;
  location_normalized?: string;
  description_hash?: string;
  deduplication_hash: string;
  similarity_group_id?: string;
  is_duplicate: boolean;
  duplicate_of_id: string | null; // Nullable UUID for non-duplicates
  processing_status: 'raw' | 'processed' | 'deduplicated' | 'merged' | 'rejected';
  processing_errors: string[];
  processed_at?: string;
  merged_to_job_id?: string;
  source_id?: string; // New FK to job_sources
}

export interface ScrapingMetrics {
  id: string;
  scrapingSessionId: string;
  sourceId: string;
  sourceTriggerMs?: number;
  sourceResponseMs?: number;
  sourceCompleteMs?: number;
  jobsFound: number;
  jobsProcessed: number;
  jobsDeduplicated: number;
  jobsRejected: number;
  retryCount: number;
  errorCount: number;
  lastErrorType?: string;
  lastErrorMessage?: string;
  requestsMade: number;
  bytesReceived: number;
  proxyUsed: boolean;
  dataQualityScore?: number;
  duplicateRate?: number;
  status: 'running' | 'completed' | 'failed' | 'timeout';
  startedAt: string;
  completedAt?: string;
}

export interface ScrapingTriggerRequest {
  userId: string;
  searchCriteria: ScrapingSearchCriteria;
  sources?: string[]; // Optional specific sources to scrape
  priority?: 'low' | 'normal' | 'high';
}

export interface ScrapingTriggerResponse {
  sessionId: string;
  status: 'triggered' | 'queued' | 'error';
  message: string;
  estimatedDuration?: number; // in seconds
  webhookUrl?: string;
}

export interface ScrapingStatusResponse {
  session: ScrapingSession;
  metrics: ScrapingMetrics[];
  progress: {
    totalSources: number;
    completedSources: number;
    percentage: number;
    estimatedTimeRemaining?: number; // in seconds
  };
  errors: Array<{
    sourceId: string;
    sourceName: string;
    errorType: string;
    errorMessage: string;
    retryCount: number;
  }>;
}

// Error types for scraping system
export interface ScrapingError extends Error {
  type: 'timeout' | 'rate_limit' | 'auth_error' | 'parse_error' | 'network_error' | 'source_error';
  sourceId?: string;
  sessionId?: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

// Configuration interfaces
export interface ScrapingConfig {
  n8n: {
    webhookUrl: string;
    apiKey: string;
    timeout: number;
  };
  sources: Record<string, {
    enabled: boolean;
    priority: number;
    customParams?: Record<string, any>;
  }>;
  retry: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
  deduplication: {
    similarityThreshold: number;
    hashAlgorithm: 'sha256' | 'md5';
  };
  monitoring: {
    enabled: boolean;
    webhookUrl?: string;
    metricsInterval: number;
  };
}

// Service interface definition
export interface IScrapingService {
  // Session management
  createSession(userId: string, criteria: ScrapingSearchCriteria): Promise<ScrapingSession>;
  getSession(sessionId: string): Promise<ScrapingSession | null>;
  updateSessionStatus(sessionId: string, status: ScrapingSession['status'], metadata?: Record<string, any>): Promise<void>;
  
  // Scraping operations
  triggerScraping(request: ScrapingTriggerRequest): Promise<ScrapingTriggerResponse>;
  getScrapingStatus(sessionId: string): Promise<ScrapingStatusResponse>;
  cancelScraping(sessionId: string): Promise<boolean>;
  
  // Source management
  getActiveSources(): Promise<ScrapingSource[]>;
  getSourceMetrics(sourceId: string, days?: number): Promise<ScrapingMetrics[]>;
  
  // Data operations
  processRawData(sessionId: string, rawData: JobRaw[]): Promise<JobRaw[]>;
  deduplicateJobs(rawJobs: JobRaw[]): Promise<{ deduplicated: JobRaw[]; duplicates: JobRaw[] }>;
  
  // Error handling
  handleScrapingError(error: ScrapingError): Promise<void>;
  retryFailedScraping(sessionId: string, sourceId?: string): Promise<boolean>;
}

// Event types for real-time updates
export interface ScrapingEvents {
  sessionStarted: { sessionId: string; userId: string };
  sessionCompleted: { sessionId: string; jobsFound: number; jobsDeduplicated: number };
  sessionFailed: { sessionId: string; error: string };
  sourceCompleted: { sessionId: string; sourceId: string; jobsFound: number };
  sourceFailed: { sessionId: string; sourceId: string; error: string };
  progressUpdate: { sessionId: string; percentage: number; currentSource: string };
}
