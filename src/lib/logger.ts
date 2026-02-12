/**
 * Shared logging utility (local copy for src/)
 * Avoids cross-boundary import from netlify/functions/
 */

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

export function createLogger(name: string) {
  return {
    debug: (msg: string, ctx?: LogContext) => console.debug(`[${name}] ${msg}`, ctx || ''),
    info: (msg: string, ctx?: LogContext) => console.info(`[${name}] ${msg}`, ctx || ''),
    warn: (msg: string, ctx?: LogContext) => console.warn(`[${name}] ${msg}`, ctx || ''),
    error: (msg: string, ctx?: LogContext) => console.error(`[${name}] ${msg}`, ctx || ''),
  };
}
