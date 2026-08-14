function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        MaliOS
      </div>

      <nav className="sidebar-nav">
        <a href="/">Dashboard</a>
        <a href="/">Money</a>
        <a href="/">Investments</a>
        <a href="/">Goals</a>
        <a href="/">Transactions</a>
      </nav>

      <div className="sidebar-bottom">
        <a href="/">Settings</a>
      </div>
    </aside>
  )
}

export default Sidebar
