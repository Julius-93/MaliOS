import Card from '../components/ui/Card'

function Dashboard() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Good morning</h2>
          <p>
            Here's a snapshot of your financial position.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card>
          <p>Net Worth</p>
          <h3>KES 0</h3>
        </Card>

        <Card>
          <p>Available Balance</p>
          <h3>KES 0</h3>
        </Card>

        <Card>
          <p>Income</p>
          <h3>KES 0</h3>
        </Card>

        <Card>
          <p>Expenses</p>
          <h3>KES 0</h3>
        </Card>
      </div>

      <Card>
        <p>Financial Health</p>
        <h3>0 / 100</h3>
      </Card>
    </section>
  )
}

export default Dashboard
