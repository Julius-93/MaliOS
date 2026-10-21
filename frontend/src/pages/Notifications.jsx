import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  clearReadNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api'


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
   NOTIFICATION TYPE LABELS
======================================== */

const notificationTypeLabels = {
  ALL: 'All Types',

  BUDGET: 'Budgets',

  LOW_BALANCE:
    'Low Balance',

  LARGE_TRANSACTION:
    'Transactions',

  GOAL: 'Goals',

  INVESTMENT:
    'Investments',

  SYSTEM: 'System',
}


/* ========================================
   FORMAT DATE
======================================== */

function formatNotificationDate(
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


  return new Intl.DateTimeFormat(
    'en-KE',
    {
      day: 'numeric',

      month: 'short',

      year: 'numeric',

      hour: '2-digit',

      minute: '2-digit',
    },
  ).format(date)
}


/* ========================================
   NOTIFICATIONS PAGE
======================================== */

function Notifications() {
  const navigate =
    useNavigate()


  /* ========================================
     NOTIFICATION DATA
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
    totalCount,
    setTotalCount,
  ] = useState(0)


  /* ========================================
     FILTERS
  ======================================== */

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('ALL')


  const [
    typeFilter,
    setTypeFilter,
  ] = useState('ALL')


  /* ========================================
     PAGE STATE
  ======================================== */

  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    error,
    setError,
  ] = useState('')


  const [
    actionMessage,
    setActionMessage,
  ] = useState('')


  /* ========================================
     AUTOMATICALLY HIDE SUCCESS MESSAGE
  ======================================== */

  useEffect(() => {
    if (!actionMessage) {
      return undefined
    }


    const timeoutId =
      window.setTimeout(
        () => {
          setActionMessage('')
        },
        4000,
      )


    return () => {
      window.clearTimeout(
        timeoutId,
      )
    }

  }, [actionMessage])


  /* ========================================
     AUTOMATICALLY HIDE ERROR MESSAGE
  ======================================== */

  useEffect(() => {
    if (!error) {
      return undefined
    }


    const timeoutId =
      window.setTimeout(
        () => {
          setError('')
        },
        5000,
      )


    return () => {
      window.clearTimeout(
        timeoutId,
      )
    }

  }, [error])


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
          navigate('/login')

          return
        }


        try {
          setLoading(true)

          setError('')


          const data =
            await getNotifications(
              token,
              100,
              {
                status:
                  statusFilter,

                type:
                  typeFilter,
              },
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


          setTotalCount(
            Number(
              data.totalCount ??
                0,
            ),
          )

        } catch (err) {
          console.error(
            'Unable to load notifications:',
            err,
          )


          setError(
            err.message ||
              'Unable to load notifications',
          )

        } finally {
          setLoading(false)
        }
      },
      [
        navigate,
        statusFilter,
        typeFilter,
      ],
    )


  /* ========================================
     INITIAL LOAD + FILTER CHANGES
  ======================================== */

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])


  /* ========================================
     AUTOMATIC REFRESH
  ======================================== */

  useEffect(() => {
    /*
     * Refresh notifications when the page
     * is visible.
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
     * Refresh when returning to the
     * browser tab.
     */
    document.addEventListener(
      'visibilitychange',
      refreshNotifications,
    )


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
     OPEN NOTIFICATION
  ======================================== */

  async function handleOpenNotification(
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


    try {
      setError('')


      /*
       * If unread, mark it read before
       * opening its destination.
       */
      if (
        !notification.readAt
      ) {
        await markNotificationRead(
          token,
          notification.id,
        )
      }


      const destination =
        notificationRoutes[
          notification.type
        ]


      if (destination) {
        navigate(
          destination,
        )

        return
      }


      await loadNotifications()

    } catch (err) {
      console.error(
        'Unable to open notification:',
        err,
      )


      setError(
        err.message ||
          'Unable to open notification',
      )
    }
  }


  /* ========================================
     MARK ONE AS READ
  ======================================== */

  async function handleMarkRead(
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


    try {
      setError('')

      setActionMessage('')


      await markNotificationRead(
        token,
        notification.id,
      )


      setActionMessage(
        'Notification marked as read.',
      )


      await loadNotifications()

    } catch (err) {
      console.error(
        'Unable to mark notification as read:',
        err,
      )


      setError(
        err.message ||
          'Unable to update notification',
      )
    }
  }


  /* ========================================
     MARK ALL AS READ
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


    if (
      unreadCount === 0
    ) {
      return
    }


    try {
      setError('')

      setActionMessage('')


      const data =
        await markAllNotificationsRead(
          token,
        )


      const updatedCount =
        Number(
          data?.updatedCount ??
            unreadCount,
        )


      setActionMessage(
        `${updatedCount} notification(s) marked as read.`,
      )


      await loadNotifications()

    } catch (err) {
      console.error(
        'Unable to mark all notifications as read:',
        err,
      )


      setError(
        err.message ||
          'Unable to update notifications',
      )
    }
  }


  /* ========================================
     DISMISS / DELETE ONE
  ======================================== */

  async function handleDelete(
    notification,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${notification.title}"?`,
      )


    if (!confirmed) {
      return
    }


    const token =
      sessionStorage.getItem(
        'malios_token',
      )


    if (!token) {
      navigate('/login')

      return
    }


    try {
      setError('')

      setActionMessage('')


      /*
       * The backend now soft-dismisses the
       * notification using dismissedAt.
       */
      await deleteNotification(
        token,
        notification.id,
      )


      setActionMessage(
        'Notification deleted.',
      )


      await loadNotifications()

    } catch (err) {
      console.error(
        'Unable to delete notification:',
        err,
      )


      setError(
        err.message ||
          'Unable to delete notification',
      )
    }
  }


  /* ========================================
     CLEAR READ NOTIFICATIONS
  ======================================== */

  async function handleClearRead() {
    const readCount =
      Math.max(
        totalCount -
          unreadCount,
        0,
      )


    if (
      readCount === 0
    ) {
      return
    }


    const confirmed =
      window.confirm(
        'Delete all read notifications?',
      )


    if (!confirmed) {
      return
    }


    const token =
      sessionStorage.getItem(
        'malios_token',
      )


    if (!token) {
      navigate('/login')

      return
    }


    try {
      setError('')

      setActionMessage('')


      /*
       * Backend soft-dismisses the read
       * notifications rather than physically
       * deleting them.
       */
      const data =
        await clearReadNotifications(
          token,
        )


      const deletedCount =
        Number(
          data?.deletedCount ??
            0,
        )


      setActionMessage(
        `${deletedCount} read notification(s) cleared.`,
      )


      await loadNotifications()

    } catch (err) {
      console.error(
        'Unable to clear read notifications:',
        err,
      )


      setError(
        err.message ||
          'Unable to clear notifications',
      )
    }
  }


  /* ========================================
     CALCULATED VALUES
  ======================================== */

  const readCount =
    Math.max(
      totalCount -
        unreadCount,
      0,
    )


  /* ========================================
     USER INTERFACE
  ======================================== */

  return (
    <div className="notifications-page">

      {/* ====================================
          PAGE INTRO
      ==================================== */}

      <div className="page-intro">

        <p>
          Review financial alerts,
          account warnings,
          investment updates and
          goal notifications.
        </p>

      </div>


      {/* ====================================
          SUMMARY CARDS
      ==================================== */}

      <section className="notifications-summary">

        <div className="notification-summary-card">

          <span>
            Total Notifications
          </span>

          <strong>
            {totalCount}
          </strong>

        </div>


        <div className="notification-summary-card">

          <span>
            Unread
          </span>

          <strong>
            {unreadCount}
          </strong>

        </div>


        <div className="notification-summary-card">

          <span>
            Read
          </span>

          <strong>
            {readCount}
          </strong>

        </div>

      </section>


      {/* ====================================
          SUCCESS MESSAGE
      ==================================== */}

      {actionMessage && (

        <div className="success-message">

          {actionMessage}

        </div>

      )}


      {/* ====================================
          ERROR MESSAGE
      ==================================== */}

      {error && (

        <div className="error-message">

          {error}

        </div>

      )}


      {/* ====================================
          FILTERS + ACTIONS
      ==================================== */}

      <section className="card notifications-controls">

        <div className="notifications-filters">


          {/* STATUS FILTER */}

          <div className="form-field">

            <label
              htmlFor="notification-status-filter"
            >
              Status
            </label>


            <select
              id="notification-status-filter"
              value={
                statusFilter
              }
              onChange={(
                event,
              ) => {
                setStatusFilter(
                  event.target.value,
                )
              }}
            >

              <option value="ALL">
                All
              </option>


              <option value="UNREAD">
                Unread
              </option>


              <option value="READ">
                Read
              </option>

            </select>

          </div>


          {/* TYPE FILTER */}

          <div className="form-field">

            <label
              htmlFor="notification-type-filter"
            >
              Type
            </label>


            <select
              id="notification-type-filter"
              value={
                typeFilter
              }
              onChange={(
                event,
              ) => {
                setTypeFilter(
                  event.target.value,
                )
              }}
            >

              {Object.entries(
                notificationTypeLabels,
              ).map(
                ([
                  value,
                  label,
                ]) => (

                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>

                ),
              )}

            </select>

          </div>

        </div>


        {/* ACTION BUTTONS */}

        <div className="notifications-actions">

          <button
            type="button"
            onClick={
              handleMarkAllRead
            }
            disabled={
              unreadCount === 0
            }
          >
            Mark All Read
          </button>


          <button
            type="button"
            className="secondary-danger-button"
            onClick={
              handleClearRead
            }
            disabled={
              readCount === 0
            }
          >
            Clear Read
          </button>

        </div>

      </section>


      {/* ====================================
          NOTIFICATION HISTORY
      ==================================== */}

      <section className="card notifications-history">

        <div className="notifications-history-heading">

          <div>

            <span className="section-label">
              Notifications
            </span>


            <h3>
              Notification History
            </h3>

          </div>


          <span className="notifications-result-count">

            {notifications.length}
            {' '}
            shown

          </span>

        </div>


        {/* ==================================
            LOADING
        ================================== */}

        {loading &&
          notifications.length ===
            0 && (

            <div className="notifications-page-empty">

              Loading notifications...

            </div>

          )}


        {/* ==================================
            EMPTY
        ================================== */}

        {!loading &&
          notifications.length ===
            0 && (

            <div className="notifications-page-empty">

              No notifications match
              these filters.

            </div>

          )}


        {/* ==================================
            NOTIFICATION LIST
        ================================== */}

        {notifications.length >
          0 && (

          <div className="notifications-page-list">

            {notifications.map(
              (
                notification,
              ) => (

                <article
                  key={
                    notification.id
                  }
                  className={
                    notification.readAt
                      ? 'notifications-page-item'
                      : 'notifications-page-item unread'
                  }
                >

                  {/* ========================
                      SEVERITY DOT
                  ======================== */}

                  <div
                    className={
                      `notifications-page-severity ` +
                      `${String(
                        notification.severity,
                      ).toLowerCase()}`
                    }
                  />


                  {/* ========================
                      CONTENT
                  ======================== */}

                  <div className="notifications-page-content">


                    {/* HEADING */}

                    <div className="notifications-page-item-heading">

                      <div>

                        <strong>

                          {
                            notification.title
                          }

                        </strong>


                        <span>

                          {notificationTypeLabels[
                            notification.type
                          ] ||
                            notification.type}

                        </span>

                      </div>


                      <time>

                        {formatNotificationDate(
                          notification.createdAt,
                        )}

                      </time>

                    </div>


                    {/* MESSAGE */}

                    <p>

                      {
                        notification.message
                      }

                    </p>


                    {/* ACTIONS */}

                    <div className="notifications-page-item-actions">

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenNotification(
                            notification,
                          )
                        }
                      >
                        Open
                      </button>


                      {!notification.readAt && (

                        <button
                          type="button"
                          onClick={() =>
                            handleMarkRead(
                              notification,
                            )
                          }
                        >
                          Mark Read
                        </button>

                      )}


                      <button
                        type="button"
                        className="notification-delete-button"
                        onClick={() =>
                          handleDelete(
                            notification,
                          )
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </article>

              ),
            )}

          </div>

        )}

      </section>

    </div>
  )
}


export default Notifications