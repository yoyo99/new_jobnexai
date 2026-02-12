import { Fragment, useEffect, useState } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'new_job' | 'match_update' | 'favorite_update'
  title: string
  content: string
  link: string | null
  read: boolean
  created_at: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadNotifications()
      
      // Souscrire aux nouvelles notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false)

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  if (loading || !user) return null

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative rounded-full p-1 text-gray-400 hover:text-gray-300">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white"
          >
            {unreadCount}
          </motion.span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-lg bg-background shadow-lg ring-1 ring-white/10 focus:outline-none">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-400 py-4">
                  Aucune notification
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg transition-colors ${
                      notification.read
                        ? 'bg-white/5'
                        : 'bg-primary-600/20 hover:bg-primary-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(notification.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="shrink-0 text-xs text-primary-400 hover:text-primary-300"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                    {notification.link && (
                      <a
                        href={notification.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-primary-400 hover:text-primary-300 mt-2"
                      >
                        Voir les détails →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}