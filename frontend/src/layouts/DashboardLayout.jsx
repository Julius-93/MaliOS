import {
  useEffect,
} from 'react'

import {
  Outlet,
} from 'react-router-dom'

import Sidebar from '../components/navigation/Sidebar'
import Topbar from '../components/navigation/Topbar'

import {
  getSettings,
} from '../services/api'

import {
  saveStoredPreferences,
} from '../utils/preferences'

import useAutoLogout from '../hooks/useAutoLogout'


function DashboardLayout() {
  /*
   * Automatically signs the user out
   * after the configured period of
   * inactivity.
   */
  useAutoLogout()


  /*
   * Load the user's saved MaliOS
   * preferences whenever the protected
   * dashboard area is opened.
   *
   * This makes theme, privacy mode,
   * compact mode, reduced motion and
   * auto-logout settings available
   * without requiring the user to open
   * the Settings page first.
   */
  useEffect(() => {
    async function syncPreferences() {
      try {
        const token =
          sessionStorage.getItem(
            'malios_token',
          )

        if (!token) {
          return
        }

        const data =
          await getSettings(token)

        if (data.settings) {
          saveStoredPreferences(
            data.settings,
          )
        }
      } catch (error) {
        /*
         * ProtectedRoute is responsible
         * for authentication redirects.
         *
         * A preference-sync failure
         * should not crash the whole
         * dashboard.
         */
        console.error(
          'Unable to sync MaliOS preferences:',
          error,
        )
      }
    }

    syncPreferences()
  }, [])


  return (
    <div className="dashboard-layout">

      <Sidebar />


      <div className="dashboard-main">

        <Topbar />


        <main className="dashboard-content">

          <Outlet />

        </main>

      </div>

    </div>
  )
}


export default DashboardLayout