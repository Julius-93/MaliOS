import { Router } from 'express'

import prisma from '../config/prisma'

import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth'


const router = Router()


/* ========================================
   HELPER TYPES
======================================== */

type CashFlowTotals = {
  income: number
  expenses: number
  net: number
  transactionCount: number
  incomeTransactionCount: number
  expenseTransactionCount: number
  transferTransactionCount: number
}


type CategorySummary = {
  category: string
  amount: number
  percentage: number
}


/* ========================================
   NUMBER HELPERS
======================================== */

/*
 * Keep monetary and percentage values
 * consistent throughout the API.
 */
function round(
  value: number,
  decimals = 2,
) {
  const factor =
    10 ** decimals

  return (
    Math.round(
      (value + Number.EPSILON) *
        factor,
    ) / factor
  )
}


/*
 * Calculate percentage change safely.
 *
 * If the previous value is zero:
 *
 * - 0 -> 0 returns 0%
 * - 0 -> positive cannot be represented
 *   meaningfully as a percentage increase,
 *   so we return null.
 */
function percentageChange(
  current: number,
  previous: number,
) {
  if (
    previous === 0
  ) {
    return current === 0
      ? 0
      : null
  }

  return round(
    (
      (
        current -
        previous
      ) /
      Math.abs(
        previous,
      )
    ) * 100,
    1,
  )
}


/* ========================================
   DATE HELPERS
======================================== */

/*
 * Strictly parse YYYY-MM-DD values.
 *
 * JavaScript's normal Date parser can
 * silently roll invalid dates forward.
 *
 * For example:
 *
 * 2026-02-31
 *
 * could otherwise become a date in March.
 */
function parseDateOnly(
  value: string,
  endOfDay = false,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null
  }


  const [
    yearString,
    monthString,
    dayString,
  ] =
    value.split('-')


  const year =
    Number(
      yearString,
    )

  const month =
    Number(
      monthString,
    )

  const day =
    Number(
      dayString,
    )


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,

        endOfDay
          ? 23
          : 0,

        endOfDay
          ? 59
          : 0,

        endOfDay
          ? 59
          : 0,

        endOfDay
          ? 999
          : 0,
      ),
    )


  /*
   * Confirm the parsed date still contains
   * exactly the date supplied by the user.
   */
  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null
  }


  return date
}


function startOfMonthUtc(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1,
      0,
      0,
      0,
      0,
    ),
  )
}


function endOfMonthUtc(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ),
  )
}


function previousMonthStartUtc(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    ),
  )
}


function previousMonthEndUtc(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      0,
      23,
      59,
      59,
      999,
    ),
  )
}


/* ========================================
   TRANSACTION TOTALS
======================================== */

function calculateTotals(
  transactions: Array<{
    type: string
    amount: unknown
  }>,
): CashFlowTotals {

  let income = 0
  let expenses = 0

  let incomeTransactionCount =
    0

  let expenseTransactionCount =
    0

  let transferTransactionCount =
    0


  for (
    const transaction
    of transactions
  ) {

    const amount =
      Number(
        transaction.amount,
      )


    if (
      transaction.type ===
      'INCOME'
    ) {

      income +=
        amount

      incomeTransactionCount +=
        1
    }


    if (
      transaction.type ===
      'EXPENSE'
    ) {

      expenses +=
        amount

      expenseTransactionCount +=
        1
    }


    if (
      transaction.type ===
      'TRANSFER'
    ) {

      transferTransactionCount +=
        1
    }
  }


  return {
    income:
      round(
        income,
      ),

    expenses:
      round(
        expenses,
      ),

    net:
      round(
        income -
        expenses,
      ),

    transactionCount:
      transactions.length,

    incomeTransactionCount,

    expenseTransactionCount,

    transferTransactionCount,
  }
}


/* ========================================
   TOP CATEGORY
======================================== */

function getTopCategory(
  categoryTotals: Record<
    string,
    number
  >,

  overallTotal: number,
): CategorySummary | null {

  const entries =
    Object.entries(
      categoryTotals,
    )


  if (
    entries.length === 0
  ) {
    return null
  }


  entries.sort(
    (
      [, amountA],
      [, amountB],
    ) =>
      amountB -
      amountA,
  )


  const [
    category,
    amount,
  ] =
    entries[0]


  return {
    category,

    amount:
      round(
        amount,
      ),

    percentage:
      overallTotal > 0
        ? round(
            (
              amount /
              overallTotal
            ) * 100,
            1,
          )
        : 0,
  }
}


/* ========================================
   GET CASH FLOW
======================================== */

/*
 * Supported:
 *
 * GET /api/cash-flow
 *
 * GET /api/cash-flow
 *     ?startDate=2026-09-01
 *     &endDate=2026-09-30
 *
 *
 * Existing response fields are preserved:
 *
 * - totalIncome
 * - totalExpenses
 * - netCashFlow
 * - incomeByCategory
 * - expensesByCategory
 * - monthlyCashFlow
 * - transactionCount
 *
 *
 * New intelligence includes:
 *
 * - savings rate
 * - expense-to-income ratio
 * - cash-flow status
 * - transaction breakdown
 * - previous-period comparison
 * - monthly averages
 * - strongest cash-flow month
 * - highest-spending month
 * - top categories
 * - current-month projection
 * - period metadata
 */

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


      const now =
        new Date()


      /* ========================================
         READ DATE FILTERS
      ======================================== */

      const startDateQuery =
        typeof req.query.startDate ===
        'string'
          ? req.query.startDate
          : null


      const endDateQuery =
        typeof req.query.endDate ===
        'string'
          ? req.query.endDate
          : null


      /* ========================================
         PARSE DATE FILTERS
      ======================================== */

      const startDate =
        startDateQuery
          ? parseDateOnly(
              startDateQuery,
              false,
            )
          : null


      const endDate =
        endDateQuery
          ? parseDateOnly(
              endDateQuery,
              true,
            )
          : null


      /* ========================================
         VALIDATE DATE FILTERS
      ======================================== */

      if (
        startDateQuery &&
        !startDate
      ) {

        return res
          .status(400)
          .json({
            error:
              'Invalid start date',
          })
      }


      if (
        endDateQuery &&
        !endDate
      ) {

        return res
          .status(400)
          .json({
            error:
              'Invalid end date',
          })
      }


      if (
        startDate &&
        endDate &&
        endDate <
          startDate
      ) {

        return res
          .status(400)
          .json({
            error:
              'End date cannot be before start date',
          })
      }


      /* ========================================
         MAIN TRANSACTION QUERY
      ======================================== */

      /*
       * Only transactions belonging to
       * accounts owned by the authenticated
       * user are included.
       */
      const transactions =
        await prisma.transaction.findMany({
          where: {

            account: {
              is: {
                userId,
              },
            },

            ...(startDate ||
            endDate
              ? {
                  occurredAt: {

                    ...(startDate
                      ? {
                          gte:
                            startDate,
                        }
                      : {}),

                    ...(endDate
                      ? {
                          lte:
                            endDate,
                        }
                      : {}),
                  },
                }
              : {}),
          },

          orderBy: {
            occurredAt:
              'asc',
          },

          include: {
            account: {
              select: {
                id: true,
                name: true,
                currency: true,
              },
            },
          },
        })


      /* ========================================
         TOTALS
      ======================================== */

      let totalIncome =
        0

      let totalExpenses =
        0


      let incomeTransactionCount =
        0

      let expenseTransactionCount =
        0

      let transferTransactionCount =
        0


      /* ========================================
         CATEGORY BREAKDOWNS
      ======================================== */

      const incomeByCategory: Record<
        string,
        number
      > = {}


      const expensesByCategory: Record<
        string,
        number
      > = {}


      /* ========================================
         MONTHLY CASH FLOW
      ======================================== */

      const monthlyMap: Record<
        string,
        {
          income: number
          expenses: number
          transactionCount: number
        }
      > = {}


      /* ========================================
         CURRENCIES
      ======================================== */

      /*
       * MaliOS currently primarily operates
       * using KES.
       *
       * We still report which currencies are
       * present so the frontend can warn the
       * user in the future if multiple
       * currencies are being aggregated.
       */
      const currencySet =
        new Set<string>()


      /* ========================================
         PROCESS TRANSACTIONS
      ======================================== */

      for (
        const transaction
        of transactions
      ) {

        const amount =
          Number(
            transaction.amount,
          )


        const category =
          transaction.category
            ?.trim() ||
          'Other'


        const month =
          transaction.occurredAt
            .toISOString()
            .slice(
              0,
              7,
            )


        currencySet.add(
          transaction.currency,
        )


        if (
          !monthlyMap[
            month
          ]
        ) {

          monthlyMap[
            month
          ] = {
            income: 0,
            expenses: 0,
            transactionCount: 0,
          }
        }


        monthlyMap[
          month
        ].transactionCount +=
          1


        /* ------------------------
           INCOME
        ------------------------ */

        if (
          transaction.type ===
          'INCOME'
        ) {

          totalIncome +=
            amount


          incomeTransactionCount +=
            1


          incomeByCategory[
            category
          ] =
            (
              incomeByCategory[
                category
              ] ||
              0
            ) +
            amount


          monthlyMap[
            month
          ].income +=
            amount
        }


        /* ------------------------
           EXPENSE
        ------------------------ */

        if (
          transaction.type ===
          'EXPENSE'
        ) {

          totalExpenses +=
            amount


          expenseTransactionCount +=
            1


          expensesByCategory[
            category
          ] =
            (
              expensesByCategory[
                category
              ] ||
              0
            ) +
            amount


          monthlyMap[
            month
          ].expenses +=
            amount
        }


        /* ------------------------
           TRANSFER
        ------------------------ */

        /*
         * Transfers are deliberately not
         * included as income or expense.
         *
         * Moving money between the user's
         * own accounts does not change the
         * user's overall cash flow.
         */
        if (
          transaction.type ===
          'TRANSFER'
        ) {

          transferTransactionCount +=
            1
        }
      }


      /* ========================================
         MAIN TOTALS
      ======================================== */

      totalIncome =
        round(
          totalIncome,
        )


      totalExpenses =
        round(
          totalExpenses,
        )


      const netCashFlow =
        round(
          totalIncome -
          totalExpenses,
        )


      /* ========================================
         SAVINGS RATE
      ======================================== */

      /*
       * Savings rate here represents the
       * percentage of recorded income that
       * remains after recorded expenses.
       */
      const savingsRate =
        totalIncome > 0
          ? round(
              (
                netCashFlow /
                totalIncome
              ) * 100,
              1,
            )
          : null


      /* ========================================
         EXPENSE TO INCOME RATIO
      ======================================== */

      const expenseToIncomeRatio =
        totalIncome > 0
          ? round(
              (
                totalExpenses /
                totalIncome
              ) * 100,
              1,
            )
          : null


      /* ========================================
         CASH FLOW STATUS
      ======================================== */

      const cashFlowStatus =
        netCashFlow > 0
          ? 'POSITIVE'
          : netCashFlow < 0
            ? 'NEGATIVE'
            : 'NEUTRAL'


      /* ========================================
         MONTHLY CASH FLOW ARRAY
      ======================================== */

      const monthlyCashFlow =
        Object.entries(
          monthlyMap,
        )
          .map(
            (
              [
                month,
                values,
              ],
            ) => ({

              month,

              income:
                round(
                  values.income,
                ),

              expenses:
                round(
                  values.expenses,
                ),

              net:
                round(
                  values.income -
                    values.expenses,
                ),

              transactionCount:
                values.transactionCount,

              savingsRate:
                values.income >
                0
                  ? round(
                      (
                        (
                          values.income -
                          values.expenses
                        ) /
                        values.income
                      ) * 100,
                      1,
                    )
                  : null,
            }),
          )
          .sort(
            (
              monthA,
              monthB,
            ) =>
              monthA.month.localeCompare(
                monthB.month,
              ),
          )


      /* ========================================
         MONTHLY AVERAGES
      ======================================== */

      const monthsAnalyzed =
        monthlyCashFlow.length


      const averageMonthlyIncome =
        monthsAnalyzed > 0
          ? round(
              totalIncome /
                monthsAnalyzed,
            )
          : 0


      const averageMonthlyExpenses =
        monthsAnalyzed > 0
          ? round(
              totalExpenses /
                monthsAnalyzed,
            )
          : 0


      const averageMonthlyNetCashFlow =
        monthsAnalyzed > 0
          ? round(
              netCashFlow /
                monthsAnalyzed,
            )
          : 0


      /* ========================================
         TOP CATEGORIES
      ======================================== */

      const topIncomeCategory =
        getTopCategory(
          incomeByCategory,
          totalIncome,
        )


      const topExpenseCategory =
        getTopCategory(
          expensesByCategory,
          totalExpenses,
        )


      /* ========================================
         STRONGEST MONTH
      ======================================== */

      const strongestCashFlowMonth =
        monthlyCashFlow.length >
        0
          ? [
              ...monthlyCashFlow,
            ].sort(
              (
                monthA,
                monthB,
              ) =>
                monthB.net -
                monthA.net,
            )[0]
          : null


      /* ========================================
         HIGHEST SPENDING MONTH
      ======================================== */

      const highestSpendingMonth =
        monthlyCashFlow.length >
        0
          ? [
              ...monthlyCashFlow,
            ].sort(
              (
                monthA,
                monthB,
              ) =>
                monthB.expenses -
                monthA.expenses,
            )[0]
          : null


      /* ========================================
         PREVIOUS PERIOD COMPARISON
      ======================================== */

      /*
       * Comparison behaviour:
       *
       * 1. startDate + endDate supplied:
       *    compare against the immediately
       *    preceding period of equal length.
       *
       * 2. No date filters supplied:
       *    compare current calendar month
       *    against previous calendar month.
       *
       * 3. Only one date supplied:
       *    comparison is unavailable because
       *    there is no complete period length.
       */

      let comparison:
        | {
            mode: string

            currentPeriod: {
              startDate: string
              endDate: string
              income: number
              expenses: number
              netCashFlow: number
            }

            previousPeriod: {
              startDate: string
              endDate: string
              income: number
              expenses: number
              netCashFlow: number
            }

            incomeChangePercentage:
              number | null

            expenseChangePercentage:
              number | null

            netCashFlowChangePercentage:
              number | null
          }
        | null =
        null


      let comparisonCurrentStart:
        Date | null =
        null

      let comparisonCurrentEnd:
        Date | null =
        null

      let comparisonPreviousStart:
        Date | null =
        null

      let comparisonPreviousEnd:
        Date | null =
        null

      let comparisonMode:
        string | null =
        null


      /* ------------------------
         CUSTOM RANGE COMPARISON
      ------------------------ */

      if (
        startDate &&
        endDate
      ) {

        const durationMs =
          endDate.getTime() -
          startDate.getTime() +
          1


        comparisonCurrentStart =
          startDate

        comparisonCurrentEnd =
          endDate


        comparisonPreviousEnd =
          new Date(
            startDate.getTime() -
              1,
          )


        comparisonPreviousStart =
          new Date(
            comparisonPreviousEnd.getTime() -
              durationMs +
              1,
          )


        comparisonMode =
          'PREVIOUS_EQUAL_PERIOD'
      }


      /* ------------------------
         MONTH-OVER-MONTH
      ------------------------ */

      if (
        !startDate &&
        !endDate
      ) {

        comparisonCurrentStart =
          startOfMonthUtc(
            now,
          )

        comparisonCurrentEnd =
          now


        comparisonPreviousStart =
          previousMonthStartUtc(
            now,
          )

        comparisonPreviousEnd =
          previousMonthEndUtc(
            now,
          )


        comparisonMode =
          'CURRENT_MONTH_VS_PREVIOUS_MONTH'
      }


      if (
        comparisonCurrentStart &&
        comparisonCurrentEnd &&
        comparisonPreviousStart &&
        comparisonPreviousEnd &&
        comparisonMode
      ) {

        const [
          currentPeriodTransactions,
          previousPeriodTransactions,
        ] =
          await Promise.all([

            prisma.transaction.findMany({
              where: {
                account: {
                  is: {
                    userId,
                  },
                },

                occurredAt: {
                  gte:
                    comparisonCurrentStart,

                  lte:
                    comparisonCurrentEnd,
                },
              },

              select: {
                type: true,
                amount: true,
              },
            }),


            prisma.transaction.findMany({
              where: {
                account: {
                  is: {
                    userId,
                  },
                },

                occurredAt: {
                  gte:
                    comparisonPreviousStart,

                  lte:
                    comparisonPreviousEnd,
                },
              },

              select: {
                type: true,
                amount: true,
              },
            }),
          ])


        const currentTotals =
          calculateTotals(
            currentPeriodTransactions,
          )


        const previousTotals =
          calculateTotals(
            previousPeriodTransactions,
          )


        comparison = {

          mode:
            comparisonMode,


          currentPeriod: {

            startDate:
              comparisonCurrentStart
                .toISOString(),

            endDate:
              comparisonCurrentEnd
                .toISOString(),

            income:
              currentTotals.income,

            expenses:
              currentTotals.expenses,

            netCashFlow:
              currentTotals.net,
          },


          previousPeriod: {

            startDate:
              comparisonPreviousStart
                .toISOString(),

            endDate:
              comparisonPreviousEnd
                .toISOString(),

            income:
              previousTotals.income,

            expenses:
              previousTotals.expenses,

            netCashFlow:
              previousTotals.net,
          },


          incomeChangePercentage:
            percentageChange(
              currentTotals.income,
              previousTotals.income,
            ),


          expenseChangePercentage:
            percentageChange(
              currentTotals.expenses,
              previousTotals.expenses,
            ),


          netCashFlowChangePercentage:
            percentageChange(
              currentTotals.net,
              previousTotals.net,
            ),
        }
      }


      /* ========================================
         CURRENT MONTH PROJECTION
      ======================================== */

      /*
       * The projection is deliberately kept
       * simple and transparent.
       *
       * It uses the current month's average
       * daily recorded activity and extends
       * that run rate to month end.
       *
       * This is an estimate, not a guarantee.
       */

      const currentMonthStart =
        startOfMonthUtc(
          now,
        )


      const currentMonthEnd =
        endOfMonthUtc(
          now,
        )


      const currentMonthTransactions =
        await prisma.transaction.findMany({
          where: {
            account: {
              is: {
                userId,
              },
            },

            occurredAt: {
              gte:
                currentMonthStart,

              lte:
                now,
            },
          },

          select: {
            type: true,
            amount: true,
          },
        })


      const currentMonthTotals =
        calculateTotals(
          currentMonthTransactions,
        )


      const daysElapsed =
        now.getUTCDate()


      const daysInMonth =
        currentMonthEnd
          .getUTCDate()


      const projectionMultiplier =
        daysElapsed > 0
          ? daysInMonth /
            daysElapsed
          : 1


      const projectedIncome =
        round(
          currentMonthTotals.income *
            projectionMultiplier,
        )


      const projectedExpenses =
        round(
          currentMonthTotals.expenses *
            projectionMultiplier,
        )


      const projectedNetCashFlow =
        round(
          projectedIncome -
          projectedExpenses,
        )


      const currentMonthProjection = {

        method:
          'DAILY_RUN_RATE',

        isEstimate:
          true,

        month:
          now
            .toISOString()
            .slice(
              0,
              7,
            ),

        daysElapsed,

        daysInMonth,

        daysRemaining:
          Math.max(
            daysInMonth -
              daysElapsed,
            0,
          ),

        actualIncome:
          currentMonthTotals.income,

        actualExpenses:
          currentMonthTotals.expenses,

        actualNetCashFlow:
          currentMonthTotals.net,

        projectedIncome,

        projectedExpenses,

        projectedNetCashFlow,

        dailyAverageIncome:
          daysElapsed > 0
            ? round(
                currentMonthTotals.income /
                  daysElapsed,
              )
            : 0,

        dailyAverageExpenses:
          daysElapsed > 0
            ? round(
                currentMonthTotals.expenses /
                  daysElapsed,
              )
            : 0,

        projectedSavingsRate:
          projectedIncome > 0
            ? round(
                (
                  projectedNetCashFlow /
                  projectedIncome
                ) * 100,
                1,
              )
            : null,
      }


      /* ========================================
         DATA RANGE
      ======================================== */

      const firstTransaction =
        transactions.length > 0
          ? transactions[0]
          : null


      const lastTransaction =
        transactions.length > 0
          ? transactions[
              transactions.length -
                1
            ]
          : null


      /* ========================================
         CURRENCY INFORMATION
      ======================================== */

      const currencies =
        Array.from(
          currencySet,
        ).sort()


      const hasMixedCurrencies =
        currencies.length > 1


      /* ========================================
         RESPONSE
      ======================================== */

      return res
        .status(200)
        .json({
          data: {

            /* ------------------------
               EXISTING API CONTRACT
            ------------------------ */

            totalIncome,

            totalExpenses,

            netCashFlow,

            incomeByCategory,

            expensesByCategory,

            monthlyCashFlow,

            transactionCount:
              transactions.length,


            /* ------------------------
               NEW SUMMARY METRICS
            ------------------------ */

            savingsRate,

            expenseToIncomeRatio,

            cashFlowStatus,


            /* ------------------------
               TRANSACTION BREAKDOWN
            ------------------------ */

            transactionBreakdown: {

              income:
                incomeTransactionCount,

              expenses:
                expenseTransactionCount,

              transfers:
                transferTransactionCount,
            },


            /* ------------------------
               MONTHLY ANALYTICS
            ------------------------ */

            monthlyAverages: {

              monthsAnalyzed,

              income:
                averageMonthlyIncome,

              expenses:
                averageMonthlyExpenses,

              netCashFlow:
                averageMonthlyNetCashFlow,
            },


            /* ------------------------
               CATEGORY INTELLIGENCE
            ------------------------ */

            topIncomeCategory,

            topExpenseCategory,


            /* ------------------------
               MONTH INTELLIGENCE
            ------------------------ */

            strongestCashFlowMonth,

            highestSpendingMonth,


            /* ------------------------
               PERIOD COMPARISON
            ------------------------ */

            comparison,


            /* ------------------------
               FORECAST
            ------------------------ */

            currentMonthProjection,


            /* ------------------------
               SELECTED PERIOD
            ------------------------ */

            period: {

              mode:
                startDate &&
                endDate
                  ? 'CUSTOM'
                  : startDate
                    ? 'FROM_DATE'
                    : endDate
                      ? 'TO_DATE'
                      : 'ALL_TIME',

              requestedStartDate:
                startDateQuery,

              requestedEndDate:
                endDateQuery,

              actualFirstTransaction:
                firstTransaction
                  ? firstTransaction
                      .occurredAt
                      .toISOString()
                  : null,

              actualLastTransaction:
                lastTransaction
                  ? lastTransaction
                      .occurredAt
                      .toISOString()
                  : null,
            },


            /* ------------------------
               CURRENCY METADATA
            ------------------------ */

            currencyInfo: {

              currencies,

              hasMixedCurrencies,

              /*
               * Future MaliOS versions can
               * perform per-currency reporting
               * instead of aggregation when
               * multiple currencies exist.
               */
              warning:
                hasMixedCurrencies
                  ? 'Cash-flow totals contain multiple currencies.'
                  : null,
            },
          },
        })


    } catch (
      error
    ) {

      console.error(
        'Failed to calculate cash flow:',
        error,
      )


      return res
        .status(500)
        .json({
          error:
            'Unable to calculate cash flow',
        })
    }
  },
)


export default router