import {
  useEffect,
  useState,
} from 'react'

import Card from '../components/ui/Card'

import SensitiveValue from '../components/ui/SensitiveValue'

import {
  getPortfolio,
} from '../services/api'


function Portfolio() {
  const token =
    sessionStorage.getItem(
      'malios_token',
    )

  const [
    portfolio,
    setPortfolio,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')


  /* ========================================
     LOAD PORTFOLIO
  ======================================== */

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      try {
        setLoading(true)
        setError('')

        const data =
          await getPortfolio(token)

        if (!cancelled) {
          setPortfolio(data)
        }
      } catch (err) {
        console.error(
          'Failed to load portfolio:',
          err,
        )

        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load portfolio',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPortfolio()

    return () => {
      cancelled = true
    }
  }, [token])


  /* ========================================
     FORMATTERS
  ======================================== */

  function formatCurrency(
    value,
    currency = 'KES',
  ) {
    return new Intl.NumberFormat(
      'en-KE',
      {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      },
    ).format(
      Number(value || 0),
    )
  }


  function formatPercentage(
    value,
  ) {
    return `${Number(
      value || 0,
    ).toFixed(2)}%`
  }


  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>
          Loading portfolio...
        </p>
      </section>
    )
  }


  return (
    <section className="dashboard-page">

      <div className="page-intro">
        <p>
          Track the value,
          performance and allocation
          of your investment portfolio.
        </p>
      </div>


      {error && (
        <p
          role="alert"
          className="form-error"
        >
          {error}
        </p>
      )}


      {portfolio && (
        <>

          {/* =================================
              PORTFOLIO COUNTS
          ================================== */}

          <div className="dashboard-grid">

            <Card>
              <p>
                Investment Accounts
              </p>

              <h3>
                {
                  portfolio.accountCount ??
                  0
                }
              </h3>
            </Card>


            <Card>
              <p>
                Holdings
              </p>

              <h3>
                {
                  portfolio.holdingCount ??
                  0
                }
              </h3>
            </Card>

          </div>


          {/* =================================
              TOTALS BY CURRENCY
          ================================== */}

          {Object.entries(
            portfolio
              .totalsByCurrency ||
              {},
          ).map(
            ([
              currency,
              totals,
            ]) => (

              <Card
                key={currency}
                className="portfolio-section"
              >

                <div className="portfolio-section-heading">

                  <div>
                    <p className="eyebrow">
                      {currency}
                    </p>

                    <h3>
                      Portfolio Summary
                    </h3>
                  </div>

                </div>


                <div className="dashboard-grid">

                  <div className="portfolio-stat">

                    <span>
                      Total Invested
                    </span>

                    <strong>
                      <SensitiveValue>
                        {formatCurrency(
                          totals.totalCost,
                          currency,
                        )}
                      </SensitiveValue>
                    </strong>

                  </div>


                  <div className="portfolio-stat">

                    <span>
                      Current Value
                    </span>

                    <strong>
                      <SensitiveValue>
                        {formatCurrency(
                          totals.totalValue,
                          currency,
                        )}
                      </SensitiveValue>
                    </strong>

                  </div>


                  <div className="portfolio-stat">

                    <span>
                      Gain / Loss
                    </span>

                    <strong>
                      <SensitiveValue>
                        {formatCurrency(
                          totals.totalGainLoss,
                          currency,
                        )}
                      </SensitiveValue>
                    </strong>

                  </div>


                  <div className="portfolio-stat">

                    <span>
                      Return
                    </span>

                    <strong>
                      {formatPercentage(
                        totals
                          .returnPercentage,
                      )}
                    </strong>

                  </div>

                </div>

              </Card>

            ),
          )}


          {/* =================================
              ASSET ALLOCATION
          ================================== */}

          {Object.entries(
            portfolio
              .assetAllocation ||
              {},
          ).map(
            ([
              currency,
              allocations,
            ]) => (

              <Card
                key={currency}
                className="portfolio-section"
              >

                <h3>
                  Asset Allocation
                  {' — '}
                  {currency}
                </h3>


                {!allocations ||
                allocations.length ===
                  0 ? (

                  <p>
                    No asset allocation
                    data available.
                  </p>

                ) : (

                  <div className="portfolio-allocation-list">

                    {allocations.map(
                      (allocation) => (

                        <div
                          key={
                            allocation
                              .assetType
                          }
                          className="portfolio-allocation-item"
                        >

                          <div className="portfolio-allocation-heading">

                            <strong>
                              {String(
                                allocation
                                  .assetType,
                              ).replaceAll(
                                '_',
                                ' ',
                              )}
                            </strong>


                            <span>
                              {Number(
                                allocation
                                  .percentage ||
                                  0,
                              ).toFixed(
                                2,
                              )}
                              %
                            </span>

                          </div>


                          <div>

                            <SensitiveValue>
                              {formatCurrency(
                                allocation
                                  .value,
                                currency,
                              )}
                            </SensitiveValue>

                          </div>


                          <progress
                            value={
                              Number(
                                allocation
                                  .percentage ||
                                  0,
                              )
                            }
                            max="100"
                          />

                        </div>

                      ),
                    )}

                  </div>

                )}

              </Card>

            ),
          )}


          {Object.keys(
            portfolio
              .totalsByCurrency ||
              {},
          ).length === 0 && (

            <Card>
              <p>
                No portfolio data yet.
                Add an investment and a
                holding to begin tracking
                your portfolio.
              </p>
            </Card>

          )}

        </>
      )}

    </section>
  )
}


export default Portfolio