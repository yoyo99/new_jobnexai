// Integration test for multi-source scraping flow
// Tests the complete end-to-end scraping pipeline

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { ScrapingService } from '../../src/lib/scraping-service-impl';
import { triggerN8nWorkflow } from '../../netlify/functions/lib/n8n-auth';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.N8N_SCRAPING_WEBHOOK_URL = 'https://test.n8n.webhook.com';
process.env.NETLIFY_URL = 'https://test.netlify.app';

describe('Multi-Source Scraping Integration Tests', () => {
  let scrapingService: ScrapingService;
  let mockSupabase: jest.Mocked<ReturnType<typeof createClient>>;

  beforeAll(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn()
      }
    } as any;

    scrapingService = new ScrapingService();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Scraping Flow', () => {
    const testUserId = 'test-user-123';
    const testSearchCriteria = {
      search: 'senior developer',
      location: 'Paris',
      jobType: 'full-time',
      experienceLevel: 'senior' as const,
      salaryMin: 60000,
      salaryMax: 90000
    };

    it('should create session and trigger n8n workflow', async () => {
      // Mock session creation
      const mockSession = {
        id: 'test-session-123',
        user_id: testUserId,
        search_criteria: testSearchCriteria,
        status: 'pending',
        total_sources: 3,
        successful_sources: 0,
        failed_sources: 0,
        jobs_found: 0,
        jobs_deduplicated: 0,
        started_at: new Date().toISOString(),
        metadata: {}
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
          })
        }),
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
          })
        })
      });

      // Mock n8n workflow trigger
      jest.mocked(triggerN8nWorkflow).mockResolvedValue({
        success: true,
        executionId: 'n8n-execution-123',
        estimatedDuration: 180,
        webhookUrl: 'https://test.webhook.url'
      });

      const result = await scrapingService.triggerScraping({
        userId: testUserId,
        searchCriteria: testSearchCriteria,
        sources: ['indeed', 'linkedin', 'glassdoor'],
        priority: 'normal'
      });

      expect(result.sessionId).toBe('test-session-123');
      expect(result.status).toBe('triggered');
      expect(result.estimatedDuration).toBe(180);
      expect(triggerN8nWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session-123',
          userId: testUserId,
          searchCriteria: testSearchCriteria
        })
      );
    });

    it('should track scraping progress across multiple sources', async () => {
      const sessionId = 'test-session-456';
      
      // Mock session data
      const mockSession = {
        id: sessionId,
        user_id: testUserId,
        search_criteria: testSearchCriteria,
        status: 'running',
        total_sources: 3,
        successful_sources: 1,
        failed_sources: 0,
        jobs_found: 25,
        jobs_deduplicated: 20,
        started_at: new Date(Date.now() - 60000).toISOString(),
        completed_at: null,
        metadata: {}
      };

      // Mock metrics data
      const mockMetrics = [
        {
          id: 'metric-1',
          scraping_session_id: sessionId,
          source_id: 'indeed',
          status: 'completed',
          jobs_found: 15,
          jobs_processed: 15,
          jobs_deduplicated: 12,
          jobs_rejected: 3,
          error_count: 0,
          source_complete_ms: 45000,
          started_at: new Date(Date.now() - 60000).toISOString(),
          completed_at: new Date(Date.now() - 15000).toISOString()
        },
        {
          id: 'metric-2',
          scraping_session_id: sessionId,
          source_id: 'linkedin',
          status: 'running',
          jobs_found: 10,
          jobs_processed: 8,
          jobs_deduplicated: 8,
          jobs_rejected: 0,
          error_count: 1,
          last_error_type: 'rate_limit',
          last_error_message: 'Rate limit exceeded',
          source_complete_ms: null,
          started_at: new Date(Date.now() - 45000).toISOString(),
          completed_at: null
        }
      ];

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({ // For session
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
          })
        })
        .mockReturnValueOnce({ // For metrics
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockMetrics, error: null })
              })
            })
          })
        });

      const result = await scrapingService.getScrapingStatus(sessionId);

      expect(result.session.id).toBe(sessionId);
      expect(result.progress.totalSources).toBe(3);
      expect(result.progress.completedSources).toBe(1);
      expect(result.progress.percentage).toBe(33);
      expect(result.metrics).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].sourceId).toBe('linkedin');
      expect(result.errors[0].errorType).toBe('rate_limit');
    });

    it('should handle scraping failures and retry logic', async () => {
      const sessionId = 'test-session-failed';
      
      // Mock failed session
      const mockSession = {
        id: sessionId,
        user_id: testUserId,
        search_criteria: testSearchCriteria,
        status: 'failed',
        total_sources: 3,
        successful_sources: 1,
        failed_sources: 2,
        jobs_found: 10,
        jobs_deduplicated: 8,
        started_at: new Date(Date.now() - 120000).toISOString(),
        completed_at: new Date(Date.now() - 30000).toISOString(),
        error_message: 'Multiple sources failed: rate_limit, timeout'
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
        })
      });

      const result = await scrapingService.getScrapingStatus(sessionId);

      expect(result.session.status).toBe('failed');
      expect(result.session.errorMessage).toContain('Multiple sources failed');
      expect(result.progress.completedSources).toBe(1);
    });

    it('should cancel running scraping session', async () => {
      const sessionId = 'test-session-cancel';
      
      // Mock running session
      const mockSession = {
        id: sessionId,
        user_id: testUserId,
        status: 'running',
        started_at: new Date().toISOString()
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await scrapingService.cancelScraping(sessionId);

      expect(result).toBe(true);
    });

    it('should not cancel completed sessions', async () => {
      const sessionId = 'test-session-completed';
      
      // Mock completed session
      const mockSession = {
        id: sessionId,
        user_id: testUserId,
        status: 'completed',
        started_at: new Date(Date.now() - 300000).toISOString(),
        completed_at: new Date(Date.now() - 60000).toISOString()
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
        })
      });

      const result = await scrapingService.cancelScraping(sessionId);

      expect(result).toBe(false);
    });
  });

  describe('Data Flow Validation', () => {
    it('should properly map database objects to service interfaces', async () => {
      const mockDbSession = {
        id: 'db-session-123',
        user_id: 'user-123',
        search_criteria: { search: 'developer' },
        status: 'completed',
        started_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-15T10:03:00Z',
        total_sources: 2,
        successful_sources: 2,
        failed_sources: 0,
        jobs_found: 50,
        jobs_deduplicated: 45,
        trigger_to_webhook_ms: 1500,
        webhook_to_completion_ms: 165000,
        metadata: { test: true }
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDbSession, error: null })
        })
      });

      const session = await scrapingService.getSession('db-session-123');

      expect(session).toEqual({
        id: 'db-session-123',
        userId: 'user-123',
        searchCriteria: { search: 'developer' },
        status: 'completed',
        startedAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T10:03:00Z',
        totalSources: 2,
        successfulSources: 2,
        failedSources: 0,
        jobsFound: 50,
        jobsDeduplicated: 45,
        triggerToWebhookMs: 1500,
        webhookToCompletionMs: 165000,
        metadata: { test: true }
      });
    });

    it('should handle database connection errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } })
        })
      });

      await expect(scrapingService.getSession('invalid-session'))
        .rejects.toThrow('Failed to get session');
    });
  });

  describe('Performance and Scaling', () => {
    it('should handle concurrent scraping requests', async () => {
      const concurrentRequests = 5;
      const mockSession = {
        id: 'concurrent-session',
        user_id: testUserId,
        search_criteria: testSearchCriteria,
        status: 'pending',
        total_sources: 3,
        successful_sources: 0,
        failed_sources: 0,
        jobs_found: 0,
        jobs_deduplicated: 0,
        started_at: new Date().toISOString(),
        metadata: {}
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
          })
        })
      });

      jest.mocked(triggerN8nWorkflow).mockResolvedValue({
        success: true,
        executionId: 'concurrent-execution',
        estimatedDuration: 180
      });

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        scrapingService.triggerScraping({
          userId: `${testUserId}-${i}`,
          searchCriteria: testSearchCriteria,
          priority: 'normal'
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.status).toBe('triggered');
        expect(result.sessionId).toBeDefined();
      });
    });

    it('should calculate estimated time remaining accurately', async () => {
      const sessionId = 'timing-test-session';
      const mockSession = {
        id: sessionId,
        user_id: testUserId,
        search_criteria: testSearchCriteria,
        status: 'running',
        total_sources: 3,
        successful_sources: 1,
        failed_sources: 0,
        jobs_found: 20,
        jobs_deduplicated: 18,
        started_at: new Date().toISOString(),
        completed_at: null,
        metadata: {}
      };

      const mockMetrics = [
        {
          id: 'metric-1',
          scraping_session_id: sessionId,
          source_id: 'indeed',
          status: 'completed',
          jobs_found: 20,
          source_complete_ms: 60000, // 1 minute
          started_at: new Date(Date.now() - 120000).toISOString(),
          completed_at: new Date(Date.now() - 60000).toISOString()
        }
      ];

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({ // Session
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
          })
        })
        .mockReturnValueOnce({ // Metrics
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: mockMetrics, error: null })
              })
            })
          })
        });

      const result = await scrapingService.getScrapingStatus(sessionId);

      expect(result.progress.estimatedTimeRemaining).toBeGreaterThan(0);
      expect(result.progress.estimatedTimeRemaining).toBeLessThan(300); // Less than 5 minutes
    });
  });
});
