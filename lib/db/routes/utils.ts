/**
 * Route utility functions
 * Helper functions for seat conversion and formatting
 */

/**
 * Convert numeric seat format (e.g., "3", "7") to UI format (e.g., "A3", "B3")
 * 
 */
export function convertSeatToUI(seatNumber: string, totalSeats: number): string {
  // If already in UI format (contains letter), return as-is
  if (/[A-Z]/.test(seatNumber)) {
    return seatNumber
  }
  
  // If numeric, convert to UI format
  const num = parseInt(seatNumber)
  if (isNaN(num) || num < 1 || num > totalSeats) {
    return seatNumber // Return as-is if invalid
  }
  
  const seatsPerRow = 4
  const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
  const rowIndex = Math.floor((num - 1) / seatsPerRow)
  const colIndex = ((num - 1) % seatsPerRow) + 1
  const rowLabel = seatLabels[rowIndex] || seatNumber.charAt(0)
  
  return `${rowLabel}${colIndex}`
}

/**
 * Convert UI seat format (e.g., "C4") to numeric format (e.g., "12")
 */
export function convertSeatToNumeric(seatNumber: string, totalSeats: number): string {
  // If already numeric, return as-is
  if (/^\d+$/.test(seatNumber)) {
    return seatNumber
  }
  
  // If in UI format (contains letter), convert to numeric
  const seatLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
  const seatsPerRow = 4
  const rowLabel = seatNumber.charAt(0)
  const colIndex = parseInt(seatNumber.slice(1))
  const rowIndex = seatLabels.indexOf(rowLabel)
  
  if (rowIndex === -1 || isNaN(colIndex)) {
    // Invalid format, try to parse as number
    const num = parseInt(seatNumber)
    return isNaN(num) ? seatNumber : num.toString()
  }
  
  // Calculate numeric seat number: (rowIndex * seatsPerRow) + colIndex
  const numericSeat = (rowIndex * seatsPerRow) + colIndex
  return numericSeat.toString()
}

/**
 * Generate all seat numbers as strings from 1 to totalSeats
 */
export function generateAllSeats(totalSeats: number): string[] {
  const allSeats: string[] = []
  for (let i = 1; i <= totalSeats; i++) {
    allSeats.push(i.toString())
  }
  return allSeats
}
