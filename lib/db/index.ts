/**
 * Database module index
 * Re-exports all database operations for backward compatibility
 * 
 * This file maintains 100% backward compatibility with the old lib/db.ts structure
 * while using the new modular organization internally.
 */

// Re-export connection utilities
export { query, queryOne, execute, closePool, database as dbInstance } from './connection'

// Re-export user operations
export {
  getUserByEmail,
  createUser,
  createEmailVerificationToken,
  verifyEmail,
  resendEmailVerification,
  getUserById,
  updateUserPassword,
} from './users'

// Re-export route operations - DIRECT import from queries.ts to bypass caching issues
export {
  getRoutes,
  getRouteById,
  getSchedulesByRoute,
  getSeatAvailability,
  getPopularRoutes,
  getAllRoutes,
  checkRouteExists,
} from './routes/queries'

export {
  createRoute,
  updateRoute,
  deleteRoute,
} from './routes/mutations'

// Re-export booking operations
export {
  createBooking,
  getBookingsByUser,
  getAllBookings,
  getBookingById,
  getBookingByPNR,
  updateBookingStatus,
  autoCompletePastBookings,
  autoCompletePastBookingsIfNeeded,
  getBookingStats,
} from './bookings'

// Re-export promo code operations
export {
  validatePromoCode,
  getActiveStudentPromotions,
  getActiveFirstTimePromotions,
  incrementPromoCodeUsageById,
  getAllPromoCodes,
  createPromoCode,
  updatePromoCode,
  togglePromoCode,
  incrementPromoCodeUsage,
} from './promo-codes'

// Re-export operator operations
export {
  getAllOperators,
  checkOperatorExists,
  createOperator,
  updateOperator,
  deleteOperator,
} from './operators'

// Re-export schedule operations
export {
  getAllSchedules,
  getScheduleByIdAdmin,
  checkScheduleExists,
  createSchedule,
  cancelSchedule,
} from './schedules'

// Re-export holiday operations
export {
  createHoliday,
  getAllHolidays,
  isHoliday,
} from './holidays'

// Re-export price override operations
export {
  setDatePriceOverride,
  getDatePriceOverride,
  deleteDatePriceOverride,
  calculateSchedulePrice,
} from './price-overrides'

// Re-export recurring schedule operations
export {
  getAllRecurringSchedules,
  getRecurringScheduleById,
  createRecurringSchedule,
  updateRecurringSchedule,
  setRecurringSchedulePriceRule,
  getRecurringSchedulePriceRules,
  deleteRecurringSchedulePriceRule,
} from './recurring-schedules'

// Import all functions statically for better performance and compatibility
import { query as queryFn, queryOne, execute as executeFn } from './connection'
import * as users from './users'
import * as routeQueries from './routes/queries'
import * as routeMutations from './routes/mutations'
import * as bookings from './bookings'
import * as promoCodes from './promo-codes'
import * as operators from './operators'
import * as schedules from './schedules'
import * as holidays from './holidays'
import * as priceOverrides from './price-overrides'
import * as recurringSchedules from './recurring-schedules'

// Create the db object with all functions for backward compatibility
export const db = {
  // Raw query functions
  query: queryFn,
  execute: executeFn,
  queryOne,

  // User operations
  getUserByEmail: users.getUserByEmail,
  createUser: users.createUser,
  createEmailVerificationToken: users.createEmailVerificationToken,
  verifyEmail: users.verifyEmail,
  resendEmailVerification: users.resendEmailVerification,
  getUserById: users.getUserById,
  updateUserPassword: users.updateUserPassword,

  // Route operations - DIRECT from queries.ts and mutations.ts
  getRoutes: routeQueries.getRoutes,
  getRouteById: routeQueries.getRouteById,
  getSchedulesByRoute: routeQueries.getSchedulesByRoute,
  getSeatAvailability: routeQueries.getSeatAvailability,
  getAllRoutes: routeQueries.getAllRoutes,
  checkRouteExists: routeQueries.checkRouteExists,
  getPopularRoutes: routeQueries.getPopularRoutes,
  createRoute: routeMutations.createRoute,
  updateRoute: routeMutations.updateRoute,
  deleteRoute: routeMutations.deleteRoute,

  // Booking operations
  createBooking: bookings.createBooking,
  getBookingsByUser: bookings.getBookingsByUser,
  getAllBookings: bookings.getAllBookings,
  getBookingById: bookings.getBookingById,
  getBookingByPNR: bookings.getBookingByPNR,
  updateBookingStatus: bookings.updateBookingStatus,
  autoCompletePastBookings: bookings.autoCompletePastBookings,
  autoCompletePastBookingsIfNeeded: bookings.autoCompletePastBookingsIfNeeded,
  getBookingStats: bookings.getBookingStats,

  // Promo code operations
  validatePromoCode: promoCodes.validatePromoCode,
  getActiveStudentPromotions: promoCodes.getActiveStudentPromotions,
  getActiveFirstTimePromotions: promoCodes.getActiveFirstTimePromotions,
  incrementPromoCodeUsageById: promoCodes.incrementPromoCodeUsageById,
  getAllPromoCodes: promoCodes.getAllPromoCodes,
  createPromoCode: promoCodes.createPromoCode,
  updatePromoCode: promoCodes.updatePromoCode,
  togglePromoCode: promoCodes.togglePromoCode,
  incrementPromoCodeUsage: promoCodes.incrementPromoCodeUsage,

  // Operator operations
  getAllOperators: operators.getAllOperators,
  checkOperatorExists: operators.checkOperatorExists,
  createOperator: operators.createOperator,
  updateOperator: operators.updateOperator,
  deleteOperator: operators.deleteOperator,

  // Schedule operations
  getAllSchedules: schedules.getAllSchedules,
  getScheduleByIdAdmin: schedules.getScheduleByIdAdmin,
  checkScheduleExists: schedules.checkScheduleExists,
  createSchedule: schedules.createSchedule,
  cancelSchedule: schedules.cancelSchedule,

  // Holiday operations
  createHoliday: holidays.createHoliday,
  getAllHolidays: holidays.getAllHolidays,
  isHoliday: holidays.isHoliday,

  // Price override operations
  setDatePriceOverride: priceOverrides.setDatePriceOverride,
  getDatePriceOverride: priceOverrides.getDatePriceOverride,
  deleteDatePriceOverride: priceOverrides.deleteDatePriceOverride,
  calculateSchedulePrice: priceOverrides.calculateSchedulePrice,

  // Recurring schedule operations
  getAllRecurringSchedules: recurringSchedules.getAllRecurringSchedules,
  getRecurringScheduleById: recurringSchedules.getRecurringScheduleById,
  createRecurringSchedule: recurringSchedules.createRecurringSchedule,
  updateRecurringSchedule: recurringSchedules.updateRecurringSchedule,
  setRecurringSchedulePriceRule: recurringSchedules.setRecurringSchedulePriceRule,
  getRecurringSchedulePriceRules: recurringSchedules.getRecurringSchedulePriceRules,
  deleteRecurringSchedulePriceRule: recurringSchedules.deleteRecurringSchedulePriceRule,
}

// Export default for backward compatibility
export default db
