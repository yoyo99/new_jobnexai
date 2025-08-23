/**
 * Global type definitions for JobNexAI SaaS application
 */

declare global {
  interface Window {
    _supabaseUrl?: string
    _supabaseKey?: string
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
    StripeGlobal?: any
    'web-vitals'?: any
    __DEV__?: boolean
  }
}

// Common utility types
export type Maybe<T> = T | null | undefined
export type NonNullable<T> = T extends null | undefined ? never : T
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: {
    message: string
    code?: string | number
    details?: any
  }
  success: boolean
  timestamp?: string
}

// Component Props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
  'data-testid'?: string
}

export interface LoadingProps {
  loading?: boolean
  disabled?: boolean
}

export interface ErrorProps {
  error?: string | null
  onErrorClear?: () => void
}

// User and Authentication types
export interface User {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  trial_ends_at?: string | null
  user_type?: 'candidate' | 'freelancer' | 'recruiter' | null
  created_at: string
  updated_at: string
}

// Job types
export interface Job {
  id: string
  title: string
  company: string
  location: string
  description?: string | null
  salary_min?: number | null
  salary_max?: number | null
  job_type: string
  remote_type?: 'remote' | 'hybrid' | 'onsite' | null
  experience_level?: 'junior' | 'mid' | 'senior' | null
  required_skills?: string[]
  created_at: string
  updated_at: string
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined
}

// UI Component types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ButtonProps extends BaseComponentProps, LoadingProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export interface SearchFilters {
  query?: string
  location?: string
  remote_type?: 'remote' | 'hybrid' | 'onsite'
  job_type?: string
  experience_level?: 'junior' | 'mid' | 'senior'
  salary_min?: number
  salary_max?: number
}

// Re-export common React types
export type {
  ComponentType,
  FC,
  ReactNode,
  ReactElement,
  MouseEvent,
  ChangeEvent,
  FormEvent
} from 'react'