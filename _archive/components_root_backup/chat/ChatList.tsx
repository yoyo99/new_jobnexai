import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatRoom {
  id: string
  last_message?: {
    content: string
    created_at: string
    sender: {
      full_name: string
    }
  }
  participants: {
    user_id: string
    user: {
      full_name: string
    }
  }[]
  unread_count: number
}

interface ChatListProps {
  onSelectRoom: (roomId: string, participantId: string) => void
}

export function ChatList({ onSelectRoom }: ChatListProps) {
  const { user } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadChatRooms()
      subscribeToNewMessages()
    }
  }, [user])

  const loadChatRooms = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chat_room_participants')
        .select(`
          room_id,
          room:chat_rooms (
            id,
            last_message:chat_messages (
              content,
              created_at,
              sender:profiles!sender_id (
                full_name
              )
            ),
            participants:chat_room_participants (
              user_id,
              user:profiles!user_id (
                full_name
              )
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('room.last_message.created_at', { ascending: false })

      if (error) throw error

      // Format the data
      const rooms = data.map(item => {
        const otherParticipants = item.room.participants.filter(
          p => p.user_id !== user?.id
        )

        // Count unread messages
        const unreadCount = 0 // This would need to be calculated based on read_by array

        return {
          id: item.room_id,
          last_message: item.room.last_message?.[0],
          participants: otherParticipants,
          unread_count: unreadCount
        }
      })

      setChatRooms(rooms)
    } catch (error) {
      console.error('Error loading chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          loadChatRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (chatRooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Aucune conversation
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {chatRooms.map((room) => {
        const otherParticipant = room.participants[0]
        
        return (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => onSelectRoom(room.id, otherParticipant.user_id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">
                  {otherParticipant.user.full_name}
                </h3>
                {room.last_message && (
                  <p className="text-sm text-gray-400 truncate">
                    {room.last_message.sender.full_name === user?.full_name
                      ? 'Vous: '
                      : `${room.last_message.sender.full_name}: `}
                    {room.last_message.content}
                  </p>
                )}
              </div>
              <div className="text-right">
                {room.last_message && (
                  <p className="text-xs text-gray-500">
                    {format(new Date(room.last_message.created_at), 'HH:mm', { locale: fr })}
                  </p>
                )}
                {room.unread_count > 0 && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-white text-xs">
                    {room.unread_count}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}