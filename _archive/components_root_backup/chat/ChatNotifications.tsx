import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

interface ChatNotificationsProps {
  onOpenChat: (roomId: string, participantId: string) => void
}

export function ChatNotifications({ onOpenChat }: ChatNotificationsProps) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [latestMessage, setLatestMessage] = useState<{
    roomId: string
    participantId: string
    senderName: string
    content: string
  } | null>(null)

  useEffect(() => {
    if (user) {
      loadUnreadCount()
      subscribeToNewMessages()
    }
  }, [user])

  const loadUnreadCount = async () => {
    try {
      // This is a placeholder - in a real app, you would calculate unread messages
      // based on a read_by array or similar mechanism
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .not('read_by', 'cs', `{${user?.id}}`)
        .neq('sender_id', user?.id)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('new_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=neq.${user?.id}`
        },
        async (payload) => {
          // Handle new message
          const { new: newMessage } = payload
          
          // Update unread count
          setUnreadCount((prev) => prev + 1)
          
          // Show notification
          try {
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMessage.sender_id)
              .single()
            
            setLatestMessage({
              roomId: newMessage.room_id,
              participantId: newMessage.sender_id,
              senderName: sender?.full_name || 'Someone',
              content: newMessage.content
            })
            setShowNotification(true)
          } catch (error) {
            console.error('Error fetching message details:', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleNotificationClick = () => {
    if (latestMessage) {
      onOpenChat(latestMessage.roomId, latestMessage.participantId)
      setShowNotification(false)
    }
  }

  return (
    <>
      <div className="relative">
        <button
          className="relative p-2 text-gray-600 hover:text-gray-900"
          onClick={() => onOpenChat('', '')}
        >
          <ChatBubbleLeftIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {showNotification && latestMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm cursor-pointer"
          onClick={handleNotificationClick}
        >
          <h4 className="font-semibold">{latestMessage.senderName}</h4>
          <p className="text-sm text-gray-600 truncate">{latestMessage.content}</p>
        </motion.div>
      )}
    </>
  )
}