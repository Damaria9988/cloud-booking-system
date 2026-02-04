// Input sanitization utilities
// Prevents XSS, SQL injection, and other security vulnerabilities

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ""

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

/**
 * Sanitize string for safe database insertion
 * Trims whitespace and removes null bytes
 */
export function sanitizeString(input: string): string {
  if (!input) return ""

  return input
    .trim()
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
}

/**
 * Sanitize email address
 * Validates and normalizes email format
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null

  const sanitized = sanitizeString(email).toLowerCase()

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + and -
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ""

  return phone.replace(/[^\d+\-\s()]/g, "").trim()
}

/**
 * Sanitize integer input
 * Ensures value is a valid integer within optional bounds
 */
export function sanitizeInt(
  value: any,
  options: { min?: number; max?: number; default?: number } = {}
): number | null {
  const num = parseInt(value, 10)

  if (isNaN(num)) {
    return options.default !== undefined ? options.default : null
  }

  if (options.min !== undefined && num < options.min) {
    return options.min
  }

  if (options.max !== undefined && num > options.max) {
    return options.max
  }

  return num
}

/**
 * Sanitize float input
 * Ensures value is a valid float within optional bounds
 */
export function sanitizeFloat(
  value: any,
  options: { min?: number; max?: number; decimals?: number; default?: number } = {}
): number | null {
  const num = parseFloat(value)

  if (isNaN(num)) {
    return options.default !== undefined ? options.default : null
  }

  let sanitized = num

  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min
  }

  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max
  }

  if (options.decimals !== undefined) {
    sanitized = parseFloat(sanitized.toFixed(options.decimals))
  }

  return sanitized
}

/**
 * Sanitize boolean input
 * Converts various truthy/falsy values to boolean
 */
export function sanitizeBoolean(value: any): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim()
    return lower === "true" || lower === "1" || lower === "yes"
  }
  if (typeof value === "number") return value !== 0
  return Boolean(value)
}

/**
 * Sanitize date input
 * Returns ISO date string or null if invalid
 */
export function sanitizeDate(value: any): string | null {
  if (!value) return null

  const date = new Date(value)

  if (isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().split("T")[0] // Return YYYY-MM-DD
}

/**
 * Sanitize array input
 * Ensures value is an array and sanitizes each element
 */
export function sanitizeArray<T>(
  value: any,
  sanitizer: (item: any) => T
): T[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map(sanitizer).filter((item) => item !== null && item !== undefined)
}

/**
 * Sanitize seat number
 * Ensures seat number matches expected format (e.g., A1, B12)
 */
export function sanitizeSeatNumber(seat: string): string | null {
  if (!seat) return null

  const sanitized = sanitizeString(seat).toUpperCase()

  // Validate seat format: Letter(s) followed by number(s)
  const seatRegex = /^[A-Z]{1,2}\d{1,2}$/
  if (!seatRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize PNR (Passenger Name Record)
 * Ensures PNR matches expected format
 */
export function sanitizePNR(pnr: string): string | null {
  if (!pnr) return null

  const sanitized = sanitizeString(pnr).toUpperCase()

  // Validate PNR format: 6 alphanumeric characters
  const pnrRegex = /^[A-Z0-9]{6}$/
  if (!pnrRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize promo code
 * Ensures promo code matches expected format
 */
export function sanitizePromoCode(code: string): string | null {
  if (!code) return null

  const sanitized = sanitizeString(code).toUpperCase()

  // Validate promo code format: 3-20 alphanumeric characters
  const codeRegex = /^[A-Z0-9]{3,20}$/
  if (!codeRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize search query
 * Removes special characters that could be used for injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ""

  return sanitizeString(query)
    .replace(/[<>{}[\]\\]/g, "") // Remove potentially dangerous characters
    .substring(0, 100) // Limit length
}

/**
 * Sanitize file name
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFileName(fileName: string): string | null {
  if (!fileName) return null

  const sanitized = sanitizeString(fileName)
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars with underscore

  if (sanitized.length === 0 || sanitized.length > 255) {
    return null
  }

  return sanitized
}

/**
 * Validate and sanitize URL
 * Ensures URL is safe and well-formed
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize object with schema
 * Applies sanitization rules to object properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: any,
  schema: Record<keyof T, (value: any) => any>
): Partial<T> {
  if (!obj || typeof obj !== "object") {
    return {}
  }

  const sanitized: any = {}

  for (const [key, sanitizer] of Object.entries(schema)) {
    if (key in obj) {
      const value = sanitizer(obj[key])
      if (value !== null && value !== undefined) {
        sanitized[key] = value
      }
    }
  }

  return sanitized
}
