import { useEffect, useState } from 'react'
import {
  createAccount,
  getAccounts,
} from '../services/api'
import Card from '../components/ui/Card'

function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [type, setType] = useState('BANK')
  const [currency, setCurrency] = useState('KES')
  const [submitting, setSubmitting] = useState(false)

  const token = sessionStorage.getItem('malios_token')

  useEffect(() => {
    let cancelled = false

    async function fetchAccounts() {
      try {
        const data = await getAccounts(token)

        if (!cancelled) {
          setAccounts(data)
        }
      } catch (err) {
        console.error('Failed to load accounts:', err)

        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAccounts()

    return () => {
      cancelled = true
    }
  }, [token])

  async function refreshAccounts() {
    const data = await getAccounts(token)
    setAccounts(data)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      await createAccount(token, {
        name,
        type,
        currency,
        balance: 0,
      })

      setName('')
      setType('BANK')
      setCurrency('KES')

      await refreshAccounts()
    } catch (err) {
      console.error('Failed to create account:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount, accountCurrency) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: accountCurrency,
      maximumFractionDigits: 0,
    }).format(amount)

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading accounts...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Money</p>

          <h2>Accounts</h2>

          <p>
            Manage the places where your money is held.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="form-error"
        >
          {error}
        </p>
      )}

      <Card className="account-form-card">
        <h3>Add account</h3>

        <form
          className="account-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="account-name">
            Account name
          </label>

          <input
            id="account-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="e.g. M-PESA"
            required
          />

          <label htmlFor="account-type">
            Account type
          </label>

          <select
            id="account-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
          >
            <option value="BANK">
              Bank
            </option>

            <option value="MOBILE_MONEY">
              Mobile Money
            </option>

            <option value="CASH">
              Cash
            </option>

            <option value="CREDIT_CARD">
              Credit Card
            </option>

            <option value="SAVINGS">
              Savings
            </option>

            <option value="OTHER">
              Other
            </option>
          </select>

          <label htmlFor="account-currency">
            Currency
          </label>

          <select
            id="account-currency"
            value={currency}
            onChange={(event) =>
              setCurrency(event.target.value)
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

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating...'
              : 'Create Account'}
          </button>
        </form>
      </Card>

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <Card>
            <p>No financial accounts yet.</p>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card
              key={account.id}
              className="account-card"
            >
              <div>
                <p className="account-type">
                  {account.type.replaceAll('_', ' ')}
                </p>

                <h3>{account.name}</h3>
              </div>

              <div>
                <p>Available Balance</p>

                <strong>
                  {formatCurrency(
                    account.calculatedBalance,
                    account.currency,
                  )}
                </strong>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  )
}

export default Accounts
