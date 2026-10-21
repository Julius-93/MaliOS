import {
  Router,
  type Response,
} from 'express'

import prisma from '../config/prisma'

import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'

import {
  syncFinancialNotifications,
} from '../services/notificationService'


const router = Router()


/*
 * Every notification endpoint requires
 * an authenticated MaliOS user.
 */
router.use(requireAuth)


/* ========================================
   GET NOTIFICATIONS
======================================== */

router.get(
  '/',
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const userId =
        req.user!.id


      /*
       * Synchronize current financial
       * conditions before loading alerts.
       *
       * Dismissed notifications remain in
       * the database, so their dedupe keys
       * prevent them from being recreated.
       */
      await syncFinancialNotifications(
        userId,
      )


      /* ====================================
         LIMIT
      ==================================== */

      const rawLimit =
        Number(
          req.query.limit ?? 50,
        )


      const limit =
        Number.isFinite(
          rawLimit,
        )
          ? Math.min(
              Math.max(
                Math.trunc(
                  rawLimit,
                ),
                1,
              ),
              100,
            )
          : 50


      /* ====================================
         FILTERS
      ==================================== */

      const status =
        String(
          req.query.status ??
            'ALL',
        ).toUpperCase()


      const type =
        String(
          req.query.type ??
            'ALL',
        ).toUpperCase()


      /*
       * Dismissed notifications must never
       * appear in the normal notification
       * feed.
       */
      const where: any = {
        userId,

        dismissedAt: null,
      }


      /*
       * Filter by read status.
       */
      if (
        status === 'UNREAD'
      ) {
        where.readAt = null
      }


      if (
        status === 'READ'
      ) {
        where.readAt = {
          not: null,
        }
      }


      /*
       * Supported notification types.
       */
      const allowedTypes = [
        'BUDGET',
        'LOW_BALANCE',
        'LARGE_TRANSACTION',
        'GOAL',
        'INVESTMENT',
        'SYSTEM',
      ]


      if (
        type !== 'ALL' &&
        allowedTypes.includes(
          type,
        )
      ) {
        where.type =
          type
      }


      /* ====================================
         LOAD RESULTS
      ==================================== */

      const [
        notifications,
        unreadCount,
        totalCount,
      ] = await Promise.all([

        prisma.notification.findMany({
          where,

          orderBy: {
            createdAt:
              'desc',
          },

          take:
            limit,
        }),


        /*
         * Only count visible,
         * non-dismissed unread alerts.
         */
        prisma.notification.count({
          where: {
            userId,

            dismissedAt:
              null,

            readAt:
              null,
          },
        }),


        /*
         * Total notification count also
         * excludes dismissed notifications.
         */
        prisma.notification.count({
          where: {
            userId,

            dismissedAt:
              null,
          },
        }),

      ])


      return res.json({
        data: {
          notifications,

          unreadCount,

          totalCount,
        },
      })

    } catch (error) {
      console.error(
        'Unable to load notifications:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to load notifications',
      })
    }
  },
)


/* ========================================
   MARK ALL AS READ
======================================== */

router.patch(
  '/read-all',
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const userId =
        req.user!.id


      /*
       * Only mark currently visible,
       * non-dismissed alerts as read.
       */
      const result =
        await prisma.notification.updateMany({
          where: {
            userId,

            dismissedAt:
              null,

            readAt:
              null,
          },

          data: {
            readAt:
              new Date(),
          },
        })


      return res.json({
        data: {
          updatedCount:
            result.count,
        },
      })

    } catch (error) {
      console.error(
        'Unable to mark notifications read:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to mark notifications as read',
      })
    }
  },
)


/* ========================================
   CLEAR ALL READ NOTIFICATIONS
======================================== */

router.delete(
  '/read',
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const userId =
        req.user!.id


      /*
       * IMPORTANT:
       *
       * Do not physically delete these rows.
       *
       * Keeping them in the database means
       * the unique dedupeKey remains present,
       * preventing the notification engine
       * from recreating the same alert.
       */
      const result =
        await prisma.notification.updateMany({
          where: {
            userId,

            dismissedAt:
              null,

            readAt: {
              not: null,
            },
          },

          data: {
            dismissedAt:
              new Date(),
          },
        })


      return res.json({
        data: {
          deletedCount:
            result.count,
        },
      })

    } catch (error) {
      console.error(
        'Unable to clear read notifications:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to clear read notifications',
      })
    }
  },
)


/* ========================================
   MARK ONE AS READ
======================================== */

router.patch(
  '/:notificationId/read',
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const userId =
        req.user!.id


      const notification =
        await prisma.notification.findFirst({
          where: {
            id:
              req.params.notificationId,

            userId,

            dismissedAt:
              null,
          },
        })


      if (
        !notification
      ) {
        return res.status(404).json({
          error:
            'Notification not found',
        })
      }


      /*
       * Preserve the existing read timestamp
       * if it has already been read.
       */
      const updated =
        await prisma.notification.update({
          where: {
            id:
              notification.id,
          },

          data: {
            readAt:
              notification.readAt ??
              new Date(),
          },
        })


      return res.json({
        data:
          updated,
      })

    } catch (error) {
      console.error(
        'Unable to update notification:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to update notification',
      })
    }
  },
)


/* ========================================
   DISMISS ONE NOTIFICATION
======================================== */

router.delete(
  '/:notificationId',
  async (
    req: AuthenticatedRequest,
    res: Response,
  ) => {
    try {
      const userId =
        req.user!.id


      const notification =
        await prisma.notification.findFirst({
          where: {
            id:
              req.params.notificationId,

            userId,

            dismissedAt:
              null,
          },
        })


      if (
        !notification
      ) {
        return res.status(404).json({
          error:
            'Notification not found',
        })
      }


      /*
       * Soft-dismiss instead of deleting.
       *
       * This preserves the dedupeKey and
       * prevents the same financial event
       * from immediately recreating itself.
       */
      await prisma.notification.update({
        where: {
          id:
            notification.id,
        },

        data: {
          dismissedAt:
            new Date(),
        },
      })


      return res.json({
        data: {
          deleted:
            true,
        },
      })

    } catch (error) {
      console.error(
        'Unable to dismiss notification:',
        error,
      )


      return res.status(500).json({
        error:
          'Unable to delete notification',
      })
    }
  },
)


export default router