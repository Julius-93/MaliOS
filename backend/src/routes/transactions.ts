import { Router } from 'express'
import { z } from 'zod'
import prisma from '../config/prisma'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),

  type: z.enum([
    'INCOME',
    'EXPENSE',
    'TRANSFER',
  ]),

  amount: z.number().positive(),

  currency: z.string().length(3).default('KES'),

  category: z.string().min(1),

  merchant: z.string().min(1).optional(),

  note: z.string().optional(),

  occurredAt: z.string().datetime(),
})

router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          account: {
            userId: req.user!.id,
          },
        },

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

      return res.status(200).json({
        data: transactions,
      })
    } catch (error) {
      console.error('Failed to fetch transactions:', error)

      return res.status(500).json({
        error: 'Unable to fetch transactions',
      })
    }
  },
)

router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const transactionId = String(req.params.id)

      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,

          account: {
            userId: req.user!.id,
          },
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

      return res.status(200).json({
        data: transaction,
      })
    } catch (error) {
      console.error('Failed to fetch transaction:', error)

      return res.status(500).json({
        error: 'Unable to fetch transaction',
      })
    }
  },
)

router.post(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = createTransactionSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid transaction data',
          details: parsed.error.flatten(),
        })
      }

      const account = await prisma.financialAccount.findFirst({
        where: {
          id: parsed.data.accountId,
          userId: req.user!.id,
        },
      })

      if (!account) {
        return res.status(404).json({
          error: 'Financial account not found',
        })
      }

      const currency = parsed.data.currency.toUpperCase()

      if (account.currency !== currency) {
        return res.status(400).json({
          error: 'Transaction currency must match account currency',
        })
      }

      const transaction = await prisma.transaction.create({
        data: {
          accountId: account.id,
          type: parsed.data.type,
          amount: parsed.data.amount,
          currency,
          category: parsed.data.category.trim(),
          merchant: parsed.data.merchant?.trim(),
          note: parsed.data.note?.trim(),
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
  },
)

export default router
