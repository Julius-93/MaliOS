import {
  Routes,
  Route,
} from 'react-router-dom'

import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute from '../components/ProtectedRoute'

import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Accounts from '../pages/Accounts'
import Transactions from '../pages/Transactions'
import Budgets from '../pages/Budgets'
import CashFlow from '../pages/CashFlow'
import Investments from '../pages/Investments'
import Portfolio from '../pages/Portfolio'
import Opportunities from '../pages/Opportunities'
import Goals from '../pages/Goals'
import Settings from '../pages/Settings'
import Notifications from '../pages/Notifications'


// Temporary placeholder for sections
// that we have not built yet.
function PlaceholderPage({
  title,
}) {
  return (
    <section className="dashboard-page">

      <div className="dashboard-heading">

        <p className="eyebrow">
          MaliOS
        </p>

        <h2>
          {title}
        </h2>

        <p>
          This section is under development.
        </p>

      </div>

    </section>
  )
}


function AppRoutes() {
  return (
    <Routes>

      {/* Public route */}

      <Route
        path="/login"
        element={
          <Login />
        }
      />


      {/* Protected MaliOS routes */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        <Route
          element={
            <DashboardLayout />
          }
        >

          {/* Dashboard */}

          <Route
            path="/"
            element={
              <Dashboard />
            }
          />


          {/* Money */}

          <Route
            path="/accounts"
            element={
              <Accounts />
            }
          />


          <Route
            path="/transactions"
            element={
              <Transactions />
            }
          />


          <Route
            path="/budgets"
            element={
              <Budgets />
            }
          />


          <Route
            path="/cash-flow"
            element={
              <CashFlow />
            }
          />


          {/* Investments */}

          <Route
            path="/portfolio"
            element={
              <Portfolio />
            }
          />


          <Route
            path="/investments"
            element={
              <Investments />
            }
          />


          <Route
            path="/opportunities"
            element={
              <Opportunities />
            }
          />


          {/* Planning */}

          <Route
            path="/goals"
            element={
              <Goals />
            }
          />


          {/* System */}

          <Route
            path="/settings"
            element={
              <Settings />
            }
          />


          <Route
            path="/notifications"
            element={
              <Notifications />
            }
          />

        </Route>

      </Route>

    </Routes>
  )
}


export default AppRoutes