import { Router } from 'express'
import { z } from 'zod'

import prisma from '../config/prisma'
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()

const assetTypes = [
  'STOCK',
  'BOND',
  'ETF',
  'MUTUAL_FUND',
  'MONEY_MARKET',
  'REAL_ESTATE',
  'CRYPTO',
  'OTHER',
] as const

const riskLevels = [
  'LOW',
  'MEDIUM',
  'HIGH',
] as const

const opportunityStatuses = [
  'WATCHING',
  'INTERESTED',
  'PASSED',
] as const

const createOpportunitySchema = z.object({
  name: z.string().trim().min(1),

  provider: z
    .string()
    .trim()
    .optional()
    .nullable(),

  assetType: z.enum(assetTypes),

  currency: z
    .string()
    .trim()
    .length(3)
    .default('KES'),

  minimumInvestment: z
    .number()
    .nonnegative(),

  expectedReturn: z
    .number()
    .optional()
    .nullable(),

  riskLevel: z.enum(riskLevels),

  status: z
    .enum(opportunityStatuses)
    .default('WATCHING'),

  notes: z
    .string()
    .trim()
    .optional()
    .nullable(),
})

const updateOpportunitySchema =
  createOpportunitySchema.partial()

function serializeOpportunity(
  opportunity: any,
) {
  return {
    ...opportunity,

    minimumInvestment:
      Number(
        opportunity.minimumInvestment,
      ),

    expectedReturn:
      opportunity.expectedReturn === null
        ? null
        : Number(
            opportunity.expectedReturn,
          ),
  }
}

/*
GET /api/opportunities

Return all opportunities belonging
to the authenticated user.
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

      const opportunities =
        await prisma.investmentOpportunity.findMany(
          {
            where: {
              userId,
            },

            orderBy: {
              createdAt: 'desc',
            },
          },
        )

      return res.status(200).json({
        data: opportunities.map(
          serializeOpportunity,
        ),
      })
    } catch (error) {
      console.error(
        'Failed to load opportunities:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to load investment opportunities',
      })
    }
  },
)

/*
GET /api/opportunities/:id
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

      const opportunity =
        await prisma.investmentOpportunity.findFirst(
          {
            where: {
              id,
              userId,
            },
          },
        )

      if (!opportunity) {
        return res.status(404).json({
          error:
            'Investment opportunity not found',
        })
      }

      return res.status(200).json({
        data:
          serializeOpportunity(
            opportunity,
          ),
      })
    } catch (error) {
      console.error(
        'Failed to load opportunity:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to load investment opportunity',
      })
    }
  },
)

/*
POST /api/opportunities
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
        createOpportunitySchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid opportunity data',
          details:
            parsed.error.flatten(),
        })
      }

      const opportunity =
        await prisma.investmentOpportunity.create(
          {
            data: {
              userId,

              name: parsed.data.name,

              provider:
                parsed.data.provider ??
                null,

              assetType:
                parsed.data.assetType,

              currency:
                parsed.data.currency.toUpperCase(),

              minimumInvestment:
                parsed.data
                  .minimumInvestment,

              expectedReturn:
                parsed.data
                  .expectedReturn ??
                null,

              riskLevel:
                parsed.data.riskLevel,

              status:
                parsed.data.status,

              notes:
                parsed.data.notes ??
                null,
            },
          },
        )

      return res.status(201).json({
        data:
          serializeOpportunity(
            opportunity,
          ),
      })
    } catch (error) {
      console.error(
        'Failed to create opportunity:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to create investment opportunity',
      })
    }
  },
)

/*
PATCH /api/opportunities/:id
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
        await prisma.investmentOpportunity.findFirst(
          {
            where: {
              id,
              userId,
            },
          },
        )

      if (!existing) {
        return res.status(404).json({
          error:
            'Investment opportunity not found',
        })
      }

      const parsed =
        updateOpportunitySchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid opportunity data',
          details:
            parsed.error.flatten(),
        })
      }

      const data = parsed.data

      const updated =
        await prisma.investmentOpportunity.update(
          {
            where: {
              id,
            },

            data: {
              ...(data.name !==
                undefined && {
                name: data.name,
              }),

              ...(data.provider !==
                undefined && {
                provider:
                  data.provider,
              }),

              ...(data.assetType !==
                undefined && {
                assetType:
                  data.assetType,
              }),

              ...(data.currency !==
                undefined && {
                currency:
                  data.currency.toUpperCase(),
              }),

              ...(data.minimumInvestment !==
                undefined && {
                minimumInvestment:
                  data.minimumInvestment,
              }),

              ...(data.expectedReturn !==
                undefined && {
                expectedReturn:
                  data.expectedReturn,
              }),

              ...(data.riskLevel !==
                undefined && {
                riskLevel:
                  data.riskLevel,
              }),

              ...(data.status !==
                undefined && {
                status:
                  data.status,
              }),

              ...(data.notes !==
                undefined && {
                notes: data.notes,
              }),
            },
          },
        )

      return res.status(200).json({
        data:
          serializeOpportunity(
            updated,
          ),
      })
    } catch (error) {
      console.error(
        'Failed to update opportunity:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to update investment opportunity',
      })
    }
  },
)

/*
DELETE /api/opportunities/:id
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
        await prisma.investmentOpportunity.findFirst(
          {
            where: {
              id,
              userId,
            },
          },
        )

      if (!existing) {
        return res.status(404).json({
          error:
            'Investment opportunity not found',
        })
      }

      await prisma.investmentOpportunity.delete(
        {
          where: {
            id,
          },
        },
      )

      return res.status(200).json({
        data: {
          message:
            'Investment opportunity deleted successfully',
        },
      })
    } catch (error) {
      console.error(
        'Failed to delete opportunity:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to delete investment opportunity',
      })
    }
  },
)

export default router