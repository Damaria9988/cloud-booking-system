"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CityAutocompleteProps {
  id: string
  name: string
  label: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
}

interface CitySuggestion {
  label: string
  value: string
  city: string
  state: string
  country?: string
  countryCode?: string
}

// Cache for recent searches (client-side)
const searchCache = new Map<string, { results: CitySuggestion[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100 // Maximum cached queries

export function CityAutocomplete({
  id,
  name,
  label,
  placeholder = "Start typing city name...",
  value = "",
  onChange,
  required = false,
  disabled = false,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Check cache first
  const getCachedResults = useCallback((query: string): CitySuggestion[] | null => {
    const cacheKey = query.toLowerCase().trim()
    const cached = searchCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.results
    }
    
    // Remove expired entry
    if (cached) {
      searchCache.delete(cacheKey)
    }
    
    return null
  }, [])

  // Store in cache
  const setCachedResults = useCallback((query: string, results: CitySuggestion[]) => {
    const cacheKey = query.toLowerCase().trim()
    
    // Limit cache size
    if (searchCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = searchCache.keys().next().value
      if (firstKey) {
        searchCache.delete(firstKey)
      }
    }
    
    searchCache.set(cacheKey, {
      results,
      timestamp: Date.now()
    })
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Check cache first
    const cached = getCachedResults(query)
    if (cached) {
      setSuggestions(cached)
      setShowSuggestions(cached.length > 0)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    try {
      const startTime = performance.now()
      const response = await fetch(
        `/api/cities/search?q=${encodeURIComponent(query)}`,
        { 
          signal: abortControllerRef.current.signal,
          cache: 'no-store', // Always fetch fresh - we handle caching client-side
        }
      )
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle both success and error responses
      if (data.error) {
        console.error("City search API error:", data.error)
        setSuggestions([])
        setShowSuggestions(false)
        return
      }
      
      const results = data.suggestions || []
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
      
      // Cache the results (even if empty, to avoid repeated failed requests)
      setCachedResults(query, results)
      
      // Log performance and results in development
      if (process.env.NODE_ENV === 'development') {
        const duration = performance.now() - startTime
        console.log(`City search for "${query}": ${results.length} results in ${duration.toFixed(0)}ms`)
        if (results.length === 0) {
          console.warn(`No results found for query: "${query}"`)
        }
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error("Error fetching city suggestions:", error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } finally {
      setLoading(false)
    }
  }, [getCachedResults, setCachedResults])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSelectedIndex(-1)
    
    if (onChange) {
      onChange(newValue)
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce the API call (reduced to 150ms for faster response)
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 150)
  }, [onChange, fetchSuggestions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleSelectSuggestion = (suggestion: CitySuggestion) => {
    const selectedValue = suggestion.value
    setInputValue(selectedValue)
    setShowSuggestions(false)
    setSelectedIndex(-1)
    
    if (onChange) {
      onChange(selectedValue)
    }
    
    // Update the input value for form submission
    if (inputRef.current) {
      inputRef.current.value = selectedValue
      // Trigger input event so form can capture the value
      const event = new Event('input', { bubbles: true })
      inputRef.current.dispatchEvent(event)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="pr-10"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-scroll scrollbar-thin">
          {suggestions.length > 0 ? (
            suggestions.slice(0, 30).map((suggestion, index) => (
              <button
                key={`${suggestion.city}-${suggestion.state}-${suggestion.countryCode || 'IN'}-${index}`}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors ${
                  index === selectedIndex ? "bg-gray-100" : ""
                }`}
              >
                <div className="font-medium text-sm">{suggestion.city}</div>
                <div className="text-xs text-muted-foreground">
                  {suggestion.country 
                    ? `${suggestion.city}, ${suggestion.state}, ${suggestion.country}`
                    : `${suggestion.city}, ${suggestion.state}`
                  }
                </div>
              </button>
            ))
          ) : (
            !loading && inputValue.length >= 2 && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No locations found
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
