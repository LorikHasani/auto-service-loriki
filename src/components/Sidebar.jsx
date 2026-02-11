import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Car, Wrench, FileText, 
  Archive, ClipboardList, Receipt, LogOut, Gauge, UserCog
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { name: 'Paneli', to: '/', icon: LayoutDashboard },
  { name: 'Klientët', to: '/clients', icon: Users },
  { name: 'Automjetet', to: '/vehicles', icon: Car },
  { name: 'Shërbimet', to: '/services', icon: Wrench },
  { name: 'Punonjësit', to: '/employees', icon: UserCog },
  { name: 'Porositë', to: '/orders', icon: FileText },
  { name: 'Arkiva', to: '/archive', icon: Archive },
  { name: 'Regjistri Ditor', to: '/logs', icon: ClipboardList },
  { name: 'Faturat', to: '/invoices', icon: Receipt },
]

export const Sidebar = () => {
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try { await signOut() } catch (error) { console.error('Error signing out:', error) }
  }

  return (
    <aside className="w-[260px] bg-dark-500 text-white min-h-screen flex flex-col border-r border-dark-400">
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-400 flex items-center justify-center shadow-lg">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-display tracking-wider text-white leading-none">AUTO SERVICE</h1>
            <p className="text-[10px] text-primary-400 tracking-widest uppercase mt-0.5">BASHKIMI</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-[14px] ${
                isActive
                  ? 'bg-primary-400/15 text-primary-400 font-semibold'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="bg-white/[0.04] rounded-lg px-3 py-3 mb-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Llogaria</p>
          <p className="text-xs font-medium text-gray-300 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Dilni</span>
        </button>
      </div>
    </aside>
  )
}
