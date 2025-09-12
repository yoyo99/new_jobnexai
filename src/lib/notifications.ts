import { supabase } from './supabase'
import { trackError } from './monitoring'

export async function requestNotificationPermission() {
  try {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    trackError(error as Error, { context: 'notifications.permission' })
    return false
  }
}

export function subscribeToNotifications(userId: string) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const notification = payload.new as any

        // Notification système
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.content,
            icon: '/logo.png',
            tag: notification.id,
            data: {
              url: notification.link,
            },
          })
        }

        // Notification sonore
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {
          // Ignorer les erreurs de lecture audio
        })

        // Mise à jour du badge
        if ('setAppBadge' in navigator && typeof navigator.setAppBadge === 'function') {
          (navigator as any).setAppBadge(1).catch(() => {
            // Ignorer les erreurs de badge
          })
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) throw error

    // Mettre à jour le badge
    if ('clearAppBadge' in navigator && typeof navigator.clearAppBadge === 'function') {
      (navigator as any).clearAppBadge().catch(() => {
        // Ignorer les erreurs de badge
      })
    }
  } catch (error) {
    trackError(error as Error, { context: 'notifications.markAsRead' })
    throw error
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error

    // Mettre à jour le badge
    if ('clearAppBadge' in navigator && typeof navigator.clearAppBadge === 'function') {
      (navigator as any).clearAppBadge().catch(() => {
        // Ignorer les erreurs de badge
      })
    }
  } catch (error) {
    trackError(error as Error, { context: 'notifications.markAllAsRead' })
    throw error
  }
}