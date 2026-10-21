import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import Card from '../components/ui/Card'

import SensitiveValue from '../components/ui/SensitiveValue'

import {
  getFinancialInsights,
  getFinancialSummary,
} from '../services/api'


/* ========================================
   FINANCIAL HEALTH LABELS
======================================== */

const healthGradeLabels = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',

  NEEDS_ATTENTION:
    'Needs Attention',
}


const dataStatusLabels = {
  SUFFICIENT:
    'Current financial data available',

  LIMITED_CURRENT_MONTH_DATA:
    'Limited current-month data',

  LIMITED_DATA:
    'Limited financial data',
}


const insightTypeLabels = {
  CASH_FLOW:
    'Cash Flow',

  SAVINGS:
    'Savings',

  SPENDING:
    'Spending',

  BALANCE:
    'Accounts',

  BUDGET:
    'Budgets',

  GOAL:
    'Goals',

  INVESTMENT:
    'Investments',
}


/* ========================================
   DASHBOARD
======================================== */

function Dashboard() {
  const navigate =
    useNavigate()


  /* ========================================
     SUMMARY STATE
  ======================================== */

  const [
    summary,
    setSummary,
  ] = useState(null)


  /* ========================================
     INSIGHTS STATE
  ======================================== */

  const [
    insights,
    setInsights,
  ] = useState(null)


  const [
    insightsError,
    setInsightsError,
  ] = useState('')


  /* ========================================
     LOADING STATE
  ======================================== */

  const [
    loading,
    setLoading,
  ] = useState(true)


  /* ========================================
     LOAD DASHBOARD DATA
  ======================================== */

  useEffect(() => {
    async function loadDashboard() {
      const token =
        sessionStorage.getItem(
          'malios_token',
        )


      /*
       * No authenticated session.
       */
      if (!token) {
        navigate(
          '/login',
          {
            replace: true,
          },
        )

        return
      }


      try {
        setLoading(true)

        setInsightsError('')


        /*
         * Financial summary is the core
         * Dashboard data.
         */
        const summaryData =
          await getFinancialSummary(
            token,
          )


        setSummary(
          summaryData,
        )


        /*
         * Financial insights are loaded
         * separately so the rest of the
         * Dashboard can still work if the
         * insights endpoint temporarily fails.
         */
        try {
          const insightData =
            await getFinancialInsights(
              token,
            )


          setInsights(
            insightData,
          )

        } catch (error) {
          console.error(
            'Unable to load financial insights:',
            error,
          )


          setInsightsError(
            'Financial insights are temporarily unavailable.',
          )
        }

      } catch (error) {
        console.error(
          'Unable to load dashboard:',
          error,
        )


        /*
         * Preserve the current MaliOS
         * authentication behaviour.
         */
        sessionStorage.removeItem(
          'malios_token',
        )


        navigate(
          '/login',
          {
            replace: true,
          },
        )

      } finally {
        setLoading(false)
      }
    }


    loadDashboard()

  }, [navigate])


  /* ========================================
     MONEY FORMATTING
  ======================================== */

  function formatCurrency(
    value,
  ) {
    return new Intl.NumberFormat(
      'en-KE',
      {
        style:
          'currency',

        currency:
          'KES',

        maximumFractionDigits:
          0,
      },
    ).format(
      Number(
        value || 0,
      ),
    )
  }


  /* ========================================
     HEALTH GRADE
  ======================================== */

  function getHealthGradeLabel(
    grade,
  ) {
    return (
      healthGradeLabels[
        grade
      ] ||
      grade ||
      'Unavailable'
    )
  }


  /* ========================================
     DATA STATUS
  ======================================== */

  function getDataStatusLabel(
    status,
  ) {
    return (
      dataStatusLabels[
        status
      ] ||
      'Financial data status unavailable'
    )
  }


  /* ========================================
     INSIGHT TYPE
  ======================================== */

  function getInsightTypeLabel(
    type,
  ) {
    return (
      insightTypeLabels[
        type
      ] ||
      type
    )
  }


  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div className="dashboard-page">

        <p>
          Loading dashboard...
        </p>

      </div>
    )
  }


  if (!summary) {
    return null
  }


  /* ========================================
     FINANCIAL HEALTH VALUES
  ======================================== */

  const healthScore =
    Number(
      insights
        ?.financialHealthScore ??
        0,
    )


  const scoreConfidence =
    Number(
      insights
        ?.scoreConfidence ??
        0,
    )


  const healthGrade =
    getHealthGradeLabel(
      insights
        ?.financialHealthGrade,
    )


  const dataStatus =
    getDataStatusLabel(
      insights
        ?.dataStatus,
    )


  const financialInsights =
    insights
      ?.insights ||
    []


  /* ========================================
     DASHBOARD UI
  ======================================== */

  return (
    <div className="dashboard-page">


      {/* ====================================
          DASHBOARD INTRO
      ==================================== */}

      <div className="dashboard-heading">

        <p className="eyebrow">
          Financial Overview
        </p>


        <h2>
          Welcome back
        </h2>


        <p>
          Here is an overview of your
          current financial position.
        </p>

      </div>


      {/* ====================================
          SUMMARY CARDS
      ==================================== */}

      <div className="dashboard-grid">


        {/* NET WORTH */}

        <Card>

          <div className="summary-card">

            <span className="summary-label">
              Net Worth
            </span>


            <strong className="summary-value">

              <SensitiveValue>

                {formatCurrency(
                  summary.netWorth,
                )}

              </SensitiveValue>

            </strong>


            <p className="summary-description">

              Total value across your
              financial accounts.

            </p>

          </div>

        </Card>


        {/* AVAILABLE BALANCE */}

        <Card>

          <div className="summary-card">

            <span className="summary-label">
              Available Balance
            </span>


            <strong className="summary-value">

              <SensitiveValue>

                {formatCurrency(
                  summary.availableBalance,
                )}

              </SensitiveValue>

            </strong>


            <p className="summary-description">

              Current available balance
              across your accounts.

            </p>

          </div>

        </Card>


        {/* INCOME */}

        <Card>

          <div className="summary-card">

            <span className="summary-label">
              Income
            </span>


            <strong className="summary-value">

              <SensitiveValue>

                {formatCurrency(
                  summary.totalIncome,
                )}

              </SensitiveValue>

            </strong>


            <p className="summary-description">

              Total recorded income.

            </p>

          </div>

        </Card>


        {/* EXPENSES */}

        <Card>

          <div className="summary-card">

            <span className="summary-label">
              Expenses
            </span>


            <strong className="summary-value">

              <SensitiveValue>

                {formatCurrency(
                  summary.totalExpenses,
                )}

              </SensitiveValue>

            </strong>


            <p className="summary-description">

              Total recorded expenses.

            </p>

          </div>

        </Card>

      </div>


      {/* ====================================
          FINANCIAL HEALTH
      ==================================== */}

      <Card>

        <section className="financial-insights-section">


          {/* ==================================
              SECTION HEADING
          ================================== */}

          <div className="financial-insights-heading">

            <div>

              <p className="eyebrow">
                Financial Health
              </p>


              <h3>
                Financial Insights
              </h3>


              <p>

                MaliOS analyses your
                accounts, transactions,
                budgets, goals and
                investments to identify
                useful financial trends.

              </p>

            </div>


            {insights && (

              <span
                className={
                  `financial-data-status ` +
                  `${String(
                    insights.dataStatus,
                  )
                    .toLowerCase()
                    .replaceAll(
                      '_',
                      '-',
                    )}`
                }
              >

                {dataStatus}

              </span>

            )}

          </div>


          {/* ==================================
              INSIGHTS ERROR
          ================================== */}

          {insightsError && (

            <div className="financial-insights-error">

              {insightsError}

            </div>

          )}


          {/* ==================================
              HEALTH OVERVIEW
          ================================== */}

          {insights && (

            <div className="financial-health-overview">


              {/* HEALTH SCORE */}

              <div className="financial-health-score-card">

                <span className="financial-health-metric-label">

                  Financial Health Score

                </span>


                <div className="financial-health-score-value">

                  <strong>
                    {healthScore}
                  </strong>

                  <span>
                    /100
                  </span>

                </div>


                <div className="financial-health-score-track">

                  <div
                    className="financial-health-score-progress"
                    style={{
                      width:
                        `${Math.min(
                          Math.max(
                            healthScore,
                            0,
                          ),
                          100,
                        )}%`,
                    }}
                  />

                </div>

              </div>


              {/* HEALTH GRADE */}

              <div className="financial-health-metric">

                <span className="financial-health-metric-label">

                  Health Grade

                </span>


                <strong
                  className={
                    `financial-health-grade ` +
                    `${String(
                      insights
                        .financialHealthGrade,
                    ).toLowerCase()}`
                  }
                >

                  {healthGrade}

                </strong>


                <p>
                  Overall assessment based
                  on the financial data
                  currently available.
                </p>

              </div>


              {/* SCORE CONFIDENCE */}

              <div className="financial-health-metric">

                <span className="financial-health-metric-label">

                  Score Confidence

                </span>


                <strong className="financial-health-confidence">

                  {scoreConfidence}%

                </strong>


                <p>

                  Confidence increases as
                  more current financial
                  activity is recorded.

                </p>

              </div>

            </div>

          )}


          {/* ==================================
              LIMITED DATA NOTICE
          ================================== */}

          {insights &&
            insights.dataStatus ===
              'LIMITED_CURRENT_MONTH_DATA' && (

              <div className="financial-data-notice">

                <strong>
                  Current-month data is limited
                </strong>


                <p>

                  Your health score also uses
                  account balances, goals and
                  investments, but there are no
                  income or expense transactions
                  recorded for the current month
                  yet.

                </p>

              </div>

            )}


          {/* ==================================
              INSIGHT CARDS
          ================================== */}

          {insights &&
            financialInsights.length >
              0 && (

              <div className="financial-insight-list">

                {financialInsights.map(
                  (
                    insight,
                  ) => (

                    <article
                      key={
                        insight.id
                      }
                      className={
                        `financial-insight-item ` +
                        `${String(
                          insight.severity,
                        ).toLowerCase()}`
                      }
                    >

                      <span
                        className={
                          `financial-insight-indicator ` +
                          `${String(
                            insight.severity,
                          ).toLowerCase()}`
                        }
                      />


                      <div className="financial-insight-content">

                        <div className="financial-insight-title-row">

                          <div>

                            <span className="financial-insight-type">

                              {getInsightTypeLabel(
                                insight.type,
                              )}

                            </span>


                            <strong>

                              {insight.title}

                            </strong>

                          </div>


                          <span
                            className={
                              `financial-insight-severity ` +
                              `${String(
                                insight.severity,
                              ).toLowerCase()}`
                            }
                          >

                            {String(
                              insight.severity,
                            ).replaceAll(
                              '_',
                              ' ',
                            )}

                          </span>

                        </div>


                        <p>

                          {insight.message}

                        </p>

                      </div>

                    </article>

                  ),
                )}

              </div>

            )}


          {/* ==================================
              EMPTY INSIGHTS
          ================================== */}

          {insights &&
            financialInsights.length ===
              0 && (

              <div className="financial-insights-empty">

                No financial insights are
                available yet.

              </div>

            )}

        </section>

      </Card>

    </div>
  )
}


export default Dashboard