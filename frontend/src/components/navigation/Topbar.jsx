function Topbar() {
  return (
    <header className="topbar">
      <div>
        <p className="topbar-label">Financial Overview</p>
        <h1 className="topbar-title">Dashboard</h1>
      </div>

      <div className="topbar-actions">
        <button type="button" className="notification-button">
          Notifications
        </button>

        <button type="button" className="profile-button">
          Julius
        </button>
      </div>
    </header>
  )
}

export default Topbar
