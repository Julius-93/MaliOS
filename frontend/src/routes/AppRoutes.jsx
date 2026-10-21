import {
  lazy,
  Suspense,
} from 'react'

import {
  Routes,
  Route,
} from 'react-router-dom'

import DashboardLayout from '../layouts/DashboardLayout'
import ProtectedRoute from '../components/ProtectedRoute'

/*
 * Keep Login eager.
 *
 * It is a small public page and should be
 * immediately available when an unauthenticated
 * user opens MaliOS.
 */
import Login from '../pages/Login'


/* ========================================
   LAZY-LOADED PROTECTED PAGES
======================================== */

/*
 * Each protected page is loaded only when
 * the user actually navigates to that route.
 *
 * This prevents large sections such as
 * Cash Flow and its Recharts dependency
 * from being included in the initial
 * application bundle.
 */

const Dashboard =
  lazy(
    () =>
      import(
        '../pages/Dashboard'
      ),
  )


const Accounts =
  lazy(
    () =>
      import(
        '../pages/Accounts'
      ),
  )


const Transactions =
  lazy(
    () =>
      import(
        '../pages/Transactions'
      ),
  )


const Budgets =
  lazy(
    () =>
      import(
        '../pages/Budgets'
      ),
  )


const CashFlow =
  lazy(
    () =>
      import(
        '../pages/CashFlow'
      ),
  )


const Investments =
  lazy(
    () =>
      import(
        '../pages/Investments'
      ),
  )


const Portfolio =
  lazy(
    () =>
      import(
        '../pages/Portfolio'
      ),
  )


const Opportunities =
  lazy(
    () =>
      import(
        '../pages/Opportunities'
      ),
  )


const Goals =
  lazy(
    () =>
      import(
        '../pages/Goals'
      ),
  )


const Settings =
  lazy(
    () =>
      import(
        '../pages/Settings'
      ),
  )


const Notifications =
  lazy(
    () =>
      import(
        '../pages/Notifications'
      ),
  )


/* ========================================
   ROUTE LOADING FALLBACK
======================================== */

/*
 * Suspense displays this while a page chunk
 * is downloaded for the first time.
 *
 * Subsequent visits will normally use the
 * browser's cached copy.
 */
function RouteLoadingFallback() {
  return (
    <section className="dashboard-page">

      <div className="route-loading-state">

        <div
          className="route-loading-spinner"
          aria-hidden="true"
        />

        <p>
          Loading...
        </p>

      </div>

    </section>
  )
}


/* ========================================
   APPLICATION ROUTES
======================================== */

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <RouteLoadingFallback />
      }
    >

      <Routes>

        {/* =================================
            PUBLIC ROUTES
        ================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* =================================
            PROTECTED MALIOS ROUTES
        ================================== */}

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

            {/* =============================
                DASHBOARD
            ============================== */}

            <Route
              path="/"
              element={
                <Dashboard />
              }
            />


            {/* =============================
                MONEY
            ============================== */}

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


            {/* =============================
                INVESTMENTS
            ============================== */}

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


            {/* =============================
                PLANNING
            ============================== */}

            <Route
              path="/goals"
              element={
                <Goals />
              }
            />


            {/* =============================
                SYSTEM
            ============================== */}

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

    </Suspense>
  )
}


export default AppRoutes