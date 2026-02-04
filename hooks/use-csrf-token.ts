"use client"

import { useEffect, useState } from "react"

/**
 * Client-side hook to manage CSRF token
 * Automatically includes token in fetch requests
 */
export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch CSRF token from cookie or API
    async function fetchToken() {
      try {
        // In a real implementation, you might fetch this from an endpoint
        // For now, we'll get it from a meta tag or similar
        const metaToken = document.querySelector('meta[name="csrf-token"]')
        if (metaToken) {
          setToken(metaToken.getAttribute("content"))
        }
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [])

  /**
   * Enhanced fetch with CSRF token
   */
  const fetchWithCsrf = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)

    // Add CSRF token for state-changing requests
    if (token && ["POST", "PUT", "PATCH", "DELETE"].includes(options.method?.toUpperCase() || "GET")) {
      headers.set("x-csrf-token", token)
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  return {
    token,
    loading,
    fetchWithCsrf,
  }
}

/**
 * Helper to add CSRF token to FormData
 */
export function addCsrfToFormData(formData: FormData, token: string): FormData {
  formData.append("_csrf", token)
  return formData
}

/**
 * Helper to create headers with CSRF token
 */
export function createHeadersWithCsrf(token: string, additionalHeaders?: HeadersInit): Headers {
  const headers = new Headers(additionalHeaders)
  headers.set("x-csrf-token", token)
  return headers
}
