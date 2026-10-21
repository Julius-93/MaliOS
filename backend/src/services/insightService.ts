import prisma from '../config/prisma'


type InsightSeverity =
  | 'SUCCESS'
  | 'INFO'
  | 'WARNING'
  | 'DANGER'


type InsightType =
  | 'CASH_FLOW'
  | 'SAVINGS'
  | 'SPENDING'
  | 'BALANCE'
  | 'BUDGET'
  | 'GOAL'
  | 'INVESTMENT'


type FinancialInsight = {
  id: string
  type: InsightType
  severity: InsightSeverity
  title: string
  message: string
}


type FinancialHealthGrade =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'NEEDS_ATTENTION'


/* ========================================
   HELPERS
======================================== */

function clamp(
  value: number,
  minimum: number,
  maximum: number,
) {
  return Math.min(
    Math.max(
      value,
      minimum,
    ),
    maximum,
  )
}


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


function getHealthGrade(
  score: number,
): FinancialHealthGrade {
  if (
    score >= 85
  ) {
    return 'EXCELLENT'
  }


  if (
    score >= 70
  ) {
    return 'GOOD'
  }


  if (
    score >= 50
  ) {
    return 'FAIR'
  }


  return 'NEEDS_ATTENTION'
}


/* ========================================
   FINANCIAL INSIGHT ENGINE
======================================== */

export async function generateFinancialInsights(
  userId: string,
) {
  const now =
    new Date()


  /* ======================================
     DATE RANGES
  ====================================== */

  const currentMonthStart =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )


  const nextMonthStart =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    )


  const previousMonthStart =
    new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    )


  /* ======================================
     LOAD CORE DATA
  ====================================== */

  const [
    accounts,
    allKesTransactions,
    currentTransactions,
    previousTransactions,
    activeBudgets,
    goals,
    investmentAccounts,
  ] = await Promise.all([

    /*
     * Base financial accounts.
     *
     * The stored account.balance is the
     * starting balance. Transactions are
     * added below to calculate the current
     * usable balance.
     */
    prisma.financialAccount.findMany({
      where: {
        userId,
        currency: 'KES',
      },

      select: {
        id: true,
        name: true,
        balance: true,
        currency: true,
      },
    }),


    /*
     * All KES transactions are needed for
     * the actual calculated account balance.
     */
    prisma.transaction.findMany({
      where: {
        account: {
          is: {
            userId,
          },
        },

        currency: 'KES',
      },

      select: {
        id: true,
        accountId: true,
        type: true,
        amount: true,
      },
    }),


    /*
     * Current calendar month activity.
     */
    prisma.transaction.findMany({
      where: {
        account: {
          is: {
            userId,
          },
        },

        currency: 'KES',

        occurredAt: {
          gte:
            currentMonthStart,

          lt:
            nextMonthStart,
        },
      },

      select: {
        id: true,
        type: true,
        amount: true,
        category: true,
        occurredAt: true,
      },
    }),


    /*
     * Previous calendar month activity.
     */
    prisma.transaction.findMany({
      where: {
        account: {
          is: {
            userId,
          },
        },

        currency: 'KES',

        occurredAt: {
          gte:
            previousMonthStart,

          lt:
            currentMonthStart,
        },
      },

      select: {
        id: true,
        type: true,
        amount: true,
        category: true,
        occurredAt: true,
      },
    }),


    /*
     * Active budgets.
     */
    prisma.budget.findMany({
      where: {
        userId,

        startDate: {
          lte: now,
        },

        endDate: {
          gte: now,
        },
      },

      orderBy: {
        endDate: 'asc',
      },
    }),


    /*
     * Financial goals.
     */
    prisma.goal.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    }),


    /*
     * Investment accounts and holdings.
     */
    prisma.investmentAccount.findMany({
      where: {
        userId,
      },

      include: {
        holdings: true,
      },
    }),

  ])


  /* ======================================
     CALCULATED ACCOUNT BALANCES
  ====================================== */

  /*
   * Build a transaction adjustment for
   * every KES account.
   */
  const accountAdjustments =
    new Map<
      string,
      number
    >()


  for (
    const transaction
    of allKesTransactions
  ) {
    const currentAdjustment =
      accountAdjustments.get(
        transaction.accountId,
      ) ?? 0


    const amount =
      Number(
        transaction.amount,
      )


    if (
      transaction.type ===
      'INCOME'
    ) {
      accountAdjustments.set(
        transaction.accountId,
        currentAdjustment +
          amount,
      )
    }


    if (
      transaction.type ===
      'EXPENSE'
    ) {
      accountAdjustments.set(
        transaction.accountId,
        currentAdjustment -
          amount,
      )
    }


    /*
     * TRANSFER transactions are ignored
     * in the combined net-worth calculation
     * for now because moving money between
     * the user's own accounts does not change
     * total wealth.
     *
     * We can refine transfer direction later
     * when MaliOS has explicit source and
     * destination transfer relationships.
     */
  }


  const calculatedAccounts =
    accounts.map(
      (account) => {
        const baseBalance =
          Number(
            account.balance,
          )


        const adjustment =
          accountAdjustments.get(
            account.id,
          ) ?? 0


        return {
          ...account,

          calculatedBalance:
            baseBalance +
            adjustment,
        }
      },
    )


  const availableBalance =
    calculatedAccounts.reduce(
      (
        total,
        account,
      ) =>
        total +
        account.calculatedBalance,
      0,
    )


  /* ======================================
     CURRENT MONTH CASH FLOW
  ====================================== */

  const monthlyIncome =
    currentTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          'INCOME',
      )
      .reduce(
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


  const monthlyExpenses =
    currentTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          'EXPENSE',
      )
      .reduce(
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


  const netCashFlow =
    monthlyIncome -
    monthlyExpenses


  const hasCurrentMonthActivity =
    currentTransactions.length >
    0


  const hasCurrentMonthIncome =
    monthlyIncome >
    0


  const hasCurrentMonthExpenses =
    monthlyExpenses >
    0


  /* ======================================
     PREVIOUS MONTH
  ====================================== */

  const previousIncome =
    previousTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          'INCOME',
      )
      .reduce(
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


  const previousExpenses =
    previousTransactions
      .filter(
        (transaction) =>
          transaction.type ===
          'EXPENSE',
      )
      .reduce(
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


  const hasPreviousMonthActivity =
    previousTransactions.length >
    0


  /* ======================================
     SAVINGS RATE
  ====================================== */

  /*
   * A zero income month does NOT mean a
   * zero savings rate.
   *
   * It means the metric is currently not
   * available.
   */
  const savingsRate =
    hasCurrentMonthIncome
      ? (
          netCashFlow /
          monthlyIncome
        ) * 100
      : null


  /* ======================================
     EXPENSE TREND
  ====================================== */

  /*
   * Only calculate a month-over-month
   * percentage when BOTH months contain
   * expense data.
   *
   * Otherwise we would incorrectly report
   * a 100% spending reduction simply because
   * nothing has been recorded this month.
   */
  const expenseChangePercentage =
    hasCurrentMonthExpenses &&
    previousExpenses > 0
      ? (
          (
            monthlyExpenses -
            previousExpenses
          ) /
          previousExpenses
        ) * 100
      : null


  /* ======================================
     SPENDING CATEGORIES
  ====================================== */

  const expenseCategoryTotals =
    new Map<
      string,
      number
    >()


  for (
    const transaction
    of currentTransactions
  ) {
    if (
      transaction.type !==
      'EXPENSE'
    ) {
      continue
    }


    const category =
      transaction.category ||
      'Other'


    const current =
      expenseCategoryTotals.get(
        category,
      ) ?? 0


    expenseCategoryTotals.set(
      category,
      current +
        Number(
          transaction.amount,
        ),
    )
  }


  const sortedExpenseCategories =
    Array.from(
      expenseCategoryTotals.entries(),
    ).sort(
      (
        [, amountA],
        [, amountB],
      ) =>
        amountB -
        amountA,
    )


  const topExpenseCategory =
    sortedExpenseCategories[0] ??
    null


  /* ======================================
   BUDGET ANALYSIS
====================================== */

const budgetAnalysis =
  await Promise.all(
    activeBudgets.map(
      async (
        budget,
      ) => {

        /*
         * Each budget now has an explicit
         * category.
         *
         * Only expenses matching:
         *
         * - the logged-in user
         * - EXPENSE transaction type
         * - budget currency
         * - budget category
         * - budget date range
         *
         * are included.
         */
        const result =
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
                 * For an active budget, never
                 * count future transactions.
                 */
                lte:
                  now <
                  budget.endDate
                    ? now
                    : budget.endDate,
              },
            },

            _sum: {
              amount: true,
            },
          })


        const spent =
          Number(
            result._sum.amount ??
              0,
          )


        const budgetAmount =
          Number(
            budget.amount,
          )


        const percentage =
          budgetAmount > 0
            ? (
                spent /
                budgetAmount
              ) * 100
            : 0


        return {
          id:
            budget.id,

          name:
            budget.name,

          category:
            budget.category,

          spent:
            round(
              spent,
            ),

          amount:
            round(
              budgetAmount,
            ),

          percentage:
            round(
              percentage,
              1,
            ),

          endDate:
            budget.endDate,
        }
      },
    ),
  )


/* ======================================
   BUDGET THRESHOLDS
====================================== */

const budgetsOverLimit =
  budgetAnalysis.filter(
    (
      budget,
    ) =>
      budget.percentage >=
      100,
  )


const budgetsNearLimit =
  budgetAnalysis.filter(
    (
      budget,
    ) =>
      budget.percentage >=
        80 &&
      budget.percentage <
        100,
  )

  /* ======================================
     GOAL ANALYSIS
  ====================================== */

  const activeGoals =
    goals.filter(
      (goal) =>
        goal.status ===
        'ACTIVE',
    )


  const completedGoals =
    goals.filter(
      (goal) =>
        goal.status ===
          'COMPLETED' ||
        (
          Number(
            goal.currentAmount,
          ) >=
          Number(
            goal.targetAmount,
          ) &&
          Number(
            goal.targetAmount,
          ) >
            0
        ),
    )


  const goalProgressValues =
    activeGoals.map(
      (goal) => {
        const target =
          Number(
            goal.targetAmount,
          )


        if (
          target <= 0
        ) {
          return 0
        }


        return clamp(
          (
            Number(
              goal.currentAmount,
            ) /
            target
          ) * 100,
          0,
          100,
        )
      },
    )


  const averageGoalProgress =
    goalProgressValues.length >
    0
      ? goalProgressValues.reduce(
          (
            total,
            value,
          ) =>
            total +
            value,
          0,
        ) /
        goalProgressValues.length
      : 0


  /* ======================================
     INVESTMENT ANALYSIS
  ====================================== */

  let totalInvestmentCost =
    0


  let totalInvestmentValue =
    0


  for (
    const account
    of investmentAccounts
  ) {
    for (
      const holding
      of account.holdings
    ) {
      const quantity =
        Number(
          holding.quantity,
        )


      const averageCost =
        Number(
          holding.averageCost,
        )


      const currentPrice =
        Number(
          holding.currentPrice,
        )


      totalInvestmentCost +=
        quantity *
        averageCost


      totalInvestmentValue +=
        quantity *
        currentPrice
    }
  }


  const portfolioReturnPercentage =
    totalInvestmentCost > 0
      ? (
          (
            totalInvestmentValue -
            totalInvestmentCost
          ) /
          totalInvestmentCost
        ) * 100
      : null


  /* ======================================
     INSIGHTS
  ====================================== */

  const insights:
    FinancialInsight[] =
      []


  /* ======================================
     CURRENT MONTH DATA AVAILABILITY
  ====================================== */

  if (
    !hasCurrentMonthActivity
  ) {
    insights.push({
      id:
        'current-month-limited-data',

      type:
        'CASH_FLOW',

      severity:
        'INFO',

      title:
        'No current-month activity yet',

      message:
        'No income or expense transactions have been recorded for the current month yet.',
    })
  }


  /* ======================================
     CASH FLOW
  ====================================== */

  if (
    hasCurrentMonthActivity
  ) {
    if (
      monthlyIncome >
      monthlyExpenses
    ) {
      insights.push({
        id:
          'positive-cash-flow',

        type:
          'CASH_FLOW',

        severity:
          'SUCCESS',

        title:
          'Positive cash flow',

        message:
          'Your recorded income is currently higher than your expenses this month.',
      })
    } else if (
      monthlyExpenses >
      monthlyIncome
    ) {
      insights.push({
        id:
          'negative-cash-flow',

        type:
          'CASH_FLOW',

        severity:
          'DANGER',

        title:
          'Negative cash flow',

        message:
          'Your recorded expenses are currently higher than your income this month.',
      })
    }
  }


  /* ======================================
     SAVINGS
  ====================================== */

  if (
    savingsRate !==
    null
  ) {
    if (
      savingsRate >=
      20
    ) {
      insights.push({
        id:
          'strong-savings-rate',

        type:
          'SAVINGS',

        severity:
          'SUCCESS',

        title:
          'Strong savings rate',

        message:
          `You are retaining approximately ${round(
            savingsRate,
            1,
          )}% of your recorded income this month.`,
      })
    } else if (
      savingsRate >=
      10
    ) {
      insights.push({
        id:
          'moderate-savings-rate',

        type:
          'SAVINGS',

        severity:
          'INFO',

        title:
          'Positive savings rate',

        message:
          `You are retaining approximately ${round(
            savingsRate,
            1,
          )}% of your recorded income this month.`,
      })
    } else if (
      savingsRate >=
      0
    ) {
      insights.push({
        id:
          'low-savings-rate',

        type:
          'SAVINGS',

        severity:
          'WARNING',

        title:
          'Low savings margin',

        message:
          `Approximately ${round(
            savingsRate,
            1,
          )}% of your recorded income remains after expenses this month.`,
      })
    } else {
      insights.push({
        id:
          'negative-savings-rate',

        type:
          'SAVINGS',

        severity:
          'DANGER',

        title:
          'Expenses exceed income',

        message:
          'Your recorded expenses currently exceed your recorded income this month.',
      })
    }
  }


  /* ======================================
     SPENDING TREND
  ====================================== */

  if (
    expenseChangePercentage !==
    null
  ) {
    if (
      expenseChangePercentage >=
      20
    ) {
      insights.push({
        id:
          'expenses-rising',

        type:
          'SPENDING',

        severity:
          'WARNING',

        title:
          'Spending has increased',

        message:
          `Your recorded expenses are approximately ${round(
            expenseChangePercentage,
            1,
          )}% higher than last month.`,
      })
    } else if (
      expenseChangePercentage <=
      -10
    ) {
      insights.push({
        id:
          'expenses-falling',

        type:
          'SPENDING',

        severity:
          'SUCCESS',

        title:
          'Spending has decreased',

        message:
          `Your recorded expenses are approximately ${round(
            Math.abs(
              expenseChangePercentage,
            ),
            1,
          )}% lower than last month.`,
      })
    } else {
      insights.push({
        id:
          'expenses-stable',

        type:
          'SPENDING',

        severity:
          'INFO',

        title:
          'Spending remains relatively stable',

        message:
          'Your recorded monthly expenses remain relatively close to last month.',
      })
    }
  }


  /* ======================================
     TOP EXPENSE CATEGORY
  ====================================== */

  if (
    topExpenseCategory &&
    monthlyExpenses > 0
  ) {
    const [
      category,
      amount,
    ] =
      topExpenseCategory


    const percentage =
      (
        amount /
        monthlyExpenses
      ) * 100


    insights.push({
      id:
        'top-expense-category',

      type:
        'SPENDING',

      severity:
        percentage >=
        50
          ? 'WARNING'
          : 'INFO',

      title:
        'Top spending category',

      message:
        `${category} represents approximately ${round(
          percentage,
          1,
        )}% of your recorded expenses this month.`,
    })
  }


  /* ======================================
     ACCOUNT POSITION
  ====================================== */

  if (
    accounts.length >
    0
  ) {
    if (
      availableBalance >
      0
    ) {
      insights.push({
        id:
          'positive-account-balance',

        type:
          'BALANCE',

        severity:
          'SUCCESS',

        title:
          'Positive account position',

        message:
          'Your combined calculated account balance remains positive.',
      })
    } else if (
      availableBalance ===
      0
    ) {
      insights.push({
        id:
          'zero-account-balance',

        type:
          'BALANCE',

        severity:
          'WARNING',

        title:
          'No available account balance',

        message:
          'Your combined calculated account balance is currently zero.',
      })
    } else {
      insights.push({
        id:
          'negative-account-balance',

        type:
          'BALANCE',

        severity:
          'DANGER',

        title:
          'Negative account position',

        message:
          'Your combined calculated account balance is below zero.',
      })
    }
  }


  /* ======================================
     BUDGETS
  ====================================== */

  if (
    budgetsOverLimit.length >
    0
  ) {
    insights.push({
      id:
        'budget-over-limit',

      type:
        'BUDGET',

      severity:
        'DANGER',

      title:
        'Budget limit exceeded',

      message:
        `${budgetsOverLimit.length} active budget(s) have reached or exceeded their configured limit.`,
    })
  } else if (
    budgetsNearLimit.length >
    0
  ) {
    insights.push({
      id:
        'budget-near-limit',

      type:
        'BUDGET',

      severity:
        'WARNING',

      title:
        'Budget pressure detected',

      message:
        `${budgetsNearLimit.length} active budget(s) are above 80% of their configured limit.`,
    })
  } else if (
    activeBudgets.length >
    0
  ) {
    insights.push({
      id:
        'budgets-healthy',

      type:
        'BUDGET',

      severity:
        'SUCCESS',

      title:
        'Budgets within range',

      message:
        'Your active budgets are currently below the warning threshold.',
    })
  }


  /* ======================================
     GOALS
  ====================================== */

  if (
    completedGoals.length >
    0
  ) {
    insights.push({
      id:
        'goal-completion',

      type:
        'GOAL',

      severity:
        'SUCCESS',

      title:
        'Financial goal achieved',

      message:
        `${completedGoals.length} financial goal(s) have reached their target.`,
    })
  }


  if (
    activeGoals.length >
    0
  ) {
    insights.push({
      id:
        'goal-progress',

      type:
        'GOAL',

      severity:
        averageGoalProgress >=
        50
          ? 'SUCCESS'
          : 'INFO',

      title:
        'Goal progress',

      message:
        `Your active financial goals are approximately ${round(
          averageGoalProgress,
          1,
        )}% complete on average.`,
    })
  }


  /* ======================================
     INVESTMENTS
  ====================================== */

  if (
    portfolioReturnPercentage !==
    null
  ) {
    if (
      portfolioReturnPercentage >=
      5
    ) {
      insights.push({
        id:
          'portfolio-gain',

        type:
          'INVESTMENT',

        severity:
          'SUCCESS',

        title:
          'Portfolio is in gain',

        message:
          `Your recorded investment portfolio is approximately ${round(
            portfolioReturnPercentage,
            1,
          )}% above its cost basis.`,
      })
    } else if (
      portfolioReturnPercentage <=
      -5
    ) {
      insights.push({
        id:
          'portfolio-loss',

        type:
          'INVESTMENT',

        severity:
          'WARNING',

        title:
          'Portfolio value has declined',

        message:
          `Your recorded investment portfolio is approximately ${round(
            Math.abs(
              portfolioReturnPercentage,
            ),
            1,
          )}% below its cost basis.`,
      })
    } else {
      insights.push({
        id:
          'portfolio-stable',

        type:
          'INVESTMENT',

        severity:
          'INFO',

        title:
          'Portfolio relatively stable',

        message:
          'Your recorded investment portfolio remains close to its overall cost basis.',
      })
    }
  }


  /* ======================================
     FINANCIAL HEALTH SCORE
  ====================================== */

  /*
   * We use weighted score components.
   *
   * Critically, unavailable data is not
   * treated as poor financial health.
   *
   * Instead, it is omitted from the score
   * and reflected in score confidence.
   */

  const scoreComponents:
    Array<{
      score: number
      weight: number
    }> =
      []


  /* ======================================
     BALANCE COMPONENT
  ====================================== */

  if (
    accounts.length >
    0
  ) {
    let balanceScore =
      50


    if (
      availableBalance >
      0
    ) {
      balanceScore =
        80
    }


    if (
      availableBalance <
      0
    ) {
      balanceScore =
        20
    }


    scoreComponents.push({
      score:
        balanceScore,

      weight:
        30,
    })
  }


  /* ======================================
     CASH FLOW COMPONENT
  ====================================== */

  if (
    hasCurrentMonthActivity
  ) {
    let cashFlowScore =
      50


    if (
      netCashFlow >
      0
    ) {
      cashFlowScore =
        85
    }


    if (
      netCashFlow <
      0
    ) {
      cashFlowScore =
        25
    }


    scoreComponents.push({
      score:
        cashFlowScore,

      weight:
        25,
    })
  }


  /* ======================================
     SAVINGS COMPONENT
  ====================================== */

  if (
    savingsRate !==
    null
  ) {
    let savingsScore =
      40


    if (
      savingsRate >=
      20
    ) {
      savingsScore =
        90
    } else if (
      savingsRate >=
      10
    ) {
      savingsScore =
        75
    } else if (
      savingsRate >=
      0
    ) {
      savingsScore =
        55
    } else {
      savingsScore =
        20
    }


    scoreComponents.push({
      score:
        savingsScore,

      weight:
        20,
    })
  }


  /* ======================================
     BUDGET COMPONENT
  ====================================== */

  if (
    activeBudgets.length >
    0
  ) {
    let budgetScore =
      85


    if (
      budgetsNearLimit.length >
      0
    ) {
      budgetScore =
        55
    }


    if (
      budgetsOverLimit.length >
      0
    ) {
      budgetScore =
        25
    }


    scoreComponents.push({
      score:
        budgetScore,

      weight:
        10,
    })
  }


  /* ======================================
     GOAL COMPONENT
  ====================================== */

  if (
    activeGoals.length >
      0 ||
    completedGoals.length >
      0
  ) {
    const goalScore =
      completedGoals.length >
      0
        ? 90
        : clamp(
            40 +
              (
                averageGoalProgress *
                0.5
              ),
            40,
            90,
          )


    scoreComponents.push({
      score:
        goalScore,

      weight:
        10,
    })
  }


  /* ======================================
     INVESTMENT COMPONENT
  ====================================== */

  if (
    portfolioReturnPercentage !==
    null
  ) {
    let investmentScore =
      65


    if (
      portfolioReturnPercentage >=
      5
    ) {
      investmentScore =
        85
    } else if (
      portfolioReturnPercentage <=
      -10
    ) {
      investmentScore =
        30
    } else if (
      portfolioReturnPercentage <
      0
    ) {
      investmentScore =
        50
    }


    scoreComponents.push({
      score:
        investmentScore,

      weight:
        10,
    })
  }


  /* ======================================
     CALCULATE WEIGHTED SCORE
  ====================================== */

  const availableWeight =
    scoreComponents.reduce(
      (
        total,
        component,
      ) =>
        total +
        component.weight,
      0,
    )


  const weightedTotal =
    scoreComponents.reduce(
      (
        total,
        component,
      ) =>
        total +
        (
          component.score *
          component.weight
        ),
      0,
    )


  const healthScore =
    availableWeight >
    0
      ? clamp(
          Math.round(
            weightedTotal /
            availableWeight,
          ),
          0,
          100,
        )
      : 50


  /*
   * Confidence tells the frontend how much
   * financial data was available when the
   * score was calculated.
   */
  const scoreConfidence =
    clamp(
      Math.round(
        (
          availableWeight /
          100
        ) * 100,
      ),
      0,
      100,
    )


  /* ======================================
     DATA STATUS
  ====================================== */

  let dataStatus:
    | 'SUFFICIENT'
    | 'LIMITED_CURRENT_MONTH_DATA'
    | 'LIMITED_DATA'


  if (
    accounts.length ===
      0 &&
    goals.length ===
      0 &&
    investmentAccounts.length ===
      0
  ) {
    dataStatus =
      'LIMITED_DATA'
  } else if (
    !hasCurrentMonthActivity
  ) {
    dataStatus =
      'LIMITED_CURRENT_MONTH_DATA'
  } else {
    dataStatus =
      'SUFFICIENT'
  }


  /* ======================================
     FINAL RESPONSE
  ====================================== */

  return {
    financialHealthScore:
      healthScore,

    financialHealthGrade:
      getHealthGrade(
        healthScore,
      ),

    scoreConfidence,

    dataStatus,

    metrics: {
      availableBalance:
        round(
          availableBalance,
        ),

      monthlyIncome:
        round(
          monthlyIncome,
        ),

      monthlyExpenses:
        round(
          monthlyExpenses,
        ),

      netCashFlow:
        round(
          netCashFlow,
        ),

      savingsRate:
        savingsRate ===
        null
          ? null
          : round(
              savingsRate,
              1,
            ),

      expenseChangePercentage:
        expenseChangePercentage ===
        null
          ? null
          : round(
              expenseChangePercentage,
              1,
            ),

      previousMonthIncome:
        round(
          previousIncome,
        ),

      previousMonthExpenses:
        round(
          previousExpenses,
        ),

      currentMonthTransactionCount:
        currentTransactions.length,

      previousMonthTransactionCount:
        previousTransactions.length,

      activeBudgetCount:
        activeBudgets.length,

      budgetsNearLimit:
        budgetsNearLimit.length,

      budgetsOverLimit:
        budgetsOverLimit.length,

      activeGoalCount:
        activeGoals.length,

      completedGoalCount:
        completedGoals.length,

      averageGoalProgress:
        round(
          averageGoalProgress,
          1,
        ),

      portfolioReturnPercentage:
        portfolioReturnPercentage ===
        null
          ? null
          : round(
              portfolioReturnPercentage,
              1,
            ),
    },

    insights:
      insights.slice(
        0,
        8,
      ),
  }
}