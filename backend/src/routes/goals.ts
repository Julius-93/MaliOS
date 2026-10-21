import { Router } from 'express'
import { z } from 'zod'

import prisma from '../config/prisma'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()


const goalStatuses = [
  'ACTIVE',
  'COMPLETED',
  'PAUSED',
] as const


const createGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1),

  targetAmount: z
    .number()
    .positive(),

  currentAmount: z
    .number()
    .nonnegative()
    .default(0),

  currency: z
    .string()
    .trim()
    .length(3)
    .default('KES'),

  targetDate: z
    .string()
    .datetime()
    .optional()
    .nullable(),

  status: z
    .enum(goalStatuses)
    .default('ACTIVE'),

  notes: z
    .string()
    .trim()
    .optional()
    .nullable(),
})


const updateGoalSchema =
  createGoalSchema.partial()


function serializeGoal(goal: any) {
  const targetAmount =
    Number(goal.targetAmount)

  const currentAmount =
    Number(goal.currentAmount)

  const remainingAmount =
    Math.max(
      targetAmount - currentAmount,
      0,
    )

  const progressPercentage =
    targetAmount > 0
      ? Math.min(
          (currentAmount /
            targetAmount) *
            100,
          100,
        )
      : 0

  return {
    ...goal,

    targetAmount,
    currentAmount,

    remainingAmount,

    progressPercentage,
  }
}


/*
GET /api/goals

Return all goals belonging to
the authenticated user.
*/
router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      const goals =
        await prisma.goal.findMany({
          where: {
            userId,
          },

          orderBy: {
            createdAt: 'desc',
          },
        })

      return res.status(200).json({
        data: goals.map(
          serializeGoal,
        ),
      })
    } catch (error) {
      console.error(
        'Failed to load goals:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to load financial goals',
      })
    }
  },
)


/*
GET /api/goals/:id
*/
router.get(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const goal =
        await prisma.goal.findFirst({
          where: {
            id,
            userId,
          },
        })

      if (!goal) {
        return res.status(404).json({
          error:
            'Financial goal not found',
        })
      }

      return res.status(200).json({
        data: serializeGoal(goal),
      })
    } catch (error) {
      console.error(
        'Failed to load goal:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to load financial goal',
      })
    }
  },
)


/*
POST /api/goals
*/
router.post(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      const parsed =
        createGoalSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid goal data',

          details:
            parsed.error.flatten(),
        })
      }

      const data = parsed.data

      const goal =
        await prisma.goal.create({
          data: {
            userId,

            name: data.name,

            targetAmount:
              data.targetAmount,

            currentAmount:
              data.currentAmount,

            currency:
              data.currency.toUpperCase(),

            targetDate:
              data.targetDate
                ? new Date(
                    data.targetDate,
                  )
                : null,

            status:
              data.status,

            notes:
              data.notes ?? null,
          },
        })

      return res.status(201).json({
        data: serializeGoal(goal),
      })
    } catch (error) {
      console.error(
        'Failed to create goal:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to create financial goal',
      })
    }
  },
)


/*
PATCH /api/goals/:id

Edit goal details or update
saved/current amount.
*/
router.patch(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const existing =
        await prisma.goal.findFirst({
          where: {
            id,
            userId,
          },
        })

      if (!existing) {
        return res.status(404).json({
          error:
            'Financial goal not found',
        })
      }

      const parsed =
        updateGoalSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid goal data',

          details:
            parsed.error.flatten(),
        })
      }

      const data = parsed.data

      const updated =
        await prisma.goal.update({
          where: {
            id,
          },

          data: {
            ...(data.name !==
              undefined && {
              name: data.name,
            }),

            ...(data.targetAmount !==
              undefined && {
              targetAmount:
                data.targetAmount,
            }),

            ...(data.currentAmount !==
              undefined && {
              currentAmount:
                data.currentAmount,
            }),

            ...(data.currency !==
              undefined && {
              currency:
                data.currency.toUpperCase(),
            }),

            ...(data.targetDate !==
              undefined && {
              targetDate:
                data.targetDate
                  ? new Date(
                      data.targetDate,
                    )
                  : null,
            }),

            ...(data.status !==
              undefined && {
              status:
                data.status,
            }),

            ...(data.notes !==
              undefined && {
              notes:
                data.notes,
            }),
          },
        })

      return res.status(200).json({
        data:
          serializeGoal(updated),
      })
    } catch (error) {
      console.error(
        'Failed to update goal:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to update financial goal',
      })
    }
  },
)


/*
DELETE /api/goals/:id
*/
router.delete(
  '/:id',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id
      const { id } = req.params

      const existing =
        await prisma.goal.findFirst({
          where: {
            id,
            userId,
          },
        })

      if (!existing) {
        return res.status(404).json({
          error:
            'Financial goal not found',
        })
      }

      await prisma.goal.delete({
        where: {
          id,
        },
      })

      return res.status(200).json({
        data: {
          message:
            'Financial goal deleted successfully',
        },
      })
    } catch (error) {
      console.error(
        'Failed to delete goal:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to delete financial goal',
      })
    }
  },
)

export default router