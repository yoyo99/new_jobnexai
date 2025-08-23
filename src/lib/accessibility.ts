/**
 * Accessibility utilities and helpers for JobNexAI
 */

// Screen reader announcements
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer
  private announcer: HTMLElement

  private constructor() {
    this.announcer = this.createAnnouncer()
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer()
    }
    return ScreenReaderAnnouncer.instance
  }

  private createAnnouncer(): HTMLElement {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `
    document.body.appendChild(announcer)
    return announcer
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = ''
    }, 1000)
  }
}

// Focus management
export class FocusManager {
  private focusStack: HTMLElement[] = []

  pushFocus(element: HTMLElement): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement)
    }
    element.focus()
  }

  popFocus(): void {
    const previousElement = this.focusStack.pop()
    if (previousElement) {
      previousElement.focus()
    }
  }

  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    function handleTabKey(event: KeyboardEvent) {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          event.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          event.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }
}

// Keyboard navigation helpers
export const KeyboardEventHandlers = {
  handleEnterSpace: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      callback()
    }
  },

  handleEscape: (callback: () => void) => (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      callback()
    }
  },

  handleArrowKeys: (options: {
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
  }) => (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        options.onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        options.onArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        options.onArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        options.onArrowRight?.()
        break
    }
  }
}

// Color contrast utilities
export const ColorContrast = {
  // Calculate relative luminance
  getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
  },

  // Calculate contrast ratio
  getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getLuminance(color1)
    const l2 = this.getLuminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  },

  // Check if contrast meets WCAG standards
  meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2)
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7
  },

  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result && result[1] && result[2] && result[3] ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}

// Reduced motion detection
export const MotionPreferences = {
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  watchMotionPreference(callback: (prefersReduced: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }
}

// Accessible modal/dialog utilities
export class AccessibleModal {
  private modal: HTMLElement
  private focusManager: FocusManager
  private announcer: ScreenReaderAnnouncer
  private cleanupFocusTrap?: () => void

  constructor(modal: HTMLElement) {
    this.modal = modal
    this.focusManager = new FocusManager()
    this.announcer = ScreenReaderAnnouncer.getInstance()
  }

  open(): void {
    // Set ARIA attributes
    this.modal.setAttribute('aria-modal', 'true')
    this.modal.setAttribute('role', 'dialog')
    
    // Trap focus
    this.cleanupFocusTrap = this.focusManager.trapFocus(this.modal)
    
    // Announce to screen readers
    const title = this.modal.querySelector('[data-modal-title]')?.textContent
    if (title) {
      this.announcer.announce(`Dialog opened: ${title}`)
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
  }

  close(): void {
    // Restore focus
    this.focusManager.popFocus()
    
    // Cleanup focus trap
    this.cleanupFocusTrap?.()
    
    // Remove ARIA attributes
    this.modal.removeAttribute('aria-modal')
    this.modal.removeAttribute('role')
    
    // Restore body scroll
    document.body.style.overflow = ''
    
    // Announce closure
    this.announcer.announce('Dialog closed')
  }
}

// Form accessibility helpers
export const FormAccessibility = {
  // Associate labels with form controls
  associateLabel(input: HTMLElement, label: HTMLElement): void {
    const inputId = input.id || `input-${Math.random().toString(36).substr(2, 9)}`
    input.id = inputId
    label.setAttribute('for', inputId)
  },

  // Add error message association
  associateError(input: HTMLElement, errorElement: HTMLElement): void {
    const errorId = errorElement.id || `error-${Math.random().toString(36).substr(2, 9)}`
    errorElement.id = errorId
    
    const existingAriaDescribedBy = input.getAttribute('aria-describedby') || ''
    const newAriaDescribedBy = existingAriaDescribedBy 
      ? `${existingAriaDescribedBy} ${errorId}` 
      : errorId
    
    input.setAttribute('aria-describedby', newAriaDescribedBy)
    input.setAttribute('aria-invalid', 'true')
  },

  // Remove error association
  removeError(input: HTMLElement, errorId: string): void {
    const ariaDescribedBy = input.getAttribute('aria-describedby') || ''
    const newAriaDescribedBy = ariaDescribedBy
      .split(' ')
      .filter(id => id !== errorId)
      .join(' ')
    
    if (newAriaDescribedBy) {
      input.setAttribute('aria-describedby', newAriaDescribedBy)
    } else {
      input.removeAttribute('aria-describedby')
    }
    
    input.setAttribute('aria-invalid', 'false')
  }
}

// High contrast mode detection
export const HighContrastMode = {
  isEnabled(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
  },

  watchHighContrast(callback: (isHighContrast: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }
}

// Export singleton instances
export const screenReader = ScreenReaderAnnouncer.getInstance()
export const focusManager = new FocusManager()