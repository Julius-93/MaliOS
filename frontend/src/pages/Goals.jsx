import { useEffect, useState } from 'react'

import SensitiveValue from '../components/ui/SensitiveValue'

import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
} from '../services/api'


const GOAL_STATUSES = [
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
]


function Goals() {
  const [goals, setGoals] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')


  // New goal form
  const [name, setName] =
    useState('')

  const [targetAmount, setTargetAmount] =
    useState('')

  const [currentAmount, setCurrentAmount] =
    useState('')

  const [currency, setCurrency] =
    useState('KES')

  const [targetDate, setTargetDate] =
    useState('')

  const [status, setStatus] =
    useState('ACTIVE')

  const [notes, setNotes] =
    useState('')


  // Edit state
  const [
    editingGoalId,
    setEditingGoalId,
  ] = useState(null)

  const [editName, setEditName] =
    useState('')

  const [
    editTargetAmount,
    setEditTargetAmount,
  ] = useState('')

  const [editCurrency, setEditCurrency] =
    useState('KES')

  const [
    editTargetDate,
    setEditTargetDate,
  ] = useState('')

  const [editStatus, setEditStatus] =
    useState('ACTIVE')

  const [editNotes, setEditNotes] =
    useState('')

  const [savingEdit, setSavingEdit] =
    useState(false)


  // Savings contribution state
  const [
    contributionGoalId,
    setContributionGoalId,
  ] = useState(null)

  const [
    contributionAmount,
    setContributionAmount,
  ] = useState('')

  const [
    savingContribution,
    setSavingContribution,
  ] = useState(false)


  useEffect(() => {
    loadGoals()
  }, [])


  async function loadGoals() {
    try {
      setLoading(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await getGoals(token)

      setGoals(data)
    } catch (err) {
      setError(
        err.message ||
          'Unable to load financial goals',
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleCreate(event) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      await createGoal(
        token,
        {
          name,

          targetAmount:
            Number(targetAmount),

          currentAmount:
            Number(
              currentAmount || 0,
            ),

          currency:
            currency.toUpperCase(),

          targetDate:
            targetDate
              ? `${targetDate}T23:59:59.999Z`
              : null,

          status,

          notes:
            notes.trim() || null,
        },
      )

      setName('')
      setTargetAmount('')
      setCurrentAmount('')
      setCurrency('KES')
      setTargetDate('')
      setStatus('ACTIVE')
      setNotes('')

      await loadGoals()
    } catch (err) {
      setError(
        err.message ||
          'Unable to create financial goal',
      )
    } finally {
      setSubmitting(false)
    }
  }


  function startEditing(goal) {
    setEditingGoalId(goal.id)

    setEditName(goal.name)

    setEditTargetAmount(
      String(goal.targetAmount),
    )

    setEditCurrency(
      goal.currency,
    )

    setEditTargetDate(
      goal.targetDate
        ? goal.targetDate.slice(
            0,
            10,
          )
        : '',
    )

    setEditStatus(goal.status)

    setEditNotes(
      goal.notes || '',
    )
  }


  function cancelEditing() {
    setEditingGoalId(null)
  }


  async function handleSaveEdit(
    goalId,
  ) {
    try {
      setSavingEdit(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      await updateGoal(
        token,
        goalId,
        {
          name: editName,

          targetAmount:
            Number(
              editTargetAmount,
            ),

          currency:
            editCurrency.toUpperCase(),

          targetDate:
            editTargetDate
              ? `${editTargetDate}T23:59:59.999Z`
              : null,

          status:
            editStatus,

          notes:
            editNotes.trim() ||
            null,
        },
      )

      setEditingGoalId(null)

      await loadGoals()
    } catch (err) {
      setError(
        err.message ||
          'Unable to update financial goal',
      )
    } finally {
      setSavingEdit(false)
    }
  }


  function openContribution(goalId) {
    setContributionGoalId(
      goalId,
    )

    setContributionAmount('')
  }


  function cancelContribution() {
    setContributionGoalId(null)
    setContributionAmount('')
  }


  async function handleContribution(
    goal,
  ) {
    const amount =
      Number(
        contributionAmount,
      )

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        'Savings contribution must be greater than zero.',
      )

      return
    }

    try {
      setSavingContribution(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const newCurrentAmount =
        Number(goal.currentAmount) +
        amount

      await updateGoal(
        token,
        goal.id,
        {
          currentAmount:
            newCurrentAmount,
        },
      )

      setContributionGoalId(null)
      setContributionAmount('')

      await loadGoals()
    } catch (err) {
      setError(
        err.message ||
          'Unable to update goal savings',
      )
    } finally {
      setSavingContribution(false)
    }
  }


  async function handleDelete(goal) {
    const confirmed =
      window.confirm(
        `Delete ${goal.name}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      await deleteGoal(
        token,
        goal.id,
      )

      await loadGoals()
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete financial goal',
      )
    }
  }


  function formatMoney(
    value,
    currencyCode = 'KES',
  ) {
    return new Intl.NumberFormat(
      'en-KE',
      {
        style: 'currency',
        currency:
          currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(Number(value || 0))
  }


  function formatStatus(value) {
    return value
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      )
  }


  function formatDate(value) {
    if (!value) {
      return 'No target date'
    }

    return new Intl.DateTimeFormat(
      'en-KE',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      },
    ).format(new Date(value))
  }


  if (loading) {
    return (
      <p>
        Loading financial goals...
      </p>
    )
  }


  return (
    <div className="goals-page">

      <div className="page-intro">
        <p>
          Set savings targets, track
          progress and build towards your
          financial objectives.
        </p>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      <section className="card goal-form-card">

        <h3>
          Create Financial Goal
        </h3>

        <form
          className="goal-form"
          onSubmit={handleCreate}
        >

          <div className="form-field">
            <label>Goal Name</label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="e.g. Emergency Fund"
              required
            />
          </div>


          <div className="form-field">
            <label>
              Target Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={targetAmount}
              onChange={(event) =>
                setTargetAmount(
                  event.target.value,
                )
              }
              placeholder="300000"
              required
            />
          </div>


          <div className="form-field">
            <label>
              Already Saved
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(event) =>
                setCurrentAmount(
                  event.target.value,
                )
              }
              placeholder="0"
            />
          </div>


          <div className="form-field">
            <label>Currency</label>

            <input
              type="text"
              maxLength="3"
              value={currency}
              onChange={(event) =>
                setCurrency(
                  event.target.value,
                )
              }
              required
            />
          </div>


          <div className="form-field">
            <label>
              Target Date
            </label>

            <input
              type="date"
              value={targetDate}
              onChange={(event) =>
                setTargetDate(
                  event.target.value,
                )
              }
            />
          </div>


          <div className="form-field">
            <label>Status</label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value,
                )
              }
            >
              {GOAL_STATUSES.map(
                (goalStatus) => (
                  <option
                    key={goalStatus}
                    value={goalStatus}
                  >
                    {formatStatus(
                      goalStatus,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>


          <div className="form-field goal-notes-field">
            <label>Notes</label>

            <textarea
              rows="3"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder="What is this goal for?"
            />
          </div>


          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating...'
              : 'Create Goal'}
          </button>

        </form>
      </section>


      <section className="goals-list-section">

        <div className="section-heading">

          <div>
            <span className="section-label">
              Financial Plan
            </span>

            <h3>
              Your Goals
            </h3>
          </div>

          <span className="goal-count">
            {goals.length}{' '}
            {goals.length === 1
              ? 'goal'
              : 'goals'}
          </span>

        </div>


        {goals.length === 0 ? (
          <div className="card empty-state">

            <h3>No goals yet</h3>

            <p>
              Create your first financial
              goal to start tracking your
              progress.
            </p>

          </div>
        ) : (
          <div className="goals-list">

            {goals.map((goal) => {

              const isEditing =
                editingGoalId ===
                goal.id

              const isContributing =
                contributionGoalId ===
                goal.id

              return (
                <article
                  className="card goal-card"
                  key={goal.id}
                >

                  <div className="goal-card-header">

                    <div>
                      <span className="goal-label">
                        Financial Goal
                      </span>

                      <h3>
                        {goal.name}
                      </h3>

                      <p>
                        Target:{' '}
                        {formatDate(
                          goal.targetDate,
                        )}
                      </p>
                    </div>


                    <span
                      className={`goal-status goal-status-${goal.status.toLowerCase()}`}
                    >
                      {formatStatus(
                        goal.status,
                      )}
                    </span>

                  </div>


                  {!isEditing ? (
                    <>
                      <div className="goal-metrics">

                        <div>
                          <span>
                            Target
                          </span>

                          <strong>
                            <SensitiveValue>
                              {formatMoney(
                                goal.targetAmount,
                                goal.currency,
                              )}
                            </SensitiveValue>
                          </strong>
                        </div>


                        <div>
                          <span>
                            Saved
                          </span>

                          <strong>
                            <SensitiveValue>
                              {formatMoney(
                                goal.currentAmount,
                                goal.currency,
                              )}
                            </SensitiveValue>
                          </strong>
                        </div>


                        <div>
                          <span>
                            Remaining
                          </span>

                          <strong>
                            <SensitiveValue>
                              {formatMoney(
                                goal.remainingAmount,
                                goal.currency,
                              )}
                            </SensitiveValue>
                          </strong>
                        </div>


                        <div>
                          <span>
                            Progress
                          </span>

                          <strong>
                            {Number(
                              goal.progressPercentage,
                            ).toFixed(
                              2,
                            )}
                            %
                          </strong>
                        </div>

                      </div>


                      <div className="goal-progress-wrapper">

                        <div className="goal-progress-heading">
                          <span>
                            Savings Progress
                          </span>

                          <strong>
                            {Number(
                              goal.progressPercentage,
                            ).toFixed(
                              2,
                            )}
                            %
                          </strong>
                        </div>


                        <div className="goal-progress">

                          <div
                            className="goal-progress-fill"
                            style={{
                              width: `${Math.min(
                                Number(
                                  goal.progressPercentage,
                                ),
                                100,
                              )}%`,
                            }}
                          />

                        </div>

                      </div>


                      {goal.notes && (
                        <div className="goal-notes">

                          <span>
                            Notes
                          </span>

                          <p>
                            {goal.notes}
                          </p>

                        </div>
                      )}


                      {isContributing && (
                        <div className="goal-contribution">

                          <div className="form-field">
                            <label>
                              Add Savings
                            </label>

                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                contributionAmount
                              }
                              onChange={(
                                event,
                              ) =>
                                setContributionAmount(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder="Amount to add"
                            />
                          </div>


                          <div className="goal-contribution-actions">

                            <button
                              type="button"
                              disabled={
                                savingContribution
                              }
                              onClick={() =>
                                handleContribution(
                                  goal,
                                )
                              }
                            >
                              {savingContribution
                                ? 'Saving...'
                                : 'Save Contribution'}
                            </button>

                            <button
                              type="button"
                              onClick={
                                cancelContribution
                              }
                            >
                              Cancel
                            </button>

                          </div>

                        </div>
                      )}


                      {!isContributing && (
                        <div className="goal-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openContribution(
                                goal.id,
                              )
                            }
                          >
                            Add Savings
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                goal,
                              )
                            }
                          >
                            Edit Goal
                          </button>


                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              handleDelete(
                                goal,
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>
                      )}
                    </>
                  ) : (

                    <div className="goal-edit-form">

                      <div className="form-field">
                        <label>
                          Goal Name
                        </label>

                        <input
                          type="text"
                          value={editName}
                          onChange={(
                            event,
                          ) =>
                            setEditName(
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </div>


                      <div className="form-field">
                        <label>
                          Target Amount
                        </label>

                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            editTargetAmount
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditTargetAmount(
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </div>


                      <div className="form-field">
                        <label>
                          Currency
                        </label>

                        <input
                          type="text"
                          maxLength="3"
                          value={
                            editCurrency
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditCurrency(
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </div>


                      <div className="form-field">
                        <label>
                          Target Date
                        </label>

                        <input
                          type="date"
                          value={
                            editTargetDate
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditTargetDate(
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </div>


                      <div className="form-field">
                        <label>
                          Status
                        </label>

                        <select
                          value={
                            editStatus
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditStatus(
                              event
                                .target
                                .value,
                            )
                          }
                        >
                          {GOAL_STATUSES.map(
                            (
                              goalStatus,
                            ) => (
                              <option
                                key={
                                  goalStatus
                                }
                                value={
                                  goalStatus
                                }
                              >
                                {formatStatus(
                                  goalStatus,
                                )}
                              </option>
                            ),
                          )}
                        </select>
                      </div>


                      <div className="form-field goal-edit-notes">
                        <label>
                          Notes
                        </label>

                        <textarea
                          rows="3"
                          value={
                            editNotes
                          }
                          onChange={(
                            event,
                          ) =>
                            setEditNotes(
                              event
                                .target
                                .value,
                            )
                          }
                        />
                      </div>


                      <div className="goal-actions goal-edit-actions">

                        <button
                          type="button"
                          disabled={
                            savingEdit
                          }
                          onClick={() =>
                            handleSaveEdit(
                              goal.id,
                            )
                          }
                        >
                          {savingEdit
                            ? 'Saving...'
                            : 'Save Changes'}
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditing
                          }
                        >
                          Cancel
                        </button>

                      </div>

                    </div>
                  )}

                </article>
              )
            })}

          </div>
        )}

      </section>

    </div>
  )
}

export default Goals