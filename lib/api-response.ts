// Standardized API response utilities
// Provides consistent error messages and response formats

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  message: string
  code?: string
  details?: any
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * User-friendly error messages mapped to error codes
 */
export const ErrorMessages = {
  // Authentication errors
  AUTH_REQUIRED: "Please log in to continue",
  AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  AUTH_EMAIL_EXISTS: "An account with this email already exists",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please log in again.",
  AUTH_FORBIDDEN: "You don't have permission to perform this action",
  
  // Validation errors
  VALIDATION_REQUIRED_FIELDS: "Please fill in all required fields",
  VALIDATION_INVALID_EMAIL: "Please enter a valid email address",
  VALIDATION_INVALID_PHONE: "Please enter a valid phone number",
  VALIDATION_PASSWORD_WEAK: "Password must be at least 8 characters long",
  VALIDATION_INVALID_DATE: "Please select a valid date",
  
  // Booking errors
  BOOKING_NOT_FOUND: "Booking not found. Please check your booking ID.",
  BOOKING_ALREADY_CANCELLED: "This booking has already been cancelled",
  BOOKING_CANNOT_CANCEL: "This booking cannot be cancelled at this time",
  BOOKING_SEATS_UNAVAILABLE: "Selected seats are no longer available. Please choose different seats.",
  BOOKING_MODIFICATION_FAILED: "Unable to modify booking. Please try again or contact support.",
  
  // Payment errors
  PAYMENT_FAILED: "Payment failed. Please check your payment details and try again.",
  PAYMENT_DECLINED: "Your payment was declined. Please try a different payment method.",
  PAYMENT_INSUFFICIENT_FUNDS: "Insufficient funds. Please use a different payment method.",
  
  // Promo code errors
  PROMO_INVALID: "Invalid promo code. Please check and try again.",
  PROMO_EXPIRED: "This promo code has expired",
  PROMO_NOT_APPLICABLE: "This promo code cannot be applied to your booking",
  PROMO_ALREADY_USED: "You have already used this promo code",
  
  // Route/Schedule errors
  ROUTE_NOT_FOUND: "Route not found. Please check your search criteria.",
  SCHEDULE_NOT_AVAILABLE: "No schedules available for selected date. Please try a different date.",
  SCHEDULE_CANCELLED: "This schedule has been cancelled. Please choose another one.",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",
  
  // Server errors
  SERVER_ERROR: "Something went wrong on our end. Please try again later.",
  DATABASE_ERROR: "Unable to process your request. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  
  // Generic
  NOT_FOUND: "The requested resource was not found",
  INVALID_REQUEST: "Invalid request. Please check your input and try again.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again or contact support.",
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string
): Response {
  return Response.json({
    success: true,
    data,
    message,
  } as ApiSuccessResponse<T>)
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: string | keyof typeof ErrorMessages,
  statusCode: number = 400,
  details?: any
): Response {
  const message = typeof error === 'string' && error in ErrorMessages
    ? ErrorMessages[error as keyof typeof ErrorMessages]
    : error

  return Response.json(
    {
      success: false,
      error: error,
      message: message,
      details,
    } as ApiErrorResponse,
    { status: statusCode }
  )
}

/**
 * HTTP status codes with descriptive names
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Error response helpers for common scenarios
 */
export const ApiError = {
  unauthorized(message?: string) {
    return errorResponse(
      message || ErrorMessages.AUTH_REQUIRED,
      HttpStatus.UNAUTHORIZED
    )
  },

  forbidden(message?: string) {
    return errorResponse(
      message || ErrorMessages.AUTH_FORBIDDEN,
      HttpStatus.FORBIDDEN
    )
  },

  notFound(resource: string = "Resource") {
    return errorResponse(
      `${resource} not found`,
      HttpStatus.NOT_FOUND
    )
  },

  validation(message: string, details?: any) {
    return errorResponse(
      message,
      HttpStatus.BAD_REQUEST,
      details
    )
  },

  conflict(message: string) {
    return errorResponse(
      message,
      HttpStatus.CONFLICT
    )
  },

  rateLimit() {
    return errorResponse(
      ErrorMessages.RATE_LIMIT_EXCEEDED,
      HttpStatus.TOO_MANY_REQUESTS
    )
  },

  server(message?: string) {
    return errorResponse(
      message || ErrorMessages.SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR
    )
  },
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<Response>
): Promise<Response> {
  return handler().catch((error) => {
    console.error('API Error:', error)

    // Handle specific error types
    if (error.message?.includes('SQLITE_BUSY')) {
      return ApiError.server('Database is busy. Please try again.')
    }

    if (error.message?.includes('UNIQUE constraint')) {
      return ApiError.conflict('This record already exists')
    }

    if (error.message?.includes('FOREIGN KEY constraint')) {
      return ApiError.validation('Invalid reference. Please check your data.')
    }

    // Generic error
    return ApiError.server(
      process.env.NODE_ENV === 'development'
        ? error.message
        : ErrorMessages.SERVER_ERROR
    )
  })
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    (field) => !data[field] || data[field] === ''
  )

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return successResponse({
    items: data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  })
}
