import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Receipt, BarChart3, Fuel, TrendingUp,
  Trophy, Download, UserCircle,
} from 'lucide-react'
import { RouteSeo } from '../seo/route-seo'

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/receipts', icon: Receipt, label: 'Receipts' },
  { to: '/analysis', icon: BarChart3, label: 'Analysis' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/top', icon: Trophy, label: 'Top 10' },
  { to: '/gas', icon: Fuel, label: 'Gas' },
  { to: '/scan', icon: Download, label: 'Import' },
] as const

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col pb-14 md:pb-0">
      <RouteSeo />
      {/* ─── Header ─── */}
      <header className="bg-costco-red text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg">
            C
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Costco Tracker</h1>
          <div className="flex-1" />
          {/* Profile — always in header on mobile, part of tabs on desktop */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `md:hidden w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isActive ? 'bg-white text-costco-red' : 'bg-white/20 text-white hover:bg-white/30'
              }`
            }
          >
            <UserCircle size={18} />
          </NavLink>
        </div>
        {/* Desktop tabs */}
        <nav className="hidden md:flex max-w-5xl mx-auto px-4 gap-1 -mb-px overflow-x-auto">
          {tabs.map((t) => (
            <DesktopTab key={t.to} to={t.to} icon={<t.icon size={16} />} label={t.label} />
          ))}
          <DesktopTab to="/profile" icon={<UserCircle size={16} />} label="Profile" />
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>

      {/* ─── Mobile bottom bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t z-40 safe-bottom">
        <div className="flex items-stretch">
          {tabs.map((t) => (
            <MobileTab key={t.to} to={t.to} icon={<t.icon size={20} />} label={t.label} />
          ))}
        </div>
      </nav>
    </div>
  )
}

// ─── Desktop tab ───

function DesktopTab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
          isActive
            ? 'bg-surface-2 text-costco-red'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

// ─── Mobile tab ───

function MobileTab({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
          isActive ? 'text-costco-red' : 'text-text-3'
        }`
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}
