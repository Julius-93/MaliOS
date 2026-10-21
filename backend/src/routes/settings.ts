import { Router } from 'express'
import { z } from 'zod'

import prisma from '../config/prisma'

import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

const router = Router()


/* ========================================
   VALIDATION
======================================== */

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1)
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1)
    .optional(),
})


const updatePreferencesSchema = z.object({
  theme: z
    .enum([
      'SYSTEM',
      'LIGHT',
      'DARK',
    ])
    .optional(),

  compactMode:
    z.boolean().optional(),

  reducedMotion:
    z.boolean().optional(),

  defaultCurrency: z
    .string()
    .trim()
    .length(3)
    .optional(),

  defaultAccountId: z
    .string()
    .uuid()
    .nullable()
    .optional(),

  dateFormat: z
    .enum([
      'DD_MM_YYYY',
      'MM_DD_YYYY',
      'YYYY_MM_DD',
    ])
    .optional(),

  hideBalances:
    z.boolean().optional(),

  budgetNotifications:
    z.boolean().optional(),

  goalNotifications:
    z.boolean().optional(),

  investmentNotifications:
    z.boolean().optional(),

  largeTransactionAlerts:
    z.boolean().optional(),

  lowBalanceAlerts:
    z.boolean().optional(),

  budgetAlertThreshold: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional(),

  largeTransactionThreshold: z
    .number()
    .nonnegative()
    .optional(),

  lowBalanceThreshold: z
    .number()
    .nonnegative()
    .optional(),

  autoLogoutMinutes: z
    .number()
    .min(0.5)
    .max(1440)
    .optional(),
})


/* ========================================
   HELPERS
======================================== */

function serializeSettings(
  settings: any,
) {
  return {
    ...settings,

    largeTransactionThreshold:
      Number(
        settings
          .largeTransactionThreshold,
      ),

    lowBalanceThreshold:
      Number(
        settings
          .lowBalanceThreshold,
      ),
  }
}


async function ensureSettings(
  userId: string,
) {
  return prisma.userSettings.upsert({
    where: {
      userId,
    },

    update: {},

    create: {
      userId,
    },
  })
}


/* ========================================
   GET SETTINGS
======================================== */

router.get(
  '/',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        })

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        })
      }

      const settings =
        await ensureSettings(userId)

      return res.status(200).json({
        data: {
          user,

          settings:
            serializeSettings(
              settings,
            ),
        },
      })
    } catch (error) {
      console.error(
        'Failed to load settings:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to load account settings',
      })
    }
  },
)


/* ========================================
   UPDATE PROFILE
======================================== */

router.patch(
  '/profile',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      const parsed =
        updateProfileSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error:
            'Invalid profile information',

          details:
            parsed.error.flatten(),
        })
      }

      const user =
        await prisma.user.update({
          where: {
            id: userId,
          },

          data: parsed.data,

          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        })

      return res.status(200).json({
        data: {
          user,
        },
      })
    } catch (error) {
      console.error(
        'Failed to update profile:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to update profile',
      })
    }
  },
)


/* ========================================
   UPDATE USER PREFERENCES
======================================== */

router.patch(
  '/preferences',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      const parsed =
        updatePreferencesSchema.safeParse(
          req.body,
        )

      if (!parsed.success) {
        return res.status(400).json({
          error:
            'Invalid settings',

          details:
            parsed.error.flatten(),
        })
      }

      const data = parsed.data

      /*
       * If a default account is supplied,
       * make sure the account actually
       * belongs to this user.
       */
      if (data.defaultAccountId) {
        const account =
          await prisma
            .financialAccount
            .findFirst({
              where: {
                id:
                  data.defaultAccountId,

                userId,
              },
            })

        if (!account) {
          return res.status(400).json({
            error:
              'Default account does not belong to this user',
          })
        }
      }

      await ensureSettings(userId)

      const settings =
        await prisma.userSettings.update({
          where: {
            userId,
          },

          data: {
            ...data,

            ...(data.defaultCurrency !==
              undefined && {
              defaultCurrency:
                data.defaultCurrency
                  .toUpperCase(),
            }),
          },
        })

      return res.status(200).json({
        data: {
          settings:
            serializeSettings(
              settings,
            ),
        },
      })
    } catch (error) {
      console.error(
        'Failed to update settings:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to update settings',
      })
    }
  },
)


/* ========================================
   EXPORT ALL MALIOS DATA AS JSON
======================================== */

router.get(
  '/export/json',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      /*
       * Important:
       * passwordHash and session token
       * hashes are deliberately excluded.
       */
      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },

          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,

            accounts: {
              include: {
                transactions: true,
              },
            },

            budgets: true,

            investmentAccounts: {
              include: {
                holdings: true,
              },
            },

            opportunities: true,
            goals: true,
            settings: true,
          },
        })

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        })
      }

      return res.status(200).json({
        exportedAt:
          new Date().toISOString(),

        data: user,
      })
    } catch (error) {
      console.error(
        'Failed to export MaliOS data:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to export MaliOS data',
      })
    }
  },
)


/* ========================================
   EXPORT TRANSACTIONS AS CSV
======================================== */

router.get(
  '/export/transactions.csv',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      const transactions =
        await prisma.transaction.findMany({
          where: {
            account: {
              userId,
            },
          },

          include: {
            account: true,
          },

          orderBy: {
            occurredAt: 'desc',
          },
        })

      function escapeCsv(
        value: unknown,
      ) {
        const text =
          String(value ?? '')

        return `"${text.replaceAll(
          '"',
          '""',
        )}"`
      }

      const header = [
        'Date',
        'Account',
        'Type',
        'Category',
        'Merchant',
        'Amount',
        'Currency',
        'Note',
      ]

      const rows = [
        header
          .map(escapeCsv)
          .join(','),

        ...transactions.map(
          (transaction) =>
            [
              transaction
                .occurredAt
                .toISOString(),

              transaction
                .account.name,

              transaction.type,

              transaction.category,

              transaction.merchant,

              Number(
                transaction.amount,
              ),

              transaction.currency,

              transaction.note,
            ]
              .map(escapeCsv)
              .join(','),
        ),
      ]

      /*
       * UTF-8 BOM helps Excel correctly
       * recognise the CSV encoding.
       */
      const csv =
        '\uFEFF' +
        rows.join('\n')

      res.setHeader(
        'Content-Type',
        'text/csv; charset=utf-8',
      )

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="malios-transactions.csv"',
      )

      return res
        .status(200)
        .send(csv)
    } catch (error) {
      console.error(
        'Failed to export transactions:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to export transactions',
      })
    }
  },
)


/* ========================================
   SIGN OUT ALL SESSIONS
======================================== */

router.delete(
  '/sessions',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      await prisma.session.deleteMany({
        where: {
          userId,
        },
      })

      return res.status(200).json({
        data: {
          message:
            'All sessions signed out successfully',
        },
      })
    } catch (error) {
      console.error(
        'Failed to clear sessions:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to sign out sessions',
      })
    }
  },
)


/* ========================================
   DELETE ACCOUNT
======================================== */

router.delete(
  '/account',
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const userId = req.user!.id

      if (
        req.body.confirmation !==
        'DELETE'
      ) {
        return res.status(400).json({
          error:
            'Type DELETE to confirm account deletion',
        })
      }

      /*
       * Related records use cascading
       * deletion in Prisma/PostgreSQL.
       */
      await prisma.user.delete({
        where: {
          id: userId,
        },
      })

      return res.status(200).json({
        data: {
          message:
            'Account deleted successfully',
        },
      })
    } catch (error) {
      console.error(
        'Failed to delete account:',
        error,
      )

      return res.status(500).json({
        error:
          'Unable to delete account',
      })
    }
  },
)


export default router