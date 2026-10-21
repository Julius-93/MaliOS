import prisma from '../config/prisma'


type NotificationTypeValue =
  | 'BUDGET'
  | 'LOW_BALANCE'
  | 'LARGE_TRANSACTION'
  | 'GOAL'
  | 'INVESTMENT'
  | 'SYSTEM'


type NotificationSeverityValue =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'DANGER'


interface NotificationInput {
  type: NotificationTypeValue
  severity: NotificationSeverityValue
  title: string
  message: string
  sourceId?: string
  dedupeKey: string
}


/*
 * Create a notification if it does not exist.
 *
 * If the same notification condition is detected
 * again, MaliOS updates the existing record rather
 * than creating duplicates.
 */
async function upsertNotification(
  userId: string,
  notification: NotificationInput,
) {
  return prisma.notification.upsert({
    where: {
      userId_dedupeKey: {
        userId,
        dedupeKey:
          notification.dedupeKey,
      },
    },

    update: {
      type:
        notification.type,

      severity:
        notification.severity,

      title:
        notification.title,

      message:
        notification.message,

      sourceId:
        notification.sourceId,
    },

    create: {
      userId,

      type:
        notification.type,

      severity:
        notification.severity,

      title:
        notification.title,

      message:
        notification.message,

      sourceId:
        notification.sourceId,

      dedupeKey:
        notification.dedupeKey,
    },
  })
}


/*
 * Check the user's financial information and
 * create notifications for conditions that match
 * their notification preferences.
 */
export async function syncFinancialNotifications(
  userId: string,
) {

  const settings =
    await prisma.userSettings.findUnique({
      where: {
        userId,
      },
    })


  /*
   * A user without settings cannot currently
   * generate configurable alerts.
   */
  if (!settings) {
    return
  }


  /* ========================================
     LOW BALANCE ALERTS
  ======================================== */

  if (
    settings.lowBalanceAlerts
  ) {

    const threshold =
      Number(
        settings.lowBalanceThreshold,
      )


    const accounts =
      await prisma.financialAccount.findMany({
        where: {
          userId,

          balance: {
            lte:
              settings.lowBalanceThreshold,
          },
        },

        select: {
          id: true,
          name: true,
          balance: true,
          currency: true,
        },
      })


    for (const account of accounts) {

      const balance =
        Number(account.balance)


      await upsertNotification(
        userId,
        {
          type:
            'LOW_BALANCE',

          severity:
            balance <= 0
              ? 'DANGER'
              : 'WARNING',

          title:
            'Low account balance',

          /*
           * We intentionally do not expose the
           * actual balance here so Privacy Mode
           * cannot be bypassed through alerts.
           */
          message:
            `${account.name} is below your ` +
            `configured low balance threshold.`,

          sourceId:
            account.id,

          dedupeKey:
            `low-balance:` +
            `${account.id}:` +
            `${threshold}`,
        },
      )
    }
  }


  /* ========================================
   LARGE TRANSACTION ALERTS
======================================== */

if (
  settings.largeTransactionAlerts
) {

  const transactions =
    await prisma.transaction.findMany({
      where: {
        account: {
          is: {
            userId,
          },
        },

        amount: {
          gte:
            settings
              .largeTransactionThreshold,
        },
      },

      orderBy: {
        occurredAt:
          'desc',
      },

      take: 50,

      select: {
        id: true,
        type: true,
        category: true,
        merchant: true,
      },
    })


  for (
    const transaction
    of transactions
  ) {

    let severity:
      | 'SUCCESS'
      | 'WARNING'
      | 'INFO'

    let title: string
    let message: string


    /*
     * Income is positive financial activity.
     */
    if (
      transaction.type ===
      'INCOME'
    ) {

      severity =
        'SUCCESS'

      title =
        'Large income received'

      message =
        'A large income transaction ' +
        'exceeded your configured ' +
        'transaction threshold.'

    }


    /*
     * Expenses deserve more attention
     * because they reduce available funds.
     */
    else if (
      transaction.type ===
      'EXPENSE'
    ) {

      severity =
        'WARNING'

      title =
        'Large expense detected'

      message =
        'A large expense transaction ' +
        'exceeded your configured ' +
        'transaction threshold.'

    }


    /*
     * Transfers are informational because
     * money may simply be moving between
     * accounts.
     */
    else {

      severity =
        'INFO'

      title =
        'Large transfer detected'

      message =
        'A large transfer exceeded your ' +
        'configured transaction threshold.'

    }


    /*
     * Add merchant information when
     * available without exposing the
     * transaction amount.
     */
    if (
      transaction.merchant
    ) {

      message +=
        ` Merchant: ` +
        `${transaction.merchant}.`

    }


    await upsertNotification(
      userId,
      {
        type:
          'LARGE_TRANSACTION',

        severity,

        title,

        message,

        sourceId:
          transaction.id,

        dedupeKey:
          `large-transaction:` +
          `${transaction.id}`,
      },
    )
  }
}


/* ========================================
   BUDGET ALERTS
======================================== */

if (
  settings.budgetNotifications
) {

  const now =
    new Date()


  const budgets =
    await prisma.budget.findMany({
      where: {
        userId,

        startDate: {
          lte: now,
        },

        endDate: {
          gte: now,
        },
      },
    })


  for (
    const budget
    of budgets
  ) {

    /*
     * Each budget now has an explicit
     * transaction category.
     *
     * Only expenses belonging to that
     * category, currency and budget
     * date range are counted.
     */
    const spent =
      await prisma.transaction.aggregate({
        where: {
          account: {
            is: {
              userId,
            },
          },

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

            /*
             * The budget is active, so only
             * count spending that has happened
             * up to the current time.
             */
            lte:
              now,
          },
        },

        _sum: {
          amount: true,
        },
      })


    const spentAmount =
      Number(
        spent._sum.amount ??
          0,
      )


    const budgetAmount =
      Number(
        budget.amount,
      )


    /*
     * Ignore invalid zero-value budgets.
     */
    if (
      budgetAmount <= 0
    ) {
      continue
    }


    const percentage =
      (
        spentAmount /
        budgetAmount
      ) * 100


    /*
     * Only generate an alert once the
     * configured warning threshold has
     * been reached.
     */
    if (
      percentage >=
      settings.budgetAlertThreshold
    ) {

      const overBudget =
        percentage >=
        100


      await upsertNotification(
        userId,
        {
          type:
            'BUDGET',

          severity:
            overBudget
              ? 'DANGER'
              : 'WARNING',

          title:
            overBudget
              ? 'Budget limit reached'
              : 'Budget warning',

          /*
           * Do not expose monetary values
           * in the notification message.
           *
           * This keeps notifications safe
           * when Privacy Mode is enabled.
           */
          message:
            `${budget.category} budget is at ` +
            `${percentage.toFixed(1)}% ` +
            `of its spending limit.`,

          sourceId:
            budget.id,

          /*
           * The budget ID keeps notifications
           * unique per budget.
           *
           * Including the configured threshold
           * allows a new alert if the user later
           * changes their warning threshold.
           */
          dedupeKey:
            `budget:` +
            `${budget.id}:` +
            `${settings.budgetAlertThreshold}`,
        },
      )
    }
  }
}


  /* ========================================
     GOAL NOTIFICATIONS
  ======================================== */

  if (
    settings.goalNotifications
  ) {

    const goals =
      await prisma.goal.findMany({
        where: {
          userId,

          status: {
            in: [
              'ACTIVE',
              'COMPLETED',
            ],
          },
        },
      })


    for (const goal of goals) {

      const target =
        Number(
          goal.targetAmount,
        )


      const current =
        Number(
          goal.currentAmount,
        )


      if (
        target > 0 &&
        current >= target
      ) {

        await upsertNotification(
          userId,
          {
            type:
              'GOAL',

            severity:
              'SUCCESS',

            title:
              'Goal achieved',

            message:
              `${goal.name} has reached ` +
              `its target.`,

            sourceId:
              goal.id,

            dedupeKey:
              `goal-complete:` +
              `${goal.id}`,
          },
        )
      }
    }
  }


  /* ========================================
     INVESTMENT NOTIFICATIONS
  ======================================== */

  if (
    settings.investmentNotifications
  ) {

    const holdings =
      await prisma
        .investmentHolding
        .findMany({
          where: {
            investmentAccount: {
              is: {
                userId,
              },
            },
          },

          include: {
            investmentAccount: {
              select: {
                name: true,
              },
            },
          },
        })


    for (
      const holding
      of holdings
    ) {

      const averageCost =
        Number(
          holding.averageCost,
        )


      const currentPrice =
        Number(
          holding.currentPrice,
        )


      if (
        averageCost <= 0
      ) {
        continue
      }


      const returnPercentage =
        (
          (
            currentPrice -
            averageCost
          ) /
          averageCost
        ) * 100


      /*
       * For now, investment notifications use
       * +/-10% as the trigger.
       *
       * We can later make this threshold
       * configurable in Settings.
       */
      if (
        returnPercentage >= 10
      ) {

        await upsertNotification(
          userId,
          {
            type:
              'INVESTMENT',

            severity:
              'SUCCESS',

            title:
              'Investment gain alert',

            message:
              `${holding.name} in ` +
              `${holding.investmentAccount.name} ` +
              `is up ` +
              `${returnPercentage.toFixed(1)}% ` +
              `from average cost.`,

            sourceId:
              holding.id,

            dedupeKey:
              `investment-gain:` +
              `${holding.id}`,
          },
        )
      }


      if (
        returnPercentage <= -10
      ) {

        await upsertNotification(
          userId,
          {
            type:
              'INVESTMENT',

            severity:
              'DANGER',

            title:
              'Investment loss alert',

            message:
              `${holding.name} in ` +
              `${holding.investmentAccount.name} ` +
              `is down ` +
              `${Math.abs(
                returnPercentage,
              ).toFixed(1)}% ` +
              `from average cost.`,

            sourceId:
              holding.id,

            dedupeKey:
              `investment-loss:` +
              `${holding.id}`,
          },
        )
      }
    }
  }
}