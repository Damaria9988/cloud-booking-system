// Utility to broadcast Socket.IO messages from API routes
// This works with the global ioBroadcast function set up in server.js

export type SocketIOMessage = 
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
  | { type: 'schedules_generated'; data: { recurringScheduleId: number; count: number; schedules: any[] } }
  | { type: 'recurring_schedule_created'; data: { recurringSchedule: any } }
  | { type: 'recurring_schedule_updated'; data: { recurringSchedule: any } }
  | { type: 'recurring_schedule_deleted'; data: { recurringScheduleId: number } }
  | { type: 'holiday_created'; data: { holiday: any } }
  | { type: 'holiday_updated'; data: { holiday: any } }
  | { type: 'holiday_deleted'; data: { holidayId: number } }
  | { type: 'price_override_set'; data: { routeId: number; travelDate: string; price: number } }
  | { type: 'price_override_removed'; data: { routeId: number; travelDate: string } }
  | { type: 'price_rule_created'; data: { recurringScheduleId: number; rule: any } }
  | { type: 'price_rule_deleted'; data: { recurringScheduleId: number; ruleId: number } }
  | { type: 'profile_updated'; data: { userId: number; user: any } }
  | { type: 'user_created'; data: { user: any } }
  | { type: 'user_deleted'; data: { userId: number } }
  | { type: 'user_count_updated'; data: { totalUsers: number } }

export function broadcast(message: SocketIOMessage, channel?: string): void {
  if (typeof global.ioBroadcast === 'function') {
    global.ioBroadcast(message, channel)
  } else {
    // Socket.IO not available (probably in build or test mode)
    console.log('Socket.IO broadcast not available:', message.type)
  }
}

export function broadcastSeatUpdate(scheduleId: number, availableSeats: number, bookedSeats: string[]): void {
  console.log("[WEBSOCKET] Broadcasting seat_update - scheduleId:", scheduleId, "bookedSeats:", bookedSeats, "availableSeats:", availableSeats)
  broadcast(
    {
      type: 'seat_update',
      data: { scheduleId, availableSeats, bookedSeats }
    },
    `schedule:${scheduleId}`
  )
  console.log("[WEBSOCKET] Seat update broadcast completed")
}

export function broadcastBookingCreated(bookingId: number, scheduleId: number, booking?: any): void {
  // Broadcast to schedule channel
  broadcast(
    {
      type: 'booking_created',
      data: { bookingId, scheduleId }
    },
    `schedule:${scheduleId}`
  )

  // Broadcast to admin channel
  if (booking) {
    broadcast(
      {
        type: 'new_booking',
        data: { booking }
      },
      'admin:bookings'
    )
  }
}

export function broadcastBookingCancelled(bookingId: number, scheduleId: number): void {
  // Broadcast to schedule channel
  broadcast(
    {
      type: 'booking_cancelled',
      data: { bookingId, scheduleId }
    },
    `schedule:${scheduleId}`
  )

  // Broadcast to admin channel
  broadcast(
    {
      type: 'booking_cancelled',
      data: { bookingId, scheduleId }
    },
    'admin:bookings'
  )
}

export function broadcastScheduleCancelled(scheduleId: number): void {
  broadcast(
    {
      type: 'schedule_cancelled',
      data: { scheduleId }
    },
    `schedule:${scheduleId}`
  )
}

// Admin data updates
export function broadcastOperatorCreated(operator: any): void {
  broadcast(
    {
      type: 'operator_created',
      data: { operator }
    },
    'admin:operators'
  )
}

export function broadcastOperatorUpdated(operator: any): void {
  broadcast(
    {
      type: 'operator_updated',
      data: { operator }
    },
    'admin:operators'
  )
}

export function broadcastOperatorDeleted(operatorId: number): void {
  broadcast(
    {
      type: 'operator_deleted',
      data: { operatorId },
    },
    'admin:operators'
  )
}

export function broadcastRouteCreated(route: any): void {
  broadcast(
    {
      type: 'route_created',
      data: { route }
    },
    'public:routes'
  )
}

export function broadcastRouteUpdated(route: any): void {
  broadcast(
    {
      type: 'route_updated',
      data: { route }
    },
    'public:routes'
  )
}

export function broadcastScheduleCreated(schedule: any): void {
  broadcast(
    {
      type: 'schedule_created',
      data: { schedule }
    },
    'public:schedules'
  )
}

export function broadcastScheduleUpdated(schedule: any): void {
  broadcast(
    {
      type: 'schedule_updated',
      data: { schedule }
    },
    'public:schedules'
  )
}

export function broadcastProfileUpdated(userId: number, user: any): void {
  // Broadcast to user-specific channel for instant updates
  broadcast(
    {
      type: 'profile_updated',
      data: { userId, user }
    },
    `user:${userId}`
  )
  
  // Also broadcast to admin channel so admin customers tab updates instantly
  broadcast(
    {
      type: 'profile_updated',
      data: { userId, user }
    },
    'admin:customers'
  )
}

export async function broadcastUserCreated(user: any): Promise<void> {
  // Broadcast to admin channel for instant customer list update
  broadcast(
    {
      type: 'user_created',
      data: { user }
    },
    'admin:customers'
  )
  
  // Calculate and broadcast user count update to public channel for hero section
  try {
    const { db } = await import('@/lib/db')
    const userCount = await db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE (is_admin = 0 OR is_admin IS NULL)`
    )
    const totalUsers = userCount[0]?.count || 0
    
    broadcast(
      {
        type: 'user_count_updated',
        data: { totalUsers }
      },
      'public:stats'
    )
  } catch (error) {
    console.error('Error calculating user count for broadcast:', error)
    // Still broadcast the user_created event even if count calculation fails
    broadcast(
      {
        type: 'user_count_updated',
        data: { totalUsers: 0 } // Fallback - listeners will refresh
      },
      'public:stats'
    )
  }
}

export function broadcastUserDeleted(userId: number): void {
  // Broadcast to admin channel for instant customer list update
  broadcast(
    {
      type: 'user_deleted',
      data: { userId }
    },
    'admin:customers'
  )
  
  // Broadcast user count update to public channel
  broadcast(
    {
      type: 'user_count_updated',
      data: { totalUsers: 0 } // Listeners will refresh to get accurate count
    },
    'public:stats'
  )
}

// Recurring Schedules broadcasts
export function broadcastRecurringScheduleCreated(recurringSchedule: any): void {
  broadcast(
    {
      type: 'recurring_schedule_created',
      data: { recurringSchedule }
    },
    'admin:recurring-schedules'
  )
  
  // Also broadcast to public schedules channel for route-specific updates
  broadcast(
    {
      type: 'recurring_schedule_created',
      data: { recurringSchedule }
    },
    `route:${recurringSchedule.route_id}`
  )
}

export function broadcastRecurringScheduleUpdated(recurringSchedule: any): void {
  broadcast(
    {
      type: 'recurring_schedule_updated',
      data: { recurringSchedule }
    },
    'admin:recurring-schedules'
  )
  
  broadcast(
    {
      type: 'recurring_schedule_updated',
      data: { recurringSchedule }
    },
    `route:${recurringSchedule.route_id}`
  )
}

export function broadcastRecurringScheduleDeleted(recurringScheduleId: number, routeId: number): void {
  broadcast(
    {
      type: 'recurring_schedule_deleted',
      data: { recurringScheduleId }
    },
    'admin:recurring-schedules'
  )
  
  broadcast(
    {
      type: 'recurring_schedule_deleted',
      data: { recurringScheduleId }
    },
    `route:${routeId}`
  )
}

export function broadcastSchedulesGenerated(recurringScheduleId: number, count: number, schedules: any[]): void {
  broadcast(
    {
      type: 'schedules_generated',
      data: { recurringScheduleId, count, schedules }
    },
    'admin:recurring-schedules'
  )
  
  // Broadcast individual schedule creations to public channel
  schedules.forEach((schedule) => {
    broadcastScheduleCreated(schedule)
  })
}

// Holiday broadcasts
export function broadcastHolidayCreated(holiday: any): void {
  broadcast(
    {
      type: 'holiday_created',
      data: { holiday }
    },
    'admin:holidays'
  )
  
  // Broadcast to public channel so price calculations update
  broadcast(
    {
      type: 'holiday_created',
      data: { holiday }
    },
    'public:pricing'
  )
}

export function broadcastHolidayUpdated(holiday: any): void {
  broadcast(
    {
      type: 'holiday_updated',
      data: { holiday }
    },
    'admin:holidays'
  )
  
  broadcast(
    {
      type: 'holiday_updated',
      data: { holiday }
    },
    'public:pricing'
  )
}

export function broadcastHolidayDeleted(holidayId: number): void {
  broadcast(
    {
      type: 'holiday_deleted',
      data: { holidayId }
    },
    'admin:holidays'
  )
  
  broadcast(
    {
      type: 'holiday_deleted',
      data: { holidayId }
    },
    'public:pricing'
  )
}

// Price Override broadcasts
export function broadcastPriceOverrideSet(routeId: number, travelDate: string, price: number): void {
  broadcast(
    {
      type: 'price_override_set',
      data: { routeId, travelDate, price }
    },
    `route:${routeId}`
  )
  
  // Also broadcast to admin pricing channel
  broadcast(
    {
      type: 'price_override_set',
      data: { routeId, travelDate, price }
    },
    'admin:pricing'
  )
  
  // Update public pricing channel
  broadcast(
    {
      type: 'price_override_set',
      data: { routeId, travelDate, price }
    },
    'public:pricing'
  )
}

export function broadcastPriceOverrideRemoved(routeId: number, travelDate: string): void {
  broadcast(
    {
      type: 'price_override_removed',
      data: { routeId, travelDate }
    },
    `route:${routeId}`
  )
  
  broadcast(
    {
      type: 'price_override_removed',
      data: { routeId, travelDate }
    },
    'admin:pricing'
  )
  
  broadcast(
    {
      type: 'price_override_removed',
      data: { routeId, travelDate }
    },
    'public:pricing'
  )
}

// Price Rule broadcasts
export function broadcastPriceRuleCreated(recurringScheduleId: number, rule: any): void {
  broadcast(
    {
      type: 'price_rule_created',
      data: { recurringScheduleId, rule }
    },
    'admin:recurring-schedules'
  )
  
  // Get route ID from recurring schedule to broadcast to route channel
  // This will be handled in the API route
}

export function broadcastPriceRuleDeleted(recurringScheduleId: number, ruleId: number): void {
  broadcast(
    {
      type: 'price_rule_deleted',
      data: { recurringScheduleId, ruleId }
    },
    'admin:recurring-schedules'
  )
}

// Type augmentation for global
declare global {
  var ioBroadcast: ((message: SocketIOMessage, channel?: string) => void) | undefined
}
