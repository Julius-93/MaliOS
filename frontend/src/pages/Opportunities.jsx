import { useEffect, useState } from 'react'

import {
  createOpportunity,
  deleteOpportunity,
  getOpportunities,
  updateOpportunity,
} from '../services/api'

import SensitiveValue from '../components/ui/SensitiveValue'


const ASSET_TYPES = [
  'STOCK',
  'BOND',
  'ETF',
  'MUTUAL_FUND',
  'MONEY_MARKET',
  'REAL_ESTATE',
  'CRYPTO',
  'OTHER',
]

const RISK_LEVELS = [
  'LOW',
  'MEDIUM',
  'HIGH',
]

const STATUSES = [
  'WATCHING',
  'INTERESTED',
  'PASSED',
]


function Opportunities() {
  const [opportunities, setOpportunities] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')


  // New opportunity form
  const [name, setName] =
    useState('')

  const [provider, setProvider] =
    useState('')

  const [assetType, setAssetType] =
    useState('BOND')

  const [currency, setCurrency] =
    useState('KES')

  const [
    minimumInvestment,
    setMinimumInvestment,
  ] = useState('')

  const [
    expectedReturn,
    setExpectedReturn,
  ] = useState('')

  const [riskLevel, setRiskLevel] =
    useState('LOW')

  const [status, setStatus] =
    useState('WATCHING')

  const [notes, setNotes] =
    useState('')


  // Editing state
  const [
    editingOpportunityId,
    setEditingOpportunityId,
  ] = useState(null)

  const [
    editMinimumInvestment,
    setEditMinimumInvestment,
  ] = useState('')

  const [
    editExpectedReturn,
    setEditExpectedReturn,
  ] = useState('')

  const [
    editRiskLevel,
    setEditRiskLevel,
  ] = useState('LOW')

  const [
    editStatus,
    setEditStatus,
  ] = useState('WATCHING')

  const [editNotes, setEditNotes] =
    useState('')

  const [savingEdit, setSavingEdit] =
    useState(false)


  useEffect(() => {
    loadOpportunities()
  }, [])


  async function loadOpportunities() {
    try {
      setLoading(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await getOpportunities(token)

      setOpportunities(data)
    } catch (err) {
      setError(
        err.message ||
          'Unable to load opportunities',
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

      await createOpportunity(
        token,
        {
          name,
          provider:
            provider.trim() || null,

          assetType,

          currency:
            currency.toUpperCase(),

          minimumInvestment:
            Number(
              minimumInvestment,
            ),

          expectedReturn:
            expectedReturn === ''
              ? null
              : Number(
                  expectedReturn,
                ),

          riskLevel,
          status,

          notes:
            notes.trim() || null,
        },
      )

      // Clear form after saving.
      setName('')
      setProvider('')
      setAssetType('BOND')
      setCurrency('KES')
      setMinimumInvestment('')
      setExpectedReturn('')
      setRiskLevel('LOW')
      setStatus('WATCHING')
      setNotes('')

      await loadOpportunities()
    } catch (err) {
      setError(
        err.message ||
          'Unable to create opportunity',
      )
    } finally {
      setSubmitting(false)
    }
  }


  function startEditing(opportunity) {
    setEditingOpportunityId(
      opportunity.id,
    )

    setEditMinimumInvestment(
      String(
        opportunity.minimumInvestment,
      ),
    )

    setEditExpectedReturn(
      opportunity.expectedReturn ??
        '',
    )

    setEditRiskLevel(
      opportunity.riskLevel,
    )

    setEditStatus(
      opportunity.status,
    )

    setEditNotes(
      opportunity.notes || '',
    )
  }


  function cancelEditing() {
    setEditingOpportunityId(null)
  }


  async function handleSaveEdit(
    opportunityId,
  ) {
    try {
      setSavingEdit(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      await updateOpportunity(
        token,
        opportunityId,
        {
          minimumInvestment:
            Number(
              editMinimumInvestment,
            ),

          expectedReturn:
            editExpectedReturn === ''
              ? null
              : Number(
                  editExpectedReturn,
                ),

          riskLevel:
            editRiskLevel,

          status:
            editStatus,

          notes:
            editNotes.trim() ||
            null,
        },
      )

      setEditingOpportunityId(
        null,
      )

      await loadOpportunities()
    } catch (err) {
      setError(
        err.message ||
          'Unable to update opportunity',
      )
    } finally {
      setSavingEdit(false)
    }
  }


  async function handleDelete(
    opportunity,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${opportunity.name}?`,
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

      await deleteOpportunity(
        token,
        opportunity.id,
      )

      await loadOpportunities()
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete opportunity',
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


  function formatLabel(value) {
    return value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      )
  }


  if (loading) {
    return (
      <p>
        Loading investment
        opportunities...
      </p>
    )
  }


  return (
    <div className="opportunities-page">

      <div className="page-intro">
        <p>
          Track investment ideas you
          are researching before adding
          them to your portfolio.
        </p>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* Add opportunity */}
      <section className="card opportunity-form-card">

        <h3>
          Add Investment Opportunity
        </h3>

        <form
          className="opportunity-form"
          onSubmit={handleCreate}
        >

          <div className="form-field">
            <label>Name</label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="91-Day Treasury Bill"
              required
            />
          </div>


          <div className="form-field">
            <label>Provider</label>

            <input
              type="text"
              value={provider}
              onChange={(event) =>
                setProvider(
                  event.target.value,
                )
              }
              placeholder="Provider or institution"
            />
          </div>


          <div className="form-field">
            <label>Asset Type</label>

            <select
              value={assetType}
              onChange={(event) =>
                setAssetType(
                  event.target.value,
                )
              }
            >
              {ASSET_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {formatLabel(
                      type,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>


          <div className="form-field">
            <label>Currency</label>

            <input
              type="text"
              value={currency}
              onChange={(event) =>
                setCurrency(
                  event.target.value,
                )
              }
              maxLength="3"
              required
            />
          </div>


          <div className="form-field">
            <label>
              Minimum Investment
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                minimumInvestment
              }
              onChange={(event) =>
                setMinimumInvestment(
                  event.target.value,
                )
              }
              placeholder="50000"
              required
            />
          </div>


          <div className="form-field">
            <label>
              Expected Return (%)
            </label>

            <input
              type="number"
              step="0.01"
              value={
                expectedReturn
              }
              onChange={(event) =>
                setExpectedReturn(
                  event.target.value,
                )
              }
              placeholder="8.5"
            />
          </div>


          <div className="form-field">
            <label>Risk Level</label>

            <select
              value={riskLevel}
              onChange={(event) =>
                setRiskLevel(
                  event.target.value,
                )
              }
            >
              {RISK_LEVELS.map(
                (risk) => (
                  <option
                    key={risk}
                    value={risk}
                  >
                    {formatLabel(
                      risk,
                    )}
                  </option>
                ),
              )}
            </select>
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
              {STATUSES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {formatLabel(
                      item,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>


          <div className="form-field opportunity-notes-field">
            <label>Notes</label>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              placeholder="Why are you considering this investment?"
              rows="3"
            />
          </div>


          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Saving...'
              : 'Add Opportunity'}
          </button>

        </form>
      </section>


      {/* Saved opportunities */}
      <section className="opportunities-list-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              Watchlist
            </span>

            <h3>
              Saved Opportunities
            </h3>
          </div>

          <span className="opportunity-count">
            {
              opportunities.length
            }{' '}
            opportunity
            {opportunities.length ===
            1
              ? ''
              : 'ies'}
          </span>
        </div>


        {opportunities.length === 0 ? (
          <div className="card empty-state">
            <h3>
              No opportunities yet
            </h3>

            <p>
              Add an investment idea
              above to start your
              research watchlist.
            </p>
          </div>
        ) : (
          <div className="opportunity-list">

            {opportunities.map(
              (opportunity) => {

                const isEditing =
                  editingOpportunityId ===
                  opportunity.id

                return (
                  <article
                    className="card opportunity-card"
                    key={
                      opportunity.id
                    }
                  >

                    <div className="opportunity-card-header">

                      <div>
                        <span className="opportunity-asset-type">
                          {formatLabel(
                            opportunity.assetType,
                          )}
                        </span>

                        <h3>
                          {
                            opportunity.name
                          }
                        </h3>

                        <p>
                          {opportunity.provider ||
                            'No provider specified'}
                        </p>
                      </div>


                      <div className="opportunity-badges">

                        <span
                          className={`risk-badge risk-${opportunity.riskLevel.toLowerCase()}`}
                        >
                          {formatLabel(
                            opportunity.riskLevel,
                          )}{' '}
                          Risk
                        </span>

                        <span
                          className={`status-badge status-${opportunity.status.toLowerCase()}`}
                        >
                          {formatLabel(
                            opportunity.status,
                          )}
                        </span>

                      </div>
                    </div>


                    {!isEditing ? (
                      <>
                        <div className="opportunity-metrics">

                          <div>
                            <span>
                              Minimum Investment
                            </span>

                            <strong>
                              <SensitiveValue>
                                {formatMoney(
                                  opportunity.minimumInvestment,
                                  opportunity.currency,
                                )}
                              </SensitiveValue>
                            </strong>
                          </div>


                          <div>
                            <span>
                              Expected Return
                            </span>

                            <strong>
                              {opportunity.expectedReturn ===
                              null
                                ? 'Not specified'
                                : `${Number(
                                    opportunity.expectedReturn,
                                  ).toFixed(
                                    2,
                                  )}%`}
                            </strong>
                          </div>


                          <div>
                            <span>
                              Currency
                            </span>

                            <strong>
                              {
                                opportunity.currency
                              }
                            </strong>
                          </div>


                          <div>
                            <span>
                              Asset Type
                            </span>

                            <strong>
                              {formatLabel(
                                opportunity.assetType,
                              )}
                            </strong>
                          </div>

                        </div>


                        {opportunity.notes && (
                          <div className="opportunity-notes">
                            <span>
                              Notes
                            </span>

                            <p>
                              {
                                opportunity.notes
                              }
                            </p>
                          </div>
                        )}


                        <div className="opportunity-actions">

                          <button
                            type="button"
                            onClick={() =>
                              startEditing(
                                opportunity,
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="danger-button"
                            onClick={() =>
                              handleDelete(
                                opportunity,
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>
                      </>
                    ) : (
                      <div className="opportunity-edit-form">

                        <div className="form-field">
                          <label>
                            Minimum Investment
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              editMinimumInvestment
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditMinimumInvestment(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </div>


                        <div className="form-field">
                          <label>
                            Expected Return (%)
                          </label>

                          <input
                            type="number"
                            step="0.01"
                            value={
                              editExpectedReturn
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditExpectedReturn(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </div>


                        <div className="form-field">
                          <label>
                            Risk Level
                          </label>

                          <select
                            value={
                              editRiskLevel
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditRiskLevel(
                                event
                                  .target
                                  .value,
                              )
                            }
                          >
                            {RISK_LEVELS.map(
                              (
                                risk,
                              ) => (
                                <option
                                  key={
                                    risk
                                  }
                                  value={
                                    risk
                                  }
                                >
                                  {formatLabel(
                                    risk,
                                  )}
                                </option>
                              ),
                            )}
                          </select>
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
                            {STATUSES.map(
                              (
                                item,
                              ) => (
                                <option
                                  key={
                                    item
                                  }
                                  value={
                                    item
                                  }
                                >
                                  {formatLabel(
                                    item,
                                  )}
                                </option>
                              ),
                            )}
                          </select>
                        </div>


                        <div className="form-field opportunity-edit-notes">
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


                        <div className="opportunity-actions">

                          <button
                            type="button"
                            disabled={
                              savingEdit
                            }
                            onClick={() =>
                              handleSaveEdit(
                                opportunity.id,
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
              },
            )}

          </div>
        )}
      </section>

    </div>
  )
}

export default Opportunities