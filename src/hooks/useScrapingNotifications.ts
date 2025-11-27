import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

export function useScrapingNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`scraping-history-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scraping_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.status === 'completed') {
            toast.success('Le scraping est terminé ! Tes résultats sont disponibles.')
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])
}
