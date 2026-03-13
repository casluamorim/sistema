import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Kanban, BarChart3, DollarSign,
  Calendar, Heart, Package, UserCheck, FileText,
  Settings, LogOut, ChevronRight, Megaphone, Wrench
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm', icon: Kanban, label: 'Pipeline / CRM' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/entregas', icon: ChevronRight, label: 'Entregas' },
  { to: '/trafego', icon: Megaphone, label: 'Tráfego Pago' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/casamentos', icon: Heart, label: 'Casamentos' },
  { to: '/fornecedores', icon: UserCheck, label: 'Fornecedores' },
  { to: '/equipamentos', icon: Package, label: 'Equipamentos' },
  { to: '/propostas', icon: FileText, label: 'Propostas' },
]

const bottomItems = [
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">Racun HQ</p>
            <p className="text-xs text-gray-500">Agência Racun</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active')
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}

        <div className="pt-3 mt-3 border-t border-gray-800 space-y-0.5">
          <NavLink
            to="/portal-cliente"
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active')
            }
          >
            <Wrench size={16} />
            <span>Portal do Cliente</span>
          </NavLink>
          {bottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn('sidebar-link', isActive && 'active')
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-800">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full bg-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300">
            {profile?.nome?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">{profile?.nome || 'Admin'}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={13} />
          Sair
        </button>
      </div>
    </aside>
  )
}
