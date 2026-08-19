import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import { getFinancialSummary } from '../services/api'

function Dashboard() {
  const navigate = useNavigate()

  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSummary() {
      const token = sessionStorage.getItem('malios_token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const data = await getFinancialSummary(token)
        setSummary(data)
      } catch (error) {
        console.error('Failed to load financial summary:', error)

        sessionStorage.removeItem('malios_token')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    loadSummary()
  }, [navigate])

  if (loading) {
    return (
      <section className="dashboard-page">
        <p>Loading financial overview...</p>
      </section>
    )
  }

  if (!summary) {
    return null
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
          <h2>Welcome back</h2>
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
