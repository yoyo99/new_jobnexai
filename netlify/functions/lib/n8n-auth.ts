// n8n webhook authentication and configuration utilities
// Handles secure communication with n8n workflows

import { createLogger } from './logger';
import { errorHandler, createAuthError, createN8nError } from './error-handler';

const logger = createLogger('n8n-auth');

export interface N8nConfig {
  webhookUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface N8nWebhookPayload {
  sessionId: string;
  userId: string;
  searchCriteria: Record<string, any>;
  sources?: string[];
  priority?: 'low' | 'normal' | 'high';
  callbackUrl?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface N8nResponse {
  success: boolean;
  workflowId?: string;
  executionId?: string;
  estimatedDuration?: number;
  webhookUrl?: string;
  message?: string;
  error?: string;
}

export class N8nAuthService {
  private config: N8nConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): N8nConfig {
    return {
      webhookUrl: process.env.N8N_SCRAPING_WEBHOOK_URL || '',
      apiKey: process.env.N8N_SCRAPING_API_KEY,
      timeout: parseInt(process.env.N8N_TIMEOUT || '30000', 10),
      retryAttempts: parseInt(process.env.N8N_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.N8N_RETRY_DELAY || '1000', 10)
    };
  }

  private validateConfig(): void {
    if (!this.config.webhookUrl) {
      throw createN8nError('N8N_SCRAPING_WEBHOOK_URL environment variable not set');
    }

    try {
      new URL(this.config.webhookUrl);
    } catch {
      throw createN8nError('Invalid N8N_SCRAPING_WEBHOOK_URL format');
    }

    if (this.config.timeout < 5000) {
      logger.warn('N8N timeout is very low, consider increasing', { timeout: this.config.timeout });
    }
  }

  // Trigger n8n workflow with authentication
  async triggerWorkflow(payload: N8nWebhookPayload): Promise<N8nResponse> {
    const timer = logger.startTimer({ sessionId: payload.sessionId });

    try {
      logger.info('Triggering n8n workflow', { 
        sessionId: payload.sessionId,
        userId: payload.userId,
        sources: payload.sources,
        priority: payload.priority
      });

      const response = await this.makeRequest(payload);
      
      timer();
      
      logger.info('n8n workflow triggered successfully', {
        sessionId: payload.sessionId,
        executionId: response.executionId,
        estimatedDuration: response.estimatedDuration
      });

      return response;

    } catch (error) {
      timer();
      logger.error('Failed to trigger n8n workflow', error as Error, {
        sessionId: payload.sessionId
      });
      throw error;
    }
  }

  // Make authenticated request to n8n
  private async makeRequest(payload: N8nWebhookPayload, attempt: number = 1): Promise<N8nResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'JobNexAI-Scraping/1.0',
      'X-Request-ID': this.generateRequestId(),
      'X-Session-ID': payload.sessionId,
      'X-User-ID': payload.userId,
    };

    // Add authentication if API key is configured
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      headers['X-N8N-API-Key'] = this.config.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        // Handle retryable errors
        if (this.isRetryableError(response.status) && attempt < this.config.retryAttempts) {
          logger.warn(`n8n request failed, retrying (${attempt}/${this.config.retryAttempts})`, {
            sessionId: payload.sessionId,
            status: response.status,
            errorText,
            nextAttempt: attempt + 1
          });

          await this.delay(this.config.retryDelay * attempt);
          return this.makeRequest(payload, attempt + 1);
        }

        throw createN8nError(`n8n webhook request failed: ${response.status} ${errorText}`, {
          sessionId: payload.sessionId,
          status: response.status,
          errorText
        });
      }

      const responseData = await response.json();
      
      return {
        success: true,
        workflowId: responseData.workflowId,
        executionId: responseData.executionId,
        estimatedDuration: responseData.estimatedDuration,
        webhookUrl: responseData.webhookUrl,
        message: responseData.message
      };

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw createN8nError('n8n request timeout', {
          sessionId: payload.sessionId,
          timeout: this.config.timeout
        });
      }

      if (error instanceof Error && error.name === 'TypeError' && attempt < this.config.retryAttempts) {
        // Network error, retry
        logger.warn(`n8n network error, retrying (${attempt}/${this.config.retryAttempts})`, {
          sessionId: payload.sessionId,
          error: error.message,
          nextAttempt: attempt + 1
        });

        await this.delay(this.config.retryDelay * attempt);
        return this.makeRequest(payload, attempt + 1);
      }

      throw error;
    }
  }

  // Check if error is retryable
  private isRetryableError(statusCode: number): boolean {
    // Retry on: 429 (rate limit), 500 (server error), 502 (bad gateway), 503 (service unavailable), 504 (timeout)
    return [429, 500, 502, 503, 504].includes(statusCode);
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate request ID for tracking
  private generateRequestId(): string {
    return `n8n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate incoming n8n webhook requests
  validateWebhookRequest(headers: Record<string, string>, body: any): boolean {
    // Check for required headers
    const requiredHeaders = ['X-N8N-Signature', 'X-N8N-Timestamp'];
    
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        logger.warn('Missing required n8n webhook header', { header });
        return false;
      }
    }

    // Validate timestamp (prevent replay attacks)
    const timestamp = parseInt(headers['X-N8N-Timestamp'], 10);
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (Math.abs(now - timestamp) > maxAge) {
      logger.warn('n8n webhook timestamp too old', { 
        timestamp, 
        now, 
        age: now - timestamp 
      });
      return false;
    }

    // Validate signature if API key is configured
    if (this.config.apiKey) {
      const expectedSignature = this.generateSignature(JSON.stringify(body), headers['X-N8N-Timestamp']);
      
      if (headers['X-N8N-Signature'] !== expectedSignature) {
        logger.warn('Invalid n8n webhook signature', {
          received: headers['X-N8N-Signature'],
          expected: expectedSignature
        });
        return false;
      }
    }

    return true;
  }

  // Generate HMAC signature for webhook validation
  private generateSignature(payload: string, timestamp: string): string {
    // This is a simplified signature generation
    // In production, use proper HMAC with the API key
    const crypto = require('crypto');
    const data = `${payload}.${timestamp}`;
    return crypto.createHmac('sha256', this.config.apiKey || '').digest('hex');
  }

  // Get configuration status
  getConfigStatus(): {
    webhookUrl: boolean;
    apiKey: boolean;
    timeout: number;
    retryAttempts: number;
  } {
    return {
      webhookUrl: !!this.config.webhookUrl,
      apiKey: !!this.config.apiKey,
      timeout: this.config.timeout,
      retryAttempts: this.config.retryAttempts
    };
  }

  // Test n8n connection
  async testConnection(): Promise<boolean> {
    try {
      const testPayload: N8nWebhookPayload = {
        sessionId: 'test-session',
        userId: 'test-user',
        searchCriteria: { test: true },
        timestamp: new Date().toISOString()
      };

      await this.makeRequest(testPayload);
      return true;
    } catch (error) {
      logger.error('n8n connection test failed', error as Error);
      return false;
    }
  }
}

// Export singleton instance
export const n8nAuthService = new N8nAuthService();

// Helper functions
export const triggerN8nWorkflow = (payload: N8nWebhookPayload) => 
  n8nAuthService.triggerWorkflow(payload);

export const validateN8nWebhook = (headers: Record<string, string>, body: any) => 
  n8nAuthService.validateWebhookRequest(headers, body);

export const testN8nConnection = () => 
  n8nAuthService.testConnection();
