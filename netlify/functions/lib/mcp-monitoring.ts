// MCP (Model Context Protocol) monitoring integration
// Sends scraping metrics and events to the existing MCP monitoring system

import { createLogger, LogContext } from './logger';
import { ScrapingMetrics, ScrapingSession } from '../../src/lib/scraping-service';

const logger = createLogger('mcp-monitoring');

export interface MCPSessionEvent {
  type: 'session_started' | 'session_completed' | 'session_failed' | 'session_cancelled';
  sessionId: string;
  userId: string;
  timestamp: string;
  metadata: {
    searchCriteria: Record<string, any>;
    sources: string[];
    priority: string;
    duration?: number;
    jobsFound?: number;
    jobsDeduplicated?: number;
    errors?: string[];
  };
}

export interface MCPSourceEvent {
  type: 'source_started' | 'source_completed' | 'source_failed' | 'source_timeout';
  sessionId: string;
  sourceId: string;
  sourceName: string;
  timestamp: string;
  metadata: {
    duration?: number;
    jobsFound?: number;
    errorType?: string;
    errorMessage?: string;
    retryCount?: number;
    proxyUsed?: boolean;
  };
}

export interface MCPMetricsEvent {
  type: 'performance_metrics' | 'quality_metrics' | 'error_metrics';
  timestamp: string;
  sessionId: string;
  metrics: {
    // Performance metrics
    totalDuration?: number;
    averageSourceDuration?: number;
    successRate?: number;
    errorRate?: number;
    
    // Quality metrics
    dataQualityScore?: number;
    duplicateRate?: number;
    jobsProcessedPerMinute?: number;
    
    // Error metrics
    totalErrors?: number;
    errorsByType?: Record<string, number>;
    retryRate?: number;
    
    // Resource metrics
    totalRequests?: number;
    bytesTransferred?: number;
    proxyUsageRate?: number;
  };
}

export interface MCPAlertEvent {
  type: 'performance_alert' | 'error_alert' | 'quality_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sessionId?: string;
  sourceId?: string;
  timestamp: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
}

export class MCPMonitoringService {
  private webhookUrl: string;
  private apiKey?: string;
  private enabled: boolean;
  private batchSize: number;
  private flushInterval: number;
  private eventQueue: Array<{
    event: MCPSessionEvent | MCPSourceEvent | MCPMetricsEvent | MCPAlertEvent;
    timestamp: number;
  }> = [];

  constructor() {
    this.loadConfig();
    this.startFlushInterval();
  }

  private loadConfig(): void {
    this.webhookUrl = process.env.MCP_WEBHOOK_URL || '';
    this.apiKey = process.env.MCP_API_KEY;
    this.enabled = process.env.METRICS_COLLECTION_ENABLED === 'true';
    this.batchSize = parseInt(process.env.MCP_BATCH_SIZE || '10', 10);
    this.flushInterval = parseInt(process.env.MCP_FLUSH_INTERVAL || '30000', 10); // 30 seconds

    if (!this.webhookUrl && this.enabled) {
      logger.warn('MCP webhook URL not configured, monitoring disabled');
      this.enabled = false;
    }

    logger.info('MCP monitoring service initialized', {
      enabled: this.enabled,
      webhookUrl: !!this.webhookUrl,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval
    });
  }

  // Send session lifecycle events
  sendSessionEvent(session: ScrapingSession, eventType: MCPSessionEvent['type'], additionalMetadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const event: MCPSessionEvent = {
      type: eventType,
      sessionId: session.id,
      userId: session.userId,
      timestamp: new Date().toISOString(),
      metadata: {
        searchCriteria: session.searchCriteria,
        sources: [], // Will be populated from session execution
        priority: session.metadata?.priority || 'normal',
        duration: session.webhookToCompletionMs,
        jobsFound: session.jobsFound,
        jobsDeduplicated: session.jobsDeduplicated,
        errors: session.errorMessage ? [session.errorMessage] : [],
        ...additionalMetadata
      }
    };

    this.queueEvent(event);
  }

  // Send source-specific events
  sendSourceEvent(
    sessionId: string, 
    sourceId: string, 
    sourceName: string, 
    eventType: MCPSourceEvent['type'],
    metadata: Omit<MCPSourceEvent['metadata'], 'duration' | 'jobsFound' | 'errorType' | 'errorMessage' | 'retryCount' | 'proxyUsed'> & {
      duration?: number;
      jobsFound?: number;
      errorType?: string;
      errorMessage?: string;
      retryCount?: number;
      proxyUsed?: boolean;
    }
  ): void {
    if (!this.enabled) return;

    const event: MCPSourceEvent = {
      type: eventType,
      sessionId,
      sourceId,
      sourceName,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.queueEvent(event);
  }

  // Send metrics events
  sendMetricsEvent(
    sessionId: string,
    metrics: ScrapingMetrics[],
    eventType: MCPMetricsEvent['type'] = 'performance_metrics'
  ): void {
    if (!this.enabled || metrics.length === 0) return;

    // Aggregate metrics from all sources
    const aggregatedMetrics = this.aggregateMetrics(metrics);

    const event: MCPMetricsEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      sessionId,
      metrics: aggregatedMetrics
    };

    this.queueEvent(event);
  }

  // Send alert events
  sendAlert(
    severity: MCPAlertEvent['severity'],
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    sessionId?: string,
    sourceId?: string
  ): void {
    if (!this.enabled) return;

    const event: MCPAlertEvent = {
      type: severity === 'critical' || severity === 'high' ? 'error_alert' : 
            severity === 'medium' ? 'performance_alert' : 'quality_alert',
      severity,
      sessionId,
      sourceId,
      timestamp: new Date().toISOString(),
      title,
      message,
      metadata
    };

    this.queueEvent(event);
    // Send alerts immediately (don't wait for batch)
    this.flushEvents();
  }

  // Queue events for batch sending
  private queueEvent(event: MCPSessionEvent | MCPSourceEvent | MCPMetricsEvent | MCPAlertEvent): void {
    this.eventQueue.push({
      event,
      timestamp: Date.now()
    });

    // Flush immediately if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  // Flush queued events to MCP
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0, this.batchSize);
    
    try {
      await this.sendEventsToMCP(events);
      logger.debug('MCP events sent successfully', { eventCount: events.length });
    } catch (error) {
      logger.error('Failed to send MCP events', error as Error, { eventCount: events.length });
      
      // Re-queue events for retry (with limit)
      if (this.eventQueue.length < 100) { // Prevent infinite growth
        this.eventQueue.unshift(...events);
      }
    }
  }

  // Send events to MCP webhook
  private async sendEventsToMCP(events: Array<{ event: any; timestamp: number }>): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'JobNexAI-MCP-Client/1.0',
      'X-Source': 'scraping-system',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-MCP-API-Key'] = this.apiKey;
    }

    const payload = {
      source: 'scraping-system',
      timestamp: new Date().toISOString(),
      events: events.map(item => item.event)
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP webhook failed: ${response.status} ${errorText}`);
    }
  }

  // Aggregate metrics from multiple sources
  private aggregateMetrics(metrics: ScrapingMetrics[]): MCPMetricsEvent['metrics'] {
    const completedMetrics = metrics.filter(m => m.status === 'completed');
    
    if (completedMetrics.length === 0) {
      return {};
    }

    const totalDuration = completedMetrics.reduce((sum, m) => sum + (m.sourceCompleteMs || 0), 0);
    const totalJobs = completedMetrics.reduce((sum, m) => sum + m.jobsFound, 0);
    const totalErrors = completedMetrics.reduce((sum, m) => sum + m.errorCount, 0);
    const totalRequests = completedMetrics.reduce((sum, m) => sum + m.requestsMade, 0);
    const totalBytes = completedMetrics.reduce((sum, m) => sum + m.bytesReceived, 0);
    const proxyUsedCount = completedMetrics.filter(m => m.proxyUsed).length;

    return {
      totalDuration,
      averageSourceDuration: totalDuration / completedMetrics.length,
      successRate: (completedMetrics.length / metrics.length) * 100,
      errorRate: (totalErrors / Math.max(totalRequests, 1)) * 100,
      dataQualityScore: completedMetrics.reduce((sum, m) => sum + (m.dataQualityScore || 0), 0) / completedMetrics.length,
      duplicateRate: completedMetrics.reduce((sum, m) => sum + (m.duplicateRate || 0), 0) / completedMetrics.length,
      jobsProcessedPerMinute: totalJobs > 0 ? (totalJobs / (totalDuration / 60000)) : 0,
      totalErrors,
      errorsByType: this.groupErrorsByType(completedMetrics),
      retryRate: completedMetrics.reduce((sum, m) => sum + m.retryCount, 0) / Math.max(totalRequests, 1) * 100,
      totalRequests,
      bytesTransferred: totalBytes,
      proxyUsageRate: (proxyUsedCount / completedMetrics.length) * 100
    };
  }

  // Group errors by type for analytics
  private groupErrorsByType(metrics: ScrapingMetrics[]): Record<string, number> {
    const errorCounts: Record<string, number> = {};
    
    metrics.forEach(metric => {
      if (metric.lastErrorType) {
        errorCounts[metric.lastErrorType] = (errorCounts[metric.lastErrorType] || 0) + 1;
      }
    });

    return errorCounts;
  }

  // Start automatic flush interval
  private startFlushInterval(): void {
    if (!this.enabled) return;

    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  // Get monitoring status
  getStatus(): {
    enabled: boolean;
    webhookConfigured: boolean;
    queueSize: number;
    batchSize: number;
    flushInterval: number;
  } {
    return {
      enabled: this.enabled,
      webhookConfigured: !!this.webhookUrl,
      queueSize: this.eventQueue.length,
      batchSize: this.batchSize,
      flushInterval: this.flushInterval
    };
  }

  // Force flush all queued events
  async forceFlush(): Promise<void> {
    await this.flushEvents();
  }
}

// Export singleton instance
export const mcpMonitoringService = new MCPMonitoringService();

// Helper functions for common monitoring scenarios
export const trackSessionStart = (session: ScrapingSession) => 
  mcpMonitoringService.sendSessionEvent(session, 'session_started');

export const trackSessionComplete = (session: ScrapingSession, metrics: ScrapingMetrics[]) => {
  mcpMonitoringService.sendSessionEvent(session, 'session_completed');
  mcpMonitoringService.sendMetricsEvent(session.id, metrics, 'performance_metrics');
};

export const trackSessionFailed = (session: ScrapingSession, error: string) => 
  mcpMonitoringService.sendSessionEvent(session, 'session_failed', { error });

export const trackSourceComplete = (sessionId: string, sourceId: string, sourceName: string, jobsFound: number, duration: number) =>
  mcpMonitoringService.sendSourceEvent(sessionId, sourceId, sourceName, 'source_completed', {
    jobsFound,
    duration
  });

export const trackSourceFailed = (sessionId: string, sourceId: string, sourceName: string, errorType: string, errorMessage: string, retryCount: number) =>
  mcpMonitoringService.sendSourceEvent(sessionId, sourceId, sourceName, 'source_failed', {
    errorType,
    errorMessage,
    retryCount
  });

export const sendPerformanceAlert = (sessionId: string, message: string, metadata: Record<string, any> = {}) =>
  mcpMonitoringService.sendAlert('high', 'Performance Alert', message, metadata, sessionId);

export const sendErrorAlert = (sessionId: string, sourceId: string, message: string, metadata: Record<string, any> = {}) =>
  mcpMonitoringService.sendAlert('critical', 'Scraping Error', message, metadata, sessionId, sourceId);

export const sendQualityAlert = (sessionId: string, message: string, metadata: Record<string, any> = {}) =>
  mcpMonitoringService.sendAlert('medium', 'Data Quality Alert', message, metadata, sessionId);
