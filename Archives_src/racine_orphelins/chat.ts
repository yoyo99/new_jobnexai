import { supabase } from './supabase'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function initializeChat(userId: string) {
  if (socket) return socket

  socket = io(import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:3001', {
    auth: {
      userId
    }
  })

  socket.on('connect', () => {
    console.log('Connected to chat server')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from chat server')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  return socket
}

export function disconnectChat() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export async function getChatRooms(userId: string) {
  try {
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
      .eq('user_id', userId)
      .order('room.last_message.created_at', { ascending: false })

    if (error) throw error

    return data.map(item => {
      const otherParticipants = item.room.participants.filter(
        p => p.user_id !== userId
      )

      return {
        id: item.room_id,
        last_message: item.room.last_message?.[0],
        participants: otherParticipants
      }
    })
  } catch (error) {
    console.error('Error getting chat rooms:', error)
    return []
  }
}

export async function getChatMessages(roomId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id,
        sender_id,
        content,
        created_at,
        sender:profiles!sender_id (
          full_name
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting chat messages:', error)
    return []
  }
}

export async function sendChatMessage(roomId: string, senderId: string, content: string) {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error sending chat message:', error)
    return false
  }
}

export function subscribeToRoom(roomId: string, callback: (message: any) => void) {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function sendTypingNotification(roomId: string, userId: string) {
  if (socket) {
    socket.emit('typing', { roomId, userId })
  }
}

export function subscribeToTyping(roomId: string, callback: (userId: string) => void) {
  if (socket) {
    socket.on(`typing:${roomId}`, (data) => {
      callback(data.userId)
    })

    return () => {
      socket.off(`typing:${roomId}`)
    }
  }
  return () => {}
}