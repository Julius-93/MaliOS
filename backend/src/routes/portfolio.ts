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

      const accounts =
        await prisma.investmentAccount.findMany({
          where: {
            userId,
          },

          orderBy: {
            createdAt: 'desc',
          },

          include: {
            holdings: true,
          },
        })

      const totalsByCurrency: Record<
        string,
        {
          totalCost: number
          totalValue: number
          totalGainLoss: number
          returnPercentage: number
        }
      > = {}

      const assetAllocationByCurrency: Record<
        string,
        Record<string, number>
      > = {}

      const accountSummaries =
        accounts.map((account) => {
          let totalCost = 0
          let totalValue = 0

          const holdings =
            account.holdings.map((holding) => {
              const quantity =
                Number(holding.quantity)

              const averageCost =
                Number(holding.averageCost)

              const currentPrice =
                Number(holding.currentPrice)

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

              totalCost += costBasis
              totalValue += marketValue

              if (
                !assetAllocationByCurrency[
                  holding.currency
                ]
              ) {
                assetAllocationByCurrency[
                  holding.currency
                ] = {}
              }

              assetAllocationByCurrency[
                holding.currency
              ][holding.assetType] =
                (assetAllocationByCurrency[
                  holding.currency
                ][holding.assetType] || 0) +
                marketValue

              return {
                id: holding.id,
                symbol: holding.symbol,
                name: holding.name,
                assetType: holding.assetType,
                currency: holding.currency,

                quantity,
                averageCost,
                currentPrice,

                costBasis,
                marketValue,
                gainLoss,
                returnPercentage,
              }
            })

          const totalGainLoss =
            totalValue - totalCost

          const returnPercentage =
            totalCost > 0
              ? (totalGainLoss / totalCost) * 100
              : 0

          if (!totalsByCurrency[account.currency]) {
            totalsByCurrency[account.currency] = {
              totalCost: 0,
              totalValue: 0,
              totalGainLoss: 0,
              returnPercentage: 0,
            }
          }

          totalsByCurrency[
            account.currency
          ].totalCost += totalCost

          totalsByCurrency[
            account.currency
          ].totalValue += totalValue

          totalsByCurrency[
            account.currency
          ].totalGainLoss += totalGainLoss

          return {
            id: account.id,
            name: account.name,
            provider: account.provider,
            currency: account.currency,

            totalCost,
            totalValue,
            totalGainLoss,
            returnPercentage,

            holdingCount:
              account.holdings.length,

            holdings,
          }
        })

      for (
        const currency of
        Object.keys(totalsByCurrency)
      ) {
        const totals =
          totalsByCurrency[currency]

        totals.returnPercentage =
          totals.totalCost > 0
            ? (totals.totalGainLoss /
                totals.totalCost) *
              100
            : 0
      }

      const assetAllocation =
        Object.entries(
          assetAllocationByCurrency,
        ).reduce<
          Record<
            string,
            Array<{
              assetType: string
              value: number
              percentage: number
            }>
          >
        >(
          (
            result,
            [currency, allocations],
          ) => {
            const totalValue =
              Object.values(
                allocations,
              ).reduce(
                (total, value) =>
                  total + value,
                0,
              )

            result[currency] =
              Object.entries(
                allocations,
              )
                .map(
                  ([assetType, value]) => ({
                    assetType,
                    value,

                    percentage:
                      totalValue > 0
                        ? (value /
                            totalValue) *
                          100
                        : 0,
                  }),
                )
                .sort(
                  (a, b) =>
                    b.value - a.value,
                )

            return result
          },
          {},
        )

      const holdingCount =
        accountSummaries.reduce(
          (total, account) =>
            total +
            account.holdingCount,
          0,
        )

      return res.status(200).json({
        data: {
          accountCount:
            accountSummaries.length,

          holdingCount,

          totalsByCurrency,

          assetAllocation,

          accounts:
            accountSummaries,
        },
      })
    } catch (error) {
      console.error(
        'Failed to calculate portfolio:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to calculate portfolio',
      })
    }
  },
)

export default router