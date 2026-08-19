import { Router } from 'express'
import { z } from 'zod'
import prisma from '../config/prisma'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()

const createAccountSchema = z.object({
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

router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const accounts = await prisma.financialAccount.findMany({
        where: {
          userId: req.user!.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          transactions: {
            select: {
              type: true,
              amount: true,
            },
          },
        },
      })

      const accountsWithCalculatedBalance = accounts.map((account) => {
        const calculatedBalance = account.transactions.reduce(
          (total, transaction) => {
            const amount = Number(transaction.amount)

            if (transaction.type === 'INCOME') {
              return total + amount
            }

            if (transaction.type === 'EXPENSE') {
              return total - amount
            }

            return total
          },
          0,
        )

        const { transactions, ...accountWithoutTransactions } = account

        return {
          ...accountWithoutTransactions,
          calculatedBalance,
        }
      })

      return res.status(200).json({
        data: accountsWithCalculatedBalance,
      })
    } catch (error) {
      console.error('Failed to fetch accounts:', error)

      return res.status(500).json({
        error: 'Unable to fetch accounts',
      })
    }
  },
)

router.get(
  '/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const accountId = String(req.params.id)

      const account = await prisma.financialAccount.findFirst({
        where: {
          id: accountId,
          userId: req.user!.id,
        },
        include: {
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

      const calculatedBalance = account.transactions.reduce(
        (total: number, transaction) => {
          const amount = Number(transaction.amount)

          if (transaction.type === 'INCOME') {
            return total + amount
          }

          if (transaction.type === 'EXPENSE') {
            return total - amount
          }

          return total
        },
        0,
      )

      return res.status(200).json({
        data: {
          ...account,
          calculatedBalance,
        },
      })
    } catch (error) {
      console.error('Failed to fetch account:', error)

      return res.status(500).json({
        error: 'Unable to fetch account',
      })
    }
  },
)

router.post(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const parsed = createAccountSchema.safeParse(req.body)

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid account data',
          details: parsed.error.flatten(),
        })
      }

      const account = await prisma.financialAccount.create({
        data: {
          userId: req.user!.id,
          name: parsed.data.name.trim(),
          type: parsed.data.type,
          currency: parsed.data.currency.toUpperCase(),
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
  },
)

export default router
