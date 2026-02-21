import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Car, Wrench, FileText, Settings,
  Archive, ClipboardList, Receipt, LogOut, Gauge, UserCog, Cog, Menu, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navigation = [
  { name: 'Paneli', to: '/', icon: LayoutDashboard },
  { name: 'Klientët', to: '/clients', icon: Users },
  { name: 'Automjetet', to: '/vehicles', icon: Car },
  { name: 'Servisimet Aktive', to: '/active-services', icon: Cog },
  { name: 'Servisimet', to: '/orders', icon: FileText },
  { name: 'Shërbimet', to: '/services', icon: Settings },
  { name: 'Raportet Ditore', to: '/logs', icon: ClipboardList },
  { name: 'Arkiva', to: '/archive', icon: Archive },
  { name: 'Faturat', to: '/invoices', icon: Receipt },
  { name: 'Punonjësit', to: '/employees', icon: UserCog },
]

export const Sidebar = () => {
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try { await signOut() } catch (error) { console.error('Error signing out:', error) }
  }

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-400 flex items-center justify-center shadow-lg">
              <Gauge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-display tracking-wider text-white leading-tight">AUTO SERVICE<br/>BASHKIMI</h1>
              <p className="text-[9px] text-primary-400 tracking-[3px] uppercase mt-0.5">CHIPTUNING</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setMobileOpen(false)}
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
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
          <LogOut className="w-4 h-4" /><span>Dilni</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-dark-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-400 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-display tracking-wider">AUTO SERVICE BASHKIMI</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - desktop: static, mobile: slide-in drawer */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-auto
        w-[260px] bg-dark-500 text-white min-h-screen h-screen flex flex-col border-r border-dark-400
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {sidebarContent}
      </aside>
    </>
  )
}
