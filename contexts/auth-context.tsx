"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import type { User } from "@/lib/auth"
import { usePathname } from "next/navigation"
import { useSocketIO } from "@/hooks/use-socketio"
import type { SocketIOMessage } from "@/hooks/use-socketio"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => Promise<void>
  loading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Fetch user from API on mount and route changes
  const fetchUser = useCallback(async () => {
    try {
      // Add cache-busting timestamp to prevent stale data
      const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle real-time profile updates via Socket.IO
  const handleProfileUpdate = (message: SocketIOMessage) => {
    if (message.type === 'profile_updated' && user && message.data.userId === user.id) {
      // Update user data immediately when profile is updated
      setUser(message.data.user as User)
    }
  }

  // Set up Socket.IO connection for real-time profile updates
  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: handleProfileUpdate,
    showToastNotifications: false,
  })

  // Subscribe to user-specific channel when user is logged in
  useEffect(() => {
    if (user && isConnected) {
      subscribe(`user:${user.id}`)
      return () => unsubscribe(`user:${user.id}`)
    }
  }, [user?.id, isConnected, subscribe, unsubscribe])

  useEffect(() => {
    fetchUser()
  }, [pathname, fetchUser]) // Refresh on route change

  const login = async (userData: User) => {
    setUser(userData)
    // Also refresh from API to ensure consistency
    await fetchUser()
  }

  const logout = async () => {
    // Clear user state immediately for instant logout
    setUser(null)
    
    // Call logout API in background (don't wait for it)
    fetch("/api/auth/logout", { method: "POST" }).catch((error) => {
      // Ignore logout API errors - user is already logged out locally
      console.error("Logout API error (ignored):", error)
    })
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

