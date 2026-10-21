import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import {
  createTransaction,
  getAccounts,
  getTransactions,
} from '../services/api'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../constants/categories'
import SensitiveValue from '../components/ui/SensitiveValue'

function Transactions() {
  const token = sessionStorage.getItem('malios_token')

  // ================================
  // DATA
  // ================================

  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  // ================================
  // FORM FIELDS
  // ================================

  const [accountId, setAccountId] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(
    EXPENSE_CATEGORIES[0],
  )
  const [merchant, setMerchant] = useState('')
  const [note, setNote] = useState('')

  // ================================
  // PAGE STATE
  // ================================

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Pick the correct categories depending
  // on whether this is income or an expense.
  const categories =
    type === 'INCOME'
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES

  // ================================
  // LOAD ACCOUNTS + TRANSACTIONS
  // ================================

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        setError('')

        const [
          accountsData,
          transactionsData,
        ] = await Promise.all([
          getAccounts(token),
          getTransactions(token),
        ])

        if (!cancelled) {
          setAccounts(accountsData)
          setTransactions(transactionsData)

          // Automatically select the first account.
          if (accountsData.length > 0) {
            setAccountId(accountsData[0].id)
          }
        }
      } catch (err) {
        console.error(
          'Failed to load transaction data:',
          err,
        )

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

  // ================================
  // REFRESH TRANSACTIONS
  // ================================

  async function refreshTransactions() {
    const data = await getTransactions(token)
    setTransactions(data)
  }

  // ================================
  // HANDLE TYPE CHANGE
  // ================================

  function handleTypeChange(event) {
    const nextType = event.target.value

    setType(nextType)

    // Reset category so it always belongs
    // to the selected transaction type.
    if (nextType === 'INCOME') {
      setCategory(INCOME_CATEGORIES[0])
    } else {
      setCategory(EXPENSE_CATEGORIES[0])
    }
  }

  // ================================
  // CREATE TRANSACTION
  // ================================

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')

      const selectedAccount = accounts.find(
        (account) => account.id === accountId,
      )

      if (!selectedAccount) {
        throw new Error(
          'Please select an account',
        )
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

      // Clear form after successful save.
      setAmount('')
      setMerchant('')
      setNote('')

      // Reset category according to current type.
      setCategory(
        type === 'INCOME'
          ? INCOME_CATEGORIES[0]
          : EXPENSE_CATEGORIES[0],
      )

      // Reload transactions immediately.
      await refreshTransactions()
    } catch (err) {
      console.error(
        'Failed to create transaction:',
        err,
      )

      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ================================
  // FORMAT MONEY
  // ================================

  const formatCurrency = (
    value,
    currency,
  ) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value))

  // ================================
  // LOADING STATE
  // ================================

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading transactions...</p>
      </section>
    )
  }

  // ================================
  // PAGE
  // ================================

  return (
    <section className="dashboard-page">
      {/* Page heading */}
      <div className="page-intro">
        <p>
         Record and review income and expenses.
       </p>
      </div>

      {/* Error message */}
      {error && (
        <p
          role="alert"
          className="form-error"
        >
          {error}
        </p>
      )}

      {/* ================================
          ADD TRANSACTION
      ================================= */}

      <Card className="transaction-form-card">
        <h3>Add Transaction</h3>

        <form
          className="transaction-form"
          onSubmit={handleSubmit}
        >
          {/* Account */}
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
            {accounts.length === 0 && (
              <option value="">
                No accounts available
              </option>
            )}

            {accounts.map((account) => (
              <option
                key={account.id}
                value={account.id}
              >
                {account.name}
              </option>
            ))}
          </select>

          {/* Transaction type */}
          <label htmlFor="transaction-type">
            Type
          </label>

          <select
            id="transaction-type"
            value={type}
            onChange={handleTypeChange}
          >
            <option value="INCOME">
              Income
            </option>

            <option value="EXPENSE">
              Expense
            </option>
          </select>

          {/* Amount */}
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
            placeholder="e.g. 5000"
            required
          />

          {/* Category */}
          <label htmlFor="transaction-category">
            Category
          </label>

          <select
            id="transaction-category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            required
          >
            {categories.map(
              (categoryOption) => (
                <option
                  key={categoryOption}
                  value={categoryOption}
                >
                  {categoryOption}
                </option>
              ),
            )}
          </select>

          {/* Merchant */}
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

          {/* Note */}
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

          {/* Save button */}
          <button
            type="submit"
            disabled={
              submitting ||
              accounts.length === 0
            }
          >
            {submitting
              ? 'Saving...'
              : 'Add Transaction'}
          </button>
        </form>
      </Card>

      {/* ================================
          TRANSACTION HISTORY
      ================================= */}

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
                  {transaction.account.name}
                </p>

                <p>
                  {new Date(
                    transaction.occurredAt,
                  ).toLocaleString()}
                </p>

                {transaction.note && (
                  <p>
                    {transaction.note}
                  </p>
                )}
              </div>

              <div className="transaction-amount">
                {transaction.type === 'INCOME'
                  ? '+'
                  : '-'}
              <SensitiveValue>
                {formatCurrency(
                  transaction.amount,
                  transaction.currency,
                )}
              </SensitiveValue>  
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  )
}

export default Transactions