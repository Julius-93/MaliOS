import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import {
  createTransaction,
  getAccounts,
  getTransactions,
} from '../services/api'

function Transactions() {
  const token = sessionStorage.getItem('malios_token')

  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  const [accountId, setAccountId] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [merchant, setMerchant] = useState('')
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [accountsData, transactionsData] =
          await Promise.all([
            getAccounts(token),
            getTransactions(token),
          ])

        if (!cancelled) {
          setAccounts(accountsData)
          setTransactions(transactionsData)

          if (accountsData.length > 0) {
            setAccountId(accountsData[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load transaction data:', err)

        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [token])

  async function refreshTransactions() {
    const data = await getTransactions(token)
    setTransactions(data)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const selectedAccount = accounts.find(
        (account) => account.id === accountId,
      )

      if (!selectedAccount) {
        throw new Error('Please select an account')
      }

      await createTransaction(token, {
        accountId,
        type,
        amount: Number(amount),
        currency: selectedAccount.currency,
        category,
        merchant: merchant || undefined,
        note: note || undefined,
        occurredAt: new Date().toISOString(),
      })

      setAmount('')
      setCategory('')
      setMerchant('')
      setNote('')

      await refreshTransactions()
    } catch (err) {
      console.error('Failed to create transaction:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value, currency) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value))

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading transactions...</p>
      </section>
    )
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Money</p>
          <h2>Transactions</h2>
          <p>
            Record and review income and expenses.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      <Card className="transaction-form-card">
        <h3>Add transaction</h3>

        <form
          className="transaction-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="transaction-account">
            Account
          </label>

          <select
            id="transaction-account"
            value={accountId}
            onChange={(event) =>
              setAccountId(event.target.value)
            }
            required
          >
            {accounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
              >
                {account.name}
              </option>
            ))}
          </select>

          <label htmlFor="transaction-type">
            Type
          </label>

          <select
            id="transaction-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
          >
            <option value="INCOME">
              Income
            </option>

            <option value="EXPENSE">
              Expense
            </option>
          </select>

          <label htmlFor="transaction-amount">
            Amount
          </label>

          <input
            id="transaction-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value)
            }
            required
          />

          <label htmlFor="transaction-category">
            Category
          </label>

          <input
            id="transaction-category"
            type="text"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            placeholder="e.g. Salary, Food, Transport"
            required
          />

          <label htmlFor="transaction-merchant">
            Merchant
          </label>

          <input
            id="transaction-merchant"
            type="text"
            value={merchant}
            onChange={(event) =>
              setMerchant(event.target.value)
            }
            placeholder="Optional"
          />

          <label htmlFor="transaction-note">
            Note
          </label>

          <textarea
            id="transaction-note"
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            placeholder="Optional"
          />

          <button
            type="submit"
            disabled={submitting || accounts.length === 0}
          >
            {submitting
              ? 'Saving...'
              : 'Add Transaction'}
          </button>
        </form>
      </Card>

      <div className="transactions-list">
        {transactions.length === 0 ? (
          <Card>
            <p>No transactions yet.</p>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="transaction-card"
            >
              <div>
                <p className="transaction-category">
                  {transaction.category}
                </p>

                <h3>
                  {transaction.merchant ||
                    transaction.account.name}
                </h3>

                <p>
                  {new Date(
                    transaction.occurredAt,
                  ).toLocaleString()}
                </p>
              </div>

              <div className="transaction-amount">
                {transaction.type === 'INCOME'
                  ? '+'
                  : '-'}
                {formatCurrency(
                  transaction.amount,
                  transaction.currency,
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  )
}

export default Transactions
