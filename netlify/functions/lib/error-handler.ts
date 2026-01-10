// Shared error handling utility for Netlify Functions
// Provides consistent error responses and categorization for scraping system

import { Handler } from '@netlify/functions';
import { createLogger, LogLevel, LogContext } from './logger';

export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SOURCE_ERROR = 'source_error',
  DATABASE_ERROR = 'database_error',
  N8N_ERROR = 'n8n_error',
  INTERNAL_ERROR = 'internal_error'
}

export enum ErrorCode {
  // Validation errors (400)
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_SEARCH_CRITERIA = 'INVALID_SEARCH_CRITERIA',
  INVALID_SESSION_ID = 'INVALID_SESSION_ID',
  
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Not found errors (404)
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  
  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  N8N_WEBHOOK_FAILED = 'N8N_WEBHOOK_FAILED',
  SCRAPING_SERVICE_UNAVAILABLE = 'SCRAPING_SERVICE_UNAVAILABLE',
  
  // Timeout errors (504)
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  SCRAPING_TIMEOUT = 'SCRAPING_TIMEOUT'
}

export interface ScrapingError extends Error {
  type: ErrorType;
  code: ErrorCode;
  statusCode: number;
  userMessage: string;
  context?: LogContext;
  retryable: boolean;
  retryAfter?: number; // seconds
  sourceId?: string;
  sessionId?: string;
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    type: ErrorType;
    details?: any;
    retryable: boolean;
    retryAfter?: number;
    requestId?: string;
  };
}

export class ScrapingErrorHandler {
  private logger = createLogger('error-handler');

  createError(
    type: ErrorType,
    code: ErrorCode,
    message: string,
    userMessage?: string,
    context?: LogContext,
    retryable: boolean = false,
    retryAfter?: number
  ): ScrapingError {
    const error = new Error(message) as ScrapingError;
    error.name = 'ScrapingError';
    error.type = type;
    error.code = code;
    error.statusCode = this.getStatusCodeForErrorType(type);
    error.userMessage = userMessage || message;
    error.context = context;
    error.retryable = retryable;
    error.retryAfter = retryAfter;
    
    return error;
  }

  // Specific error creation methods
  validationError(message: string, field?: string, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.VALIDATION_ERROR,
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Validation error: ${message}`,
      `Les données fournies sont invalides: ${message}`,
      context
    );
  }

  authenticationError(message: string = 'Authentication required', context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.AUTHENTICATION_ERROR,
      ErrorCode.UNAUTHORIZED,
      `Authentication error: ${message}`,
      'Authentification requise pour accéder à cette ressource',
      context
    );
  }

  authorizationError(message: string = 'Insufficient permissions', context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.AUTHORIZATION_ERROR,
      ErrorCode.FORBIDDEN,
      `Authorization error: ${message}`,
      'Permissions insuffisantes pour effectuer cette action',
      context
    );
  }

  rateLimitError(retryAfter: number = 60, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.RATE_LIMIT_ERROR,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      'Trop de requêtes. Veuillez réessayer plus tard.',
      context,
      true,
      retryAfter
    );
  }

  timeoutError(operation: string, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.TIMEOUT_ERROR,
      ErrorCode.REQUEST_TIMEOUT,
      `Timeout during ${operation}`,
      "L'opération a pris trop de temps. Veuillez réessayer.",
      context,
      true
    );
  }

  sourceError(sourceId: string, message: string, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.SOURCE_ERROR,
      ErrorCode.SOURCE_NOT_FOUND,
      `Source error for ${sourceId}: ${message}`,
      `Erreur avec la source de scraping: ${message}`,
      { ...context, sourceId },
      false
    );
  }

  databaseError(message: string, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.DATABASE_ERROR,
      ErrorCode.DATABASE_CONNECTION_FAILED,
      `Database error: ${message}`,
      'Erreur de base de données. Veuillez réessayer plus tard.',
      context,
      true
    );
  }

  n8nError(message: string, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.N8N_ERROR,
      ErrorCode.N8N_WEBHOOK_FAILED,
      `n8n error: ${message}`,
      'Erreur du service de scraping. Veuillez réessayer plus tard.',
      context,
      true
    );
  }

  internalError(message: string, context?: LogContext): ScrapingError {
    return this.createError(
      ErrorType.INTERNAL_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
      `Internal error: ${message}`,
      'Erreur interne du serveur. Veuillez réessayer plus tard.',
      context
    );
  }

  // Error handling middleware
  handleError(error: ScrapingError | Error | unknown, context?: LogContext): ErrorResponse {
    let scrapingError: ScrapingError;

    if (error instanceof Error && 'type' in error) {
      scrapingError = error as ScrapingError;
    } else if (error instanceof Error) {
      scrapingError = this.internalError(error.message, context);
    } else {
      scrapingError = this.internalError('Unknown error occurred', context);
    }

    // Log the error
    this.logger.error(scrapingError.message, scrapingError, scrapingError.context);

    // Create standardized error response
    const errorResponse: ErrorResponse = {
      error: {
        code: scrapingError.code,
        message: scrapingError.userMessage,
        type: scrapingError.type,
        retryable: scrapingError.retryable,
        requestId: context?.requestId
      }
    };

    if (scrapingError.retryAfter) {
      errorResponse.error.retryAfter = scrapingError.retryAfter;
    }

    // Add details for development/debugging (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.details = {
        technicalMessage: scrapingError.message,
        context: scrapingError.context,
        stack: scrapingError.stack
      };
    }

    return errorResponse;
  }

  // Create error response with proper headers
  createErrorResponse(error: ScrapingError | Error | unknown, context?: LogContext): { statusCode: number; headers: any; body: string } {
    const errorResponse = this.handleError(error, context);
    let scrapingError: ScrapingError;

    if (error instanceof Error && 'type' in error) {
      scrapingError = error as ScrapingError;
    } else if (error instanceof Error) {
      scrapingError = this.internalError(error.message, context);
    } else {
      scrapingError = this.internalError('Unknown error occurred', context);
    }

    return {
      statusCode: scrapingError.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Max-Age': '86400',
        ...(scrapingError.retryAfter && { 'Retry-After': scrapingError.retryAfter.toString() })
      },
      body: JSON.stringify(errorResponse)
    };
  }

  // Helper function to get HTTP status code for error type
  private getStatusCodeForErrorType(type: ErrorType): number {
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
        return 400;
      case ErrorType.AUTHENTICATION_ERROR:
        return 401;
      case ErrorType.AUTHORIZATION_ERROR:
        return 403;
      case ErrorType.SOURCE_ERROR:
        return 404;
      case ErrorType.RATE_LIMIT_ERROR:
        return 429;
      case ErrorType.TIMEOUT_ERROR:
        return 504;
      case ErrorType.NETWORK_ERROR:
      case ErrorType.DATABASE_ERROR:
      case ErrorType.N8N_ERROR:
      case ErrorType.INTERNAL_ERROR:
      default:
        return 500;
    }
  }

  // Async error wrapper for Netlify functions
  async wrapAsync<T>(
    asyncFn: () => Promise<T>,
    context?: LogContext,
    errorMessage?: string
  ): Promise<T> {
    try {
      return await asyncFn();
    } catch (error) {
      if (errorMessage) {
        this.logger.error(errorMessage, error as Error, context);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const errorHandler = new ScrapingErrorHandler();

// Helper functions for common error scenarios
export const createValidationError = (message: string, field?: string, context?: LogContext) => 
  errorHandler.validationError(message, field, context);

export const createAuthError = (message?: string, context?: LogContext) => 
  errorHandler.authenticationError(message, context);

export const createRateLimitError = (retryAfter?: number, context?: LogContext) => 
  errorHandler.rateLimitError(retryAfter, context);

export const createTimeoutError = (operation: string, context?: LogContext) => 
  errorHandler.timeoutError(operation, context);

export const createSourceError = (sourceId: string, message: string, context?: LogContext) => 
  errorHandler.sourceError(sourceId, message, context);

export const createDatabaseError = (message: string, context?: LogContext) => 
  errorHandler.databaseError(message, context);

export const createN8nError = (message: string, context?: LogContext) => 
  errorHandler.n8nError(message, context);

export const createInternalError = (message: string, context?: LogContext) => 
  errorHandler.internalError(message, context);
