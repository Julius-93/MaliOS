import Sidebar from '../components/navigation/Sidebar'
import Topbar from '../components/navigation/Topbar'

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
