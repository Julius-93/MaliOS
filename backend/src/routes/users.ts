import { Router } from 'express'
import prisma from '../config/prisma'

const router = Router()

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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return res.json({
      data: users,
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)

    return res.status(500).json({
      error: 'Unable to fetch users',
    })
  }
})

export default router
