import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline'

interface User {
  id: string
  full_name: string
  title?: string
  company?: string
}

interface UserSearchProps {
  onConnect: (userId: string) => void
}

export function UserSearch({ onConnect }: UserSearchProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingConnections, setPendingConnections] = useState<Record<string, boolean>>({})

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, title, company')
        .ilike('full_name', `%${searchQuery}%`)
        .neq('id', user?.id)
        .limit(20)

      if (error) throw error
      setSearchResults(data || [])

      // Check existing connection status
      if (data && data.length > 0) {
        const userIds = data.map(u => u.id)
        const { data: connections, error: connectionsError } = await supabase
          .from('professional_connections')
          .select('connected_user_id, status')
          .eq('user_id', user?.id)
          .in('connected_user_id', userIds)

        if (connectionsError) throw connectionsError

        const pendingMap: Record<string, boolean> = {}
        connections?.forEach(conn => {
          pendingMap[conn.connected_user_id] = conn.status === 'pending'
        })
        setPendingConnections(pendingMap)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendConnectionRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('professional_connections')
        .insert({
          user_id: user?.id,
          connected_user_id: userId,
          status: 'pending'
        })

      if (error) throw error

      setPendingConnections(prev => ({
        ...prev,
        [userId]: true
      }))
    } catch (error) {
      console.error('Error sending connection request:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white mb-4">
          Rechercher des professionnels
        </h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="btn-primary"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {searchResults.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {loading ? 'Recherche en cours...' : 'Aucun résultat trouvé'}
          </div>
        ) : (
          searchResults.map((result) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">
                    {result.full_name}
                  </h3>
                  {result.title && (
                    <p className="text-sm text-gray-400">
                      {result.title}
                    </p>
                  )}
                  {result.company && (
                    <p className="text-sm text-gray-400">
                      {result.company}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => sendConnectionRequest(result.id)}
                  disabled={pendingConnections[result.id]}
                  className={`btn-secondary flex items-center gap-2 ${
                    pendingConnections[result.id] ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <UserPlusIcon className="h-5 w-5" />
                  {pendingConnections[result.id] ? 'Demande envoyée' : 'Se connecter'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}