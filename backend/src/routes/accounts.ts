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

    return res.json({
      data: accountsWithCalculatedBalance,
    })
  } catch (error) {
    console.error('Failed to fetch accounts:', error)

    return res.status(500).json({
      error: 'Unable to fetch accounts',
    })
  }
})

router.post('/', async (req, res) => {
  try {
    // existing POST logic
  } catch (error) {
    console.error('Failed to create account:', error)

    return res.status(500).json({
      error: 'Unable to create account',
    })
  }
})

export default router
