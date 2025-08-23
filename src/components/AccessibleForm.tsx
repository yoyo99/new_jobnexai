import React, { useState, useRef, useEffect } from 'react'
import { FormAccessibility, screenReader } from '../lib/accessibility'

interface FormFieldProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url'
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  placeholder?: string
  description?: string
  autoComplete?: string
}

export function AccessibleFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  description,
  autoComplete
}: FormFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [hasBeenFocused, setHasBeenFocused] = useState(false)

  // Associate labels and errors
  useEffect(() => {
    if (inputRef.current) {
      const input = inputRef.current
      
      // Associate with description if it exists
      if (description && descriptionRef.current) {
        const descId = `${id}-description`
        descriptionRef.current.id = descId
        
        const existingDescribedBy = input.getAttribute('aria-describedby') || ''
        const newDescribedBy = existingDescribedBy 
          ? `${existingDescribedBy} ${descId}` 
          : descId
        input.setAttribute('aria-describedby', newDescribedBy)
      }

      // Handle error state
      if (error && errorRef.current && hasBeenFocused) {
        FormAccessibility.associateError(input, errorRef.current)
        
        // Announce error to screen readers
        screenReader.announce(`${label}: ${error}`, 'assertive')
      } else if (!error && errorRef.current) {
        const errorId = errorRef.current.id
        if (errorId) {
          FormAccessibility.removeError(input, errorId)
        }
      }
    }
  }, [error, description, id, label, hasBeenFocused])

  const handleBlur = () => {
    setHasBeenFocused(true)
  }

  const inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-50 disabled:text-gray-500
    ${error && hasBeenFocused 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300'
    }
  `

  return (
    <div className="space-y-1">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <div 
          ref={descriptionRef}
          className="text-sm text-gray-600"
        >
          {description}
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClasses}
        aria-required={required}
        aria-invalid={error && hasBeenFocused ? 'true' : 'false'}
      />

      {error && hasBeenFocused && (
        <div 
          ref={errorRef}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  )
}

interface AccessibleFormProps {
  title: string
  description?: string
  onSubmit: (data: Record<string, string>) => Promise<void>
  children: React.ReactNode
}

export function AccessibleForm({
  title,
  description,
  onSubmit,
  children
}: AccessibleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const formData = new FormData(e.currentTarget)
      const data: Record<string, string> = {}
      
      for (const [key, value] of formData.entries()) {
        data[key] = value.toString()
      }

      await onSubmit(data)
      
      // Announce successful submission
      screenReader.announce('Form submitted successfully', 'polite')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setSubmitError(errorMessage)
      
      // Announce error
      screenReader.announce(`Form submission failed: ${errorMessage}`, 'assertive')
      
      // Focus on error message for screen readers
      setTimeout(() => {
        const errorElement = formRef.current?.querySelector('[data-submit-error]') as HTMLElement
        errorElement?.focus()
      }, 100)
      
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      <div>
        <h2 
          className="text-2xl font-bold text-gray-900"
          id="form-title"
        >
          {title}
        </h2>
        {description && (
          <p 
            className="mt-2 text-gray-600"
            id="form-description"
          >
            {description}
          </p>
        )}
      </div>

      <fieldset 
        className="space-y-4"
        aria-labelledby="form-title"
        aria-describedby={description ? "form-description" : undefined}
        disabled={isSubmitting}
      >
        <legend className="sr-only">{title} form fields</legend>
        {children}
      </fieldset>

      {submitError && (
        <div
          data-submit-error
          className="rounded-md bg-red-50 p-4 border border-red-200"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-red-400" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Submission Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {submitError}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby={isSubmitting ? "submit-status" : undefined}
        >
          {isSubmitting ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                fill="none" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </button>
      </div>

      {isSubmitting && (
        <div id="submit-status" className="sr-only" aria-live="polite">
          Form is being submitted, please wait.
        </div>
      )}
    </form>
  )
}