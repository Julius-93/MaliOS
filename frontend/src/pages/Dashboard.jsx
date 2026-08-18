import { useEffect, useState } from 'react'
import Card from '../components/ui/Card'
import { getFinancialSummary } from '../services/api'

const TEST_USER_ID = '4b75bca8-121f-400e-94e9-9c95cfbb361f'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getFinancialSummary(TEST_USER_ID)
        setSummary(data)
      } catch (err) {
        console.error(err)
        setError('Unable to load your financial summary.')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [])

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading financial overview...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <p>{error}</p>
      </section>
    )
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount)

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Good afternoon</h2>
          <p>Here's a snapshot of your financial position.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card>
          <p>Net Worth</p>
          <h3>{formatCurrency(summary.netWorth)}</h3>
        </Card>

        <Card>
          <p>Available Balance</p>
          <h3>{formatCurrency(summary.availableBalance)}</h3>
        </Card>

        <Card>
          <p>Income</p>
          <h3>{formatCurrency(summary.totalIncome)}</h3>
        </Card>

        <Card>
          <p>Expenses</p>
          <h3>{formatCurrency(summary.totalExpenses)}</h3>
        </Card>
      </div>

      <Card>
        <p>Financial Health</p>
        <h3>Coming soon</h3>
      </Card>
    </section>
  )
}

export default Dashboard
