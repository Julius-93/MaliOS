import type { NextFunction, Request, Response } from 'express'
import prisma from '../config/prisma'
import { hashSessionToken } from '../utils/session'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const token = authorization.slice(7).trim()

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const tokenHash = hashSessionToken(token)

    const session = await prisma.session.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!session) {
      return res.status(401).json({
        error: 'Invalid session',
      })
    }

    if (session.expiresAt <= new Date()) {
      await prisma.session.delete({
        where: {
          id: session.id,
        },
      })

      return res.status(401).json({
        error: 'Session expired',
      })
    }

    req.user = session.user

    return next()
  } catch (error) {
    console.error('Authentication failed:', error)

    return res.status(500).json({
      error: 'Unable to authenticate request',
    })
  }
}
