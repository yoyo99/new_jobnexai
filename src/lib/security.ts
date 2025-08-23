/**
 * Security configuration and utilities for JobNexAI
 */

// Content Security Policy configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Vite in development
      "https://js.stripe.com",
      "https://www.googletagmanager.com"
    ],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https://*.supabase.co"],
    connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
    objectSrc: ["'none'"]
  }
}

// Input validation schemas
export const validationSchemas = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
  }
}

// Security utilities
export class SecurityUtils {
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
  }

  static validateInput(input: string, type: 'email' | 'password' | 'text'): {
    isValid: boolean
    sanitized: string
    errors: string[]
  } {
    const errors: string[] = []
    let sanitized = input.trim()
    sanitized = this.sanitizeHtml(sanitized)

    switch (type) {
      case 'email':
        if (!validationSchemas.email.test(sanitized)) {
          errors.push('Invalid email format')
        }
        break
      case 'password':
        if (sanitized.length < validationSchemas.password.minLength) {
          errors.push('Password too short')
        }
        if (!validationSchemas.password.pattern.test(sanitized)) {
          errors.push('Password must contain uppercase, lowercase, number, and special character')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors
    }
  }

  static checkPasswordStrength(password: string): {
    score: number
    strength: 'weak' | 'medium' | 'strong'
    suggestions: string[]
  } {
    let score = 0
    const suggestions: string[] = []

    if (password.length >= 8) score += 1
    else suggestions.push('Use at least 8 characters')
    
    if (/[a-z]/.test(password)) score += 1
    else suggestions.push('Add lowercase letters')
    
    if (/[A-Z]/.test(password)) score += 1
    else suggestions.push('Add uppercase letters')
    
    if (/\d/.test(password)) score += 1
    else suggestions.push('Add numbers')
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else suggestions.push('Add special characters')

    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'

    return { score, strength, suggestions }
  }
}

// Security event logging
export class SecurityLogger {
  private static events: Array<{
    timestamp: number
    level: 'info' | 'warning' | 'error'
    event: string
    details: any
  }> = []

  static log(level: 'info' | 'warning' | 'error', event: string, details: any = {}) {
    const logEntry = {
      timestamp: Date.now(),
      level,
      event,
      details
    }

    this.events.push(logEntry)

    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY ${level.toUpperCase()}]`, event, details)
    }
  }

  static getEvents() {
    return [...this.events]
  }
}

export default {
  cspConfig,
  validationSchemas,
  SecurityUtils,
  SecurityLogger
}