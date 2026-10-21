import {
  useEffect,
  useState,
} from 'react'

import {
  getStoredPreferences,
} from '../../utils/preferences'


function SensitiveValue({
  children,
}) {
  const [
    hidden,
    setHidden,
  ] = useState(
    Boolean(
      getStoredPreferences()
        .hideBalances,
    ),
  )


  useEffect(() => {
    /*
     * Update immediately when settings
     * change inside MaliOS.
     */
    function handlePreferenceChange(
      event,
    ) {
      setHidden(
        Boolean(
          event.detail
            ?.hideBalances,
        ),
      )
    }


    /*
     * Also handle preference changes
     * from another browser tab.
     */
    function handleStorageChange() {
      setHidden(
        Boolean(
          getStoredPreferences()
            .hideBalances,
        ),
      )
    }


    window.addEventListener(
      'malios-preferences-updated',
      handlePreferenceChange,
    )

    window.addEventListener(
      'storage',
      handleStorageChange,
    )


    return () => {
      window.removeEventListener(
        'malios-preferences-updated',
        handlePreferenceChange,
      )

      window.removeEventListener(
        'storage',
        handleStorageChange,
      )
    }
  }, [])


  if (hidden) {
    return (
      <span className="sensitive-value"
      aria-label="Hidden financial value"
      >
        ********
      </span>
    )
  }


  return (
    <span className="sensitive-value">
      {children}
    </span>
  )
}


export default SensitiveValue