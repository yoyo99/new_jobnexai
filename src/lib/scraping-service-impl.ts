// Concrete implementation of IScrapingService
// Provides the actual business logic for the n8n scraping system

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  IScrapingService, 
  ScrapingSearchCriteria, 
  ScrapingSession, 
  ScrapingSource, 
  JobRaw, 
  ScrapingMetrics,
  ScrapingTriggerRequest,
  ScrapingTriggerResponse,
  ScrapingStatusResponse,
  ScrapingError
} from './scraping-service';
import { createLogger, LogContext } from '../../netlify/functions/lib/logger';
import { 
  triggerN8nWorkflow, 
  N8nWebhookPayload 
} from '../../netlify/functions/lib/n8n-auth';
import {
  trackSessionStart,
  sendPerformanceAlert,
  sendErrorAlert
} from '../../netlify/functions/lib/mcp-monitoring';
import {
  deduplicateJobs as performDeduplication,
  DeduplicationResult,
  JobWithHash
} from './deduplication-utils';

const logger = createLogger('scraping-service');

export class ScrapingService implements IScrapingService {
  private supabase: SupabaseClient;
  private n8nWebhookUrl: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.n8nWebhookUrl = process.env.N8N_SCRAPING_WEBHOOK_URL!;
    
    if (!this.n8nWebhookUrl) {
      logger.error('N8N_SCRAPING_WEBHOOK_URL environment variable not set');
    }
  }

  // Session management
  async createSession(userId: string, criteria: ScrapingSearchCriteria): Promise<ScrapingSession> {
    const context: LogContext = { userId, function: 'createSession' };
    const timer = logger.startTimer(context);

    try {
      logger.info('Creating scraping session', { userId, criteria });

      // Get active sources count
      const { data: sources, error: sourcesError } = await this.supabase
        .from('job_sources')
        .select('id')
        .eq('is_active', true);

      if (sourcesError) {
        throw new Error(`Failed to get active sources: ${sourcesError.message}`);
      }

      const { data, error } = await this.supabase
        .from('scraping_sessions')
        .insert({
          user_id: userId,
          search_criteria: criteria,
          status: 'pending',
          total_sources: sources?.length || 0,
          metadata: {
            created_by: 'scraping-service',
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }

      const session = this.mapDbSessionToInterface(data);
      
      timer();
      logger.info('Scraping session created successfully', { sessionId: session.id });
      
      return session;

    } catch (error) {
      timer();
      logger.error('Failed to create scraping session', error as Error, context);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ScrapingSession | null> {
    const context: LogContext = { sessionId, function: 'getSession' };
    
    try {
      const { data, error } = await this.supabase
        .from('scraping_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get session: ${error.message}`);
      }

      return this.mapDbSessionToInterface(data);

    } catch (error) {
      logger.error('Failed to get scraping session', error as Error, context);
      throw error;
    }
  }

  async updateSessionStatus(
    sessionId: string, 
    status: ScrapingSession['status'], 
    metadata?: Record<string, any>
  ): Promise<void> {
    const context: LogContext = { sessionId, status, function: 'updateSessionStatus' };
    
    try {
      const updateData: any = { status };
      
      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      if (metadata) {
        updateData.metadata = metadata;
      }

      const { error } = await this.supabase
        .from('scraping_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        throw new Error(`Failed to update session status: ${error.message}`);
      }

      logger.info('Session status updated', context);

    } catch (error) {
      logger.error('Failed to update session status', error as Error, context);
      throw error;
    }
  }

  // Scraping operations
  async triggerScraping(request: ScrapingTriggerRequest): Promise<ScrapingTriggerResponse> {
    const context: LogContext = { 
      userId: request.userId, 
      function: 'triggerScraping' 
    };
    const timer = logger.startTimer(context);

    try {
      logger.info('Triggering scraping workflow', { 
        userId: request.userId, 
        criteria: request.searchCriteria,
        sources: request.sources 
      });

      // Create session first
      const session = await this.createSession(request.userId, request.searchCriteria);
      
      // Update session to running
      await this.updateSessionStatus(session.id, 'running');
      
      // Track session start
      trackSessionStart(session);

      // Prepare n8n payload
      const n8nPayload: N8nWebhookPayload = {
        sessionId: session.id,
        userId: request.userId,
        searchCriteria: request.searchCriteria,
        sources: request.sources || [],
        priority: request.priority || 'normal',
        callbackUrl: `${process.env.NETLIFY_URL}/.netlify/functions/scraping-callback`,
        timestamp: new Date().toISOString()
      };

      // Trigger n8n workflow
      const n8nResponse = await triggerN8nWorkflow(n8nPayload);

      const response: ScrapingTriggerResponse = {
        sessionId: session.id,
        status: n8nResponse.success ? 'triggered' : 'queued',
        message: n8nResponse.success 
          ? 'Scraping workflow triggered successfully' 
          : 'Scraping workflow queued for processing',
        ...(n8nResponse.estimatedDuration && { estimatedDuration: n8nResponse.estimatedDuration }),
        ...(n8nResponse.webhookUrl && { webhookUrl: n8nResponse.webhookUrl })
      };

      timer();
      logger.info('Scraping workflow triggered successfully', { 
        sessionId: session.id,
        executionId: n8nResponse.executionId
      });

      return response;

    } catch (error) {
      timer();
      logger.error('Failed to trigger scraping', error as Error, context);
      
      // Try to update session to failed if it was created
      if (context.sessionId) {
        await this.updateSessionStatus(context.sessionId, 'failed', { 
          error: (error as Error).message 
        });
      }
      
      throw error;
    }
  }

  async getScrapingStatus(sessionId: string): Promise<ScrapingStatusResponse> {
    const context: LogContext = { sessionId, function: 'getScrapingStatus' };
    
    try {
      // Get session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Get metrics for this session
      const { data: metrics, error: metricsError } = await this.supabase
        .from('scraping_metrics')
        .select('*')
        .eq('scraping_session_id', sessionId);

      if (metricsError) {
        throw new Error(`Failed to get metrics: ${metricsError.message}`);
      }

      // Calculate progress
      const totalSources = session.totalSources;
      const completedSources = metrics?.filter(m => m.status === 'completed').length || 0;
      const percentage = totalSources > 0 ? Math.round((completedSources / totalSources) * 100) : 0;

      // Get errors
      const errors = metrics?.filter(m => m.error_count > 0).map(metric => ({
        sourceId: metric.source_id,
        sourceName: `Source ${metric.source_id}`, // TODO: Get actual source name
        errorType: metric.last_error_type || 'unknown',
        errorMessage: metric.last_error_message || 'Unknown error',
        retryCount: metric.retry_count
      })) || [];

      const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(session, metrics || []);
      
      const response: ScrapingStatusResponse = {
        session,
        metrics: metrics || [],
        progress: {
          totalSources,
          completedSources,
          percentage,
          ...(estimatedTimeRemaining && { estimatedTimeRemaining })
        },
        errors
      };

      logger.debug('Scraping status retrieved', { 
        sessionId, 
        status: session.status, 
        percentage 
      });

      return response;

    } catch (error) {
      logger.error('Failed to get scraping status', error as Error, context);
      throw error;
    }
  }

  async cancelScraping(sessionId: string): Promise<boolean> {
    const context: LogContext = { sessionId, function: 'cancelScraping' };
    
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (session.status !== 'running' && session.status !== 'pending') {
        logger.warn('Cannot cancel session - not in running state', { 
          sessionId, 
          status: session.status 
        });
        return false;
      }

      // Update session status
      await this.updateSessionStatus(sessionId, 'cancelled');

      // TODO: Send cancellation signal to n8n if needed
      // This would require n8n API integration to cancel running workflows

      logger.info('Scraping session cancelled', { sessionId });
      return true;

    } catch (error) {
      logger.error('Failed to cancel scraping', error as Error, context);
      throw error;
    }
  }

  // Source management
  async getActiveSources(): Promise<ScrapingSource[]> {
    try {
      const { data, error } = await this.supabase
        .from('job_sources')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to get active sources: ${error.message}`);
      }

      return data?.map(source => this.mapDbSourceToInterface(source)) || [];

    } catch (error) {
      logger.error('Failed to get active sources', error as Error);
      throw error;
    }
  }

  async getSourceMetrics(sourceId: string, days: number = 7): Promise<ScrapingMetrics[]> {
    const context: LogContext = { sourceId, days, function: 'getSourceMetrics' };
    
    try {
      const { data, error } = await this.supabase
        .from('scraping_metrics')
        .select('*')
        .eq('source_id', sourceId)
        .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get source metrics: ${error.message}`);
      }

      return data?.map(metric => this.mapDbMetricToInterface(metric)) || [];

    } catch (error) {
      logger.error('Failed to get source metrics', error as Error, context);
      throw error;
    }
  }

  // Data operations
  async processRawData(sessionId: string, rawData: JobRaw[]): Promise<JobRaw[]> {
    const context: LogContext = { sessionId, count: rawData.length, function: 'processRawData' };
    
    try {
      logger.info('Processing raw data', context);

      // Update processing status
      const processedData = rawData.map(item => ({
        ...item,
        processingStatus: 'processed' as const,
        processedAt: new Date().toISOString()
      }));

      // TODO: Implement actual processing logic
      // This would include data normalization, validation, etc.

      logger.info('Raw data processed successfully', context);
      return processedData;

    } catch (error) {
      logger.error('Failed to process raw data', error as Error, context);
      throw error;
    }
  }

  async deduplicateJobs(rawJobs: JobRaw[]): Promise<{ deduplicated: JobRaw[]; duplicates: JobRaw[] }> {
    const context: LogContext = { count: rawJobs.length, function: 'deduplicateJobs' };
    
    try {
      logger.info('Deduplicating jobs', context);

      // Convert JobRaw (snake_case) to format expected by deduplication-utils (camelCase)
      const jobsForDeduplication = rawJobs.map(job => this.mapJobRawToDeduplicationFormat(job));

      // Use the deduplication utility
      const result: DeduplicationResult = performDeduplication(jobsForDeduplication);

      // Convert back to JobRaw (snake_case) format, preserving original database fields
      const deduplicated = this.applyDeduplicationResult(rawJobs, result.deduplicated, false);
      const duplicates = this.applyDeduplicationResult(rawJobs, result.duplicates, true);

      logger.info('Deduplication completed', { 
        ...context, 
        deduplicated: deduplicated.length,
        duplicates: duplicates.length,
        statistics: result.statistics
      });

      return { deduplicated, duplicates };

    } catch (error) {
      logger.error('Failed to deduplicate jobs', error as Error, context);
      throw error;
    }
  }

  // Mapper: JobRaw (snake_case) -> Deduplication format (camelCase)
  private mapJobRawToDeduplicationFormat(job: JobRaw): JobWithHash {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location || '',
      description: job.description || '',
      url: job.url,
      postedAt: job.posted_date || job.scraped_at, // Use posted_date if available, fallback to scraped_at
      scrapedAt: job.scraped_at,
      // Add deduplication-specific fields
      deduplicationHash: job.deduplication_hash,
      isDuplicate: job.is_duplicate,
      duplicateOfId: job.duplicate_of_id,
      processingStatus: job.processing_status
    };
  }

  // Apply deduplication results to original JobRaw objects, preserving all database fields
  private applyDeduplicationResult(
    originalJobs: JobRaw[], 
    deduplicationResults: JobWithHash[], 
    areDuplicates: boolean
  ): JobRaw[] {
    // Create a map of original jobs by ID for quick lookup
    const originalJobMap = new Map<string, JobRaw>();
    originalJobs.forEach(job => originalJobMap.set(job.id, job));

    return deduplicationResults.map(dedupResult => {
      const originalJob = originalJobMap.get(dedupResult.id);
      if (!originalJob) {
        throw new Error(`Original job not found for deduplication result: ${dedupResult.id}`);
      }

      // Update only the deduplication-related fields, preserve everything else
      return {
        ...originalJob, // Preserve all original database fields
        // Update deduplication fields from the result
        deduplication_hash: dedupResult.deduplicationHash,
        is_duplicate: areDuplicates,
        duplicate_of_id: areDuplicates ? dedupResult.duplicateOfId : null,
        processing_status: areDuplicates ? 'deduplicated' : (originalJob.processing_status || 'raw'),
        processed_at: new Date().toISOString(),
        // Update normalized fields if they were calculated
        title_normalized: dedupResult.title || '',
        company_normalized: dedupResult.company || '',
        location_normalized: dedupResult.location || '',
        description_hash: dedupResult.description || ''
      };
    });
  }

  // Error handling
  async handleScrapingError(error: ScrapingError): Promise<void> {
    const context: LogContext = { 
      type: error.type, 
      function: 'handleScrapingError',
      ...(error.sessionId && { sessionId: error.sessionId }),
      ...(error.sourceId && { sourceId: error.sourceId })
    };
    
    try {
      logger.error('Handling scraping error', error, context);

      // Update session status if session ID is available
      if (error.sessionId) {
        await this.updateSessionStatus(error.sessionId, 'failed', { 
          error: error.message,
          errorType: error.type
        });
      }

      // Send error alert to monitoring
      if (error.type === 'source_error' && error.sourceId) {
        sendErrorAlert(
          error.sessionId || 'unknown',
          error.sourceId,
          `Source error: ${error.message}`,
          { errorType: error.type, retryable: error.retryable }
        );
      } else if (error.sessionId) {
        sendPerformanceAlert(
          error.sessionId,
          `Scraping error: ${error.message}`,
          { errorType: error.type, retryable: error.retryable }
        );
      }

    } catch (handlingError) {
      logger.error('Failed to handle scraping error', handlingError as Error, context);
    }
  }

  async retryFailedScraping(sessionId: string, sourceId?: string): Promise<boolean> {
    const context: LogContext = { 
      sessionId, 
      function: 'retryFailedScraping',
      ...(sourceId && { sourceId })
    };
    
    try {
      logger.info('Retrying failed scraping', context);

      // TODO: Implement retry logic
      // This would involve:
      // 1. Getting failed metrics for the session/source
      // 2. Triggering n8n workflow with retry flag
      // 3. Updating status accordingly

      logger.info('Scraping retry initiated', context);
      return true;

    } catch (error) {
      logger.error('Failed to retry scraping', error as Error, context);
      return false;
    }
  }

  // Helper methods for mapping database objects to interfaces
  private mapDbSessionToInterface(dbSession: any): ScrapingSession {
    return {
      id: dbSession.id,
      userId: dbSession.user_id,
      searchCriteria: dbSession.search_criteria,
      status: dbSession.status,
      startedAt: dbSession.started_at,
      completedAt: dbSession.completed_at,
      totalSources: dbSession.total_sources,
      successfulSources: dbSession.successful_sources,
      failedSources: dbSession.failed_sources,
      jobsFound: dbSession.jobs_found,
      jobsDeduplicated: dbSession.jobs_deduplicated,
      errorMessage: dbSession.error_message,
      metadata: dbSession.metadata,
      triggerToWebhookMs: dbSession.trigger_to_webhook_ms,
      webhookToCompletionMs: dbSession.webhook_to_completion_ms
    };
  }

  private mapDbSourceToInterface(dbSource: any): ScrapingSource {
    return {
      id: dbSource.id,
      name: dbSource.name,
      displayName: dbSource.name, // Using name as display name for now
      baseUrl: dbSource.url,
      authType: 'none' as const, // Default value for existing sources
      isActive: dbSource.is_active,
      rateLimitRequestsPerMinute: 60, // Default values
      rateLimitBurstSize: 10,
      maxRetries: 3,
      retryBackoffMs: 1000,
      requiresProxy: false,
      proxyRotationEnabled: false,
      successRate: 0,
      lastSuccessAt: dbSource.last_success_at || undefined,
      lastErrorAt: dbSource.last_error_at || undefined,
      lastErrorMessage: dbSource.last_error_message || undefined
    };
  }

  private mapDbMetricToInterface(dbMetric: any): ScrapingMetrics {
    return {
      id: dbMetric.id,
      scrapingSessionId: dbMetric.scraping_session_id,
      sourceId: dbMetric.source_id,
      sourceTriggerMs: dbMetric.source_trigger_ms,
      sourceResponseMs: dbMetric.source_response_ms,
      sourceCompleteMs: dbMetric.source_complete_ms,
      jobsFound: dbMetric.jobs_found,
      jobsProcessed: dbMetric.jobs_processed,
      jobsDeduplicated: dbMetric.jobs_deduplicated,
      jobsRejected: dbMetric.jobs_rejected,
      retryCount: dbMetric.retry_count,
      errorCount: dbMetric.error_count,
      lastErrorType: dbMetric.last_error_type,
      lastErrorMessage: dbMetric.last_error_message,
      requestsMade: dbMetric.requests_made,
      bytesReceived: dbMetric.bytes_received,
      proxyUsed: dbMetric.proxy_used,
      dataQualityScore: dbMetric.data_quality_score,
      duplicateRate: dbMetric.duplicate_rate,
      status: dbMetric.status,
      startedAt: dbMetric.started_at,
      completedAt: dbMetric.completed_at
    };
  }

  private calculateEstimatedTimeRemaining(
    session: ScrapingSession, 
    metrics: ScrapingMetrics[]
  ): number | undefined {
    const completedMetrics = metrics.filter(m => m.status === 'completed');
    
    if (completedMetrics.length === 0) {
      return undefined;
    }

    const avgDuration = completedMetrics.reduce((sum, m) => 
      sum + (m.sourceCompleteMs || 0), 0) / completedMetrics.length;
    
    const remainingSources = session.totalSources - completedMetrics.length;
    
    return Math.round((avgDuration * remainingSources) / 1000); // Convert to seconds
  }
}
