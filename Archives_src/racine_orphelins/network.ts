import { supabase } from './supabase'

export async function getConnections(userId: string) {
  try {
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
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting connections:', error)
    return []
  }
}

export async function getPendingRequests(userId: string) {
  try {
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
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting pending requests:', error)
    return []
  }
}

export async function sendConnectionRequest(userId: string, connectedUserId: string) {
  try {
    const { error } = await supabase
      .from('professional_connections')
      .insert({
        user_id: userId,
        connected_user_id: connectedUserId,
        status: 'pending'
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error sending connection request:', error)
    return false
  }
}

export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'rejected' | 'blocked') {
  try {
    const { error } = await supabase
      .from('professional_connections')
      .update({ status })
      .eq('id', connectionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating connection status:', error)
    return false
  }
}

export async function searchUsers(query: string, currentUserId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, title, company')
      .ilike('full_name', `%${query}%`)
      .neq('id', currentUserId)
      .limit(20)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

export async function getConnectionStatus(userId: string, connectedUserId: string) {
  try {
    const { data, error } = await supabase
      .from('professional_connections')
      .select('status')
      .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${userId})`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No connection found
        return null
      }
      throw error
    }
    
    return data.status
  } catch (error) {
    console.error('Error getting connection status:', error)
    return null
  }
}