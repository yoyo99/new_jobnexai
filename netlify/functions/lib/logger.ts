// Shared logging utility for Netlify Functions
// Provides structured logging with correlation IDs and performance tracking

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  sessionId?: string;
  userId?: string;
  sourceId?: string;
  requestId?: string;
  function?: string;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private functionName: string;
  private requestId: string;

  constructor(functionName: string) {
    this.functionName = functionName;
    this.requestId = this.generateRequestId();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        function: this.functionName,
        requestId: this.requestId
      }
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    return entry;
  }

  private log(entry: LogEntry): void {
    const logMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.function}:${entry.requestId}] ${entry.message}`;
    
    // Add context info
    if (entry.context) {
      const contextStr = Object.entries(entry.context)
        .filter(([key]) => key !== 'function' && key !== 'requestId')
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      
      if (contextStr) {
        console.log(`${logMessage} ${contextStr}`);
      } else {
        console.log(logMessage);
      }
    } else {
      console.log(logMessage);
    }

    // Add error details if present
    if (entry.error) {
      console.error(`Error details: ${entry.error.message}`);
      if (entry.error.stack) {
        console.error(`Stack trace: ${entry.error.stack}`);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(this.formatMessage(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.log(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(this.formatMessage(LogLevel.ERROR, message, context, error));
  }

  // Performance logging
  startTimer(context?: LogContext): () => void {
    const startTime = Date.now();
    this.debug('Timer started', context);

    return () => {
      const duration = Date.now() - startTime;
      this.debug('Timer completed', { ...context, duration });
    };
  }

  // Session-specific logging
  logSessionEvent(event: string, sessionId: string, context?: Omit<LogContext, 'sessionId'>): void {
    this.info(`Session event: ${event}`, { ...context, sessionId });
  }

  // Source-specific logging
  logSourceEvent(event: string, sourceId: string, context?: Omit<LogContext, 'sourceId'>): void {
    this.info(`Source event: ${event}`, { ...context, sourceId });
  }

  // API request logging
  logApiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API request: ${method} ${url}`, context);
  }

  logApiResponse(statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(this.formatMessage(level, `API response: ${statusCode} (${duration}ms)`, context));
  }

  // Get request ID for correlation
  getRequestId(): string {
    return this.requestId;
  }
}

// Factory function to create logger instances
export function createLogger(functionName: string): Logger {
  return new Logger(functionName);
}

// Default logger export
export const logger = createLogger('netlify-function');
