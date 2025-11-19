import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { motion } from 'framer-motion'
import {
  UserIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline'

interface Connection {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'blocked'
  connected_user: {
    id: string
    full_name: string
    title?: string
    company?: string
  }
  created_at: string
}

interface NetworkListProps {
  onChatWithUser: (userId: string) => void
}

export function NetworkList({ onChatWithUser }: NetworkListProps) {
  const { user } = useAuth()
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'accepted'>('all')

  useEffect(() => {
    if (user) {
      loadConnections()
      subscribeToConnections()
    }
  }, [user])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('professional_connections')
        .select(`
          id,
          status,
          created_at,
          connected_user:profiles!connected_user_id (
            id,
            full_name,
            title,
            company
          )
        `)
        .or(`user_id.eq.${user?.id},connected_user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConnections(data || [])
    } catch (error) {
      console.error('Error loading connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToConnections = () => {
    const channel = supabase
      .channel('connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professional_connections',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          loadConnections()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleConnection = async (connectionId: string, action: 'accept' | 'reject' | 'block') => {
    try {
      const { error } = await supabase
        .from('professional_connections')
        .update({ status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'blocked' })
        .eq('id', connectionId)

      if (error) throw error
      loadConnections()
    } catch (error) {
      console.error('Error updating connection:', error)
    }
  }

  const filteredConnections = connections.filter(connection => {
    if (selectedFilter === 'all') return true
    return connection.status === selectedFilter
  })

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setSelectedFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setSelectedFilter('accepted')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'accepted'
              ? 'bg-primary-600 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Acceptées
        </button>
      </div>

      <div className="space-y-4">
        {filteredConnections.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Aucune connexion trouvée
          </div>
        ) : (
          filteredConnections.map((connection) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {connection.connected_user.full_name}
                    </h3>
                    {connection.connected_user.title && (
                      <p className="text-sm text-gray-400">
                        {connection.connected_user.title}
                      </p>
                    )}
                    {connection.connected_user.company && (
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        {connection.connected_user.company}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {connection.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConnection(connection.id, 'accept')}
                        className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                      >
                        <UserPlusIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleConnection(connection.id, 'reject')}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      >
                        <UserMinusIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  {connection.status === 'accepted' && (
                    <button
                      onClick={() => onChatWithUser(connection.connected_user.id)}
                      className="p-2 text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors"
                    >
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}