import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { NetworkList } from './network/NetworkList'
import { ConnectionRequests } from './network/ConnectionRequests'
import { ChatRoom } from './chat/ChatRoom'
import { UserSearch } from './network/UserSearch'
import {
  UserGroupIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export function Network() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'chat' | 'search'>('connections')
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadPendingRequestsCount()
    }
  }, [user])

  const loadPendingRequestsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('professional_connections')
        .select('*', { count: 'exact', head: true })
        .eq('connected_user_id', user?.id)
        .eq('status', 'pending')

      if (error) throw error
      setPendingRequestsCount(count || 0)
    } catch (error) {
      console.error('Error loading pending requests count:', error)
    }
  }

  const handleChatWithUser = async (userId: string) => {
    try {
      // Check if a chat room already exists between these users
      const { data: existingRooms, error: roomsError } = await supabase
        .from('chat_room_participants')
        .select(`
          room_id,
          room:chat_rooms(
            id
          )
        `)
        .eq('user_id', user?.id)

      if (roomsError) throw roomsError

      const { data: otherParticipants, error: participantsError } = await supabase
        .from('chat_room_participants')
        .select('room_id, user_id')
        .in('room_id', existingRooms.map(r => r.room_id))
        .eq('user_id', userId)

      if (participantsError) throw participantsError

      let roomId: string

      if (otherParticipants && otherParticipants.length > 0) {
        // Use existing room
        roomId = otherParticipants[0].room_id
      } else {
        // Create new room
        const { data: newRoom, error: createRoomError } = await supabase
          .from('chat_rooms')
          .insert({})
          .select()
          .single()

        if (createRoomError) throw createRoomError

        roomId = newRoom.id

        // Add participants
        const { error: addParticipantsError } = await supabase
          .from('chat_room_participants')
          .insert([
            { room_id: roomId, user_id: user?.id },
            { room_id: roomId, user_id: userId }
          ])

        if (addParticipantsError) throw addParticipantsError
      }

      setSelectedChatRoom(roomId)
      setSelectedParticipant(userId)
      setActiveTab('chat')
    } catch (error) {
      console.error('Error setting up chat room:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Réseau professionnel</h1>
        <p className="text-gray-400 mt-1">
          Gérez vos connexions et échangez avec d'autres professionnels
        </p>
      </div>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'connections'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <UserGroupIcon className="h-5 w-5" />
            Connexions
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <UserPlusIcon className="h-5 w-5" />
            Demandes
            {pendingRequestsCount > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Messages
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'search'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            Rechercher
          </button>
        </nav>
      </div>

      <div className="card">
        {activeTab === 'connections' && (
          <NetworkList onChatWithUser={handleChatWithUser} />
        )}
        {activeTab === 'requests' && (
          <ConnectionRequests />
        )}
        {activeTab === 'chat' && selectedChatRoom && selectedParticipant && (
          <ChatRoom roomId={selectedChatRoom} participantId={selectedParticipant} />
        )}
        {activeTab === 'chat' && (!selectedChatRoom || !selectedParticipant) && (
          <div className="text-center py-12 text-gray-400">
            Sélectionnez une connexion pour démarrer une conversation
          </div>
        )}
        {activeTab === 'search' && (
          <UserSearch onConnect={(userId) => {
            // Handle connection request
          }} />
        )}
      </div>
    </div>
  )
}