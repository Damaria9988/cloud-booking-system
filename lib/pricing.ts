/**
 * Pricing utilities for seat class calculations
 * This file is shared between client and server components
 */

// Business class premium: 35% extra on base price
export const BUSINESS_CLASS_PREMIUM = 0.35

/**
 * Check if a seat is business class (rows 1-4)
 * @param seatId - Seat identifier like "1A", "4D", "12F"
 * @returns true if the seat is in business class (rows 1-4)
 */
export function isBusinessClassSeat(seatId: string): boolean {
  const row = parseInt(seatId.replace(/[A-Z]/g, ""))
  return row >= 1 && row <= 4
}

/**
 * Calculate price for a seat based on its class
 * @param seatId - Seat identifier
 * @param basePrice - Base price for economy class
 * @returns Price for the seat (with business class premium if applicable)
 */
export function getSeatPrice(seatId: string, basePrice: number): number {
  if (isBusinessClassSeat(seatId)) {
    return basePrice * (1 + BUSINESS_CLASS_PREMIUM)
  }
  return basePrice
}

/**
 * Calculate the business class price from base price
 * @param basePrice - Base price for economy class
 * @returns Business class price
 */
export function getBusinessClassPrice(basePrice: number): number {
  return basePrice * (1 + BUSINESS_CLASS_PREMIUM)
}

/**
 * Calculate total price for a list of seats
 * @param seats - Array of seat IDs
 * @param basePrice - Base price per seat
 * @param isFlightMode - Whether this is a flight (applies business class premium)
 * @returns Total price for all seats
 */
export function calculateSeatsTotal(
  seats: string[],
  basePrice: number,
  isFlightMode: boolean = false
): number {
  if (!isFlightMode) {
    return basePrice * seats.length
  }
  
  return seats.reduce((total, seat) => {
    return total + getSeatPrice(seat, basePrice)
  }, 0)
}

/**
 * Get breakdown of business and economy seats with their prices
 * @param seats - Array of seat IDs
 * @param basePrice - Base price per seat
 * @returns Object with business and economy seat details
 */
export function getSeatPriceBreakdown(
  seats: string[],
  basePrice: number
): {
  businessSeats: string[]
  economySeats: string[]
  businessSubtotal: number
  economySubtotal: number
  total: number
} {
  const businessSeats = seats.filter(isBusinessClassSeat)
  const economySeats = seats.filter(seat => !isBusinessClassSeat(seat))
  
  const businessPrice = getBusinessClassPrice(basePrice)
  const businessSubtotal = businessSeats.length * businessPrice
  const economySubtotal = economySeats.length * basePrice
  
  return {
    businessSeats,
    economySeats,
    businessSubtotal,
    economySubtotal,
    total: businessSubtotal + economySubtotal
  }
}
