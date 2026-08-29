import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Ambulance, Settings, LogOut } from 'lucide-react'

const Sidebar = ({ onLogout }) => {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Patients', path: '/patients', icon: <Users size={20} /> },
    { name: 'Ambulances', path: '/ambulances', icon: <Ambulance size={20} /> },
    { name: 'Profile', path: '/profile', icon: <Settings size={20} /> },
  ]

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-full flex flex-col shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          <Ambulance className="text-blue-600" />
          ResQRoute
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                  }`}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 mt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-center text-slate-500">
          Hospital Management System<br />v1.0.0
        </div>
      </div>
    </div>
  )
}

export default Sidebar
