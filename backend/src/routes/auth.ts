import { Router } from 'express'
import { z } from 'zod'
import argon2 from 'argon2'
import prisma from '../config/prisma'
import {
  createSessionToken,
  hashSessionToken,
} from '../utils/session'

import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(12).max(128),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid registration data',
        details: parsed.error.flatten(),
      })
    }

    const email = parsed.data.email.trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      })
    }

    const passwordHash = await argon2.hash(parsed.data.password)

    const user = await prisma.user.create({
      data: {
        email,
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName.trim(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    })

    return res.status(201).json({
      data: user,
    })
  } catch (error) {
    console.error('Failed to register user:', error)

    return res.status(500).json({
      error: 'Unable to register user',
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid login data',
      })
    }

    const email = parsed.data.email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      })
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      parsed.data.password,
    )

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password',
      })
    }

    const sessionToken = createSessionToken()

    const tokenHash = hashSessionToken(sessionToken)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    return res.status(200).json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token: sessionToken,
        expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to log in user:', error)

    return res.status(500).json({
      error: 'Unable to log in',
    })
  }
})

router.get(
  '/me',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    return res.status(200).json({
      data: {
        user: req.user,
      },
    })
  },
)

export default router
