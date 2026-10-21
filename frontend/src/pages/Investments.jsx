import {
  useEffect,
  useState,
} from 'react'

import Card from '../components/ui/Card'

import SensitiveValue from '../components/ui/SensitiveValue'

import {
  createInvestmentAccount,
  createInvestmentHolding,
  deleteInvestmentAccount,
  deleteInvestmentHolding,
  getInvestments,
  updateInvestmentHolding,
} from '../services/api'


function Investments() {
  const token =
    sessionStorage.getItem(
      'malios_token',
    )

  const [
    accounts,
    setAccounts,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')


  /* ========================================
     ACCOUNT FORM
  ======================================== */

  const [
    accountName,
    setAccountName,
  ] = useState('')

  const [
    provider,
    setProvider,
  ] = useState('')

  const [
    currency,
    setCurrency,
  ] = useState('KES')

  const [
    creatingAccount,
    setCreatingAccount,
  ] = useState(false)


  /* ========================================
     HOLDING FORM
  ======================================== */

  const [
    selectedAccountId,
    setSelectedAccountId,
  ] = useState('')

  const [
    symbol,
    setSymbol,
  ] = useState('')

  const [
    holdingName,
    setHoldingName,
  ] = useState('')

  const [
    assetType,
    setAssetType,
  ] = useState('OTHER')

  const [
    quantity,
    setQuantity,
  ] = useState('1')

  const [
    averageCost,
    setAverageCost,
  ] = useState('')

  const [
    currentPrice,
    setCurrentPrice,
  ] = useState('')

  const [
    creatingHolding,
    setCreatingHolding,
  ] = useState(false)


  /* ========================================
     LOAD INVESTMENTS
  ======================================== */

  useEffect(() => {
    let cancelled = false

    async function loadInvestments() {
      try {
        setLoading(true)
        setError('')

        const data =
          await getInvestments(
            token,
          )

        if (!cancelled) {
          const list =
            Array.isArray(data)
              ? data
              : data.accounts ||
                data
                  .investmentAccounts ||
                []

          setAccounts(list)
        }
      } catch (err) {
        console.error(
          'Failed to load investments:',
          err,
        )

        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load investments',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInvestments()

    return () => {
      cancelled = true
    }
  }, [token])


  async function refreshInvestments() {
    const data =
      await getInvestments(
        token,
      )

    const list =
      Array.isArray(data)
        ? data
        : data.accounts ||
          data.investmentAccounts ||
          []

    setAccounts(list)
  }


  /* ========================================
     CREATE INVESTMENT ACCOUNT
  ======================================== */

  async function handleCreateAccount(
    event,
  ) {
    event.preventDefault()

    try {
      setCreatingAccount(true)
      setError('')

      await createInvestmentAccount(
        token,
        {
          name: accountName,
          provider:
            provider || null,
          currency,
        },
      )

      setAccountName('')
      setProvider('')
      setCurrency('KES')

      await refreshInvestments()
    } catch (err) {
      console.error(
        'Failed to create investment account:',
        err,
      )

      setError(
        err.message ||
          'Unable to create investment account',
      )
    } finally {
      setCreatingAccount(false)
    }
  }


  /* ========================================
     CREATE HOLDING
  ======================================== */

  async function handleCreateHolding(
    event,
  ) {
    event.preventDefault()

    try {
      setCreatingHolding(true)
      setError('')

      await createInvestmentHolding(
        token,
        selectedAccountId,
        {
          symbol,
          name: holdingName,
          assetType,

          quantity:
            Number(quantity),

          averageCost:
            Number(
              averageCost,
            ),

          currentPrice:
            Number(
              currentPrice,
            ),
        },
      )

      setSymbol('')
      setHoldingName('')
      setAssetType('OTHER')
      setQuantity('1')
      setAverageCost('')
      setCurrentPrice('')

      await refreshInvestments()
    } catch (err) {
      console.error(
        'Failed to create holding:',
        err,
      )

      setError(
        err.message ||
          'Unable to create holding',
      )
    } finally {
      setCreatingHolding(false)
    }
  }


  /* ========================================
     UPDATE HOLDING PRICE
  ======================================== */

  async function handleUpdateHolding(
    holding,
  ) {
    const value =
      window.prompt(
        `Enter the current price for ${holding.name}:`,
        String(
          holding.currentPrice ??
            '',
        ),
      )

    if (value === null) {
      return
    }

    const numericValue =
      Number(value)

    if (
      !Number.isFinite(
        numericValue,
      ) ||
      numericValue < 0
    ) {
      setError(
        'Current price must be a valid positive number.',
      )

      return
    }

    try {
      setError('')

      await updateInvestmentHolding(
        token,
        holding.id,
        {
          currentPrice:
            numericValue,
        },
      )

      await refreshInvestments()
    } catch (err) {
      setError(
        err.message ||
          'Unable to update holding',
      )
    }
  }


  /* ========================================
     DELETE HOLDING
  ======================================== */

  async function handleDeleteHolding(
    holding,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${holding.name}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteInvestmentHolding(
        token,
        holding.id,
      )

      await refreshInvestments()
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete holding',
      )
    }
  }


  /* ========================================
     DELETE INVESTMENT ACCOUNT
  ======================================== */

  async function handleDeleteAccount(
    account,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${account.name} and its holdings?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await deleteInvestmentAccount(
        token,
        account.id,
      )

      await refreshInvestments()
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete investment account',
      )
    }
  }


  /* ========================================
     FORMATTERS
  ======================================== */

  function formatCurrency(
    value,
    investmentCurrency = 'KES',
  ) {
    return new Intl.NumberFormat(
      'en-KE',
      {
        style: 'currency',
        currency:
          investmentCurrency,
        maximumFractionDigits: 2,
      },
    ).format(
      Number(value || 0),
    )
  }


  function calculateHolding(
    holding,
  ) {
    const holdingQuantity =
      Number(
        holding.quantity || 0,
      )

    const cost =
      Number(
        holding.averageCost || 0,
      )

    const price =
      Number(
        holding.currentPrice || 0,
      )

    const totalCost =
      holdingQuantity *
      cost

    const currentValue =
      holdingQuantity *
      price

    const gainLoss =
      currentValue -
      totalCost

    const returnPercentage =
      totalCost > 0
        ? (
            gainLoss /
            totalCost
          ) *
          100
        : 0

    return {
      totalCost,
      currentValue,
      gainLoss,
      returnPercentage,
    }
  }


  if (loading) {
    return (
      <section className="dashboard-page">
        <p>
          Loading investments...
        </p>
      </section>
    )
  }


  return (
    <section className="dashboard-page">

      <div className="page-intro">
        <p>
          Manage investment accounts,
          holdings and current market
          values.
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


      {/* =====================================
          CREATE INVESTMENT ACCOUNT
      ====================================== */}

      <Card className="investment-form-card">

        <h3>
          Add Investment Account
        </h3>


        <form
          className="investment-form"
          onSubmit={
            handleCreateAccount
          }
        >

          <div className="form-field">

            <label>
              Account Name
            </label>

            <input
              type="text"
              value={
                accountName
              }
              onChange={(event) =>
                setAccountName(
                  event.target.value,
                )
              }
              placeholder="e.g. Mansa-X"
              required
            />

          </div>


          <div className="form-field">

            <label>
              Provider
            </label>

            <input
              type="text"
              value={provider}
              onChange={(event) =>
                setProvider(
                  event.target.value,
                )
              }
              placeholder="e.g. Standard Investment Bank"
            />

          </div>


          <div className="form-field">

            <label>
              Currency
            </label>

            <select
              value={currency}
              onChange={(event) =>
                setCurrency(
                  event.target.value,
                )
              }
            >
              <option value="KES">
                KES
              </option>

              <option value="USD">
                USD
              </option>

              <option value="EUR">
                EUR
              </option>

              <option value="GBP">
                GBP
              </option>
            </select>

          </div>


          <button
            type="submit"
            disabled={
              creatingAccount
            }
          >
            {creatingAccount
              ? 'Creating...'
              : 'Create Investment Account'}
          </button>

        </form>

      </Card>


      {/* =====================================
          CREATE HOLDING
      ====================================== */}

      {accounts.length > 0 && (

        <Card className="investment-form-card">

          <h3>
            Add Holding
          </h3>


          <form
            className="investment-form"
            onSubmit={
              handleCreateHolding
            }
          >

            <div className="form-field">

              <label>
                Investment Account
              </label>

              <select
                value={
                  selectedAccountId
                }
                onChange={(event) =>
                  setSelectedAccountId(
                    event.target
                      .value,
                  )
                }
                required
              >

                <option value="">
                  Select account
                </option>

                {accounts.map(
                  (account) => (

                    <option
                      key={
                        account.id
                      }
                      value={
                        account.id
                      }
                    >
                      {
                        account.name
                      }
                    </option>

                  ),
                )}

              </select>

            </div>


            <div className="form-field">

              <label>
                Symbol
              </label>

              <input
                value={symbol}
                onChange={(event) =>
                  setSymbol(
                    event.target
                      .value,
                  )
                }
                placeholder="e.g. MANSAX"
                required
              />

            </div>


            <div className="form-field">

              <label>
                Holding Name
              </label>

              <input
                value={
                  holdingName
                }
                onChange={(event) =>
                  setHoldingName(
                    event.target
                      .value,
                  )
                }
                placeholder="e.g. Mansa-X Fund"
                required
              />

            </div>


            <div className="form-field">

              <label>
                Asset Type
              </label>

              <select
                value={assetType}
                onChange={(event) =>
                  setAssetType(
                    event.target
                      .value,
                  )
                }
              >
                <option value="STOCK">
                  Stock
                </option>

                <option value="BOND">
                  Bond
                </option>

                <option value="ETF">
                  ETF
                </option>

                <option value="FUND">
                  Fund
                </option>

                <option value="CRYPTO">
                  Crypto
                </option>

                <option value="REAL_ESTATE">
                  Real Estate
                </option>

                <option value="OTHER">
                  Other
                </option>
              </select>

            </div>


            <div className="form-field">

              <label>
                Quantity
              </label>

              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    event.target
                      .value,
                  )
                }
                required
              />

            </div>


            <div className="form-field">

              <label>
                Average Cost
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  averageCost
                }
                onChange={(event) =>
                  setAverageCost(
                    event.target
                      .value,
                  )
                }
                required
              />

            </div>


            <div className="form-field">

              <label>
                Current Price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  currentPrice
                }
                onChange={(event) =>
                  setCurrentPrice(
                    event.target
                      .value,
                  )
                }
                required
              />

            </div>


            <button
              type="submit"
              disabled={
                creatingHolding
              }
            >
              {creatingHolding
                ? 'Adding...'
                : 'Add Holding'}
            </button>

          </form>

        </Card>

      )}


      {/* =====================================
          INVESTMENT ACCOUNTS
      ====================================== */}

      <div className="investment-account-list">

        {accounts.length === 0 ? (

          <Card>
            <p>
              No investment accounts
              yet.
            </p>
          </Card>

        ) : (

          accounts.map(
            (account) => (

              <Card
                key={account.id}
                className="investment-account-card"
              >

                <div className="investment-account-heading">

                  <div>

                    <p className="eyebrow">
                      Investment Account
                    </p>

                    <h3>
                      {account.name}
                    </h3>

                    {account.provider && (
                      <p>
                        {
                          account.provider
                        }
                      </p>
                    )}

                  </div>


                  <button
                    type="button"
                    className="secondary-danger-button"
                    onClick={() =>
                      handleDeleteAccount(
                        account,
                      )
                    }
                  >
                    Delete Account
                  </button>

                </div>


                {!account.holdings ||
                account.holdings
                  .length === 0 ? (

                  <p>
                    No holdings in this
                    account yet.
                  </p>

                ) : (

                  <div className="investment-holdings">

                    {account.holdings.map(
                      (holding) => {
                        const values =
                          calculateHolding(
                            holding,
                          )

                        return (

                          <div
                            key={
                              holding.id
                            }
                            className="investment-holding"
                          >

                            <div className="investment-holding-heading">

                              <div>

                                <p className="eyebrow">
                                  {String(
                                    holding
                                      .assetType,
                                  ).replaceAll(
                                    '_',
                                    ' ',
                                  )}
                                </p>

                                <h4>
                                  {
                                    holding.name
                                  }
                                </h4>

                                <p>
                                  {
                                    holding.symbol
                                  }
                                </p>

                              </div>

                            </div>


                            <div className="investment-metrics">

                              <div>
                                <span>
                                  Quantity
                                </span>

                                <strong>
                                  {
                                    holding.quantity
                                  }
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Average Cost
                                </span>

                                <strong>
                                  <SensitiveValue>
                                    {formatCurrency(
                                      holding
                                        .averageCost,
                                      account
                                        .currency,
                                    )}
                                  </SensitiveValue>
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Current Price
                                </span>

                                <strong>
                                  <SensitiveValue>
                                    {formatCurrency(
                                      holding
                                        .currentPrice,
                                      account
                                        .currency,
                                    )}
                                  </SensitiveValue>
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Invested
                                </span>

                                <strong>
                                  <SensitiveValue>
                                    {formatCurrency(
                                      values
                                        .totalCost,
                                      account
                                        .currency,
                                    )}
                                  </SensitiveValue>
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Current Value
                                </span>

                                <strong>
                                  <SensitiveValue>
                                    {formatCurrency(
                                      values
                                        .currentValue,
                                      account
                                        .currency,
                                    )}
                                  </SensitiveValue>
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Gain / Loss
                                </span>

                                <strong>
                                  <SensitiveValue>
                                    {formatCurrency(
                                      values
                                        .gainLoss,
                                      account
                                        .currency,
                                    )}
                                  </SensitiveValue>
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Return
                                </span>

                                <strong>
                                  {values
                                    .returnPercentage
                                    .toFixed(
                                      2,
                                    )}
                                  %
                                </strong>
                              </div>

                            </div>


                            <div className="investment-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateHolding(
                                    holding,
                                  )
                                }
                              >
                                Update Price
                              </button>


                              <button
                                type="button"
                                className="secondary-danger-button"
                                onClick={() =>
                                  handleDeleteHolding(
                                    holding,
                                  )
                                }
                              >
                                Delete Holding
                              </button>

                            </div>

                          </div>

                        )
                      },
                    )}

                  </div>

                )}

              </Card>

            ),
          )

        )}

      </div>

    </section>
  )
}


export default Investments