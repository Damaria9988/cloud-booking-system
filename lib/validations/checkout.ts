/**
 * Checkout Form Validation Utilities
 */

export interface ValidationError {
  field: string
  message: string
}

export interface PassengerData {
  firstName: string
  lastName: string
  age: string
  gender: string
  type: string
}

export interface ContactData {
  email: string
  phone: string
}

export interface CardPaymentData {
  cardNumber: string
  cardName: string
  expiry: string
  cvv: string
}

export interface UPIPaymentData {
  upiId: string
}

// Validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[1-9]\d{1,14}$/, // E.164 format (flexible)
  phoneSimple: /^[\d\s\-\(\)\+]{7,20}$/, // More lenient phone validation
  name: /^[a-zA-Z\s\-']{2,50}$/,
  cardNumber: /^[\d\s]{13,19}$/, // 13-19 digits (with spaces)
  cardNumberDigits: /^\d{13,19}$/, // Pure digits
  expiry: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
  cvv: /^\d{3,4}$/,
  upiId: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/,
}

// Helper to sanitize card number (remove spaces)
export function sanitizeCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s/g, '')
}

// Format card number with spaces (for display)
export function formatCardNumber(cardNumber: string): string {
  const sanitized = sanitizeCardNumber(cardNumber)
  return sanitized.replace(/(\d{4})(?=\d)/g, '$1 ')
}

// Validate passenger details
export function validatePassenger(passenger: PassengerData, index: number): ValidationError[] {
  const errors: ValidationError[] = []
  const prefix = `passenger-${index}`

  // First name validation
  if (!passenger.firstName || passenger.firstName.trim() === '') {
    errors.push({ field: `${prefix}-firstName`, message: 'First name is required' })
  } else if (!patterns.name.test(passenger.firstName.trim())) {
    errors.push({ field: `${prefix}-firstName`, message: 'Please enter a valid first name (2-50 characters, letters only)' })
  }

  // Last name validation
  if (!passenger.lastName || passenger.lastName.trim() === '') {
    errors.push({ field: `${prefix}-lastName`, message: 'Last name is required' })
  } else if (!patterns.name.test(passenger.lastName.trim())) {
    errors.push({ field: `${prefix}-lastName`, message: 'Please enter a valid last name (2-50 characters, letters only)' })
  }

  // Age validation
  if (!passenger.age || passenger.age.trim() === '') {
    errors.push({ field: `${prefix}-age`, message: 'Age is required' })
  } else {
    const age = parseInt(passenger.age, 10)
    if (isNaN(age) || age < 0 || age > 120) {
      errors.push({ field: `${prefix}-age`, message: 'Please enter a valid age (0-120)' })
    }
    
    // Validate age matches passenger type
    if (!isNaN(age)) {
      if (passenger.type === 'infant' && age > 2) {
        errors.push({ field: `${prefix}-age`, message: 'Infants must be 2 years or younger' })
      } else if (passenger.type === 'child' && (age < 3 || age > 11)) {
        errors.push({ field: `${prefix}-age`, message: 'Children must be between 3-11 years' })
      } else if (passenger.type === 'adult' && (age < 12 || age > 59)) {
        errors.push({ field: `${prefix}-age`, message: 'Adults must be between 12-59 years' })
      } else if (passenger.type === 'senior' && age < 60) {
        errors.push({ field: `${prefix}-age`, message: 'Seniors must be 60 years or older' })
      }
    }
  }

  // Gender validation
  if (!passenger.gender || passenger.gender === '') {
    errors.push({ field: `${prefix}-gender`, message: 'Please select a gender' })
  }

  // Type validation
  if (!passenger.type || passenger.type === '') {
    errors.push({ field: `${prefix}-type`, message: 'Please select passenger type' })
  }

  return errors
}

// Validate contact information
export function validateContact(contact: ContactData): ValidationError[] {
  const errors: ValidationError[] = []

  // Email validation
  if (!contact.email || contact.email.trim() === '') {
    errors.push({ field: 'email', message: 'Email address is required' })
  } else if (!patterns.email.test(contact.email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  // Phone validation
  if (!contact.phone || contact.phone.trim() === '') {
    errors.push({ field: 'phone', message: 'Phone number is required' })
  } else if (!patterns.phoneSimple.test(contact.phone.trim())) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' })
  }

  return errors
}

// Validate card payment
export function validateCardPayment(payment: CardPaymentData): ValidationError[] {
  const errors: ValidationError[] = []

  // Card number validation
  if (!payment.cardNumber || payment.cardNumber.trim() === '') {
    errors.push({ field: 'cardNumber', message: 'Card number is required' })
  } else {
    const sanitized = sanitizeCardNumber(payment.cardNumber)
    if (!patterns.cardNumberDigits.test(sanitized)) {
      errors.push({ field: 'cardNumber', message: 'Please enter a valid card number (13-19 digits)' })
    } else if (!luhnCheck(sanitized)) {
      errors.push({ field: 'cardNumber', message: 'Invalid card number' })
    }
  }

  // Cardholder name validation
  if (!payment.cardName || payment.cardName.trim() === '') {
    errors.push({ field: 'cardName', message: 'Cardholder name is required' })
  } else if (payment.cardName.trim().length < 2) {
    errors.push({ field: 'cardName', message: 'Please enter the full name on the card' })
  }

  // Expiry validation
  if (!payment.expiry || payment.expiry.trim() === '') {
    errors.push({ field: 'expiry', message: 'Expiry date is required' })
  } else if (!patterns.expiry.test(payment.expiry.trim())) {
    errors.push({ field: 'expiry', message: 'Please enter expiry as MM/YY' })
  } else {
    // Check if card is expired
    const [month, year] = payment.expiry.split('/')
    const expiryDate = new Date(2000 + parseInt(year), parseInt(month), 0)
    const now = new Date()
    if (expiryDate < now) {
      errors.push({ field: 'expiry', message: 'Card has expired' })
    }
  }

  // CVV validation
  if (!payment.cvv || payment.cvv.trim() === '') {
    errors.push({ field: 'cvv', message: 'CVV is required' })
  } else if (!patterns.cvv.test(payment.cvv.trim())) {
    errors.push({ field: 'cvv', message: 'CVV must be 3 or 4 digits' })
  }

  return errors
}

// Validate UPI payment
export function validateUPIPayment(payment: UPIPaymentData): ValidationError[] {
  const errors: ValidationError[] = []

  if (!payment.upiId || payment.upiId.trim() === '') {
    errors.push({ field: 'upiId', message: 'UPI ID is required' })
  } else if (!patterns.upiId.test(payment.upiId.trim())) {
    errors.push({ field: 'upiId', message: 'Please enter a valid UPI ID (e.g., name@upi)' })
  }

  return errors
}

// Luhn algorithm for card number validation
function luhnCheck(cardNumber: string): boolean {
  let sum = 0
  let isEven = false
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

// Get card type from number
export function getCardType(cardNumber: string): string {
  const sanitized = sanitizeCardNumber(cardNumber)
  
  if (/^4/.test(sanitized)) return 'visa'
  if (/^5[1-5]/.test(sanitized)) return 'mastercard'
  if (/^3[47]/.test(sanitized)) return 'amex'
  if (/^6(?:011|5)/.test(sanitized)) return 'discover'
  if (/^(?:2131|1800|35)/.test(sanitized)) return 'jcb'
  if (/^3(?:0[0-5]|[68])/.test(sanitized)) return 'diners'
  
  return 'unknown'
}

// Validate all checkout data
export function validateCheckout(
  passengers: PassengerData[],
  contact: ContactData,
  paymentMethod: string,
  paymentData: CardPaymentData | UPIPaymentData
): ValidationError[] {
  let errors: ValidationError[] = []

  // Validate all passengers
  passengers.forEach((passenger, index) => {
    errors = errors.concat(validatePassenger(passenger, index))
  })

  // Validate contact
  errors = errors.concat(validateContact(contact))

  // Validate payment based on method
  if (paymentMethod === 'card') {
    errors = errors.concat(validateCardPayment(paymentData as CardPaymentData))
  } else if (paymentMethod === 'upi') {
    errors = errors.concat(validateUPIPayment(paymentData as UPIPaymentData))
  }
  // Wallet doesn't need additional validation

  return errors
}
