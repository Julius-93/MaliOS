import { Router } from 'express'
import { z } from 'zod'

import prisma from '../config/prisma'

import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'


const router = Router()

const DAY_MS =
  24 * 60 * 60 * 1000


/* ========================================
   VALIDATION
======================================== */

const createBudgetSchema = z.object({
  name: z
    .string()
    .min(1)
    .optional(),

  category: z
    .string()
    .min(1),

  amount: z
    .number()
    .positive(),

  currency: z
    .string()
    .length(3)
    .default('KES'),

  startDate: z
    .string()
    .datetime(),

  endDate: z
    .string()
    .datetime(),
})


const updateBudgetSchema = z.object({
  name: z
    .string()
    .min(1)
    .optional(),

  category: z
    .string()
    .min(1)
    .optional(),

  amount: z
    .number()
    .positive()
    .optional(),

  currency: z
    .string()
    .length(3)
    .optional(),

  startDate: z
    .string()
    .datetime()
    .optional(),

  endDate: z
    .string()
    .datetime()
    .optional(),
})


/* ========================================
   HELPERS
======================================== */

function round(
  value: number,
  decimals = 2,
) {
  const multiplier =
    10 ** decimals

  return (
    Math.round(
      value * multiplier,
    ) / multiplier
  )
}


function getPeriodStatus(
  startDate: Date,
  endDate: Date,
  now: Date,
) {
  if (
    now <
    startDate
  ) {
    return 'UPCOMING'
  }

  if (
    now >
    endDate
  ) {
    return 'ENDED'
  }

  return 'ACTIVE'
}


/* ========================================
   CALCULATE BUDGET PROGRESS
======================================== */

async function calculateBudgetProgress(
  budget: {
    amount: unknown
    category: string
    currency: string
    startDate: Date
    endDate: Date
  },
  userId: string,
) {
  const now =
    new Date()

  const budgetAmount =
    Number(
      budget.amount,
    )

  const periodStatus =
    getPeriodStatus(
      budget.startDate,
      budget.endDate,
      now,
    )


  /* ======================================
     DATE METRICS
  ====================================== */

  const totalDays =
    Math.max(
      1,
      Math.ceil(
        (
          budget.endDate.getTime() -
          budget.startDate.getTime()
        ) /
          DAY_MS,
      ),
    )


  let elapsedDays =
    0


  if (
    periodStatus ===
    'ACTIVE'
  ) {
    elapsedDays =
      Math.max(
        1,
        Math.min(
          totalDays,

          Math.ceil(
            (
              now.getTime() -
              budget.startDate.getTime()
            ) /
              DAY_MS,
          ),
        ),
      )
  }


  if (
    periodStatus ===
    'ENDED'
  ) {
    elapsedDays =
      totalDays
  }


  const daysRemaining =
    periodStatus ===
    'ENDED'
      ? 0
      : Math.max(
          0,
          Math.ceil(
            (
              budget.endDate.getTime() -
              now.getTime()
            ) /
              DAY_MS,
          ),
        )


  /* ======================================
     SPENDING
  ====================================== */

  let spent =
    0


  /*
   * Upcoming budgets cannot have valid
   * in-period spending yet.
   */
  if (
    periodStatus !==
    'UPCOMING'
  ) {
    const spendingEnd =
      now <
      budget.endDate
        ? now
        : budget.endDate


    const expenses =
      await prisma.transaction.findMany({
        where: {
          type:
            'EXPENSE',

          currency:
            budget.currency,

          category: {
            equals:
              budget.category,

            mode:
              'insensitive',
          },

          occurredAt: {
            gte:
              budget.startDate,

            lte:
              spendingEnd,
          },

          account: {
            is: {
              userId,
            },
          },
        },

        select: {
          amount: true,
        },
      })


    spent =
      expenses.reduce(
        (
          total,
          transaction,
        ) =>
          total +
          Number(
            transaction.amount,
          ),
        0,
      )
  }


  /* ======================================
     CURRENT PROGRESS
  ====================================== */

  const remaining =
    budgetAmount -
    spent


  const percentageUsed =
    budgetAmount >
    0
      ? (
          spent /
          budgetAmount
        ) * 100
      : 0


  /* ======================================
     SPENDING RATE + PROJECTION
  ====================================== */

  const dailySpendRate =
    elapsedDays >
    0
      ? spent /
        elapsedDays
      : 0


  let projectedSpend =
    0


  if (
    periodStatus ===
    'ACTIVE'
  ) {
    projectedSpend =
      dailySpendRate *
      totalDays
  }


  if (
    periodStatus ===
    'ENDED'
  ) {
    projectedSpend =
      spent
  }


  const projectedRemaining =
    budgetAmount -
    projectedSpend


  const projectedPercentage =
    budgetAmount >
    0
      ? (
          projectedSpend /
          budgetAmount
        ) * 100
      : 0


  /* ======================================
     BUDGET HEALTH STATUS
  ====================================== */

  let healthStatus:
    | 'ON_TRACK'
    | 'PROJECTED_OVER'
    | 'WARNING'
    | 'EXCEEDED' =
      'ON_TRACK'


  if (
    percentageUsed >=
    100
  ) {
    healthStatus =
      'EXCEEDED'
  } else if (
    percentageUsed >=
    80
  ) {
    healthStatus =
      'WARNING'
  } else if (
    periodStatus ===
      'ACTIVE' &&
    projectedSpend >
      budgetAmount
  ) {
    healthStatus =
      'PROJECTED_OVER'
  }


  return {
    spent:
      round(
        spent,
      ),

    remaining:
      round(
        remaining,
      ),

    percentageUsed:
      round(
        percentageUsed,
        1,
      ),

    projectedSpend:
      round(
        projectedSpend,
      ),

    projectedRemaining:
      round(
        projectedRemaining,
      ),

    projectedPercentage:
      round(
        projectedPercentage,
        1,
      ),

    dailySpendRate:
      round(
        dailySpendRate,
      ),

    totalDays,

    elapsedDays,

    daysRemaining,

    periodStatus,

    healthStatus,

    isOverBudget:
      remaining <
      0,
  }
}


/* ========================================
   GET ALL BUDGETS
======================================== */

router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId =
        req.user!.id


      const budgets =
        await prisma.budget.findMany({
          where: {
            userId,
          },

          orderBy: [
            {
              startDate:
                'desc',
            },

            {
              createdAt:
                'desc',
            },
          ],
        })


      const budgetsWithProgress =
        await Promise.all(
          budgets.map(
            async (
              budget,
            ) => {
              const progress =
                await calculateBudgetProgress(
                  budget,
                  userId,
                )


              return {
                ...budget,

                amount:
                  Number(
                    budget.amount,
                  ),

                ...progress,
              }
            },
          ),
        )


      return res.status(200).json({
        data:
          budgetsWithProgress,
      })

    } catch (error) {
      console.error(
        'Failed to fetch budgets:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to fetch budgets',
      })
    }
  },
)


/* ========================================
   GET ONE BUDGET
======================================== */

router.get(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const budgetId =
        String(
          req.params.id,
        )

      const userId =
        req.user!.id


      const budget =
        await prisma.budget.findFirst({
          where: {
            id:
              budgetId,

            userId,
          },
        })


      if (!budget) {
        return res.status(404).json({
          error:
            'Budget not found',
        })
      }


      const progress =
        await calculateBudgetProgress(
          budget,
          userId,
        )


      return res.status(200).json({
        data: {
          ...budget,

          amount:
            Number(
              budget.amount,
            ),

          ...progress,
        },
      })

    } catch (error) {
      console.error(
        'Failed to fetch budget:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to fetch budget',
      })
    }
  },
)


/* ========================================
   CREATE BUDGET
======================================== */

router.post(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const parsed =
        createBudgetSchema.safeParse(
          req.body,
        )


      if (
        !parsed.success
      ) {
        return res.status(400).json({
          error:
            'Invalid budget data',

          details:
            parsed.error.flatten(),
        })
      }


      const category =
        parsed.data.category.trim()


      const name =
        parsed.data.name
          ?.trim() ||
        category


      const startDate =
        new Date(
          parsed.data.startDate,
        )


      const endDate =
        new Date(
          parsed.data.endDate,
        )


      if (
        endDate <
        startDate
      ) {
        return res.status(400).json({
          error:
            'Budget end date cannot be before start date',
        })
      }


      const budget =
        await prisma.budget.create({
          data: {
            userId:
              req.user!.id,

            name,

            category,

            amount:
              parsed.data.amount,

            currency:
              parsed.data.currency
                .toUpperCase(),

            startDate,

            endDate,
          },
        })


      const progress =
        await calculateBudgetProgress(
          budget,
          req.user!.id,
        )


      return res.status(201).json({
        data: {
          ...budget,

          amount:
            Number(
              budget.amount,
            ),

          ...progress,
        },
      })

    } catch (error) {
      console.error(
        'Failed to create budget:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to create budget',
      })
    }
  },
)


/* ========================================
   UPDATE BUDGET
======================================== */

router.patch(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const budgetId =
        String(
          req.params.id,
        )

      const userId =
        req.user!.id


      const parsed =
        updateBudgetSchema.safeParse(
          req.body,
        )


      if (
        !parsed.success
      ) {
        return res.status(400).json({
          error:
            'Invalid budget data',

          details:
            parsed.error.flatten(),
        })
      }


      const existingBudget =
        await prisma.budget.findFirst({
          where: {
            id:
              budgetId,

            userId,
          },
        })


      if (
        !existingBudget
      ) {
        return res.status(404).json({
          error:
            'Budget not found',
        })
      }


      const startDate =
        parsed.data.startDate
          ? new Date(
              parsed.data.startDate,
            )
          : existingBudget.startDate


      const endDate =
        parsed.data.endDate
          ? new Date(
              parsed.data.endDate,
            )
          : existingBudget.endDate


      if (
        endDate <
        startDate
      ) {
        return res.status(400).json({
          error:
            'Budget end date cannot be before start date',
        })
      }


      const category =
        parsed.data.category !==
        undefined
          ? parsed.data.category.trim()
          : existingBudget.category


      const updatedBudget =
        await prisma.budget.update({
          where: {
            id:
              existingBudget.id,
          },

          data: {
            name:
              parsed.data.name !==
              undefined
                ? parsed.data.name.trim()
                : existingBudget.name,

            category,

            amount:
              parsed.data.amount !==
              undefined
                ? parsed.data.amount
                : existingBudget.amount,

            currency:
              parsed.data.currency !==
              undefined
                ? parsed.data.currency
                    .toUpperCase()
                : existingBudget.currency,

            startDate,

            endDate,
          },
        })


      const progress =
        await calculateBudgetProgress(
          updatedBudget,
          userId,
        )


      return res.status(200).json({
        data: {
          ...updatedBudget,

          amount:
            Number(
              updatedBudget.amount,
            ),

          ...progress,
        },
      })

    } catch (error) {
      console.error(
        'Failed to update budget:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to update budget',
      })
    }
  },
)


/* ========================================
   DELETE BUDGET
======================================== */

router.delete(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const budgetId =
        String(
          req.params.id,
        )


      const budget =
        await prisma.budget.findFirst({
          where: {
            id:
              budgetId,

            userId:
              req.user!.id,
          },
        })


      if (!budget) {
        return res.status(404).json({
          error:
            'Budget not found',
        })
      }


      await prisma.budget.delete({
        where: {
          id:
            budget.id,
        },
      })


      return res.status(200).json({
        message:
          'Budget deleted successfully',
      })

    } catch (error) {
      console.error(
        'Failed to delete budget:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to delete budget',
      })
    }
  },
)


export default router