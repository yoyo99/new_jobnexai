import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  subscribeToNotifications,
  requestNotificationPermission,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../lib/notifications'

interface Notification {
  id: string
  type: 'new_job' | 'match_update' | 'favorite_update' | 'application_update'
  title: string
  content: string
  link: string | null
  read: boolean
  created_at: string
}

export function NotificationCenter() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      requestNotificationPermission()
      const unsubscribe = subscribeToNotifications(user.id)
      return () => unsubscribe()
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
        .limit(20)

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
      await markNotificationAsRead(notificationId)
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
      await markAllNotificationsAsRead(user?.id)
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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative rounded-full p-1 text-gray-400 hover:text-gray-300"
      >
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
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-background p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <Dialog.Title className="text-lg font-medium text-white">
                      Notifications
                    </Dialog.Title>
                    <div className="flex items-center gap-4">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-primary-400 hover:text-primary-300"
                        >
                          Tout marquer comme lu
                        </button>
                      )}
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 py-4">
                        Aucune notification
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg transition-colors ${
                            notification.read
                              ? 'bg-white/5'
                              : 'bg-primary-600/20'
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
                        </motion.div>
                      ))
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}