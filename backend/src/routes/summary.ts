import { Router } from 'express'
import prisma from '../config/prisma'

const router = Router()

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      })
    }

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

    return res.json({
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
})

export default router
