import { Router } from 'express'
import { z } from 'zod'
import prisma from '../config/prisma'

const router = Router()

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    })

    res.json({
      data: users,
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)

    res.status(500).json({
      error: 'Unable to fetch users',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid user data',
        details: parsed.error.flatten(),
      })
    }

    const { email, firstName, lastName } = parsed.data

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'A user with this email already exists',
      })
    }

    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
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
    console.error('Failed to create user:', error)

    return res.status(500).json({
      error: 'Unable to create user',
    })
  }
})

export default router
