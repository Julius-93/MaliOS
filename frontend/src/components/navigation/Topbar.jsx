import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../services/api'

function Topbar() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)

  useEffect(() => {
    async function loadUser() {
      const token = sessionStorage.getItem('malios_token')

      if (!token) {
        navigate('/login')
        return
      }

      try {
        const currentUser = await getCurrentUser(token)
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to load current user:', error)

        sessionStorage.removeItem('malios_token')
        navigate('/login')
      }
    }

    loadUser()
  }, [navigate])

  function handleLogout() {
    sessionStorage.removeItem('malios_token')
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div>
        <p className="topbar-label">Financial Overview</p>
        <h1 className="topbar-title">Dashboard</h1>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="notification-button"
        >
          Notifications
        </button>

        <div className="profile-menu">
          <span className="profile-name">
            {user ? user.firstName : 'Loading...'}
          </span>

          <button
            type="button"
            className="profile-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Topbar
