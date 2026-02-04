// Authentication utilities
// This file provides helper functions for user authentication

import { hash, compare } from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export type User = {
  id: number
  email: string
  firstName: string
  lastName: string
  isStudent: boolean
  isAdmin: boolean
}

// Simulate session management (in production, use proper auth library)
export function createSession(user: User): string {
  // In production, create JWT or session token
  return Buffer.from(JSON.stringify(user)).toString("base64")
}

export function verifySession(token: string): User | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString())
  } catch {
    return null
  }
}
