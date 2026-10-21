import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  getCurrentUser,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/api'


/* ========================================
   PAGE DETAILS
======================================== */

const pageDetails = {
  '/': {
    label: 'Financial Overview',
    title: 'Dashboard',
  },

  '/accounts': {
    label: 'Money',
    title: 'Accounts',
  },

  '/transactions': {
    label: 'Money',
    title: 'Transactions',
  },

  '/budgets': {
    label: 'Planning',
    title: 'Budgets',
  },

  '/cash-flow': {
    label: 'Money',
    title: 'Cash Flow',
  },

  '/portfolio': {
    label: 'Invest',
    title: 'Portfolio',
  },

  '/investments': {
    label: 'Invest',
    title: 'Investments',
  },

  '/opportunities': {
    label: 'Invest',
    title: 'Opportunities',
  },

  '/goals': {
    label: 'Plan',
    title: 'Goals',
  },

  '/notifications': {
    label: 'System',
    title: 'Notifications',
  },

  '/settings': {
    label: 'System',
    title: 'Settings',
  },
}


/* ========================================
   NOTIFICATION DESTINATIONS
======================================== */

const notificationRoutes = {
  BUDGET: '/budgets',

  LOW_BALANCE: '/accounts',

  LARGE_TRANSACTION:
    '/transactions',

  GOAL: '/goals',

  INVESTMENT: '/investments',

  SYSTEM: '/notifications',
}


/* ========================================
   BELL ICON
======================================== */

function BellIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="
          M18 8
          a6 6 0 0 0-12 0
          c0 7-3 7-3 9
          h18
          c0-2-3-2-3-9
        "
      />

      <path
        d="
          M13.73 21
          a2 2 0 0 1-3.46 0
        "
      />
    </svg>
  )
}


/* ========================================
   NOTIFICATION TIME FORMAT
======================================== */

function formatNotificationTime(
  value,
) {
  const date =
    new Date(value)


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }


  const difference =
    Date.now() -
    date.getTime()


  const minute =
    60 * 1000


  const hour =
    60 * minute


  const day =
    24 * hour


  if (
    difference <
    minute
  ) {
    return 'Just now'
  }


  if (
    difference <
    hour
  ) {
    return `${Math.floor(
      difference /
        minute,
    )}m ago`
  }


  if (
    difference <
    day
  ) {
    return `${Math.floor(
      difference /
        hour,
    )}h ago`
  }


  return new Intl.DateTimeFormat(
    'en-KE',
    {
      day: 'numeric',
      month: 'short',
    },
  ).format(date)
}


/* ========================================
   TOPBAR COMPONENT
======================================== */

function Topbar() {
  const navigate =
    useNavigate()


  const location =
    useLocation()


  const dropdownRef =
    useRef(null)


  /* ========================================
     USER STATE
  ======================================== */

  const [
    user,
    setUser,
  ] = useState(null)


  /* ========================================
     NOTIFICATION STATE
  ======================================== */

  const [
    notifications,
    setNotifications,
  ] = useState([])


  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0)


  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false)


  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false)


  /* ========================================
     CURRENT PAGE
  ======================================== */

  const currentPage =
    pageDetails[
      location.pathname
    ] || {
      label: 'MaliOS',
      title: 'Overview',
    }


  /* ========================================
     LOAD CURRENT USER
  ======================================== */

  useEffect(() => {
    async function loadUser() {
      const token =
        sessionStorage.getItem(
          'malios_token',
        )


      if (!token) {
        navigate('/login')

        return
      }


      try {
        const currentUser =
          await getCurrentUser(
            token,
          )


        setUser(
          currentUser,
        )

      } catch (error) {
        console.error(
          'Failed to load current user:',
          error,
        )


        sessionStorage.removeItem(
          'malios_token',
        )


        navigate('/login')
      }
    }


    loadUser()

  }, [navigate])


  /* ========================================
     LOAD NOTIFICATIONS
  ======================================== */

  const loadNotifications =
    useCallback(
      async () => {
        const token =
          sessionStorage.getItem(
            'malios_token',
          )


        if (!token) {
          return
        }


        try {
          setNotificationsLoading(
            true,
          )


          const data =
            await getNotifications(
              token,
              20,
            )


          setNotifications(
            data.notifications ||
              [],
          )


          setUnreadCount(
            Number(
              data.unreadCount ??
                0,
            ),
          )

        } catch (error) {
          console.error(
            'Failed to load notifications:',
            error,
          )

        } finally {
          setNotificationsLoading(
            false,
          )
        }
      },
      [],
    )


  /* ========================================
     INITIAL NOTIFICATION LOAD
  ======================================== */

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])


  /* ========================================
     AUTOMATIC NOTIFICATION REFRESH
  ======================================== */

  useEffect(() => {
    /*
     * Refresh notifications only while
     * MaliOS is visible to the user.
     */
    function refreshNotifications() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        loadNotifications()
      }
    }


    /*
     * Refresh every 30 seconds.
     */
    const intervalId =
      window.setInterval(
        refreshNotifications,
        30000,
      )


    /*
     * Refresh when the browser window
     * becomes active again.
     */
    window.addEventListener(
      'focus',
      refreshNotifications,
    )


    /*
     * Refresh when the MaliOS tab becomes
     * visible again.
     */
    document.addEventListener(
      'visibilitychange',
      refreshNotifications,
    )


    /*
     * Clean up everything when Topbar
     * is unmounted.
     */
    return () => {
      window.clearInterval(
        intervalId,
      )


      window.removeEventListener(
        'focus',
        refreshNotifications,
      )


      document.removeEventListener(
        'visibilitychange',
        refreshNotifications,
      )
    }

  }, [loadNotifications])


  /* ========================================
     CLOSE DROPDOWN ON PAGE CHANGE
  ======================================== */

  useEffect(() => {
    setNotificationsOpen(
      false,
    )
  }, [location.pathname])


  /* ========================================
     CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  ======================================== */

  useEffect(() => {
    function handleOutsideClick(
      event,
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target,
        )
      ) {
        setNotificationsOpen(
          false,
        )
      }
    }


    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )


    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }

  }, [])


  /* ========================================
     OPEN / CLOSE NOTIFICATION DROPDOWN
  ======================================== */

  async function handleNotificationToggle() {
    const opening =
      !notificationsOpen


    setNotificationsOpen(
      opening,
    )


    /*
     * Refresh whenever the dropdown
     * is opened.
     */
    if (opening) {
      await loadNotifications()
    }
  }


  /* ========================================
     CLICK ONE NOTIFICATION
  ======================================== */

  async function handleNotificationClick(
    notification,
  ) {
    const token =
      sessionStorage.getItem(
        'malios_token',
      )


    if (!token) {
      navigate('/login')

      return
    }


    /*
     * Mark the notification as read
     * before navigating.
     */
    if (
      !notification.readAt
    ) {
      try {
        await markNotificationRead(
          token,
          notification.id,
        )


        /*
         * Update local state immediately.
         */
        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,

                      readAt:
                        new Date()
                          .toISOString(),
                    }
                  : item,
            ),
        )


        /*
         * Reduce the unread badge count.
         */
        setUnreadCount(
          (current) =>
            Math.max(
              current - 1,
              0,
            ),
        )

      } catch (error) {
        console.error(
          'Unable to mark notification read:',
          error,
        )
      }
    }


    /*
     * Find the MaliOS section related
     * to this notification type.
     */
    const destination =
      notificationRoutes[
        notification.type
      ]


    if (destination) {
      navigate(
        destination,
      )
    }


    setNotificationsOpen(
      false,
    )
  }


  /* ========================================
     MARK ALL NOTIFICATIONS READ
  ======================================== */

  async function handleMarkAllRead() {
    const token =
      sessionStorage.getItem(
        'malios_token',
      )


    if (!token) {
      navigate('/login')

      return
    }


    try {
      await markAllNotificationsRead(
        token,
      )


      const readAt =
        new Date()
          .toISOString()


      /*
       * Update all loaded notifications
       * immediately in the interface.
       */
      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,

              readAt:
                item.readAt ||
                readAt,
            }),
          ),
      )


      setUnreadCount(0)

    } catch (error) {
      console.error(
        'Unable to mark all notifications read:',
        error,
      )
    }
  }


  /* ========================================
     VIEW ALL NOTIFICATIONS
  ======================================== */

  function handleViewAllNotifications() {
    setNotificationsOpen(
      false,
    )


    navigate(
      '/notifications',
    )
  }


  /* ========================================
     LOGOUT
  ======================================== */

  function handleLogout() {
    sessionStorage.removeItem(
      'malios_token',
    )


    navigate('/login')
  }


  /* ========================================
     UI
  ======================================== */

  return (
    <header className="topbar">

      {/* ====================================
          PAGE TITLE
      ==================================== */}

      <div>

        <p className="topbar-label">
          {currentPage.label}
        </p>


        <h1 className="topbar-title">
          {currentPage.title}
        </h1>

      </div>


      {/* ====================================
          TOPBAR ACTIONS
      ==================================== */}

      <div className="topbar-actions">


        {/* ==================================
            NOTIFICATIONS
        ================================== */}

        <div
          className="notification-menu"
          ref={dropdownRef}
        >

          <button
            type="button"
            className="notification-button"
            onClick={
              handleNotificationToggle
            }
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : 'Notifications'
            }
            aria-expanded={
              notificationsOpen
            }
          >

            <BellIcon />


            <span>
              Notifications
            </span>


            {unreadCount > 0 && (

              <span className="notification-badge">

                {unreadCount > 99
                  ? '99+'
                  : unreadCount}

              </span>

            )}

          </button>


          {/* ================================
              NOTIFICATION DROPDOWN
          ================================ */}

          {notificationsOpen && (

            <div className="notification-dropdown">


              {/* ============================
                  DROPDOWN HEADER
              ============================ */}

              <div className="notification-dropdown-header">

                <div>

                  <strong>
                    Notifications
                  </strong>


                  <span>

                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : 'You are all caught up'}

                  </span>

                </div>


                {unreadCount > 0 && (

                  <button
                    type="button"
                    className="notification-mark-all"
                    onClick={
                      handleMarkAllRead
                    }
                  >
                    Mark all read
                  </button>

                )}

              </div>


              {/* ============================
                  NOTIFICATION LIST
              ============================ */}

              <div className="notification-list">


                {/* LOADING */}

                {notificationsLoading &&
                  notifications.length ===
                    0 && (

                    <div className="notification-empty">

                      Loading notifications...

                    </div>

                  )}


                {/* EMPTY */}

                {!notificationsLoading &&
                  notifications.length ===
                    0 && (

                    <div className="notification-empty">

                      No notifications yet.

                    </div>

                  )}


                {/* NOTIFICATION ITEMS */}

                {notifications.map(
                  (notification) => (

                    <button
                      type="button"
                      key={
                        notification.id
                      }
                      className={
                        notification.readAt
                          ? 'notification-item'
                          : 'notification-item unread'
                      }
                      onClick={() =>
                        handleNotificationClick(
                          notification,
                        )
                      }
                    >

                      {/* SEVERITY DOT */}

                      <span
                        className={
                          `notification-severity ` +
                          `${String(
                            notification.severity,
                          ).toLowerCase()}`
                        }
                      />


                      {/* CONTENT */}

                      <span className="notification-item-content">


                        <span className="notification-item-heading">

                          <strong>

                            {
                              notification.title
                            }

                          </strong>


                          <small>

                            {formatNotificationTime(
                              notification.createdAt,
                            )}

                          </small>

                        </span>


                        <span className="notification-message">

                          {
                            notification.message
                          }

                        </span>

                      </span>

                    </button>

                  ),
                )}

              </div>


              {/* ============================
                  VIEW ALL
              ============================ */}

              <div className="notification-dropdown-footer">

                <button
                  type="button"
                  className="notification-view-all"
                  onClick={
                    handleViewAllNotifications
                  }
                >
                  View all notifications
                </button>

              </div>

            </div>

          )}

        </div>


        {/* ==================================
            PROFILE
        ================================== */}

        <div className="profile-menu">

          <span className="profile-name">

            {user
              ? user.firstName
              : 'Loading...'}

          </span>


          <button
            type="button"
            className="profile-button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </div>

    </header>
  )
}


export default Topbar