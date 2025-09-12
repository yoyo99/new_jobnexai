import { supabase } from './supabase'
import { io, Socket } from 'socket.io-client'

// Types pour le chat
export interface Participant {
  user_id: string
  user: { full_name: string }
}
export interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: { full_name: string }
}
export interface ChatRoomData {
  id: string
  last_message: Message | null
  participants: Participant[]
}

let socket: Socket | null = null

export function initializeChat(userId: string): Socket {
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

export function disconnectChat(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export async function getChatRooms(userId: string): Promise<ChatRoomData[]> {
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
    return (data || []).map((item: any) => {
      const participants: Participant[] = (item.room.participants || []).map((p: any) => ({
        user_id: p.user_id,
        user: p.user[0],
      }))
      const msg = item.room.last_message?.[0]
      const last_message: Message | null = msg
        ? {
            id: msg.id,
            sender_id: msg.sender_id,
            content: msg.content,
            created_at: msg.created_at,
            sender: msg.sender[0],
          }
        : null
      return { id: item.room_id, participants, last_message }
    })
  } catch (error) {
    console.error('Error getting chat rooms:', error)
    return []
  }
}

export async function getChatMessages(roomId: string): Promise<Message[]> {
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
    return (data || []).map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      content: msg.content,
      created_at: msg.created_at,
      sender: msg.sender[0],
    }))
  } catch (error) {
    console.error('Error getting chat messages:', error)
    return []
  }
}

export async function sendChatMessage(roomId: string, senderId: string, content: string): Promise<boolean> {
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

export function subscribeToRoom(roomId: string, callback: (message: Message) => void): () => void {
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
        const newMsg: any = payload.new
        const message: Message = {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          content: newMsg.content,
          created_at: newMsg.created_at,
          sender: newMsg.sender,
        }
        callback(message)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function sendTypingNotification(roomId: string, userId: string): void {
  socket?.emit('typing', { roomId, userId })
}

export function subscribeToTyping(roomId: string, callback: (userId: string) => void): () => void {
  if (!socket) {
    return () => {}
  }
  socket.on(`typing:${roomId}`, (data) => {
    callback(data.userId)
  })
  return () => {
    socket?.off(`typing:${roomId}`)
  }
}