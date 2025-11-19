import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { 
  getChatMessages, 
  sendChatMessage, 
  subscribeToRoom, 
  sendTypingNotification, 
  subscribeToTyping 
} from '../../lib/chat'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: {
    full_name: string
  }
}

interface ChatRoomProps {
  roomId: string
  participantId: string
}

export function ChatRoom({ roomId, participantId }: ChatRoomProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const [participant, setParticipant] = useState<{ full_name: string } | null>(null)

  useEffect(() => {
    loadMessages()
    const unsubscribe = subscribeToRoom(roomId, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })
    
    loadParticipantInfo()

    const unsubscribeTyping = subscribeToTyping(roomId, (userId) => {
      if (userId !== user?.id) {
        setIsTyping(true)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
        }, 3000)
      }
    })

    return () => {
      unsubscribe()
      unsubscribeTyping()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const messages = await getChatMessages(roomId)
      setMessages(messages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadParticipantInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', participantId)
        .single()

      if (error) throw error
      setParticipant(data)
    } catch (error) {
      console.error('Error loading participant info:', error)
    }
  }

  const handleTyping = () => {
    sendTypingNotification(roomId, user?.id || '')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    try {
      const success = await sendChatMessage(roomId, user.id, newMessage.trim())
      if (success) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-white/5 rounded-lg">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-medium text-white">
          {participant?.full_name || 'Conversation'}
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === user?.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.sender.full_name}
                </span>
                <span className="text-xs opacity-70">
                  {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="text-sm text-gray-400">
            {participant?.full_name} est en train d'écrire...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage()
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            Envoyer
          </button>
        </div>
      </div>
    </div>
  )
}