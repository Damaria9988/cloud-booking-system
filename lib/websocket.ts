// WebSocket utility for real-time updates
// This will be used with Next.js custom server

export type WebSocketMessage = 
  | { type: 'seat_update'; data: { scheduleId: number; availableSeats: number; bookedSeats: string[] } }
  | { type: 'booking_created'; data: { bookingId: number; scheduleId: number } }
  | { type: 'booking_cancelled'; data: { bookingId: number; scheduleId: number } }
  | { type: 'schedule_cancelled'; data: { scheduleId: number } }
  | { type: 'new_booking'; data: { booking: any } }
  | { type: 'ping'; data: { timestamp: number } }

export interface WebSocketClient {
  id: string
  ws: any
  subscriptions: Set<string>
}

export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map()
  private static instance: WebSocketManager

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  addClient(id: string, ws: any): void {
    this.clients.set(id, {
      id,
      ws,
      subscriptions: new Set()
    })
    console.log(`✅ WebSocket client connected: ${id}`)
  }

  removeClient(id: string): void {
    this.clients.delete(id)
    console.log(`❌ WebSocket client disconnected: ${id}`)
  }

  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.add(channel)
      console.log(`📡 Client ${clientId} subscribed to ${channel}`)
    }
  }

  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId)
    if (client) {
      client.subscriptions.delete(channel)
      console.log(`🔕 Client ${clientId} unsubscribed from ${channel}`)
    }
  }

  broadcast(message: WebSocketMessage, channel?: string): void {
    let sentCount = 0
    
    this.clients.forEach((client) => {
      // If channel specified, only send to subscribed clients
      if (channel && !client.subscriptions.has(channel)) {
        return
      }

      try {
        if (client.ws.readyState === 1) { // OPEN state
          client.ws.send(JSON.stringify(message))
          sentCount++
        }
      } catch (error) {
        console.error(`Error sending to client ${client.id}:`, error)
      }
    })

    if (sentCount > 0) {
      console.log(`📤 Broadcast ${message.type} to ${sentCount} client(s)${channel ? ` on channel ${channel}` : ''}`)
    }
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId)
    if (client && client.ws.readyState === 1) {
      try {
        client.ws.send(JSON.stringify(message))
        console.log(`📤 Sent ${message.type} to client ${clientId}`)
      } catch (error) {
        console.error(`Error sending to client ${clientId}:`, error)
      }
    }
  }

  getClientCount(): number {
    return this.clients.size
  }

  getChannelSubscribers(channel: string): number {
    let count = 0
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel)) {
        count++
      }
    })
    return count
  }
}

// Export singleton instance
export const wsManager = WebSocketManager.getInstance()
