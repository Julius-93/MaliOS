import { Router } from 'express'
import { z } from 'zod'
import prisma from '../config/prisma'

const router = Router()

const createAccountSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum([
    'BANK',
    'MOBILE_MONEY',
    'CASH',
    'CREDIT_CARD',
    'SAVINGS',
    'OTHER',
  ]),
  currency: z.string().length(3).default('KES'),
  balance: z.number().nonnegative().default(0),
})

router.get('/', async (req, res) => {
  try {
    const accounts = await prisma.financialAccount.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return res.json({
      data: accounts,
    })
  } catch (error) {
    console.error('Failed to fetch accounts:', error)

    return res.status(500).json({
      error: 'Unable to fetch accounts',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const account = await prisma.financialAccount.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        transactions: {
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    })

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
      })
    }

    return res.json({
      data: account,
    })
  } catch (error) {
    console.error('Failed to fetch account:', error)

    return res.status(500).json({
      error: 'Unable to fetch account',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const parsed = createAccountSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid account data',
        details: parsed.error.flatten(),
      })
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parsed.data.userId,
      },
    })

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      })
    }

    const account = await prisma.financialAccount.create({
      data: {
        userId: parsed.data.userId,
        name: parsed.data.name,
        type: parsed.data.type,
        currency: parsed.data.currency,
        balance: parsed.data.balance,
      },
    })

    return res.status(201).json({
      data: account,
    })
  } catch (error) {
    console.error('Failed to create account:', error)

    return res.status(500).json({
      error: 'Unable to create account',
    })
  }
})

export default router
