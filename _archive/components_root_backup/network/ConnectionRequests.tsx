import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { motion } from 'framer-motion'
import {
  UserIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface ConnectionRequest {
  id: string
  user: {
    id: string
    full_name: string
    title?: string
    company?: string
  }
  created_at: string
}

export function ConnectionRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadRequests()
      subscribeToRequests()
    }
  }, [user])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('professional_connections')
        .select(`
          id,
          created_at,
          user:profiles!user_id (
            id,
            full_name,
            title,
            company
          )
        `)
        .eq('connected_user_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'professional_connections',
          filter: `connected_user_id=eq.${user?.id}`,
        },
        () => {
          loadRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleRequest = async (requestId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('professional_connections')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId)

      if (error) throw error
      loadRequests()
    } catch (error) {
      console.error('Error handling request:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Aucune demande de connexion en attente
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-600/20 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">
                  {request.user.full_name}
                </h3>
                {request.user.title && (
                  <p className="text-sm text-gray-400">
                    {request.user.title}
                  </p>
                )}
                {request.user.company && (
                  <p className="text-sm text-gray-400">
                    {request.user.company}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRequest(request.id, true)}
                className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleRequest(request.id, false)}
                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}