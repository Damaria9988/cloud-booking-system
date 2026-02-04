'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export type SocketIOMessage = 
  | { type: 'connected'; data: { clientId: string; message: string } }
  | { type: 'subscribed'; data: { channel: string } }
  | { type: 'unsubscribed'; data: { channel: string } }
  | { type: 'seat_update'; data: { scheduleId: number; availableSeats: number; bookedSeats: string[] } }
  | { type: 'seat_selection'; data: { scheduleId: number; selectedSeats: string[]; clientId: string } }
  | { type: 'booking_created'; data: { bookingId: number; scheduleId: number } }
  | { type: 'booking_cancelled'; data: { bookingId: number; scheduleId: number } }
  | { type: 'schedule_cancelled'; data: { scheduleId: number } }
  | { type: 'new_booking'; data: { booking: any } }
  | { type: 'operator_created'; data: { operator: any } }
  | { type: 'operator_updated'; data: { operator: any } }
  | { type: 'operator_deleted'; data: { operatorId: number } }
  | { type: 'route_created'; data: { route: any } }
  | { type: 'route_updated'; data: { route: any } }
  | { type: 'schedule_created'; data: { schedule: any } }
  | { type: 'schedule_updated'; data: { schedule: any } }
  | { type: 'profile_updated'; data: { userId: number; user: any } }
  | { type: 'user_created'; data: { user: any } }
  | { type: 'user_deleted'; data: { userId: number } }
  | { type: 'user_count_updated'; data: { totalUsers: number } }
  | { type: 'heartbeat'; data: { timestamp: number } }
  | { type: 'pong'; data: { timestamp: number } }

type SocketIOStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseSocketIOOptions {
  autoConnect?: boolean
  autoReconnect?: boolean
  onMessage?: (message: SocketIOMessage) => void
  onError?: (error: Error) => void
  showToastNotifications?: boolean
}

export function useSocketIO(options: UseSocketIOOptions = {}) {
  const {
    autoConnect = true,
    autoReconnect = true,
    onMessage,
    onError,
    showToastNotifications = false,
  } = options

  const socket = useRef<Socket | null>(null)
  const [status, setStatus] = useState<SocketIOStatus>('disconnected')
  const [clientId, setClientId] = useState<string | null>(null)
  const [lastMessage, setLastMessage] = useState<SocketIOMessage | null>(null)

  const connect = useCallback(() => {
    if (socket.current?.connected) {
      return
    }

    if (socket.current) {
      socket.current.connect()
      return
    }

    try {
      const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      
      socket.current = io(socketUrl, {
        path: '/api/socket.io',
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        reconnection: autoReconnect,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
      })

      socket.current.on('connect', () => {
        setStatus('connected')
        // Log connection for monitoring (commented out to reduce noise)
        // if (process.env.NODE_ENV === 'development') {
        //   console.log(`[Socket.IO] Connected: ${socket.current?.id}`)
        // }
        if (showToastNotifications) {
          toast.success('Real-time updates enabled')
        }
      })

      socket.current.on('disconnect', (reason) => {
        setStatus('disconnected')
        // Log disconnection for monitoring (commented out to reduce noise)
        // if (process.env.NODE_ENV === 'development') {
        //   console.log(`[Socket.IO] Disconnected: ${reason}`)
        // }
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          socket.current?.connect()
        }
      })

      socket.current.on('connect_error', (error) => {
        setStatus('error')
        onError?.(error)
        // Socket.IO handles reconnection automatically, so we don't need to do anything
      })

      socket.current.on('connected', (data: { clientId: string; message: string }) => {
        setClientId(data.clientId)
        setLastMessage({ type: 'connected', data })
      })

      socket.current.on('message', (message: SocketIOMessage) => {
        if (process.env.NODE_ENV === 'development') {
          console.log("[SocketIO] Received message:", message.type, message.data)
        }
        setLastMessage(message)
        onMessage?.(message)
      })

      socket.current.on('subscribed', (data: { channel: string }) => {
        setLastMessage({ type: 'subscribed', data })
      })

      socket.current.on('unsubscribed', (data: { channel: string }) => {
        setLastMessage({ type: 'unsubscribed', data })
      })

      socket.current.on('pong', (data: { timestamp: number }) => {
        setLastMessage({ type: 'pong', data })
      })

    } catch (error) {
      console.error('Failed to create Socket.IO connection:', error)
      setStatus('error')
    }
  }, [autoReconnect, onMessage, onError, showToastNotifications])

  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.disconnect()
      socket.current = null
    }
    setStatus('disconnected')
  }, [])

  const subscribe = useCallback((channel: string) => {
    if (socket.current?.connected) {
      socket.current.emit('subscribe', channel)
    }
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    if (socket.current?.connected) {
      socket.current.emit('unsubscribe', channel)
    }
  }, [])

  const send = useCallback((data: any) => {
    if (socket.current?.connected) {
      socket.current.emit('message', data)
    }
  }, [])

  useEffect(() => {
    if (autoConnect && typeof window !== 'undefined') {
      // Small delay to prevent rapid connections
      const connectTimer = setTimeout(() => {
        connect()
      }, 100)

      return () => {
        clearTimeout(connectTimer)
        disconnect()
      }
    } else {
      return () => {
        disconnect()
      }
    }
  }, [autoConnect, connect, disconnect])

  return {
    status,
    clientId,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    isConnected: status === 'connected',
  }
}

// Hook for seat availability updates
export function useSeatAvailability(scheduleId: number | null) {
  const [availableSeats, setAvailableSeats] = useState<number | null>(null)
  const [bookedSeats, setBookedSeats] = useState<string[]>([])

  const handleMessage = useCallback((message: SocketIOMessage) => {
    if (message.type === 'seat_update' && message.data.scheduleId === scheduleId) {
      setAvailableSeats(message.data.availableSeats)
      setBookedSeats(message.data.bookedSeats)
    }
  }, [scheduleId])

  // Only connect if scheduleId is provided
  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: scheduleId !== null,
    autoReconnect: scheduleId !== null,
    onMessage: handleMessage,
    showToastNotifications: false,
  })

  useEffect(() => {
    if (scheduleId && isConnected) {
      subscribe(`schedule:${scheduleId}`)
      return () => unsubscribe(`schedule:${scheduleId}`)
    }
  }, [scheduleId, isConnected, subscribe, unsubscribe])

  return { availableSeats, bookedSeats, isConnected }
}

// Hook for admin dashboard real-time updates
export function useAdminDashboard() {
  const [newBookings, setNewBookings] = useState<any[]>([])

  const handleMessage = useCallback((message: SocketIOMessage) => {
    if (message.type === 'new_booking') {
      setNewBookings((prev) => [message.data.booking, ...prev])
      toast.success('New booking received!')
    } else if (message.type === 'booking_cancelled') {
      toast.info('A booking was cancelled')
    }
  }, [])

  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    onMessage: handleMessage,
    showToastNotifications: true,
  })

  useEffect(() => {
    if (isConnected) {
      subscribe('admin:bookings')
      return () => unsubscribe('admin:bookings')
    }
  }, [isConnected, subscribe, unsubscribe])

  return { newBookings, isConnected }
}

// Hook for public real-time route and schedule updates
export function usePublicUpdates(onRoutesUpdated?: () => void, onSchedulesUpdated?: () => void) {
  const handleMessage = useCallback((message: SocketIOMessage) => {
    if (message.type === 'route_created' || message.type === 'route_updated') {
      toast.success('New routes available!', {
        description: 'New travel options have been added.',
        duration: 3000,
      })
      onRoutesUpdated?.()
    } else if (message.type === 'schedule_created' || message.type === 'schedule_updated') {
      toast.info('Schedules updated!', {
        description: 'New departure times are available.',
        duration: 3000,
      })
      onSchedulesUpdated?.()
    }
  }, [onRoutesUpdated, onSchedulesUpdated])

  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    onMessage: handleMessage,
    showToastNotifications: false,
  })

  useEffect(() => {
    if (isConnected) {
      subscribe('public:routes')
      subscribe('public:schedules')
      return () => {
        unsubscribe('public:routes')
        unsubscribe('public:schedules')
      }
    }
  }, [isConnected, subscribe, unsubscribe])

  return { isConnected }
}
