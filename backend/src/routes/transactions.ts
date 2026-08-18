import { Router } from 'express'
import { z } from 'zod'
import prisma from '../config/prisma'

const router = Router()

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),

  type: z.enum([
    'INCOME',
    'EXPENSE',
    'TRANSFER',
  ]),

  amount: z.number().positive(),

  currency: z
    .string()
    .length(3)
    .default('KES'),

  category: z
    .string()
    .min(1),

  merchant: z
    .string()
    .min(1)
    .optional(),

  note: z
    .string()
    .optional(),

  occurredAt: z
    .string()
    .datetime(),
})

router.get('/', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        occurredAt: 'desc',
      },

      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
      },
    })

    return res.json({
      data: transactions,
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)

    return res.status(500).json({
      error: 'Unable to fetch transactions',
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: req.params.id,
      },

      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
          },
        },
      },
    })

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
      })
    }

    return res.json({
      data: transaction,
    })
  } catch (error) {
    console.error('Failed to fetch transaction:', error)

    return res.status(500).json({
      error: 'Unable to fetch transaction',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const parsed = createTransactionSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid transaction data',
        details: parsed.error.flatten(),
      })
    }

    const account = await prisma.financialAccount.findUnique({
      where: {
        id: parsed.data.accountId,
      },
    })

    if (!account) {
      return res.status(404).json({
        error: 'Financial account not found',
      })
    }

    if (account.currency !== parsed.data.currency) {
      return res.status(400).json({
        error: 'Transaction currency must match account currency',
      })
    }

    const transaction = await prisma.transaction.create({
      data: {
        accountId: parsed.data.accountId,
        type: parsed.data.type,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        category: parsed.data.category,
        merchant: parsed.data.merchant,
        note: parsed.data.note,
        occurredAt: new Date(parsed.data.occurredAt),
      },
    })

    return res.status(201).json({
      data: transaction,
    })
  } catch (error) {
    console.error('Failed to create transaction:', error)

    return res.status(500).json({
      error: 'Unable to create transaction',
    })
  }
})

export default router
