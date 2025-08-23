/**
 * Progressive Web App utilities and service worker management
 */

interface InstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

class PWAManager {
  private static instance: PWAManager
  private installPrompt: InstallPromptEvent | null = null
  private registration: ServiceWorkerRegistration | null = null
  private isOnline = navigator.onLine

  private constructor() {
    this.init()
  }

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  private async init() {
    // Register service worker
    await this.registerServiceWorker()
    
    // Setup install prompt handling
    this.setupInstallPrompt()
    
    // Setup online/offline detection
    this.setupOnlineOfflineHandling()
    
    // Setup push notifications
    this.setupPushNotifications()
  }

  // Service Worker Registration
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered:', this.registration.scope)

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.showUpdateAvailableNotification()
            }
          })
        }
      })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data)
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  // Install Prompt Management
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPrompt = e as InstallPromptEvent
      this.showInstallButton()
    })

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      this.hideInstallButton()
      this.trackInstallation()
    })
  }

  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      return false
    }

    try {
      await this.installPrompt.prompt()
      const { outcome } = await this.installPrompt.userChoice
      
      console.log('Install prompt result:', outcome)
      
      if (outcome === 'accepted') {
        this.installPrompt = null
        return true
      }
      
      return false
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  canInstall(): boolean {
    return this.installPrompt !== null
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           // @ts-ignore
           window.navigator.standalone === true
  }

  // Online/Offline Handling
  private setupOnlineOfflineHandling(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.handleOnlineStatus(true)
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.handleOnlineStatus(false)
    })
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }

  private handleOnlineStatus(isOnline: boolean): void {
    if (isOnline) {
      this.showOnlineNotification()
      this.syncOfflineData()
    } else {
      this.showOfflineNotification()
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('connection-change', {
      detail: { isOnline }
    }))
  }

  // Push Notifications
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('Push notifications not supported')
      return
    }

    // Request permission if not granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration || Notification.permission !== 'granted') {
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      })

      console.log('Push subscription successful:', subscription)
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Background Sync
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('Background sync not supported')
      return
    }

    try {
      // Type assertion for sync property
      const syncManager = (this.registration as any).sync
      await syncManager.register(tag)
      console.log('Background sync registered:', tag)
    } catch (error) {
      console.error('Background sync registration failed:', error)
    }
  }

  // Cache Management
  async clearCache(): Promise<void> {
    if (!('caches' in window)) {
      return
    }

    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('All caches cleared')
    } catch (error) {
      console.error('Cache clearing failed:', error)
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window) || !('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0
    }

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      console.error('Cache size estimation failed:', error)
      return 0
    }
  }

  // Update Management
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      await this.registration.update()
      return true
    } catch (error) {
      console.error('Update check failed:', error)
      return false
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      return
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  // Private helper methods
  private showInstallButton(): void {
    const event = new CustomEvent('pwa-install-available')
    window.dispatchEvent(event)
  }

  private hideInstallButton(): void {
    const event = new CustomEvent('pwa-install-completed')
    window.dispatchEvent(event)
  }

  private showUpdateAvailableNotification(): void {
    const event = new CustomEvent('pwa-update-available')
    window.dispatchEvent(event)
  }

  private showOnlineNotification(): void {
    const event = new CustomEvent('pwa-online')
    window.dispatchEvent(event)
  }

  private showOfflineNotification(): void {
    const event = new CustomEvent('pwa-offline')
    window.dispatchEvent(event)
  }

  private trackInstallation(): void {
    // Track PWA installation with analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag
      gtag('event', 'pwa_install', {
        event_category: 'PWA',
        event_label: 'User installed PWA'
      })
    }
  }

  private async syncOfflineData(): Promise<void> {
    // Trigger background sync for offline data
    await this.requestBackgroundSync('profile-update-sync')
    await this.requestBackgroundSync('job-application-sync')
  }

  private handleServiceWorkerMessage(data: any): void {
    console.log('Message from Service Worker:', data)
    
    switch (data.type) {
      case 'CACHE_UPDATED':
        window.dispatchEvent(new CustomEvent('pwa-cache-updated'))
        break
      case 'OFFLINE_READY':
        window.dispatchEvent(new CustomEvent('pwa-offline-ready'))
        break
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance()

// Utility functions
export const isPWAInstalled = (): boolean => {
  return pwaManager.isInstalled()
}

export const canInstallPWA = (): boolean => {
  return pwaManager.canInstall()
}

export const installPWA = (): Promise<boolean> => {
  return pwaManager.promptInstall()
}

export const isOnline = (): boolean => {
  return pwaManager.getOnlineStatus()
}

export const subscribeToPush = (): Promise<PushSubscription | null> => {
  return pwaManager.subscribeToPushNotifications()
}

export const requestSync = (tag: string): Promise<void> => {
  return pwaManager.requestBackgroundSync(tag)
}

// PWA-related custom events
export interface PWAEvents {
  'pwa-install-available': CustomEvent
  'pwa-install-completed': CustomEvent
  'pwa-update-available': CustomEvent
  'pwa-online': CustomEvent
  'pwa-offline': CustomEvent
  'pwa-cache-updated': CustomEvent
  'pwa-offline-ready': CustomEvent
  'connection-change': CustomEvent<{ isOnline: boolean }>
}

// Type augmentation for PWA events
declare global {
  interface WindowEventMap extends PWAEvents {}
}