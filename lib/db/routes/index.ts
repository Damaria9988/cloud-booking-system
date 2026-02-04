/**
 * Route Database Operations
 * Re-exports all route-related database functions
 */

// Query operations (read)
export {
  getRoutes,
  getRouteById,
  getSchedulesByRoute,
  getSeatAvailability,
  getPopularRoutes,
  getAllRoutes,
  checkRouteExists,
} from './queries'

// Mutation operations (write)
export {
  createRoute,
  updateRoute,
  deleteRoute,
} from './mutations'

// Utility functions
export {
  convertSeatToUI,
  convertSeatToNumeric,
  generateAllSeats,
} from './utils'
