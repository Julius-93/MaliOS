import { applyTheme } from './theme'

const PREFERENCES_KEY =
  'malios_preferences'

export const DEFAULT_PREFERENCES = {
  theme: 'SYSTEM',

  compactMode: false,
  reducedMotion: false,

  defaultCurrency: 'KES',
  defaultAccountId: null,
  dateFormat: 'DD_MM_YYYY',

  hideBalances: false,

  budgetNotifications: true,
  goalNotifications: true,
  investmentNotifications: true,
  largeTransactionAlerts: true,
  lowBalanceAlerts: true,

  budgetAlertThreshold: 80,
  largeTransactionThreshold: 50000,
  lowBalanceThreshold: 10000,

  autoLogoutMinutes: 30,
}


export function getStoredPreferences() {
  try {
    const saved =
      localStorage.getItem(
        PREFERENCES_KEY,
      )

    if (!saved) {
      return {
        ...DEFAULT_PREFERENCES,
      }
    }

    return {
      ...DEFAULT_PREFERENCES,
      ...JSON.parse(saved),
    }
  } catch {
    return {
      ...DEFAULT_PREFERENCES,
    }
  }
}


export function applyPreferences(
  preferences,
) {
  const prefs = {
    ...DEFAULT_PREFERENCES,
    ...preferences,
  }

  /* Theme */
  applyTheme(
    String(
      prefs.theme || 'SYSTEM',
    ).toLowerCase(),
  )

  /* Compact mode */
  document.documentElement.setAttribute(
    'data-compact',
    prefs.compactMode
      ? 'true'
      : 'false',
  )

  /* Reduced motion */
  document.documentElement.setAttribute(
    'data-reduced-motion',
    prefs.reducedMotion
      ? 'true'
      : 'false',
  )

  /* Privacy mode */
  document.documentElement.setAttribute(
    'data-hide-balances',
    prefs.hideBalances
      ? 'true'
      : 'false',
  )
}


export function saveStoredPreferences(
  preferences,
) {
  const merged = {
    ...DEFAULT_PREFERENCES,
    ...preferences,
  }

  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify(merged),
  )

  applyPreferences(merged)

  /*
   * Notify the currently-open MaliOS
   * page that settings changed.
   */
  window.dispatchEvent(
    new CustomEvent(
      'malios-preferences-updated',
      {
        detail: merged,
      },
    ),
  )

  return merged
}


export function clearStoredPreferences() {
  localStorage.removeItem(
    PREFERENCES_KEY,
  )
}