import {
  useEffect,
  useState,
} from 'react'

import {
  changePassword,
  deleteAccount,
  exportMaliosData,
  exportTransactionsCsv,
  getAccounts,
  getSettings,
  signOutAllSessions,
  updatePreferences,
  updateProfile,
} from '../services/api'

import {
  applyTheme,
} from '../utils/theme'

import {
  clearStoredPreferences,
  saveStoredPreferences,
} from '../utils/preferences'


function Settings() {
  const [user, setUser] =
    useState(null)

  const [accounts, setAccounts] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false)

  const [
    savingPreferences,
    setSavingPreferences,
  ] = useState(false)

  const [
    deletingAccount,
    setDeletingAccount,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')


  /* ========================================
     PROFILE
  ======================================== */

  const [firstName, setFirstName] =
    useState('')

  const [lastName, setLastName] =
    useState('')


  /* ========================================
     APPEARANCE
  ======================================== */

  const [theme, setTheme] =
    useState('system')

  const [
    compactMode,
    setCompactMode,
  ] = useState(false)

  const [
    reducedMotion,
    setReducedMotion,
  ] = useState(false)


  /* ========================================
     FINANCIAL PREFERENCES
  ======================================== */

  const [
    defaultCurrency,
    setDefaultCurrency,
  ] = useState('KES')

  const [
    defaultAccountId,
    setDefaultAccountId,
  ] = useState('')

  const [
    dateFormat,
    setDateFormat,
  ] = useState(
    'DD_MM_YYYY',
  )

  const [
    hideBalances,
    setHideBalances,
  ] = useState(false)


  /* ========================================
     NOTIFICATIONS
  ======================================== */

  const [
    budgetNotifications,
    setBudgetNotifications,
  ] = useState(true)

  const [
    goalNotifications,
    setGoalNotifications,
  ] = useState(true)

  const [
    investmentNotifications,
    setInvestmentNotifications,
  ] = useState(true)

  const [
    largeTransactionAlerts,
    setLargeTransactionAlerts,
  ] = useState(true)

  const [
    lowBalanceAlerts,
    setLowBalanceAlerts,
  ] = useState(true)

  const [
    budgetAlertThreshold,
    setBudgetAlertThreshold,
  ] = useState(80)

  const [
    largeTransactionThreshold,
    setLargeTransactionThreshold,
  ] = useState(50000)

  const [
    lowBalanceThreshold,
    setLowBalanceThreshold,
  ] = useState(10000)

  /* ========================================
     SECURITY
  ======================================== */

  const [
    autoLogoutMinutes,
    setAutoLogoutMinutes,
  ] = useState(30)

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState('')

  const [
    newPassword,
    setNewPassword,
  ] = useState('')

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState('')

  const [
    changingPassword,
    setChangingPassword,
  ] = useState(false)


  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] = useState(false)

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false)

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false)


  /* ========================================
     DELETE ACCOUNT
  ======================================== */

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState('')


  /* ========================================
     LOAD SETTINGS
  ======================================== */

  useEffect(() => {
    loadSettings()
  }, [])


  async function loadSettings() {
    try {
      setLoading(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const [
        settingsData,
        accountsData,
      ] = await Promise.all([
        getSettings(token),
        getAccounts(token),
      ])

      const currentUser =
        settingsData.user

      const preferences =
        settingsData.settings

      setUser(currentUser)

      setFirstName(
        currentUser.firstName,
      )

      setLastName(
        currentUser.lastName,
      )

      setAccounts(
        accountsData || [],
      )


      const loadedTheme =
        String(
          preferences.theme ||
            'SYSTEM',
        ).toLowerCase()

      setTheme(loadedTheme)

      setCompactMode(
        Boolean(
          preferences.compactMode,
        ),
      )

      setReducedMotion(
        Boolean(
          preferences.reducedMotion,
        ),
      )

      setDefaultCurrency(
        preferences
          .defaultCurrency ||
          'KES',
      )

      setDefaultAccountId(
        preferences
          .defaultAccountId ||
          '',
      )

      setDateFormat(
        preferences.dateFormat ||
          'DD_MM_YYYY',
      )

      setHideBalances(
        Boolean(
          preferences.hideBalances,
        ),
      )

      setBudgetNotifications(
        Boolean(
          preferences
            .budgetNotifications,
        ),
      )

      setGoalNotifications(
        Boolean(
          preferences
            .goalNotifications,
        ),
      )

      setInvestmentNotifications(
        Boolean(
          preferences
            .investmentNotifications,
        ),
      )

      setLargeTransactionAlerts(
        Boolean(
          preferences
            .largeTransactionAlerts,
        ),
      )

      setLowBalanceAlerts(
        Boolean(
          preferences
            .lowBalanceAlerts,
        ),
      )

      setBudgetAlertThreshold(
        Number(
          preferences
            .budgetAlertThreshold ??
            80,
        ),
      )

      setLargeTransactionThreshold(
        Number(
          preferences
            .largeTransactionThreshold ??
            50000,
        ),
      )

      setLowBalanceThreshold(
        Number(
          preferences
            .lowBalanceThreshold ??
            10000,
        ),
      )

      setAutoLogoutMinutes(
        Number(
          preferences
            .autoLogoutMinutes ??
            30,
        ),
      )

      saveStoredPreferences(
        preferences,
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to load settings',
      )
    } finally {
      setLoading(false)
    }
  }


  /* ========================================
     PROFILE
  ======================================== */

  async function handleSaveProfile(
    event,
  ) {
    event.preventDefault()

    try {
      setSavingProfile(true)
      setError('')
      setSuccess('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await updateProfile(
          token,
          {
            firstName,
            lastName,
          },
        )

      setUser(data.user)

      setSuccess(
        'Profile updated successfully.',
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to update profile',
      )
    } finally {
      setSavingProfile(false)
    }
  }


  /* ========================================
     THEME
  ======================================== */

  async function handleThemeChange(
    newTheme,
  ) {
    const previousTheme =
      theme

    try {
      setError('')
      setSuccess('')

      setTheme(newTheme)

      applyTheme(newTheme)

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await updatePreferences(
          token,
          {
            theme:
              newTheme.toUpperCase(),
          },
        )

      saveStoredPreferences(
        data.settings,
      )
    } catch (err) {
      setTheme(
        previousTheme,
      )

      applyTheme(
        previousTheme,
      )

      setError(
        err.message ||
          'Unable to save theme',
      )
    }
  }


  /* ========================================
     PRIVACY MODE
  ======================================== */

  async function handleHideBalancesChange(
    newValue,
  ) {
    const previousValue =
      hideBalances

    try {
      setError('')
      setSuccess('')

      setHideBalances(
        newValue,
      )

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await updatePreferences(
          token,
          {
            hideBalances:
              newValue,
          },
        )

      saveStoredPreferences(
        data.settings,
      )

      setSuccess(
        newValue
          ? 'Privacy Mode enabled.'
          : 'Privacy Mode disabled.',
      )
    } catch (err) {
      setHideBalances(
        previousValue,
      )

      setError(
        err.message ||
          'Unable to update Privacy Mode',
      )
    }
  }

  async function handleAutoLogoutChange(
  newValue,
) {
  const previousValue =
    autoLogoutMinutes

  try {
    setError('')
    setSuccess('')

    const numericValue =
      Number(newValue)

    setAutoLogoutMinutes(
      numericValue,
    )

    const token =
      sessionStorage.getItem(
        'malios_token',
      )

    const data =
      await updatePreferences(
        token,
        {
          autoLogoutMinutes:
            numericValue,
        },
      )

    saveStoredPreferences(
      data.settings,
    )

    let description

    if (numericValue === 0.5) {
      description =
        '30 seconds'
    } else if (
      numericValue === 1
    ) {
      description =
        '1 minute'
    } else if (
      numericValue === 60
    ) {
      description =
        '1 hour'
    } else if (
      numericValue === 120
    ) {
      description =
        '2 hours'
    } else {
      description =
        `${numericValue} minutes`
    }

    setSuccess(
      `Automatic logout set to ${description}.`,
    )
  } catch (err) {
    setAutoLogoutMinutes(
      previousValue,
    )

    setError(
      err.message ||
        'Unable to update automatic logout',
    )
  }
}

  /* ========================================
     SAVE OTHER PREFERENCES
  ======================================== */

  async function handleSavePreferences() {
    try {
      setSavingPreferences(true)

      setError('')
      setSuccess('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await updatePreferences(
          token,
          {
            theme:
              theme.toUpperCase(),

            compactMode,

            reducedMotion,

            defaultCurrency:
              defaultCurrency
                .toUpperCase(),

            defaultAccountId:
              defaultAccountId ||
              null,

            dateFormat,

            hideBalances,

            budgetNotifications,

            goalNotifications,

            investmentNotifications,

            largeTransactionAlerts,

            lowBalanceAlerts,

            budgetAlertThreshold:
              Number(
                budgetAlertThreshold,
              ),

            largeTransactionThreshold:
              Number(
                largeTransactionThreshold,
              ),

            lowBalanceThreshold:
              Number(
                lowBalanceThreshold,
              ),

            autoLogoutMinutes:
              Number(
                autoLogoutMinutes,
              ),
          },
        )

      saveStoredPreferences(
        data.settings,
      )

      setSuccess(
        'Settings saved successfully.',
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to save settings',
      )
    } finally {
      setSavingPreferences(false)
    }
  }


  /* ========================================
     DATA EXPORT
  ======================================== */

  function downloadBlob(
    blob,
    filename,
  ) {
    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url
    link.download = filename

    document.body.appendChild(
      link,
    )

    link.click()

    link.remove()

    URL.revokeObjectURL(url)
  }


  async function handleExportCsv() {
    try {
      setError('')
      setSuccess('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const blob =
        await exportTransactionsCsv(
          token,
        )

      downloadBlob(
        blob,
        'malios-transactions.csv',
      )

      setSuccess(
        'Transaction export created successfully.',
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to export transactions',
      )
    }
  }


  async function handleExportJson() {
    try {
      setError('')
      setSuccess('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      const data =
        await exportMaliosData(
          token,
        )

      const blob =
        new Blob(
          [
            JSON.stringify(
              data,
              null,
              2,
            ),
          ],
          {
            type:
              'application/json',
          },
        )

      downloadBlob(
        blob,
        'malios-data.json',
      )

      setSuccess(
        'MaliOS data export created successfully.',
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to export MaliOS data',
      )
    }
  }

/* ========================================
   CHANGE PASSWORD
======================================== */

async function handleChangePassword(
  event,
) {
  event.preventDefault()


  setError('')
  setSuccess('')


  if (
    newPassword.length < 12
  ) {
    setError(
      'New password must be at least 12 characters long.',
    )

    return
  }


  if (
    newPassword !==
    confirmNewPassword
  ) {
    setError(
      'New passwords do not match.',
    )

    return
  }


  if (
    currentPassword ===
    newPassword
  ) {
    setError(
      'New password must be different from your current password.',
    )

    return
  }


  try {
    setChangingPassword(true)


    const token =
      sessionStorage.getItem(
        'malios_token',
      )


    await changePassword(
      token,
      {
        currentPassword,

        newPassword,

        confirmPassword:
          confirmNewPassword,
      },
    )


    /*
     * Never keep password values in
     * React state after a successful
     * change.
     */
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')

    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)


    setSuccess(
      'Password changed successfully. Other active sessions have been signed out.',
    )
  } catch (err) {
    setError(
      err.message ||
        'Unable to change password',
    )
  } finally {
    setChangingPassword(false)
  }
}

  /* ========================================
     SESSION MANAGEMENT
  ======================================== */

  function handleCurrentSignOut() {
    sessionStorage.removeItem(
      'malios_token',
    )

    window.location.href =
      '/login'
  }


  async function handleSignOutAll() {
    const confirmed =
      window.confirm(
        'Sign out all MaliOS sessions? You will need to sign in again.',
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      await signOutAllSessions(
        token,
      )

      sessionStorage.removeItem(
        'malios_token',
      )

      window.location.href =
        '/login'
    } catch (err) {
      setError(
        err.message ||
          'Unable to sign out sessions',
      )
    }
  }


  /* ========================================
     DELETE ACCOUNT
  ======================================== */

  async function handleDeleteAccount() {
    if (
      deleteConfirmation !==
      'DELETE'
    ) {
      setError(
        'Type DELETE to confirm account deletion.',
      )

      return
    }

    const confirmed =
      window.confirm(
        'This permanently deletes your MaliOS account and all associated financial data. This cannot be undone. Continue?',
      )

    if (!confirmed) {
      return
    }

    try {
      setDeletingAccount(true)
      setError('')

      const token =
        sessionStorage.getItem(
          'malios_token',
        )

      await deleteAccount(
        token,
        deleteConfirmation,
      )

      sessionStorage.removeItem(
        'malios_token',
      )

      clearStoredPreferences()

      window.location.href =
        '/login'
    } catch (err) {
      setError(
        err.message ||
          'Unable to delete account',
      )
    } finally {
      setDeletingAccount(false)
    }
  }


  /* ========================================
     HELPERS
  ======================================== */

  function formatDate(value) {
    if (!value) {
      return ''
    }

    return new Intl.DateTimeFormat(
      'en-KE',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(
      new Date(value),
    )
  }


  if (loading) {
    return (
      <p>
        Loading account settings...
      </p>
    )
  }


  if (!user) {
    return (
      <div className="error-message">
        Unable to load user settings.
      </div>
    )
  }


  return (
    <div className="settings-page">

      <div className="page-intro">
        <p>
          Manage your MaliOS profile,
          financial preferences,
          notifications, security and
          privacy.
        </p>
      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {success && (
        <div className="success-message">
          {success}
        </div>
      )}


      {/* APPEARANCE */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Appearance
          </span>

          <h3>
            Display Preferences
          </h3>

        </div>


        <div className="settings-row">

          <div>

            <strong>
              Color Theme
            </strong>

            <p>
              Choose how MaliOS appears
              on this device.
            </p>

          </div>


          <div className="theme-selector">

            <button
              type="button"
              className={
                theme === 'light'
                  ? 'theme-option active'
                  : 'theme-option'
              }
              onClick={() =>
                handleThemeChange(
                  'light',
                )
              }
            >
              ☀️ Light
            </button>


            <button
              type="button"
              className={
                theme === 'dark'
                  ? 'theme-option active'
                  : 'theme-option'
              }
              onClick={() =>
                handleThemeChange(
                  'dark',
                )
              }
            >
              🌙 Dark
            </button>


            <button
              type="button"
              className={
                theme === 'system'
                  ? 'theme-option active'
                  : 'theme-option'
              }
              onClick={() =>
                handleThemeChange(
                  'system',
                )
              }
            >
              💻 System
            </button>

          </div>

        </div>


        <SettingToggle
          title="Compact Mode"
          description="Reduce spacing and show more information on screen."
          checked={compactMode}
          onChange={
            setCompactMode
          }
        />


        <SettingToggle
          title="Reduced Motion"
          description="Reduce animations and motion effects throughout MaliOS."
          checked={reducedMotion}
          onChange={
            setReducedMotion
          }
        />

      </section>


      {/* PROFILE */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Profile
          </span>

          <h3>
            Personal Information
          </h3>

        </div>


        <form
          className="settings-profile-form"
          onSubmit={
            handleSaveProfile
          }
        >

          <div className="form-field">

            <label>
              First Name
            </label>

            <input
              type="text"
              value={firstName}
              onChange={(event) =>
                setFirstName(
                  event.target.value,
                )
              }
              required
            />

          </div>


          <div className="form-field">

            <label>
              Last Name
            </label>

            <input
              type="text"
              value={lastName}
              onChange={(event) =>
                setLastName(
                  event.target.value,
                )
              }
              required
            />

          </div>


          <div className="form-field">

            <label>
              Email Address
            </label>

            <input
              type="email"
              value={user.email}
              disabled
            />

            <small>
              Email changes are not
              currently available from
              profile settings.
            </small>

          </div>


          <button
            type="submit"
            disabled={
              savingProfile
            }
          >
            {savingProfile
              ? 'Saving...'
              : 'Save Profile'}
          </button>

        </form>

      </section>


      {/* FINANCIAL PREFERENCES */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Finance
          </span>

          <h3>
            Financial Preferences
          </h3>

        </div>


        <div className="settings-grid">

          <div className="form-field">

            <label>
              Default Currency
            </label>

            <select
              value={
                defaultCurrency
              }
              onChange={(event) =>
                setDefaultCurrency(
                  event.target.value,
                )
              }
            >

              <option value="KES">
                KES
              </option>

              <option value="USD">
                USD
              </option>

              <option value="EUR">
                EUR
              </option>

              <option value="GBP">
                GBP
              </option>

            </select>

          </div>


          <div className="form-field">

            <label>
              Default Account
            </label>

            <select
              value={
                defaultAccountId
              }
              onChange={(event) =>
                setDefaultAccountId(
                  event.target.value,
                )
              }
            >

              <option value="">
                No default account
              </option>

              {accounts.map(
                (account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.name}
                  </option>
                ),
              )}

            </select>

          </div>


          <div className="form-field">

            <label>
              Date Format
            </label>

            <select
              value={dateFormat}
              onChange={(event) =>
                setDateFormat(
                  event.target.value,
                )
              }
            >

              <option value="DD_MM_YYYY">
                DD/MM/YYYY
              </option>

              <option value="MM_DD_YYYY">
                MM/DD/YYYY
              </option>

              <option value="YYYY_MM_DD">
                YYYY-MM-DD
              </option>

            </select>

          </div>

        </div>


        <SettingToggle
          title="Privacy Mode / Hide Balances"
          description="Hide sensitive monetary values throughout MaliOS."
          checked={hideBalances}
          onChange={
            handleHideBalancesChange
          }
        />

      </section>


      {/* NOTIFICATIONS */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Notifications
          </span>

          <h3>
            Financial Alerts
          </h3>

        </div>


        <SettingToggle
          title="Budget Alerts"
          description="Notify when budget usage approaches its configured limit."
          checked={
            budgetNotifications
          }
          onChange={
            setBudgetNotifications
          }
        />


        <div className="settings-grid">

          <div className="form-field">

            <label>
              Budget Warning (%)
            </label>

            <input
              type="number"
              min="1"
              max="100"
              value={
                budgetAlertThreshold
              }
              onChange={(event) =>
                setBudgetAlertThreshold(
                  event.target.value,
                )
              }
            />

          </div>

        </div>


        <SettingToggle
          title="Low Balance Alerts"
          description="Notify when account balances fall below your selected threshold."
          checked={
            lowBalanceAlerts
          }
          onChange={
            setLowBalanceAlerts
          }
        />


        <div className="settings-grid">

          <div className="form-field">

            <label>
              Low Balance Threshold
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                lowBalanceThreshold
              }
              onChange={(event) =>
                setLowBalanceThreshold(
                  event.target.value,
                )
              }
            />

          </div>

        </div>


        <SettingToggle
          title="Large Transaction Alerts"
          description="Notify when a transaction exceeds your selected amount."
          checked={
            largeTransactionAlerts
          }
          onChange={
            setLargeTransactionAlerts
          }
        />


        <div className="settings-grid">

          <div className="form-field">

            <label>
              Large Transaction Threshold
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                largeTransactionThreshold
              }
              onChange={(event) =>
                setLargeTransactionThreshold(
                  event.target.value,
                )
              }
            />

          </div>

        </div>


        <SettingToggle
          title="Goal Notifications"
          description="Notify when savings milestones and goal targets are reached."
          checked={
            goalNotifications
          }
          onChange={
            setGoalNotifications
          }
        />


        <SettingToggle
          title="Investment Notifications"
          description="Receive relevant portfolio and investment notifications."
          checked={
            investmentNotifications
          }
          onChange={
            setInvestmentNotifications
          }
        />

      </section>


      {/* SECURITY */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Security
          </span>

          <h3>
            Password & Session Security
          </h3>

        </div>


        {/* CHANGE PASSWORD */}

        <div className="settings-security-block">

          <div className="settings-security-heading">

            <strong>
              Change Password
            </strong>

            <p>
              Use a strong password with at least
              12 characters. Changing your password
              will sign out other active MaliOS sessions.
            </p>

          </div>


          <form
            className="settings-password-form"
            onSubmit={
              handleChangePassword
            }
          >

            <div className="form-field">

              <label htmlFor="current-password">
                Current Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="current-password"
                  type={
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={
                    currentPassword
                  }
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value,
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle-button"
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    minHeight: '38px',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setShowCurrentPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showCurrentPassword
                      ? 'Hide current password'
                      : 'Show current password'
                  }
                >
                  {showCurrentPassword
                    ? <EyeOffIcon />
                    : <EyeIcon />}
                </button>

              </div>

            </div>


            <div className="form-field">

              <label htmlFor="new-password">
                New Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="new-password"
                  type={
                    showNewPassword
                      ? 'text'
                      : 'password'
                  }
                  minLength="12"
                  maxLength="128"
                  autoComplete="new-password"
                  value={
                    newPassword
                  }
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value,
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle-button"
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    minHeight: '38px',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setShowNewPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showNewPassword
                      ? 'Hide new password'
                      : 'Show new password'
                  }
                >
                  {showNewPassword
                    ? <EyeOffIcon />
                    : <EyeIcon />}
                </button>

              </div>

              <small>
                Minimum 12 characters.
              </small>

            </div>


            <div className="form-field">

              <label htmlFor="confirm-new-password">
                Confirm New Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="confirm-new-password"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  minLength="12"
                  maxLength="128"
                  autoComplete="new-password"
                  value={
                    confirmNewPassword
                  }
                  onChange={(event) =>
                    setConfirmNewPassword(
                      event.target.value,
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle-button"
                  style={{
                    width: '38px',
                    height: '38px',
                    minWidth: '38px',
                    minHeight: '38px',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirmed password'
                      : 'Show confirmed password'
                  }
                >
                  {showConfirmPassword
                    ? <EyeOffIcon />
                    : <EyeIcon />}
                </button>

              </div>

            </div>


            <button
              type="submit"
              disabled={
                changingPassword
              }
            >
              {changingPassword
                ? 'Changing Password...'
                : 'Change Password'}
            </button>

          </form>

        </div>


        {/* AUTO LOGOUT */}

        <div className="settings-security-block">

          <div className="settings-security-heading">

            <strong>
              Automatic Logout
            </strong>

            <p>
              Automatically sign out after a
              period of inactivity.
            </p>

          </div>


          <div className="settings-grid">

            <div className="form-field">

              <label>
                Inactivity Period
              </label>

              <select
                value={
                  autoLogoutMinutes
                }
                onChange={(event) =>
                  handleAutoLogoutChange(
                   Number(
                     event.target.value,
                   ),
                 )
               }
             >

               <option value={0.5}>
                 30 seconds
               </option>

               <option value={1}>
                 1 minute
               </option>

               <option value={5}>
                 5 minutes
               </option>

                <option value={15}>
                  15 minutes
                </option>

                <option value={30}>
                  30 minutes
                </option>

                <option value={60}>
                 1 hour
                </option>

                <option value={120}>
                  2 hours
                </option>

              </select>


            </div>

          </div>

        </div>


        {/* CURRENT SESSION */}

        <div className="settings-row">

          <div>

            <strong>
              Current Session
            </strong>

            <p>
              Sign out of MaliOS on this
              browser only.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleCurrentSignOut
            }
          >
            Sign Out
          </button>

        </div>


        {/* ALL SESSIONS */}

        <div className="settings-row">

          <div>

            <strong>
              Sign Out All Sessions
            </strong>

            <p>
              End every active MaliOS
              session associated with
              your account.
            </p>

          </div>


          <button
            type="button"
            className="secondary-danger-button"
            onClick={
              handleSignOutAll
            }
          >
            Sign Out All
          </button>

        </div>

      </section>


      {/* SAVE SETTINGS */}

      <button
        type="button"
        className="settings-save-button"
        disabled={
          savingPreferences
        }
        onClick={
          handleSavePreferences
        }
      >
        {savingPreferences
          ? 'Saving Settings...'
          : 'Save Settings'}
      </button>


      {/* DATA & PRIVACY */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Data & Privacy
          </span>

          <h3>
            Your Financial Data
          </h3>

        </div>


        <div className="settings-row">

          <div>

            <strong>
              Export Transactions
            </strong>

            <p>
              Download transaction
              history as CSV for Excel
              or other financial tools.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleExportCsv
            }
          >
            Export CSV
          </button>

        </div>


        <div className="settings-row">

          <div>

            <strong>
              Export Complete MaliOS Data
            </strong>

            <p>
              Download accounts,
              transactions, budgets,
              goals, investments and
              preferences as JSON.
            </p>

          </div>


          <button
            type="button"
            onClick={
              handleExportJson
            }
          >
            Export JSON
          </button>

        </div>

      </section>


      {/* ACCOUNT */}

      <section className="card settings-section-card">

        <div className="settings-section-heading">

          <span className="section-label">
            Account
          </span>

          <h3>
            Account Information
          </h3>

        </div>


        <div className="settings-account-grid">

          <div>

            <span>
              Full Name
            </span>

            <strong>
              {user.firstName}{' '}
              {user.lastName}
            </strong>

          </div>


          <div>

            <span>
              Email
            </span>

            <strong>
              {user.email}
            </strong>

          </div>


          <div>

            <span>
              Member Since
            </span>

            <strong>
              {formatDate(
                user.createdAt,
              )}
            </strong>

          </div>


          <div>

            <span>
              Last Updated
            </span>

            <strong>
              {formatDate(
                user.updatedAt,
              )}
            </strong>

          </div>

        </div>

      </section>


      {/* DANGER ZONE */}

      <section className="card settings-danger-zone">

        <div className="settings-section-heading">

          <span className="section-label danger-label">
            Danger Zone
          </span>

          <h3>
            Delete Account
          </h3>

        </div>


        <p>
          Permanently delete your
          MaliOS account and all
          associated financial data.
          This action cannot be undone.
        </p>


        <div className="danger-confirmation">

          <div className="form-field">

            <label>
              Type DELETE to confirm
            </label>

            <input
              type="text"
              value={
                deleteConfirmation
              }
              onChange={(event) =>
                setDeleteConfirmation(
                  event.target.value,
                )
              }
              placeholder="DELETE"
            />

          </div>


          <button
            type="button"
            className="delete-account-button"
            disabled={
              deleteConfirmation !==
                'DELETE' ||
              deletingAccount
            }
            onClick={
              handleDeleteAccount
            }
          >
            {deletingAccount
              ? 'Deleting...'
              : 'Delete Account'}
          </button>

        </div>

      </section>

    </div>
  )
}


function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  )
}


function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.2 18.2 0 0 1-2.1 3.3" />
      <path d="M6.6 6.7C3.7 8.6 2 12 2 12s3.5 8 10 8a10.8 10.8 0 0 0 4.1-.8" />
    </svg>
  )
}


function SettingToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="settings-row">

      <div>

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>


      <button
        type="button"
        className={
          checked
            ? 'settings-toggle active'
            : 'settings-toggle'
        }
        aria-pressed={
          checked
        }
        aria-label={title}
        onClick={() =>
          onChange(!checked)
        }
      >
        <span />
      </button>

    </div>
  )
}


export default Settings
