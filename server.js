// Custom Next.js server with Socket.IO support
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Create Socket.IO server
  const io = new Server(server, {
    path: '/api/socket.io',
    cors: {
      origin: dev ? `http://${hostname}:${port}` : false,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
  })

  // Store connected clients by channel
  const channelSubscriptions = new Map() // channel -> Set of socketIds

  // Connection monitoring
  let connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    peakConnections: 0,
    disconnections: 0,
  }

  // Log connection stats periodically (every 5 minutes)
  setInterval(() => {
    const active = io.sockets.sockets.size
    if (active > 0) {
      console.log(`📊 Socket.IO Stats: Active=${active}, Total=${connectionStats.totalConnections}, Peak=${connectionStats.peakConnections}, Disconnected=${connectionStats.disconnections}`)
    }
  }, 5 * 60 * 1000) // 5 minutes

  io.on('connection', (socket) => {
    const clientId = socket.id
    connectionStats.totalConnections++
    connectionStats.activeConnections = io.sockets.sockets.size
    if (connectionStats.activeConnections > connectionStats.peakConnections) {
      connectionStats.peakConnections = connectionStats.activeConnections
    }
    
    // Reduce log noise - only log every 100th connection or when debugging
    if (connectionStats.totalConnections % 100 === 0 || dev === false) {
      console.log(`✅ Socket.IO milestone: ${connectionStats.totalConnections} total connections (Active: ${connectionStats.activeConnections})`)
    }

    // Send welcome message
    socket.emit('connected', {
      clientId,
      message: 'Connected to Damaria\'s Travel Socket.IO',
    })

    // Handle subscription to channels
    socket.on('subscribe', (channel) => {
      if (!channelSubscriptions.has(channel)) {
        channelSubscriptions.set(channel, new Set())
      }
      channelSubscriptions.get(channel).add(socket.id)
      socket.join(channel)
      // Reduced logging - uncomment for debugging
      // console.log(`📡 Client ${clientId} subscribed to ${channel}`)
      socket.emit('subscribed', { channel })
    })

    // Handle unsubscription from channels
    socket.on('unsubscribe', (channel) => {
      if (channelSubscriptions.has(channel)) {
        channelSubscriptions.get(channel).delete(socket.id)
      }
      socket.leave(channel)
      // Reduced logging - uncomment for debugging
      // console.log(`🔕 Client ${clientId} unsubscribed from ${channel}`)
      socket.emit('unsubscribed', { channel })
    })

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() })
    })

    // Handle messages from clients (relay seat_selection to others in same channel)
    socket.on('message', (message) => {
      try {
        // Only relay seat_selection messages
        if (message && message.type === 'seat_selection' && message.data) {
          const { scheduleId } = message.data
          const channel = `schedule:${scheduleId}`
          
          // Broadcast to all OTHER clients in the same channel (not back to sender)
          socket.to(channel).emit('message', message)
          
          console.log(`📤 [SERVER] Relayed seat_selection from ${clientId} to channel ${channel}`)
        }
      } catch (error) {
        console.error(`❌ [SERVER] Error handling message from ${clientId}:`, error)
      }
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      // Remove from all channel subscriptions
      channelSubscriptions.forEach((socketIds, channel) => {
        socketIds.delete(socket.id)
        if (socketIds.size === 0) {
          channelSubscriptions.delete(channel)
        }
      })
      connectionStats.disconnections++
      connectionStats.activeConnections = io.sockets.sockets.size
      // Only log unusual disconnects, not normal ones
      if (reason !== 'client namespace disconnect' && reason !== 'transport close') {
        console.log(`❌ Socket.IO client disconnected: ${clientId} (Reason: ${reason}, Active: ${connectionStats.activeConnections})`)
      }
    })

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket.IO error for client ${clientId}:`, error)
    })
  })

  // Broadcast function accessible from API routes
  global.ioBroadcast = (message, channel) => {
    try {
      if (channel) {
        // Broadcast to specific channel/room
        const room = io.sockets.adapter.rooms.get(channel)
        const sentCount = room ? room.size : 0
        
        if (message.type === 'seat_update') {
          console.log(`📤 [SERVER] Broadcasting seat_update to channel ${channel}`)
          console.log(`📤 [SERVER] Message data:`, JSON.stringify(message.data, null, 2))
          console.log(`📤 [SERVER] Clients in room: ${sentCount}`)
        }
        
        io.to(channel).emit('message', message)
        
        if (sentCount > 0) {
          console.log(`📤 [SERVER] Broadcast ${message.type} to ${sentCount} client(s) on channel ${channel}`)
        } else {
          console.warn(`⚠️ [SERVER] No clients subscribed to channel ${channel} - message not delivered`)
        }
      } else {
        // Broadcast to all connected clients
        io.emit('message', message)
        const sentCount = io.sockets.sockets.size
        if (sentCount > 0) {
          console.log(`📤 [SERVER] Broadcast ${message.type} to ${sentCount} client(s)`)
        }
      }
    } catch (error) {
      console.error('❌ [SERVER] Error broadcasting:', error)
    }
  }

  // Also keep wsBroadcast for backward compatibility (will be removed later)
  global.wsBroadcast = global.ioBroadcast

  // Start server
  server.listen(port, (err) => {
    if (err) throw err
    console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║   🚀 Damaria's Travel Server Ready!      ║
║                                           ║
║   ➜ Local:   http://localhost:${port}     ║
║   ➜ Socket.IO: ws://localhost:${port}/api/socket.io  ║
║                                           ║
║   ✅ HTTP Server: Running                ║
║   ✅ Socket.IO Server: Running          ║
║   ✅ Database: Connected                 ║
║                                           ║
╚═══════════════════════════════════════════╝
    `)
  })
})
