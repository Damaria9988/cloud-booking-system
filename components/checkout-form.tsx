"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { FormField, FormSelect } from "@/components/ui/form-field"
import { CreditCard, Smartphone, ArrowRight, Wallet, Shield, User, Plus, AlertCircle } from "lucide-react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  validatePassenger,
  validateContact,
  validateCardPayment,
  validateUPIPayment,
  formatCardNumber,
  sanitizeCardNumber,
  getCardType,
  type ValidationError,
} from "@/lib/validations/checkout"

interface CheckoutFormProps {
  bookingData: {
    trip: any
    seats: string[]
    pricePerSeat: number
    discount: number
    tax: number
    routeId?: number
    scheduleId?: string
    travelDate?: string
    // promoCode?: string // Promo code commented out
  }
}

// Storage key for checkout form data
const STORAGE_KEY = "checkout_form_data"

export function CheckoutForm({ bookingData }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [showAllErrors, setShowAllErrors] = useState(false)
  
  // Load payment method from sessionStorage
  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(`${STORAGE_KEY}_paymentMethod`)
        return saved || "card"
      } catch (error) {
        return "card"
      }
    }
    return "card"
  })
  
  // Save payment method to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`${STORAGE_KEY}_paymentMethod`, paymentMethod)
      } catch (error) {
        console.error("Error saving payment method:", error)
      }
    }
  }, [paymentMethod])
  
  // Store form values in state to prevent loss on re-render
  // Load from sessionStorage on mount
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved) {
          return JSON.parse(saved)
        }
      } catch (error) {
        console.error("Error loading form data from sessionStorage:", error)
      }
    }
    return {}
  })
  
  // Save to sessionStorage whenever formValues change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formValues))
      } catch (error) {
        console.error("Error saving form data to sessionStorage:", error)
      }
    }
  }, [formValues])
  
  // Saved travelers feature commented out
  // const [useSavedTravelers, setUseSavedTravelers] = useState(false)
  // const savedTravelers = [
  //   { id: 1, firstName: "John", lastName: "Doe", age: 30, gender: "male" },
  //   { id: 2, firstName: "Jane", lastName: "Doe", age: 28, gender: "female" },
  // ]

  // Insurance is disabled - cost is always 0
  const insuranceCost = 0
  
  // Handle input changes to preserve values
  const handleInputChange = (name: string, value: string) => {
    setFormValues(prev => {
      const updated = { ...prev, [name]: value }
      // Also save immediately to sessionStorage
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch (error) {
          console.error("Error saving form data:", error)
        }
      }
      return updated
    })
    
    // Clear error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  // Mark field as touched on blur
  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name)
  }

  // Validate a single field
  const validateField = useCallback((fieldName: string) => {
    const value = formValues[fieldName] || ""
    let errors: ValidationError[] = []

    // Determine field type and validate accordingly
    if (fieldName.startsWith('firstName-') || fieldName.startsWith('lastName-') || 
        fieldName.startsWith('age-') || fieldName.startsWith('gender-') || fieldName.startsWith('type-')) {
      const index = parseInt(fieldName.split('-')[1], 10)
      const passenger = {
        firstName: formValues[`firstName-${index}`] || "",
        lastName: formValues[`lastName-${index}`] || "",
        age: formValues[`age-${index}`] || "",
        gender: formValues[`gender-${index}`] || "",
        type: formValues[`type-${index}`] || "adult",
      }
      errors = validatePassenger(passenger, index)
    } else if (fieldName === 'email' || fieldName === 'phone') {
      errors = validateContact({
        email: formValues.email || "",
        phone: formValues.phone || "",
      })
    } else if (['cardNumber', 'cardName', 'expiry', 'cvv'].includes(fieldName)) {
      if (paymentMethod === 'card') {
        errors = validateCardPayment({
          cardNumber: formValues.cardNumber || "",
          cardName: formValues.cardName || "",
          expiry: formValues.expiry || "",
          cvv: formValues.cvv || "",
        })
      }
    } else if (fieldName === 'upiId') {
      if (paymentMethod === 'upi') {
        errors = validateUPIPayment({
          upiId: formValues.upiId || "",
        })
      }
    }

    // Update errors state
    setValidationErrors(prev => {
      const updated = { ...prev }
      // Clear relevant errors first
      errors.forEach(err => {
        if (err.field === fieldName || err.field.includes(fieldName.split('-')[0])) {
          // Only set error if field is touched
          if (touched[err.field] || showAllErrors) {
            updated[err.field] = err.message
          }
        }
      })
      // If no error for this specific field, remove it
      const fieldError = errors.find(e => e.field === fieldName)
      if (!fieldError) {
        delete updated[fieldName]
      }
      return updated
    })

    return errors
  }, [formValues, paymentMethod, touched, showAllErrors])

  // Validate all fields
  const validateAllFields = useCallback(() => {
    let allErrors: ValidationError[] = []

    // Validate all passengers
    bookingData.seats.forEach((_, index) => {
      const passenger = {
        firstName: formValues[`firstName-${index}`] || "",
        lastName: formValues[`lastName-${index}`] || "",
        age: formValues[`age-${index}`] || "",
        gender: formValues[`gender-${index}`] || "",
        type: formValues[`type-${index}`] || "adult",
      }
      allErrors = allErrors.concat(validatePassenger(passenger, index))
    })

    // Validate contact
    allErrors = allErrors.concat(validateContact({
      email: formValues.email || "",
      phone: formValues.phone || "",
    }))

    // Validate payment
    if (paymentMethod === 'card') {
      allErrors = allErrors.concat(validateCardPayment({
        cardNumber: formValues.cardNumber || "",
        cardName: formValues.cardName || "",
        expiry: formValues.expiry || "",
        cvv: formValues.cvv || "",
      }))
    } else if (paymentMethod === 'upi') {
      allErrors = allErrors.concat(validateUPIPayment({
        upiId: formValues.upiId || "",
      }))
    }

    // Convert to record format
    const errorRecord: Record<string, string> = {}
    allErrors.forEach(err => {
      errorRecord[err.field] = err.message
    })
    
    setValidationErrors(errorRecord)
    return allErrors
  }, [bookingData.seats, formValues, paymentMethod])

  // Get error for a field (only show if touched or showAllErrors)
  const getFieldError = (fieldName: string): string | undefined => {
    if (touched[fieldName] || showAllErrors) {
      return validationErrors[fieldName]
    }
    return undefined
  }

  // Handle card number formatting
  const handleCardNumberChange = (value: string) => {
    // Remove non-digits and format
    const digitsOnly = value.replace(/\D/g, '')
    const formatted = formatCardNumber(digitsOnly.slice(0, 16))
    handleInputChange('cardNumber', formatted)
  }

  // Handle expiry formatting (MM/YY) - auto-insert "/" after month
  const handleExpiryChange = (value: string, prevValue: string = '') => {
    // Remove all non-digits first
    let digits = value.replace(/\D/g, '')
    
    // Limit to 4 digits (MMYY)
    digits = digits.slice(0, 4)
    
    let formatted = ''
    
    if (digits.length === 0) {
      formatted = ''
    } else if (digits.length === 1) {
      // First digit - if > 1, prefix with 0 (e.g., "5" -> "05/")
      if (parseInt(digits) > 1) {
        formatted = '0' + digits + '/'
      } else {
        formatted = digits
      }
    } else if (digits.length === 2) {
      // Two digits for month - add slash automatically
      const month = parseInt(digits)
      if (month > 12) {
        // Invalid month, cap at 12
        formatted = '12/'
      } else if (month === 0) {
        // Invalid month 00, make it 01
        formatted = '01/'
      } else {
        formatted = digits + '/'
      }
    } else {
      // Month + year digits
      const month = digits.slice(0, 2)
      const year = digits.slice(2)
      formatted = month + '/' + year
    }
    
    handleInputChange('expiry', formatted)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validate all fields before submission
    setShowAllErrors(true)
    const errors = validateAllFields()
    
    if (errors.length > 0) {
      // Scroll to first error
      const firstErrorField = errors[0].field
      const element = document.getElementById(firstErrorField) || 
                      document.querySelector(`[name="${firstErrorField}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        ;(element as HTMLInputElement).focus()
      }
      
      toast.error(`Please fix ${errors.length} validation error${errors.length > 1 ? 's' : ''} before continuing`)
      return
    }

    setLoading(true)

    try {
      // Use form values from state (preserved across re-renders)
      const formData = new FormData(e.currentTarget)
      
      // Collect passenger data - prefer state values, fallback to formData
      const passengers: any[] = []
      bookingData.seats.forEach((seat: string, index: number) => {
        const firstName = formValues[`firstName-${index}`] || (formData.get(`firstName-${index}`) as string)
        const lastName = formValues[`lastName-${index}`] || (formData.get(`lastName-${index}`) as string)
        const age = formValues[`age-${index}`] || (formData.get(`age-${index}`) as string)
        const gender = formValues[`gender-${index}`] || (formData.get(`gender-${index}`) as string)
        const passengerType = formValues[`type-${index}`] || (formData.get(`type-${index}`) as string) || 'adult'

        if (firstName && lastName && age && gender) {
          passengers.push({
            firstName,
            lastName,
            age,
            gender,
            passengerType,
          })
        }
      })

      if (passengers.length !== bookingData.seats.length) {
        toast.error("Please fill in all passenger details")
        setLoading(false)
        return
      }

      // Get contact information - prefer state values, fallback to formData
      const contactEmail = formValues["email"] || (formData.get("email") as string)
      const contactPhone = formValues["phone"] || (formData.get("phone") as string)

      if (!contactEmail || !contactPhone) {
        toast.error("Please provide contact email and phone")
        setLoading(false)
        return
      }

      // Insurance is disabled - cost is always 0 (using component-level insuranceCost variable)

      // Create booking
      // Ensure routeId and scheduleId are numbers
      const routeId = typeof bookingData.routeId === 'string' 
        ? parseInt(bookingData.routeId, 10) 
        : Number(bookingData.routeId)
      
      // Handle scheduleId - check if it's empty or invalid before parsing
      let scheduleIdNum: number | undefined
      if (bookingData.scheduleId) {
        if (typeof bookingData.scheduleId === 'string') {
          const parsed = parseInt(bookingData.scheduleId, 10)
          scheduleIdNum = isNaN(parsed) ? undefined : parsed
        } else {
          scheduleIdNum = isNaN(Number(bookingData.scheduleId)) ? undefined : Number(bookingData.scheduleId)
        }
      }

      // Validate required fields before sending
      if (!routeId || isNaN(routeId)) {
        console.error("Invalid routeId:", bookingData.routeId)
        toast.error("Invalid route information. Please go back and try again.")
        setLoading(false)
        return
      }

      if (!scheduleIdNum || isNaN(scheduleIdNum)) {
        console.error("❌ Invalid or missing scheduleId:", {
          scheduleId: bookingData.scheduleId,
          type: typeof bookingData.scheduleId,
          parsed: scheduleIdNum,
          bookingData: bookingData
        })
        toast.error("Schedule information is missing. Please go back to seat selection and try again.")
        setLoading(false)
        return
      }
      
      console.log("✅ Valid scheduleId found:", scheduleIdNum)

      // Validate travel date
      if (!bookingData.travelDate) {
        console.error("Missing travelDate:", bookingData)
        toast.error("Travel date is missing. Please go back and try again.")
        setLoading(false)
        return
      }

      console.log("Submitting booking with:", {
        routeId,
        scheduleId: scheduleIdNum,
        travelDate: bookingData.travelDate,
        seats: bookingData.seats,
        passengersCount: passengers.length,
        contactEmail,
        contactPhone,
        paymentMethod
      })

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId: routeId,
          scheduleId: scheduleIdNum,
          travelDate: bookingData.travelDate,
          seats: bookingData.seats,
          passengers,
          contactEmail,
          contactPhone,
          paymentMethod: paymentMethod,
          insuranceCost,
          // promoCode: (bookingData as any).promoCode, // Promo code commented out
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("Booking API error:", {
          status: response.status,
          error: data.error,
          body: data
        })
        toast.error(data.error || "Failed to create booking")
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log("Booking created successfully:", data)

      // Clear form data from sessionStorage after successful booking
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(STORAGE_KEY)
        } catch (error) {
          console.error("Error clearing form data:", error)
        }
      }

      // Show success toast
      toast.success("Booking created successfully! Redirecting...")

      // Redirect to success page with booking ID
      // Always navigate after successful booking creation - don't block on router checks
      try {
        router.push(`/booking/success?bookingId=${data.booking.id}`)
      } catch (navError) {
        // If router.push fails, use window.location as fallback
        if (typeof window !== 'undefined') {
          window.location.href = `/booking/success?bookingId=${data.booking.id}`
        }
      }
    } catch (err) {
      console.error("Booking error:", err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
          ? err 
          : "Failed to create booking. Please try again."
      toast.error(errorMessage)
      setLoading(false)
      
      // Don't clear form data on error - user can retry
    }
  }

  // Count total errors
  const errorCount = Object.keys(validationErrors).length

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Error Summary */}
      {showAllErrors && errorCount > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">
                  Please fix {errorCount} error{errorCount > 1 ? 's' : ''} before continuing
                </p>
                <ul className="mt-2 text-sm text-destructive/80 list-disc list-inside space-y-1">
                  {Object.entries(validationErrors).slice(0, 5).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                  {errorCount > 5 && (
                    <li>...and {errorCount - 5} more</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Travel Insurance section commented out */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Travel Insurance (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setTravelInsurance("none")}
              className={`p-4 rounded-lg border-2 transition-all ${
                travelInsurance === "none" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold mb-2">No Insurance</div>
              <div className="text-2xl font-bold mb-2">$0</div>
              <div className="text-xs text-muted-foreground">Travel at your own risk</div>
            </button>

            <button
              type="button"
              onClick={() => setTravelInsurance("basic")}
              className={`p-4 rounded-lg border-2 transition-all ${
                travelInsurance === "basic" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold mb-2">Basic Coverage</div>
              <div className="text-2xl font-bold mb-2">$15</div>
              <ul className="text-xs text-left text-muted-foreground space-y-1">
                <li>✓ Trip Cancellation</li>
                <li>✓ $5,000 Medical</li>
                <li>✓ Baggage Loss</li>
              </ul>
            </button>

            <button
              type="button"
              onClick={() => setTravelInsurance("premium")}
              className={`p-4 rounded-lg border-2 transition-all ${
                travelInsurance === "premium" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-semibold mb-2">Premium Coverage</div>
              <div className="text-2xl font-bold mb-2">$35</div>
              <ul className="text-xs text-left text-muted-foreground space-y-1">
                <li>✓ All Basic Coverage</li>
                <li>✓ $50,000 Medical</li>
                <li>✓ Trip Delay</li>
                <li>✓ Emergency Evacuation</li>
              </ul>
            </button>
          </div>
        </CardContent>
      </Card> */}

      {/* Passenger Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Passenger Details
            </span>
            {/* Saved travelers feature commented out */}
            {/* {savedTravelers.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseSavedTravelers(!useSavedTravelers)}
              >
                {useSavedTravelers ? "Enter Manually" : "Use Saved Travelers"}
              </Button>
            )} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {bookingData.seats.map((seat: string, index: number) => (
            <div key={seat} className="space-y-6 pb-6 border-b border-border last:border-0 last:pb-0">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Passenger {index + 1} - Seat {seat}
              </h3>

              {/* Passenger form with validation */}
              <div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    id={`firstName-${index}`}
                    name={`firstName-${index}`}
                    label="First Name"
                    placeholder="John"
                    required
                    value={formValues[`firstName-${index}`] || ""}
                    onChange={(e) => handleInputChange(`firstName-${index}`, e.target.value)}
                    onBlur={() => handleBlur(`passenger-${index}-firstName`)}
                    error={getFieldError(`passenger-${index}-firstName`)}
                  />

                  <FormField
                    id={`lastName-${index}`}
                    name={`lastName-${index}`}
                    label="Last Name"
                    placeholder="Doe"
                    required
                    value={formValues[`lastName-${index}`] || ""}
                    onChange={(e) => handleInputChange(`lastName-${index}`, e.target.value)}
                    onBlur={() => handleBlur(`passenger-${index}-lastName`)}
                    error={getFieldError(`passenger-${index}-lastName`)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3 mt-6">
                  <FormField
                    id={`age-${index}`}
                    name={`age-${index}`}
                    type="number"
                    label="Age"
                    placeholder="25"
                    min={0}
                    max={120}
                    required
                    value={formValues[`age-${index}`] || ""}
                    onChange={(e) => handleInputChange(`age-${index}`, e.target.value)}
                    onBlur={() => handleBlur(`passenger-${index}-age`)}
                    error={getFieldError(`passenger-${index}-age`)}
                  />

                  <FormSelect
                    id={`gender-${index}`}
                    name={`gender-${index}`}
                    label="Gender"
                    required
                    value={formValues[`gender-${index}`] || ""}
                    onChange={(e) => handleInputChange(`gender-${index}`, e.target.value)}
                    onBlur={() => handleBlur(`passenger-${index}-gender`)}
                    error={getFieldError(`passenger-${index}-gender`)}
                    options={[
                      { value: "", label: "Select" },
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                  />

                  <FormSelect
                    id={`type-${index}`}
                    name={`type-${index}`}
                    label="Type"
                    required
                    value={formValues[`type-${index}`] || "adult"}
                    onChange={(e) => handleInputChange(`type-${index}`, e.target.value)}
                    onBlur={() => handleBlur(`passenger-${index}-type`)}
                    error={getFieldError(`passenger-${index}-type`)}
                    options={[
                      { value: "adult", label: "Adult (12-59)" },
                      { value: "child", label: "Child (3-11)" },
                      { value: "infant", label: "Infant (0-2)" },
                      { value: "senior", label: "Senior (60+)" },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}

          {bookingData.seats.length < 4 && (
            <Button type="button" variant="outline" className="w-full bg-transparent" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Another Passenger
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Contact Details */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="john@example.com"
            required
            value={formValues["email"] || ""}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            error={getFieldError("email")}
            hint="Your ticket will be sent to this email"
          />

          <FormField
            id="phone"
            name="phone"
            type="tel"
            label="Phone Number"
            placeholder="+1 (555) 000-0000"
            required
            value={formValues["phone"] || ""}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            error={getFieldError("phone")}
            hint="For booking updates and support"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="card" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Card</span>
              </TabsTrigger>
              <TabsTrigger value="upi" className="gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">UPI</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className={getFieldError("cardNumber") ? "text-destructive" : ""}>
                  Card Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input 
                    id="cardNumber" 
                    name="cardNumber" 
                    placeholder="1234 5678 9012 3456" 
                    required={paymentMethod === "card"}
                    value={formValues["cardNumber"] || ""}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    onBlur={() => handleBlur("cardNumber")}
                    className={getFieldError("cardNumber") ? "border-destructive pr-20" : "pr-20"}
                    maxLength={19}
                  />
                  {formValues["cardNumber"] && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground uppercase">
                      {getCardType(formValues["cardNumber"])}
                    </span>
                  )}
                </div>
                {getFieldError("cardNumber") && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("cardNumber")}
                  </p>
                )}
              </div>

              <FormField
                id="cardName"
                name="cardName"
                label="Cardholder Name"
                placeholder="John Doe"
                required={paymentMethod === "card"}
                value={formValues["cardName"] || ""}
                onChange={(e) => handleInputChange("cardName", e.target.value)}
                onBlur={() => handleBlur("cardName")}
                error={getFieldError("cardName")}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiry" className={getFieldError("expiry") ? "text-destructive" : ""}>
                    Expiry Date <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="expiry" 
                    name="expiry" 
                    placeholder="MM/YY" 
                    required={paymentMethod === "card"}
                    value={formValues["expiry"] || ""}
                    onChange={(e) => handleExpiryChange(e.target.value, formValues["expiry"] || "")}
                    onKeyDown={(e) => {
                      // Handle backspace on the slash
                      if (e.key === 'Backspace' && formValues["expiry"]?.endsWith('/')) {
                        e.preventDefault()
                        handleInputChange('expiry', formValues["expiry"].slice(0, -1))
                      }
                    }}
                    onBlur={() => handleBlur("expiry")}
                    className={getFieldError("expiry") ? "border-destructive" : ""}
                    maxLength={5}
                  />
                  {getFieldError("expiry") && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("expiry")}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv" className={getFieldError("cvv") ? "text-destructive" : ""}>
                    CVV <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="cvv" 
                    name="cvv" 
                    type="password" 
                    placeholder="123" 
                    maxLength={4} 
                    required={paymentMethod === "card"}
                    value={formValues["cvv"] || ""}
                    onChange={(e) => handleInputChange("cvv", e.target.value.replace(/\D/g, ''))}
                    onBlur={() => handleBlur("cvv")}
                    className={getFieldError("cvv") ? "border-destructive" : ""}
                  />
                  {getFieldError("cvv") && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("cvv")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">3 or 4 digit security code</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="upi" className="space-y-4 mt-6">
              <FormField
                id="upiId"
                name="upiId"
                label="UPI ID"
                placeholder="yourname@upi"
                required={paymentMethod === "upi"}
                value={formValues["upiId"] || ""}
                onChange={(e) => handleInputChange("upiId", e.target.value)}
                onBlur={() => handleBlur("upiId")}
                error={getFieldError("upiId")}
                hint="You will receive a payment request on your UPI app"
              />
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 mt-6">
              <div className="grid gap-3">
                <Button type="button" variant="outline" className="justify-start h-auto py-3 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                    <div className="text-left">
                      <div className="font-medium">PayPal</div>
                      <div className="text-xs text-muted-foreground">Fast & secure</div>
                    </div>
                  </div>
                </Button>
                <Button type="button" variant="outline" className="justify-start h-auto py-3 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500" />
                    <div className="text-left">
                      <div className="font-medium">Google Pay</div>
                      <div className="text-xs text-muted-foreground">Quick checkout</div>
                    </div>
                  </div>
                </Button>
                <Button type="button" variant="outline" className="justify-start h-auto py-3 bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500" />
                    <div className="text-left">
                      <div className="font-medium">Apple Pay</div>
                      <div className="text-xs text-muted-foreground">Touch ID payment</div>
                    </div>
                  </div>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button type="submit" disabled={loading} className="w-full h-12 bg-accent hover:bg-accent/90 group" size="lg">
        {loading ? (
          "Completing Booking..."
        ) : (
          <>
            Complete Payment • $
            {(
              bookingData.pricePerSeat * bookingData.seats.length -
              bookingData.discount +
              // bookingData.tax + // Taxes commented out
              insuranceCost
            ).toFixed(2)}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By completing this purchase, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  )
}
