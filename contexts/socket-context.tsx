"use client"

import { createContext, useContext, ReactNode, useRef, useCallback, useEffect } from "react"
import { useSocketIO, type SocketIOMessage } from "@/hooks/use-socketio"

interface SocketContextType {
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  send: (data: any) => void
  isConnected: boolean
  clientId: string | null
  connectionCount: number // Track how many components are using this connection
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

/**
 * Shared Socket.IO Provider
 * 
 * This provider creates a single Socket.IO connection that can be shared across
 * multiple components, reducing the number of simultaneous connections.
 * 
 * Usage:
 *   const { subscribe, unsubscribe, send, isConnected } = useSocket()
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const connectionCountRef = useRef(0)
  const messageHandlersRef = useRef<Map<string, Set<(message: SocketIOMessage) => void>>>(new Map())
  
  // Single shared Socket.IO connection
  const { subscribe: baseSubscribe, unsubscribe: baseUnsubscribe, send, isConnected, clientId } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: (message) => {
      // Route messages to all registered handlers for the message type
      const handlers = messageHandlersRef.current.get(message.type) || new Set()
      handlers.forEach(handler => handler(message))
    },
    showToastNotifications: false,
  })

  // Track connection usage
  useEffect(() => {
    connectionCountRef.current++
    return () => {
      connectionCountRef.current--
    }
  }, [])

  // Enhanced subscribe with handler registration
  const subscribe = useCallback((channel: string) => {
    baseSubscribe(channel)
  }, [baseSubscribe])

  const unsubscribe = useCallback((channel: string) => {
    baseUnsubscribe(channel)
  }, [baseUnsubscribe])

  // Register message handler (for internal use)
  const registerHandler = useCallback((messageType: string, handler: (message: SocketIOMessage) => void) => {
    if (!messageHandlersRef.current.has(messageType)) {
      messageHandlersRef.current.set(messageType, new Set())
    }
    messageHandlersRef.current.get(messageType)!.add(handler)
    
    return () => {
      messageHandlersRef.current.get(messageType)?.delete(handler)
    }
  }, [])

  return (
    <SocketContext.Provider
      value={{
        subscribe,
        unsubscribe,
        send,
        isConnected,
        clientId,
        connectionCount: connectionCountRef.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

/**
 * Hook to access shared Socket.IO connection
 * 
 * IMPORTANT: This hook must be called in consistent order (see REACT_HOOKS_ORDER.md)
 */
export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}
