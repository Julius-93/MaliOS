import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

import Card from '../components/ui/Card'
import SensitiveValue from '../components/ui/SensitiveValue'

import {
  getCashFlow,
} from '../services/api'


/* ========================================
   CURRENCY FORMATTER
======================================== */

function formatCurrency(
  value,
) {
  return new Intl.NumberFormat(
    'en-KE',
    {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    },
  ).format(
    Number(
      value || 0,
    ),
  )
}


/* ========================================
   MONTH FORMATTER
======================================== */

function formatMonth(
  month,
) {
  if (!month) {
    return ''
  }


  const [
    year,
    monthNumber,
  ] =
    month.split('-')


  /*
   * Use UTC here so month labels cannot
   * shift because of the browser's
   * local timezone.
   */
  const date =
    new Date(
      Date.UTC(
        Number(year),
        Number(monthNumber) - 1,
        1,
      ),
    )


  return new Intl.DateTimeFormat(
    'en-KE',
    {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(
    date,
  )
}


/* ========================================
   PERCENTAGE FORMATTER
======================================== */

function formatPercentage(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return 'Not available'
  }


  const numeric =
    Number(
      value,
    )


  const sign =
    numeric > 0
      ? '+'
      : ''


  return (
    `${sign}` +
    `${numeric.toFixed(1)}%`
  )
}


/* ========================================
   DATE FORMATTER
======================================== */

function formatDate(
  value,
) {
  if (!value) {
    return '—'
  }


  /*
   * Backend period boundaries are UTC.
   *
   * Example:
   *
   * 2026-09-30T23:59:59.999Z
   *
   * Without timeZone: 'UTC', a browser
   * running in EAT can display this as
   * 1 Oct 2026.
   *
   * Keeping the formatter in UTC preserves
   * the intended financial reporting date.
   */
  return new Intl.DateTimeFormat(
    'en-KE',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(
    new Date(
      value,
    ),
  )
}


/* ========================================
   PRIVACY-SAFE CHART TOOLTIP
======================================== */

/*
 * Monetary values shown inside chart
 * tooltips are wrapped in SensitiveValue.
 *
 * This allows MaliOS Privacy Mode to hide
 * the exact amounts shown when hovering
 * over a chart.
 */
function CashFlowTooltip({
  active,
  payload,
  label,
}) {

  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }


  return (
    <div className="cash-flow-chart-tooltip">

      <strong>
        {formatMonth(
          label,
        )}
      </strong>


      {payload.map(
        (
          entry,
        ) => (

          <div
            key={
              entry.dataKey
            }
            className="cash-flow-chart-tooltip-row"
          >

            <span>
              {entry.name}
            </span>


            <strong>

              <SensitiveValue>

                {formatCurrency(
                  entry.value,
                )}

              </SensitiveValue>

            </strong>

          </div>

        ),
      )}

    </div>
  )
}


/* ========================================
   CASH FLOW PAGE
======================================== */

function CashFlow() {

  const token =
    sessionStorage.getItem(
      'malios_token',
    )


  /* ========================================
     STATE
  ======================================== */

  const [
    cashFlow,
    setCashFlow,
  ] =
    useState(
      null,
    )


  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    )


  const [
    error,
    setError,
  ] =
    useState(
      '',
    )


  /* ========================================
     DATE FILTERS
  ======================================== */

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      '',
    )


  const [
    endDate,
    setEndDate,
  ] =
    useState(
      '',
    )


  /* ========================================
     LOAD CASH FLOW
  ======================================== */

  useEffect(
    () => {

      let cancelled =
        false


      async function loadCashFlow() {

        try {

          setLoading(
            true,
          )

          setError(
            '',
          )


          if (!token) {

            throw new Error(
              'Authentication required',
            )
          }


          const data =
            await getCashFlow(
              token,
            )


          if (
            !cancelled
          ) {

            setCashFlow(
              data,
            )
          }

        } catch (
          err
        ) {

          console.error(
            'Failed to load cash flow:',
            err,
          )


          if (
            !cancelled
          ) {

            setError(
              err.message ||
                'Unable to load cash flow',
            )
          }

        } finally {

          if (
            !cancelled
          ) {

            setLoading(
              false,
            )
          }
        }
      }


      loadCashFlow()


      return () => {

        cancelled =
          true
      }

    },
    [
      token,
    ],
  )


  /* ========================================
     APPLY DATE FILTER
  ======================================== */

  async function handleFilter(
    event,
  ) {

    event.preventDefault()


    try {

      setLoading(
        true,
      )

      setError(
        '',
      )


      /*
       * Do a quick frontend check before
       * sending the request.
       *
       * The backend also performs strict
       * date validation.
       */
      if (
        startDate &&
        endDate &&
        endDate <
          startDate
      ) {

        throw new Error(
          'End date cannot be before start date',
        )
      }


      const data =
        await getCashFlow(
          token,
          startDate,
          endDate,
        )


      setCashFlow(
        data,
      )

    } catch (
      err
    ) {

      console.error(
        'Failed to filter cash flow:',
        err,
      )


      setError(
        err.message ||
          'Unable to filter cash flow',
      )

    } finally {

      setLoading(
        false,
      )
    }
  }


  /* ========================================
     CLEAR DATE FILTERS
  ======================================== */

  async function handleClearFilters() {

    try {

      setLoading(
        true,
      )

      setError(
        '',
      )


      setStartDate(
        '',
      )

      setEndDate(
        '',
      )


      const data =
        await getCashFlow(
          token,
        )


      setCashFlow(
        data,
      )

    } catch (
      err
    ) {

      console.error(
        'Failed to reset cash flow:',
        err,
      )


      setError(
        err.message ||
          'Unable to reset cash flow',
      )

    } finally {

      setLoading(
        false,
      )
    }
  }


  /* ========================================
     MONTHLY CHART DATA
  ======================================== */

  const chartData =
    useMemo(
      () =>
        cashFlow
          ?.monthlyCashFlow ??
        [],
      [
        cashFlow,
      ],
    )


  /* ========================================
     EXPENSE CATEGORY DATA
  ======================================== */

  const expenseCategories =
    useMemo(
      () => {

        if (
          !cashFlow
        ) {
          return []
        }


        return Object.entries(
          cashFlow
            .expensesByCategory ||
            {},
        )
          .sort(
            (
              [, amountA],
              [, amountB],
            ) =>
              Number(
                amountB,
              ) -
              Number(
                amountA,
              ),
          )

      },
      [
        cashFlow,
      ],
    )


  /* ========================================
     INCOME CATEGORY DATA
  ======================================== */

  const incomeCategories =
    useMemo(
      () => {

        if (
          !cashFlow
        ) {
          return []
        }


        return Object.entries(
          cashFlow
            .incomeByCategory ||
            {},
        )
          .sort(
            (
              [, amountA],
              [, amountB],
            ) =>
              Number(
                amountB,
              ) -
              Number(
                amountA,
              ),
          )

      },
      [
        cashFlow,
      ],
    )


  /* ========================================
     INITIAL LOADING STATE
  ======================================== */

  if (
    loading &&
    !cashFlow
  ) {

    return (
      <section className="dashboard-page">

        <p>
          Loading cash flow...
        </p>

      </section>
    )
  }


  /* ========================================
     PAGE
  ======================================== */

  return (
    <section className="dashboard-page">

      {/* =====================================
          PAGE INTRO
      ====================================== */}

      <div className="page-intro">

        <p>
          Understand where your money
          comes from, where it goes,
          how your cash flow is changing,
          and where the current month
          may be heading.
        </p>

      </div>


      {/* =====================================
          ERROR MESSAGE
      ====================================== */}

      {error && (

        <p
          role="alert"
          className="form-error"
        >
          {error}
        </p>

      )}


      {/* =====================================
          DATE FILTER
      ====================================== */}

      <Card className="cash-flow-filter-card">

        <div className="cash-flow-section-heading">

          <div>

            <h3>
              Cash Flow Period
            </h3>

            <p>
              Analyse all activity or
              focus on a specific period.
            </p>

          </div>


          {cashFlow?.period && (

            <span className="cash-flow-period-badge">

              {
                cashFlow
                  .period
                  .mode
                  ?.replaceAll(
                    '_',
                    ' ',
                  )
              }

            </span>

          )}

        </div>


        <form
          className="cash-flow-filter-form"
          onSubmit={
            handleFilter
          }
        >

          {/* START DATE */}

          <div className="form-field">

            <label htmlFor="cash-flow-start">
              Start Date
            </label>


            <input
              id="cash-flow-start"
              type="date"
              value={
                startDate
              }
              onChange={
                (
                  event,
                ) =>
                  setStartDate(
                    event
                      .target
                      .value,
                  )
              }
            />

          </div>


          {/* END DATE */}

          <div className="form-field">

            <label htmlFor="cash-flow-end">
              End Date
            </label>


            <input
              id="cash-flow-end"
              type="date"
              value={
                endDate
              }
              min={
                startDate ||
                undefined
              }
              onChange={
                (
                  event,
                ) =>
                  setEndDate(
                    event
                      .target
                      .value,
                  )
              }
            />

          </div>


          {/* FILTER ACTIONS */}

          <div className="cash-flow-filter-actions">

            <button
              type="submit"
              disabled={
                loading
              }
            >

              {
                loading
                  ? 'Loading...'
                  : 'Apply Filter'
              }

            </button>


            <button
              type="button"
              className="secondary-button"
              onClick={
                handleClearFilters
              }
              disabled={
                loading
              }
            >
              Clear
            </button>

          </div>

        </form>

      </Card>


      {/* =====================================
          CASH FLOW CONTENT
      ====================================== */}

      {cashFlow && (
        <>

          {/* =================================
              PRIMARY SUMMARY
          ================================== */}

          <div className="dashboard-grid">

            {/* MONEY IN */}

            <Card>

              <p>
                Money In
              </p>


              <h3>

                <SensitiveValue>

                  {formatCurrency(
                    cashFlow
                      .totalIncome,
                  )}

                </SensitiveValue>

              </h3>

            </Card>


            {/* MONEY OUT */}

            <Card>

              <p>
                Money Out
              </p>


              <h3>

                <SensitiveValue>

                  {formatCurrency(
                    cashFlow
                      .totalExpenses,
                  )}

                </SensitiveValue>

              </h3>

            </Card>


            {/* NET CASH FLOW */}

            <Card>

              <p>
                Net Cash Flow
              </p>


              <h3>

                <SensitiveValue>

                  {formatCurrency(
                    cashFlow
                      .netCashFlow,
                  )}

                </SensitiveValue>

              </h3>


              <small
                className={
                  `cash-flow-status ${
                    cashFlow
                      .cashFlowStatus
                      ?.toLowerCase()
                  }`
                }
              >
                {
                  cashFlow
                    .cashFlowStatus
                }
              </small>

            </Card>


            {/* SAVINGS RATE */}

            <Card>

              <p>
                Savings Rate
              </p>


              <h3>

                {
                  cashFlow
                    .savingsRate !==
                  null
                    ? `${cashFlow.savingsRate}%`
                    : 'N/A'
                }

              </h3>


              <small>

                {
                  cashFlow
                    .expenseToIncomeRatio !==
                  null
                    ? `${cashFlow.expenseToIncomeRatio}% spent`
                    : 'Income required'
                }

              </small>

            </Card>

          </div>


          {/* =================================
              TRANSACTION SNAPSHOT
          ================================== */}

          <Card className="cash-flow-section">

            <div className="cash-flow-section-heading">

              <div>

                <h3>
                  Transaction Snapshot
                </h3>

                <p>
                  Activity recorded during
                  the selected period.
                </p>

              </div>


              <strong>
                {
                  cashFlow
                    .transactionCount
                } transactions
              </strong>

            </div>


            <div className="cash-flow-stat-grid">

              {/* INCOME TRANSACTIONS */}

              <div className="cash-flow-stat">

                <span>
                  Income Transactions
                </span>

                <strong>

                  {
                    cashFlow
                      .transactionBreakdown
                      ?.income ??
                    0
                  }

                </strong>

              </div>


              {/* EXPENSE TRANSACTIONS */}

              <div className="cash-flow-stat">

                <span>
                  Expense Transactions
                </span>

                <strong>

                  {
                    cashFlow
                      .transactionBreakdown
                      ?.expenses ??
                    0
                  }

                </strong>

              </div>


              {/* TRANSFERS */}

              <div className="cash-flow-stat">

                <span>
                  Transfers
                </span>

                <strong>

                  {
                    cashFlow
                      .transactionBreakdown
                      ?.transfers ??
                    0
                  }

                </strong>

              </div>


              {/* MONTHS ANALYSED */}

              <div className="cash-flow-stat">

                <span>
                  Months Analysed
                </span>

                <strong>

                  {
                    cashFlow
                      .monthlyAverages
                      ?.monthsAnalyzed ??
                    0
                  }

                </strong>

              </div>

            </div>

          </Card>


          {/* =================================
              INCOME VS EXPENSES CHART
          ================================== */}

          <Card className="cash-flow-section">

            <div className="cash-flow-section-heading">

              <div>

                <h3>
                  Income vs Expenses
                </h3>

                <p>
                  Monthly movement across
                  the selected period.
                </p>

              </div>

            </div>


            {chartData.length ===
            0 ? (

              <p>
                No monthly cash-flow data
                available.
              </p>

            ) : (

              <div className="cash-flow-chart">

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <BarChart
                    data={
                      chartData
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                    />


                    <XAxis
                      dataKey="month"
                      tickFormatter={
                        formatMonth
                      }
                    />


                    <Tooltip
                      content={
                        <CashFlowTooltip />
                      }
                    />


                    <Legend />


                    <Bar
                      dataKey="income"
                      name="Income"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                      fill="#16a34a"
                    />


                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                      fill="#dc2626"
                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

          </Card>


          {/* =================================
              NET CASH FLOW TREND
          ================================== */}

          <Card className="cash-flow-section">

            <div className="cash-flow-section-heading">

              <div>

                <h3>
                  Net Cash Flow Trend
                </h3>

                <p>
                  See whether the amount
                  remaining after expenses
                  is improving over time.
                </p>

              </div>

            </div>


            {chartData.length ===
            0 ? (

              <p>
                No trend data available.
              </p>

            ) : (

              <div className="cash-flow-chart">

                <ResponsiveContainer
                  width="100%"
                  height={280}
                >

                  <LineChart
                    data={
                      chartData
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                    />


                    <XAxis
                      dataKey="month"
                      tickFormatter={
                        formatMonth
                      }
                    />


                    <Tooltip
                      content={
                        <CashFlowTooltip />
                      }
                    />


                    <Legend />


                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net Cash Flow"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                      stroke="#2563eb"
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            )}

          </Card>


          {/* =================================
              PERIOD COMPARISON
          ================================== */}

          {cashFlow
            .comparison && (

            <Card className="cash-flow-section">

              <div className="cash-flow-section-heading">

                <div>

                  <h3>
                    Period Comparison
                  </h3>


                  <p>

                    {
                      cashFlow
                        .comparison
                        .mode ===
                      'CURRENT_MONTH_VS_PREVIOUS_MONTH'
                        ? 'Current month compared with the previous month.'
                        : 'Selected period compared with the immediately preceding equal-length period.'
                    }

                  </p>

                </div>

              </div>


              <div className="cash-flow-comparison-grid">

                {/* CURRENT PERIOD */}

                <div className="cash-flow-comparison-card">

                  <span>
                    Current Period
                  </span>


                  <small>

                    {
                      formatDate(
                        cashFlow
                          .comparison
                          .currentPeriod
                          .startDate,
                      )
                    }

                    {' — '}

                    {
                      formatDate(
                        cashFlow
                          .comparison
                          .currentPeriod
                          .endDate,
                      )
                    }

                  </small>


                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .comparison
                          .currentPeriod
                          .netCashFlow,
                      )}

                    </SensitiveValue>

                  </strong>


                  <small>
                    Net Cash Flow
                  </small>

                </div>


                {/* PREVIOUS PERIOD */}

                <div className="cash-flow-comparison-card">

                  <span>
                    Previous Period
                  </span>


                  <small>

                    {
                      formatDate(
                        cashFlow
                          .comparison
                          .previousPeriod
                          .startDate,
                      )
                    }

                    {' — '}

                    {
                      formatDate(
                        cashFlow
                          .comparison
                          .previousPeriod
                          .endDate,
                      )
                    }

                  </small>


                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .comparison
                          .previousPeriod
                          .netCashFlow,
                      )}

                    </SensitiveValue>

                  </strong>


                  <small>
                    Net Cash Flow
                  </small>

                </div>

              </div>


              {/* PERCENTAGE CHANGES */}

              <div className="cash-flow-change-grid">

                <div>

                  <span>
                    Income Change
                  </span>

                  <strong>

                    {
                      formatPercentage(
                        cashFlow
                          .comparison
                          .incomeChangePercentage,
                      )
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    Expense Change
                  </span>

                  <strong>

                    {
                      formatPercentage(
                        cashFlow
                          .comparison
                          .expenseChangePercentage,
                      )
                    }

                  </strong>

                </div>


                <div>

                  <span>
                    Net Change
                  </span>

                  <strong>

                    {
                      formatPercentage(
                        cashFlow
                          .comparison
                          .netCashFlowChangePercentage,
                      )
                    }

                  </strong>

                </div>

              </div>

            </Card>

          )}


          {/* =================================
              CURRENT MONTH PROJECTION
          ================================== */}

          {cashFlow
            .currentMonthProjection && (

            <Card className="cash-flow-section">

              <div className="cash-flow-section-heading">

                <div>

                  <h3>
                    Current Month Projection
                  </h3>

                  <p>
                    Estimated month-end
                    position using the
                    current daily run rate.
                  </p>

                </div>


                <span className="cash-flow-estimate-badge">
                  Estimate
                </span>

              </div>


              <div className="cash-flow-projection-grid">

                {/* ACTUAL INCOME */}

                <div>

                  <span>
                    Actual Income
                  </span>

                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .currentMonthProjection
                          .actualIncome,
                      )}

                    </SensitiveValue>

                  </strong>

                </div>


                {/* PROJECTED INCOME */}

                <div>

                  <span>
                    Projected Income
                  </span>

                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .currentMonthProjection
                          .projectedIncome,
                      )}

                    </SensitiveValue>

                  </strong>

                </div>


                {/* ACTUAL EXPENSES */}

                <div>

                  <span>
                    Actual Expenses
                  </span>

                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .currentMonthProjection
                          .actualExpenses,
                      )}

                    </SensitiveValue>

                  </strong>

                </div>


                {/* PROJECTED EXPENSES */}

                <div>

                  <span>
                    Projected Expenses
                  </span>

                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .currentMonthProjection
                          .projectedExpenses,
                      )}

                    </SensitiveValue>

                  </strong>

                </div>


                {/* PROJECTED NET */}

                <div>

                  <span>
                    Projected Net
                  </span>

                  <strong>

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .currentMonthProjection
                          .projectedNetCashFlow,
                      )}

                    </SensitiveValue>

                  </strong>

                </div>


                {/* DAYS REMAINING */}

                <div>

                  <span>
                    Days Remaining
                  </span>

                  <strong>

                    {
                      cashFlow
                        .currentMonthProjection
                        .daysRemaining
                    }

                  </strong>

                </div>

              </div>


              <p className="cash-flow-projection-note">

                Projection is based on
                recorded daily activity
                and is an estimate, not a
                guaranteed future result.
                Lump-sum income such as
                salary can make projected
                income appear higher than
                expected.

              </p>

            </Card>

          )}


          {/* =================================
              MONTHLY AVERAGES
          ================================== */}

          <Card className="cash-flow-section">

            <div className="cash-flow-section-heading">

              <div>

                <h3>
                  Monthly Averages
                </h3>

                <p>
                  Average performance across
                  months represented in the
                  selected data.
                </p>

              </div>

            </div>


            <div className="cash-flow-stat-grid">

              {/* AVERAGE INCOME */}

              <div className="cash-flow-stat">

                <span>
                  Average Income
                </span>

                <strong>

                  <SensitiveValue>

                    {formatCurrency(
                      cashFlow
                        .monthlyAverages
                        ?.income,
                    )}

                  </SensitiveValue>

                </strong>

              </div>


              {/* AVERAGE EXPENSES */}

              <div className="cash-flow-stat">

                <span>
                  Average Expenses
                </span>

                <strong>

                  <SensitiveValue>

                    {formatCurrency(
                      cashFlow
                        .monthlyAverages
                        ?.expenses,
                    )}

                  </SensitiveValue>

                </strong>

              </div>


              {/* AVERAGE NET */}

              <div className="cash-flow-stat">

                <span>
                  Average Net
                </span>

                <strong>

                  <SensitiveValue>

                    {formatCurrency(
                      cashFlow
                        .monthlyAverages
                        ?.netCashFlow,
                    )}

                  </SensitiveValue>

                </strong>

              </div>

            </div>

          </Card>


          {/* =================================
              MONTH INTELLIGENCE
          ================================== */}

          <div className="cash-flow-two-column">

            {/* STRONGEST MONTH */}

            <Card className="cash-flow-section">

              <h3>
                Strongest Cash Flow Month
              </h3>


              {cashFlow
                .strongestCashFlowMonth ? (
                <>

                  <strong className="cash-flow-highlight-value">

                    {
                      formatMonth(
                        cashFlow
                          .strongestCashFlowMonth
                          .month,
                      )
                    }

                  </strong>


                  <p>

                    Net cash flow:
                    {' '}

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .strongestCashFlowMonth
                          .net,
                      )}

                    </SensitiveValue>

                  </p>

                </>
              ) : (

                <p>
                  No data available.
                </p>

              )}

            </Card>


            {/* HIGHEST SPENDING MONTH */}

            <Card className="cash-flow-section">

              <h3>
                Highest Spending Month
              </h3>


              {cashFlow
                .highestSpendingMonth ? (
                <>

                  <strong className="cash-flow-highlight-value">

                    {
                      formatMonth(
                        cashFlow
                          .highestSpendingMonth
                          .month,
                      )
                    }

                  </strong>


                  <p>

                    Expenses:
                    {' '}

                    <SensitiveValue>

                      {formatCurrency(
                        cashFlow
                          .highestSpendingMonth
                          .expenses,
                      )}

                    </SensitiveValue>

                  </p>

                </>
              ) : (

                <p>
                  No data available.
                </p>

              )}

            </Card>

          </div>


          {/* =================================
              EXPENSE BREAKDOWN
          ================================== */}

          <Card className="cash-flow-section">

            <div className="cash-flow-section-heading">

              <div>

                <h3>
                  Expenses by Category
                </h3>


                {cashFlow
                  .topExpenseCategory && (

                  <p>

                    Top category:
                    {' '}

                    <strong>

                      {
                        cashFlow
                          .topExpenseCategory
                          .category
                      }

                    </strong>

                    {' · '}

                    {
                      cashFlow
                        .topExpenseCategory
                        .percentage
                    }

                    %

                  </p>

                )}

              </div>

            </div>


            {expenseCategories
              .length ===
            0 ? (

              <p>
                No expenses recorded in
                this period.
              </p>

            ) : (

              <div className="cash-flow-category-list">

                {expenseCategories.map(
                  (
                    [
                      category,
                      amount,
                    ],
                  ) => {

                    const percentage =
                      cashFlow
                        .totalExpenses >
                      0
                        ? (
                            Number(
                              amount,
                            ) /
                            cashFlow
                              .totalExpenses
                          ) *
                          100
                        : 0


                    return (

                      <div
                        key={
                          category
                        }
                        className="cash-flow-category"
                      >

                        <div className="cash-flow-category-heading">

                          <strong>
                            {
                              category
                            }
                          </strong>


                          <span>

                            <SensitiveValue>

                              {formatCurrency(
                                amount,
                              )}

                            </SensitiveValue>

                          </span>

                        </div>


                        <progress
                          value={
                            percentage
                          }
                          max="100"
                        />


                        <small>

                          {
                            percentage.toFixed(
                              1,
                            )
                          }

                          % of expenses

                        </small>

                      </div>

                    )
                  },
                )}

              </div>

            )}

          </Card>


          {/* =================================
              INCOME BREAKDOWN
          ================================== */}

          <Card className="cash-flow-section">

            <div className="cash-flow-section-heading">

              <div>

                <h3>
                  Income by Category
                </h3>


                {cashFlow
                  .topIncomeCategory && (

                  <p>

                    Top category:
                    {' '}

                    <strong>

                      {
                        cashFlow
                          .topIncomeCategory
                          .category
                      }

                    </strong>

                    {' · '}

                    {
                      cashFlow
                        .topIncomeCategory
                        .percentage
                    }

                    %

                  </p>

                )}

              </div>

            </div>


            {incomeCategories
              .length ===
            0 ? (

              <p>
                No income recorded in
                this period.
              </p>

            ) : (

              <div className="cash-flow-category-list">

                {incomeCategories.map(
                  (
                    [
                      category,
                      amount,
                    ],
                  ) => {

                    const percentage =
                      cashFlow
                        .totalIncome >
                      0
                        ? (
                            Number(
                              amount,
                            ) /
                            cashFlow
                              .totalIncome
                          ) *
                          100
                        : 0


                    return (

                      <div
                        key={
                          category
                        }
                        className="cash-flow-category"
                      >

                        <div className="cash-flow-category-heading">

                          <strong>
                            {
                              category
                            }
                          </strong>


                          <span>

                            <SensitiveValue>

                              {formatCurrency(
                                amount,
                              )}

                            </SensitiveValue>

                          </span>

                        </div>


                        <progress
                          value={
                            percentage
                          }
                          max="100"
                        />


                        <small>

                          {
                            percentage.toFixed(
                              1,
                            )
                          }

                          % of income

                        </small>

                      </div>

                    )
                  },
                )}

              </div>

            )}

          </Card>


          {/* =================================
              MULTI-CURRENCY WARNING
          ================================== */}

          {cashFlow
            .currencyInfo
            ?.hasMixedCurrencies && (

            <Card className="cash-flow-section">

              <p className="form-error">

                {
                  cashFlow
                    .currencyInfo
                    .warning
                }

              </p>

            </Card>

          )}

        </>
      )}

    </section>
  )
}


export default CashFlow