import { Router } from 'express'
import prisma from '../config/prisma'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()

router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id

      const accounts = await prisma.financialAccount.findMany({
        where: {
          userId,
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

      let totalIncome = 0
      let totalExpenses = 0
      let availableBalance = 0

      for (const account of accounts) {
        for (const transaction of account.transactions) {
          const amount = Number(transaction.amount)

          if (transaction.type === 'INCOME') {
            totalIncome += amount
            availableBalance += amount
          }

          if (transaction.type === 'EXPENSE') {
            totalExpenses += amount
            availableBalance -= amount
          }
        }
      }

      const netWorth = availableBalance

      return res.status(200).json({
        data: {
          totalIncome,
          totalExpenses,
          availableBalance,
          netWorth,
        },
      })
    } catch (error) {
      console.error('Failed to calculate financial summary:', error)

      return res.status(500).json({
        error: 'Unable to calculate financial summary',
      })
    }
  },
)

export default router
