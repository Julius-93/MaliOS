import { Router } from 'express'
import { z } from 'zod'
import prisma from '../config/prisma'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()

// ========================================
// VALIDATION
// ========================================

const createInvestmentAccountSchema = z.object({
  name: z.string().min(1),
  provider: z.string().min(1),
  currency: z.string().length(3).default('KES'),
})

const createHoldingSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),

  assetType: z.enum([
    'STOCK',
    'BOND',
    'ETF',
    'MUTUAL_FUND',
    'MONEY_MARKET',
    'REAL_ESTATE',
    'CRYPTO',
    'OTHER',
  ]),

  quantity: z.number().positive(),

  averageCost: z.number().nonnegative(),

  currentPrice: z.number().nonnegative(),
})

const updateHoldingSchema = z.object({
  symbol: z.string().min(1).optional(),
  name: z.string().min(1).optional(),

  assetType: z
    .enum([
      'STOCK',
      'BOND',
      'ETF',
      'MUTUAL_FUND',
      'MONEY_MARKET',
      'REAL_ESTATE',
      'CRYPTO',
      'OTHER',
    ])
    .optional(),

  quantity: z.number().positive().optional(),

  averageCost: z.number().nonnegative().optional(),

  currentPrice: z.number().nonnegative().optional(),
})

// ========================================
// HELPER
// ========================================

function calculateHoldingValues(holding: {
  quantity: unknown
  averageCost: unknown
  currentPrice: unknown
}) {
  const quantity = Number(holding.quantity)
  const averageCost = Number(holding.averageCost)
  const currentPrice = Number(holding.currentPrice)

  const costBasis =
    quantity * averageCost

  const marketValue =
    quantity * currentPrice

  const gainLoss =
    marketValue - costBasis

  const returnPercentage =
    costBasis > 0
      ? (gainLoss / costBasis) * 100
      : 0

  return {
    quantity,
    averageCost,
    currentPrice,
    costBasis,
    marketValue,
    gainLoss,
    returnPercentage,
  }
}

// ========================================
// GET ALL INVESTMENT ACCOUNTS
// ========================================

router.get(
  '/',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id

      const accounts =
        await prisma.investmentAccount.findMany({
          where: {
            userId,
          },

          orderBy: {
            createdAt: 'desc',
          },

          include: {
            holdings: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        })

      const accountsWithValues =
        accounts.map((account) => {
          const holdings =
            account.holdings.map(
              (holding) => ({
                ...holding,
                ...calculateHoldingValues(
                  holding,
                ),
              }),
            )

          const totalCost =
            holdings.reduce(
              (total, holding) =>
                total + holding.costBasis,
              0,
            )

          const totalValue =
            holdings.reduce(
              (total, holding) =>
                total +
                holding.marketValue,
              0,
            )

          const totalGainLoss =
            totalValue - totalCost

          const returnPercentage =
            totalCost > 0
              ? (totalGainLoss /
                  totalCost) *
                100
              : 0

          return {
            ...account,
            holdings,

            totalCost,
            totalValue,
            totalGainLoss,
            returnPercentage,
          }
        })

      return res.status(200).json({
        data: accountsWithValues,
      })
    } catch (error) {
      console.error(
        'Failed to fetch investments:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to fetch investments',
      })
    }
  },
)

// ========================================
// GET ONE INVESTMENT ACCOUNT
// ========================================

router.get(
  '/accounts/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const accountId =
        String(req.params.id)

      const account =
        await prisma.investmentAccount.findFirst({
          where: {
            id: accountId,
            userId: req.user!.id,
          },

          include: {
            holdings: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        })

      if (!account) {
        return res.status(404).json({
          error:
            'Investment account not found',
        })
      }

      const holdings =
        account.holdings.map(
          (holding) => ({
            ...holding,
            ...calculateHoldingValues(
              holding,
            ),
          }),
        )

      const totalCost =
        holdings.reduce(
          (total, holding) =>
            total + holding.costBasis,
          0,
        )

      const totalValue =
        holdings.reduce(
          (total, holding) =>
            total + holding.marketValue,
          0,
        )

      const totalGainLoss =
        totalValue - totalCost

      const returnPercentage =
        totalCost > 0
          ? (totalGainLoss /
              totalCost) *
            100
          : 0

      return res.status(200).json({
        data: {
          ...account,
          holdings,
          totalCost,
          totalValue,
          totalGainLoss,
          returnPercentage,
        },
      })
    } catch (error) {
      console.error(
        'Failed to fetch investment account:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to fetch investment account',
      })
    }
  },
)

// ========================================
// CREATE INVESTMENT ACCOUNT
// ========================================

router.post(
  '/accounts',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const parsed =
        createInvestmentAccountSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error:
            'Invalid investment account data',

          details:
            parsed.error.flatten(),
        })
      }

      const account =
        await prisma.investmentAccount.create({
          data: {
            userId: req.user!.id,

            name:
              parsed.data.name.trim(),

            provider:
              parsed.data.provider.trim(),

            currency:
              parsed.data.currency.toUpperCase(),
          },
        })

      return res.status(201).json({
        data: account,
      })
    } catch (error) {
      console.error(
        'Failed to create investment account:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to create investment account',
      })
    }
  },
)

// ========================================
// CREATE HOLDING
// ========================================

router.post(
  '/accounts/:accountId/holdings',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const accountId =
        String(req.params.accountId)

      const parsed =
        createHoldingSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error:
            'Invalid investment holding data',

          details:
            parsed.error.flatten(),
        })
      }

      // Make sure the account belongs
      // to the logged-in user.
      const account =
        await prisma.investmentAccount.findFirst({
          where: {
            id: accountId,
            userId: req.user!.id,
          },
        })

      if (!account) {
        return res.status(404).json({
          error:
            'Investment account not found',
        })
      }

      const holding =
        await prisma.investmentHolding.create({
          data: {
            investmentAccountId:
              account.id,

            symbol:
              parsed.data.symbol
                .trim()
                .toUpperCase(),

            name:
              parsed.data.name.trim(),

            assetType:
              parsed.data.assetType,

            quantity:
              parsed.data.quantity,

            averageCost:
              parsed.data.averageCost,

            currentPrice:
              parsed.data.currentPrice,

            // Holding inherits the account currency.
            currency:
              account.currency,
          },
        })

      return res.status(201).json({
        data: {
          ...holding,

          ...calculateHoldingValues(
            holding,
          ),
        },
      })
    } catch (error) {
      console.error(
        'Failed to create holding:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to create investment holding',
      })
    }
  },
)

// ========================================
// UPDATE HOLDING
// ========================================

router.patch(
  '/holdings/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const holdingId =
        String(req.params.id)

      const parsed =
        updateHoldingSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error:
            'Invalid investment holding data',

          details:
            parsed.error.flatten(),
        })
      }

      const existingHolding =
        await prisma.investmentHolding.findFirst({
          where: {
            id: holdingId,

            investmentAccount: {
              userId: req.user!.id,
            },
          },
        })

      if (!existingHolding) {
        return res.status(404).json({
          error:
            'Investment holding not found',
        })
      }

      const holding =
        await prisma.investmentHolding.update({
          where: {
            id: existingHolding.id,
          },

          data: {
            symbol:
              parsed.data.symbol !==
              undefined
                ? parsed.data.symbol
                    .trim()
                    .toUpperCase()
                : existingHolding.symbol,

            name:
              parsed.data.name !==
              undefined
                ? parsed.data.name.trim()
                : existingHolding.name,

            assetType:
              parsed.data.assetType ??
              existingHolding.assetType,

            quantity:
              parsed.data.quantity ??
              existingHolding.quantity,

            averageCost:
              parsed.data.averageCost ??
              existingHolding.averageCost,

            currentPrice:
              parsed.data.currentPrice ??
              existingHolding.currentPrice,
          },
        })

      return res.status(200).json({
        data: {
          ...holding,

          ...calculateHoldingValues(
            holding,
          ),
        },
      })
    } catch (error) {
      console.error(
        'Failed to update holding:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to update investment holding',
      })
    }
  },
)

// ========================================
// DELETE HOLDING
// ========================================

router.delete(
  '/holdings/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const holdingId =
        String(req.params.id)

      const holding =
        await prisma.investmentHolding.findFirst({
          where: {
            id: holdingId,

            investmentAccount: {
              userId: req.user!.id,
            },
          },
        })

      if (!holding) {
        return res.status(404).json({
          error:
            'Investment holding not found',
        })
      }

      await prisma.investmentHolding.delete({
        where: {
          id: holding.id,
        },
      })

      return res.status(200).json({
        message:
          'Investment holding deleted successfully',
      })
    } catch (error) {
      console.error(
        'Failed to delete holding:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to delete investment holding',
      })
    }
  },
)

// ========================================
// DELETE INVESTMENT ACCOUNT
// ========================================

router.delete(
  '/accounts/:id',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const accountId =
        String(req.params.id)

      const account =
        await prisma.investmentAccount.findFirst({
          where: {
            id: accountId,
            userId: req.user!.id,
          },
        })

      if (!account) {
        return res.status(404).json({
          error:
            'Investment account not found',
        })
      }

      await prisma.investmentAccount.delete({
        where: {
          id: account.id,
        },
      })

      return res.status(200).json({
        message:
          'Investment account deleted successfully',
      })
    } catch (error) {
      console.error(
        'Failed to delete investment account:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to delete investment account',
      })
    }
  },
)

export default router