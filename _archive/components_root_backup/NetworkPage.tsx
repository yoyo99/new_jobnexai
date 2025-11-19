import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { Network } from './Network'
import { ChatNotifications } from './chat/ChatNotifications'
import { NotificationPreferences } from './notifications/NotificationPreferences'
import { initializeChat, disconnectChat } from '../lib/chat'

export function NetworkPage() {
  const { user } = useAuth()
  const [showPreferences, setShowPreferences] = useState(false)
  const [activeChatRoom, setActiveChatRoom] = useState<{
    roomId: string
    participantId: string
  } | null>(null)

  useEffect(() => {
    if (user) {
      // Initialize chat connection
      initializeChat(user.id)
      
      return () => {
        // Clean up chat connection
        disconnectChat()
      }
    }
  }, [user])

  const handleOpenChat = (roomId: string, participantId: string) => {
    setActiveChatRoom({ roomId, participantId })
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Réseau professionnel</h1>
          <p className="text-gray-400 mt-1">
            Gérez vos connexions et échangez avec d'autres professionnels
          </p>
        </div>
        <button
          onClick={() => setShowPreferences(!showPreferences)}
          className="btn-secondary"
        >
          {showPreferences ? 'Retour au réseau' : 'Préférences de notification'}
        </button>
      </div>

      {showPreferences ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <NotificationPreferences />
        </motion.div>
      ) : (
        <Network />
      )}

      <ChatNotifications onOpenChat={handleOpenChat} />
    </div>
  )
}