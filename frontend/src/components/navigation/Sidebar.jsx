import {
  NavLink,
} from 'react-router-dom'


const navigationSections = [
  {
    title: 'Overview',

    items: [
      {
        label: 'Dashboard',
        path: '/',
      },
    ],
  },

  {
    title: 'Money',

    items: [
      {
        label: 'Accounts',
        path: '/accounts',
      },

      {
        label: 'Transactions',
        path: '/transactions',
      },

      {
        label: 'Budgets',
        path: '/budgets',
      },

      {
        label: 'Cash Flow',
        path: '/cash-flow',
      },
    ],
  },

  {
    title: 'Invest',

    items: [
      {
        label: 'Portfolio',
        path: '/portfolio',
      },

      {
        label: 'Investments',
        path: '/investments',
      },

      {
        label: 'Opportunities',
        path: '/opportunities',
      },
    ],
  },

  {
    title: 'Plan',

    items: [
      {
        label: 'Goals',
        path: '/goals',
      },
    ],
  },
]


const systemItems = [
  {
    label: 'Notifications',
    path: '/notifications',
  },

  {
    label: 'Settings',
    path: '/settings',
  },
]


function Sidebar() {
  return (
    <aside className="sidebar">

      {/* =====================================
          LOGO
      ===================================== */}

      <div className="sidebar-logo">
        MaliOS
      </div>


      {/* =====================================
          MAIN NAVIGATION
      ===================================== */}

      <nav className="sidebar-nav">

        {navigationSections.map(
          (section) => (

            <div
              className="sidebar-section"
              key={section.title}
            >

              <p className="sidebar-section-title">
                {section.title}
              </p>


              <div className="sidebar-section-items">

                {section.items.map(
                  (item) => (

                    <NavLink
                      to={item.path}
                      key={item.path}
                      end={
                        item.path === '/'
                      }
                      className={({
                        isActive,
                      }) =>
                        isActive
                          ? 'active'
                          : ''
                      }
                    >
                      {item.label}
                    </NavLink>

                  ),
                )}

              </div>

            </div>

          ),
        )}

      </nav>


      {/* =====================================
          SYSTEM NAVIGATION
      ===================================== */}

      <div className="sidebar-bottom">

        <p className="sidebar-section-title">
          System
        </p>


        <div className="sidebar-section-items">

          {systemItems.map(
            (item) => (

              <NavLink
                to={item.path}
                key={item.path}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? 'active'
                    : ''
                }
              >
                {item.label}
              </NavLink>

            ),
          )}

        </div>

      </div>

    </aside>
  )
}


export default Sidebar