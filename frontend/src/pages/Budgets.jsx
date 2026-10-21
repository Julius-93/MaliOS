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
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from '../services/api'

import {
  EXPENSE_CATEGORIES,
} from '../constants/categories'


/* ========================================
   STATUS LABELS
======================================== */

const healthStatusLabels = {
  ON_TRACK: 'On Track',
  PROJECTED_OVER: 'Projected Over',
  WARNING: 'Warning',
  EXCEEDED: 'Exceeded',
}


const periodStatusLabels = {
  UPCOMING: 'Upcoming',
  ACTIVE: 'Active',
  ENDED: 'Ended',
}


/* ========================================
   BUDGETS PAGE
======================================== */

function Budgets() {
  const navigate =
    useNavigate()


  /* ========================================
     BUDGET DATA
  ======================================== */

  const [
    budgets,
    setBudgets,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    submitting,
    setSubmitting,
  ] = useState(false)


  const [
    error,
    setError,
  ] = useState('')


  const [
    successMessage,
    setSuccessMessage,
  ] = useState('')


  /* ========================================
     CREATE FORM
  ======================================== */

  const [
    category,
    setCategory,
  ] = useState(
    EXPENSE_CATEGORIES[0],
  )


  const [
    amount,
    setAmount,
  ] = useState('')


  const [
    currency,
    setCurrency,
  ] = useState('KES')


  const [
    startDate,
    setStartDate,
  ] = useState('')


  const [
    endDate,
    setEndDate,
  ] = useState('')


  /* ========================================
     EDIT STATE
  ======================================== */

  const [
    editingBudgetId,
    setEditingBudgetId,
  ] = useState(null)


  const [
    editCategory,
    setEditCategory,
  ] = useState('')


  const [
    editAmount,
    setEditAmount,
  ] = useState('')


  const [
    editCurrency,
    setEditCurrency,
  ] = useState('KES')


  const [
    editStartDate,
    setEditStartDate,
  ] = useState('')


  const [
    editEndDate,
    setEditEndDate,
  ] = useState('')


  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false)


  /* ========================================
     AUTOMATIC MESSAGES
  ======================================== */

  useEffect(() => {
    if (!successMessage) {
      return undefined
    }


    const timeoutId =
      window.setTimeout(
        () => {
          setSuccessMessage('')
        },
        4000,
      )


    return () => {
      window.clearTimeout(
        timeoutId,
      )
    }

  }, [successMessage])


  useEffect(() => {
    if (!error) {
      return undefined
    }


    const timeoutId =
      window.setTimeout(
        () => {
          setError('')
        },
        5000,
      )


    return () => {
      window.clearTimeout(
        timeoutId,
      )
    }

  }, [error])


  /* ========================================
     GET TOKEN
  ======================================== */

  function getToken() {
    const token =
      sessionStorage.getItem(
        'malios_token',
      )


    if (!token) {
      navigate(
        '/login',
        {
          replace: true,
        },
      )

      return null
    }


    return token
  }


  /* ========================================
     LOAD BUDGETS
  ======================================== */

  useEffect(() => {
    let cancelled =
      false


    async function loadBudgets() {
      const token =
        getToken()


      if (!token) {
        return
      }


      try {
        setLoading(true)

        setError('')


        const data =
          await getBudgets(
            token,
          )


        if (!cancelled) {
          setBudgets(
            data || [],
          )
        }

      } catch (err) {
        console.error(
          'Failed to load budgets:',
          err,
        )


        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load budgets',
          )
        }

      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }


    loadBudgets()


    return () => {
      cancelled =
        true
    }

  }, [navigate])


  /* ========================================
     REFRESH BUDGETS
  ======================================== */

  async function refreshBudgets() {
    const token =
      getToken()


    if (!token) {
      return
    }


    const data =
      await getBudgets(
        token,
      )


    setBudgets(
      data || [],
    )
  }


  /* ========================================
     CREATE BUDGET
  ======================================== */

  async function handleSubmit(
    event,
  ) {
    event.preventDefault()


    const token =
      getToken()


    if (!token) {
      return
    }


    try {
      setSubmitting(true)

      setError('')

      setSuccessMessage('')


      if (
        !startDate ||
        !endDate
      ) {
        throw new Error(
          'Please select a start date and end date',
        )
      }


      if (
        endDate <
        startDate
      ) {
        throw new Error(
          'End date cannot be before start date',
        )
      }


      if (
        !amount ||
        Number(amount) <=
          0
      ) {
        throw new Error(
          'Budget amount must be greater than zero',
        )
      }


      /*
       * name remains available for display,
       * while category is now the explicit
       * transaction-matching field.
       */
      await createBudget(
        token,
        {
          name:
            category,

          category,

          amount:
            Number(
              amount,
            ),

          currency,

          startDate:
            `${startDate}T00:00:00.000Z`,

          endDate:
            `${endDate}T23:59:59.999Z`,
        },
      )


      setCategory(
        EXPENSE_CATEGORIES[0],
      )

      setAmount('')

      setCurrency('KES')

      setStartDate('')

      setEndDate('')


      setSuccessMessage(
        'Budget created successfully.',
      )


      await refreshBudgets()

    } catch (err) {
      console.error(
        'Failed to create budget:',
        err,
      )


      setError(
        err.message ||
          'Unable to create budget',
      )

    } finally {
      setSubmitting(false)
    }
  }


  /* ========================================
     START EDIT
  ======================================== */

  function handleStartEdit(
    budget,
  ) {
    setEditingBudgetId(
      budget.id,
    )


    setEditCategory(
      budget.category ||
        budget.name,
    )


    setEditAmount(
      String(
        budget.amount,
      ),
    )


    setEditCurrency(
      budget.currency,
    )


    setEditStartDate(
      budget.startDate.slice(
        0,
        10,
      ),
    )


    setEditEndDate(
      budget.endDate.slice(
        0,
        10,
      ),
    )


    setError('')
  }


  /* ========================================
     CANCEL EDIT
  ======================================== */

  function handleCancelEdit() {
    setEditingBudgetId(
      null,
    )

    setEditCategory('')

    setEditAmount('')

    setEditCurrency('KES')

    setEditStartDate('')

    setEditEndDate('')
  }


  /* ========================================
     SAVE EDIT
  ======================================== */

  async function handleSaveEdit(
    event,
    budgetId,
  ) {
    event.preventDefault()


    const token =
      getToken()


    if (!token) {
      return
    }


    try {
      setSavingEdit(true)

      setError('')

      setSuccessMessage('')


      if (
        !editStartDate ||
        !editEndDate
      ) {
        throw new Error(
          'Please select a start date and end date',
        )
      }


      if (
        editEndDate <
        editStartDate
      ) {
        throw new Error(
          'End date cannot be before start date',
        )
      }


      if (
        !editAmount ||
        Number(
          editAmount,
        ) <= 0
      ) {
        throw new Error(
          'Budget amount must be greater than zero',
        )
      }


      await updateBudget(
        token,
        budgetId,
        {
          name:
            editCategory,

          category:
            editCategory,

          amount:
            Number(
              editAmount,
            ),

          currency:
            editCurrency,

          startDate:
            `${editStartDate}T00:00:00.000Z`,

          endDate:
            `${editEndDate}T23:59:59.999Z`,
        },
      )


      handleCancelEdit()


      setSuccessMessage(
        'Budget updated successfully.',
      )


      await refreshBudgets()

    } catch (err) {
      console.error(
        'Failed to update budget:',
        err,
      )


      setError(
        err.message ||
          'Unable to update budget',
      )

    } finally {
      setSavingEdit(false)
    }
  }


  /* ========================================
     DELETE BUDGET
  ======================================== */

  async function handleDelete(
    budgetId,
  ) {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this budget?',
      )


    if (!confirmed) {
      return
    }


    const token =
      getToken()


    if (!token) {
      return
    }


    try {
      setError('')

      setSuccessMessage('')


      await deleteBudget(
        token,
        budgetId,
      )


      setSuccessMessage(
        'Budget deleted successfully.',
      )


      await refreshBudgets()

    } catch (err) {
      console.error(
        'Failed to delete budget:',
        err,
      )


      setError(
        err.message ||
          'Unable to delete budget',
      )
    }
  }


  /* ========================================
     MONEY FORMATTER
  ======================================== */

  function formatCurrency(
    value,
    budgetCurrency,
  ) {
    return new Intl.NumberFormat(
      'en-KE',
      {
        style:
          'currency',

        currency:
          budgetCurrency,

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
     STATUS HELPERS
  ======================================== */

  function getHealthStatusLabel(
    status,
  ) {
    return (
      healthStatusLabels[
        status
      ] ||
      status
    )
  }


  function getPeriodStatusLabel(
    status,
  ) {
    return (
      periodStatusLabels[
        status
      ] ||
      status
    )
  }


  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <section className="dashboard-page">

        <p>
          Loading budgets...
        </p>

      </section>
    )
  }


  /* ========================================
     PAGE
  ======================================== */

  return (
    <section className="dashboard-page">


      {/* ====================================
          INTRO
      ==================================== */}

      <div className="page-intro">

        <p>
          Set category-based spending
          limits and monitor how your
          actual spending compares with
          your plan.
        </p>

      </div>


      {/* ====================================
          MESSAGES
      ==================================== */}

      {error && (

        <p
          role="alert"
          className="form-error"
        >
          {error}
        </p>

      )}


      {successMessage && (

        <div className="success-message">

          {successMessage}

        </div>

      )}


      {/* ====================================
          CREATE BUDGET
      ==================================== */}

      <Card className="budget-form-card">

        <h3>
          Create Budget
        </h3>


        <form
          className="budget-form"
          onSubmit={
            handleSubmit
          }
        >

          {/* CATEGORY */}

          <div className="form-field">

            <label htmlFor="budget-category">
              Category
            </label>


            <select
              id="budget-category"
              value={
                category
              }
              onChange={(
                event,
              ) =>
                setCategory(
                  event.target.value,
                )
              }
            >

              {EXPENSE_CATEGORIES.map(
                (
                  expenseCategory,
                ) => (

                  <option
                    key={
                      expenseCategory
                    }
                    value={
                      expenseCategory
                    }
                  >
                    {
                      expenseCategory
                    }
                  </option>

                ),
              )}

            </select>

          </div>


          {/* AMOUNT */}

          <div className="form-field">

            <label htmlFor="budget-amount">
              Budget Amount
            </label>


            <input
              id="budget-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={
                amount
              }
              onChange={(
                event,
              ) =>
                setAmount(
                  event.target.value,
                )
              }
              placeholder="e.g. 8000"
              required
            />

          </div>


          {/* CURRENCY */}

          <div className="form-field">

            <label htmlFor="budget-currency">
              Currency
            </label>


            <select
              id="budget-currency"
              value={
                currency
              }
              onChange={(
                event,
              ) =>
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


          {/* START DATE */}

          <div className="form-field">

            <label htmlFor="budget-start-date">
              Start Date
            </label>


            <input
              id="budget-start-date"
              type="date"
              value={
                startDate
              }
              onChange={(
                event,
              ) =>
                setStartDate(
                  event.target.value,
                )
              }
              required
            />

          </div>


          {/* END DATE */}

          <div className="form-field">

            <label htmlFor="budget-end-date">
              End Date
            </label>


            <input
              id="budget-end-date"
              type="date"
              value={
                endDate
              }
              min={
                startDate ||
                undefined
              }
              onChange={(
                event,
              ) =>
                setEndDate(
                  event.target.value,
                )
              }
              required
            />

          </div>


          {/* SUBMIT */}

          <div className="form-field">

            <label>
              &nbsp;
            </label>


            <button
              type="submit"
              disabled={
                submitting
              }
            >

              {submitting
                ? 'Creating...'
                : 'Create Budget'}

            </button>

          </div>

        </form>

      </Card>


      {/* ====================================
          BUDGET LIST
      ==================================== */}

      <div className="budgets-list">

        {budgets.length ===
        0 ? (

          <Card>

            <div className="budget-empty-state">

              <h3>
                No budgets yet
              </h3>


              <p>

                Create your first category
                budget above. MaliOS will
                automatically match expenses
                in that category and calculate
                your spending progress.

              </p>

            </div>

          </Card>

        ) : (

          budgets.map(
            (
              budget,
            ) => {
              const percentageUsed =
                Number(
                  budget.percentageUsed ??
                    0,
                )


              const progress =
                Math.min(
                  Math.max(
                    percentageUsed,
                    0,
                  ),
                  100,
                )


              const isEditing =
                editingBudgetId ===
                budget.id


              const healthStatus =
                budget.healthStatus ||
                'ON_TRACK'


              const periodStatus =
                budget.periodStatus ||
                'ACTIVE'


              const projectedOverAmount =
                Number(
                  budget.projectedRemaining ??
                    0,
                ) <
                0
                  ? Math.abs(
                      Number(
                        budget.projectedRemaining,
                      ),
                    )
                  : 0


              return (
                <Card
                  key={
                    budget.id
                  }
                  className="budget-card"
                >

                  {isEditing ? (

                    /* ========================
                       EDIT MODE
                    ======================== */

                    <form
                      className="budget-form"
                      onSubmit={(
                        event,
                      ) =>
                        handleSaveEdit(
                          event,
                          budget.id,
                        )
                      }
                    >

                      <div className="form-field">

                        <label>
                          Category
                        </label>


                        <select
                          value={
                            editCategory
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditCategory(
                              event.target.value,
                            )
                          }
                        >

                          {EXPENSE_CATEGORIES.map(
                            (
                              expenseCategory,
                            ) => (

                              <option
                                key={
                                  expenseCategory
                                }
                                value={
                                  expenseCategory
                                }
                              >
                                {
                                  expenseCategory
                                }
                              </option>

                            ),
                          )}

                        </select>

                      </div>


                      <div className="form-field">

                        <label>
                          Budget Amount
                        </label>


                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            editAmount
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditAmount(
                              event.target.value,
                            )
                          }
                          required
                        />

                      </div>


                      <div className="form-field">

                        <label>
                          Currency
                        </label>


                        <select
                          value={
                            editCurrency
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditCurrency(
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


                      <div className="form-field">

                        <label>
                          Start Date
                        </label>


                        <input
                          type="date"
                          value={
                            editStartDate
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditStartDate(
                              event.target.value,
                            )
                          }
                          required
                        />

                      </div>


                      <div className="form-field">

                        <label>
                          End Date
                        </label>


                        <input
                          type="date"
                          value={
                            editEndDate
                          }
                          min={
                            editStartDate ||
                            undefined
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditEndDate(
                              event.target.value,
                            )
                          }
                          required
                        />

                      </div>


                      <div className="budget-actions">

                        <button
                          type="submit"
                          disabled={
                            savingEdit
                          }
                        >

                          {savingEdit
                            ? 'Saving...'
                            : 'Save Changes'}

                        </button>


                        <button
                          type="button"
                          className="secondary-button"
                          onClick={
                            handleCancelEdit
                          }
                          disabled={
                            savingEdit
                          }
                        >
                          Cancel
                        </button>

                      </div>

                    </form>

                  ) : (

                    /* ========================
                       DISPLAY MODE
                    ======================== */

                    <>

                      {/* HEADER */}

                      <div className="budget-card-header">

                        <div>

                          <p className="eyebrow">
                            Budget
                          </p>


                          <h3>
                            {
                              budget.category ||
                              budget.name
                            }
                          </h3>

                        </div>


                        <div className="budget-status-group">

                          <span
                            className={
                              `budget-period-status ` +
                              `${String(
                                periodStatus,
                              ).toLowerCase()}`
                            }
                          >

                            {getPeriodStatusLabel(
                              periodStatus,
                            )}

                          </span>


                          <span
                            className={
                              `budget-health-status ` +
                              `${String(
                                healthStatus,
                              )
                                .toLowerCase()
                                .replaceAll(
                                  '_',
                                  '-',
                                )}`
                            }
                          >

                            {getHealthStatusLabel(
                              healthStatus,
                            )}

                          </span>

                        </div>

                      </div>


                      {/* CORE VALUES */}

                      <div className="budget-metrics">

                        <div>

                          <span>
                            Budget
                          </span>


                          <strong>

                            <SensitiveValue>

                              {formatCurrency(
                                budget.amount,
                                budget.currency,
                              )}

                            </SensitiveValue>

                          </strong>

                        </div>


                        <div>

                          <span>
                            Spent
                          </span>


                          <strong>

                            <SensitiveValue>

                              {formatCurrency(
                                budget.spent,
                                budget.currency,
                              )}

                            </SensitiveValue>

                          </strong>

                        </div>


                        <div>

                          <span>
                            {Number(
                              budget.remaining,
                            ) <
                            0
                              ? 'Over Budget'
                              : 'Remaining'}
                          </span>


                          <strong>

                            <SensitiveValue>

                              {formatCurrency(
                                Math.abs(
                                  Number(
                                    budget.remaining,
                                  ),
                                ),
                                budget.currency,
                              )}

                            </SensitiveValue>

                          </strong>

                        </div>

                      </div>


                      {/* PROGRESS */}

                      <div className="budget-progress-section">

                        <div className="budget-progress-heading">

                          <span>
                            Budget usage
                          </span>


                          <strong>
                            {percentageUsed.toFixed(
                              1,
                            )}
                            %
                          </strong>

                        </div>


                        <progress
                          className={
                            `budget-progress ` +
                            `${String(
                              healthStatus,
                            )
                              .toLowerCase()
                              .replaceAll(
                                '_',
                                '-',
                              )}`
                          }
                          value={
                            progress
                          }
                          max="100"
                        />

                      </div>


                      {/* ANALYTICS */}

                      <div className="budget-analytics-grid">

                        <div>

                          <span>
                            Days Remaining
                          </span>


                          <strong>
                            {
                              budget.daysRemaining ??
                              0
                            }
                          </strong>

                        </div>


                        <div>

                          <span>
                            Daily Spend Rate
                          </span>


                          <strong>

                            <SensitiveValue>

                              {formatCurrency(
                                budget.dailySpendRate,
                                budget.currency,
                              )}

                            </SensitiveValue>

                          </strong>

                        </div>


                        <div>

                          <span>
                            Projected Spend
                          </span>


                          <strong>

                            <SensitiveValue>

                              {formatCurrency(
                                budget.projectedSpend,
                                budget.currency,
                              )}

                            </SensitiveValue>

                          </strong>

                        </div>

                      </div>


                      {/* PROJECTED OVERSPEND */}

                      {projectedOverAmount >
                        0 && (

                        <div className="budget-projection-warning">

                          <strong>
                            Projected overspend
                          </strong>


                          <p>

                            At the current spending
                            rate, this budget may
                            exceed its limit by{' '}

                            <SensitiveValue>

                              {formatCurrency(
                                projectedOverAmount,
                                budget.currency,
                              )}

                            </SensitiveValue>

                            .

                          </p>

                        </div>

                      )}


                      {/* DATE RANGE */}

                      <div className="budget-date-range">

                        <small>

                          {budget.startDate.slice(
                            0,
                            10,
                          )}

                          {' — '}

                          {budget.endDate.slice(
                            0,
                            10,
                          )}

                        </small>

                      </div>


                      {/* ACTIONS */}

                      <div className="budget-actions">

                        <button
                          type="button"
                          onClick={() =>
                            handleStartEdit(
                              budget,
                            )
                          }
                        >
                          Edit Budget
                        </button>


                        <button
                          type="button"
                          className="secondary-danger-button"
                          onClick={() =>
                            handleDelete(
                              budget.id,
                            )
                          }
                        >
                          Delete Budget
                        </button>

                      </div>

                    </>

                  )}

                </Card>
              )
            },
          )

        )}

      </div>

    </section>
  )
}


export default Budgets