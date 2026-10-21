import { useEffect } from 'react'

import {
  getStoredPreferences,
} from '../utils/preferences'


function useAutoLogout() {
  useEffect(() => {
    let logoutTimer = null

    let autoLogoutMinutes =
      Number(
        getStoredPreferences()
          .autoLogoutMinutes,
      ) || 30


    /*
     * Remove the current authentication
     * token and return the user to login.
     */
    function logout() {
      sessionStorage.removeItem(
        'malios_token',
      )

      window.location.href =
        '/login'
    }


    /*
     * Start or restart the inactivity
     * countdown.
     */
    function startTimer() {
      if (logoutTimer) {
        window.clearTimeout(
          logoutTimer,
        )
      }

      const milliseconds =
        autoLogoutMinutes *
        60 *
        1000

      logoutTimer =
        window.setTimeout(
          logout,
          milliseconds,
        )
    }


    /*
     * Any normal user activity resets
     * the inactivity timer.
     */
    function handleActivity() {
      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      if (!token) {
        return
      }

      startTimer()
    }


    /*
     * Settings can change while the app
     * is already open.
     *
     * When autoLogoutMinutes changes,
     * immediately restart the timer using
     * the new value.
     */
    function handlePreferenceUpdate(
      event,
    ) {
      const newMinutes =
        Number(
          event.detail
            ?.autoLogoutMinutes,
        )

      autoLogoutMinutes =
        Number.isFinite(
          newMinutes,
        ) &&
        newMinutes > 0
          ? newMinutes
          : 30

      startTimer()
    }


    const activityEvents = [
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ]


    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          handleActivity,
          {
            passive: true,
          },
        )
      },
    )


    window.addEventListener(
      'malios-preferences-updated',
      handlePreferenceUpdate,
    )


    /*
     * Start the first inactivity timer
     * when DashboardLayout mounts.
     */
    startTimer()


    /*
     * Cleanup when leaving the protected
     * dashboard area.
     */
    return () => {
      if (logoutTimer) {
        window.clearTimeout(
          logoutTimer,
        )
      }

      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            handleActivity,
          )
        },
      )

      window.removeEventListener(
        'malios-preferences-updated',
        handlePreferenceUpdate,
      )
    }
  }, [])
}


export default useAutoLogout