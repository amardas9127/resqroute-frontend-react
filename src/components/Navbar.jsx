import { Bell, LogOut, Search, User } from 'lucide-react'

const Navbar = ({ hospital, onLogout }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
      {/* <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patients, ambulances..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
          />
        </div>
      </div> */}

      <div className="flex items-center w-full">
        <button
          onClick={onLogout}
          className="ml-auto p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group flex items-center gap-2"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium hidden lg:block group-hover:text-red-600">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
