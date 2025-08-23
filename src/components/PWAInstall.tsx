import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pwaManager, canInstallPWA, installPWA, isPWAInstalled } from '../lib/pwa'
import { screenReader } from '../lib/accessibility'

interface PWAInstallProps {
  variant?: 'banner' | 'button' | 'floating'
  className?: string
  showIcon?: boolean
}

export function PWAInstall({ 
  variant = 'button', 
  className = '',
  showIcon = true 
}: PWAInstallProps) {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check initial state
    setCanInstall(canInstallPWA())
    setIsInstalled(isPWAInstalled())

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setCanInstall(true)
      setShowPrompt(true)
      screenReader.announce('App installation is now available')
    }

    const handleInstallCompleted = () => {
      setCanInstall(false)
      setIsInstalled(true)
      setShowPrompt(false)
      screenReader.announce('App installed successfully')
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    window.addEventListener('pwa-install-completed', handleInstallCompleted)

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      window.removeEventListener('pwa-install-completed', handleInstallCompleted)
    }
  }, [])

  const handleInstall = async () => {
    if (!canInstall) return

    setIsInstalling(true)
    
    try {
      const installed = await installPWA()
      
      if (installed) {
        setShowPrompt(false)
        screenReader.announce('App installation started')
      } else {
        screenReader.announce('App installation was cancelled')
      }
    } catch (error) {
      console.error('Installation failed:', error)
      screenReader.announce('App installation failed')
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    screenReader.announce('Installation prompt dismissed')
  }

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall) {
    return null
  }

  if (variant === 'banner') {
    return (
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-4 shadow-lg ${className}`}
            role="banner"
            aria-label="App installation prompt"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {showIcon && (
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Install JobNexAI</h3>
                  <p className="text-sm opacity-90">Get the app for a better experience</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Install JobNexAI app"
                >
                  {isInstalling ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Installing...</span>
                    </span>
                  ) : (
                    'Install'
                  )}
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white p-2 rounded-lg transition-colors"
                  aria-label="Dismiss installation prompt"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`fixed bottom-6 right-6 z-50 ${className}`}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-sm border border-gray-200">
              <div className="flex items-start space-x-3">
                {showIcon && (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">Install JobNexAI</h3>
                  <p className="text-xs text-gray-600 mt-1">Access your job search tools offline</p>
                  
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      onClick={handleInstall}
                      disabled={isInstalling}
                      className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isInstalling ? 'Installing...' : 'Install'}
                    </button>
                    
                    <button
                      onClick={handleDismiss}
                      className="text-gray-500 hover:text-gray-700 text-xs"
                    >
                      Later
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // Default button variant
  return (
    <motion.button
      onClick={handleInstall}
      disabled={isInstalling}
      className={`inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Install JobNexAI app"
    >
      {showIcon && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )}
      
      <span>
        {isInstalling ? 'Installing...' : 'Install App'}
      </span>
      
      {isInstalling && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
    </motion.button>
  )
}

// Connection status indicator
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleConnectionChange = (event: CustomEvent<{ isOnline: boolean }>) => {
      setIsOnline(event.detail.isOnline)
      setShowStatus(true)
      
      // Hide status after 3 seconds
      setTimeout(() => setShowStatus(false), 3000)
    }

    window.addEventListener('connection-change', handleConnectionChange as EventListener)
    
    return () => {
      window.removeEventListener('connection-change', handleConnectionChange as EventListener)
    }
  }, [])

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium ${
            isOnline 
              ? 'bg-green-500' 
              : 'bg-red-500'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-200' : 'bg-red-200'
            }`} />
            <span>
              {isOnline ? 'Back online' : 'You\'re offline'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Update available notification
export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShowUpdate(true)
      screenReader.announce('App update available')
    }

    window.addEventListener('pwa-update-available', handleUpdateAvailable)
    
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)
    
    try {
      await pwaManager.skipWaiting()
      window.location.reload()
    } catch (error) {
      console.error('Update failed:', error)
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm">Update Available</h3>
                <p className="text-sm text-gray-600 mt-1">A new version of the app is ready to install</p>
                
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Now'}
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Later
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}