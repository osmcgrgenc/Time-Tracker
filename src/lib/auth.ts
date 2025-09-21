import { getServerSession } from 'next-auth/next'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createErrorResponse, HTTP_STATUS, ERROR_MESSAGES } from './api-helpers'

// Get session from server components
export async function getAuthSession() {
  return await getServerSession()
}

// Get user ID from JWT token in API routes
export async function getUserIdFromToken(req: NextRequest): Promise<string | null> {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    return token?.userId || null
  } catch (error) {
    console.error('Error getting user ID from token:', error)
    return null
  }
}

// Middleware to protect API routes
export function withAuth(handler: (req: NextRequest, userId: string) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      const userId = await getUserIdFromToken(req)
      
      if (!userId) {
        return createErrorResponse(
          ERROR_MESSAGES.UNAUTHORIZED,
          HTTP_STATUS.UNAUTHORIZED
        )
      }

      return await handler(req, userId)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return createErrorResponse(
        ERROR_MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_ERROR
      )
    }
  }
}

// Check if user is authenticated (for client-side)
export function requireAuth() {
  // This will be used in client components with useSession
  return true
}