import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import Dashboard from '../pages/Dashboard'
import Login from '../pages/Login'
import ProtectedRoute from '../components/ProtectedRoute'

function PlaceholderPage({ title }) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <p className="eyebrow">MaliOS</p>
        <h2>{title}</h2>
        <p>This section is under development.</p>
      </div>
    </section>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/accounts"
            element={<PlaceholderPage title="Accounts" />}
          />

          <Route
            path="/transactions"
            element={<PlaceholderPage title="Transactions" />}
          />

          <Route
            path="/budgets"
            element={<PlaceholderPage title="Budgets" />}
          />

          <Route
            path="/cash-flow"
            element={<PlaceholderPage title="Cash Flow" />}
          />

          <Route
            path="/portfolio"
            element={<PlaceholderPage title="Portfolio" />}
          />

          <Route
            path="/investments"
            element={<PlaceholderPage title="Investments" />}
          />

          <Route
            path="/opportunities"
            element={<PlaceholderPage title="Opportunities" />}
          />

          <Route
            path="/goals"
            element={<PlaceholderPage title="Goals" />}
          />

          <Route
            path="/settings"
            element={<PlaceholderPage title="Settings" />}
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
