import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Avatar, ThemeToggle } from '../ui/index.jsx'

const ROLE_CONFIG = {
  volunteer: {
    color: 'bg-teal-500',
    label: 'Volunteer',
    badge: 'badge-teal',
    nav: [
      { to: '/volunteer',               label: 'Dashboard',      icon: '⊞', end: true },
      { to: '/volunteer/tasks',         label: 'Browse Tasks',   icon: '◫' },
      { to: '/volunteer/my-tasks',      label: 'My Tasks',       icon: '✓' },
      { to: '/volunteer/matches',       label: 'Best Matches',   icon: '✦' },
      { to: '/volunteer/checkin',       label: 'Check In',       icon: '📍' },
      { to: '/volunteer/certificate',   label: 'Certificate',    icon: '🏅' },
      { to: '/volunteer/leaderboard',   label: 'Leaderboard',    icon: '🏆' },
      { to: '/volunteer/notifications', label: 'Notifications',  icon: '🔔', notif: true },
      { to: '/volunteer/profile',       label: 'Profile',        icon: '👤' },
    ]
  },
  coordinator: {
    color: 'bg-blue-500',
    label: 'Coordinator',
    badge: 'badge-blue',
    nav: [
      { to: '/coordinator',             label: 'Dashboard',      icon: '⊞', end: true },
      { to: '/coordinator/tasks',       label: 'Task Board',     icon: '◫' },
      { to: '/coordinator/attendance',  label: 'Attendance',     icon: '📋' },
      { to: '/coordinator/volunteers',  label: 'Volunteers',     icon: '👥' },
      { to: '/coordinator/needs',       label: 'Flag Needs',     icon: '🚩' },
      { to: '/coordinator/notifications',label:'Notifications',  icon: '🔔', notif: true },
    ]
  },
  ngo_admin: {
    color: 'bg-violet-500',
    label: 'NGO Admin',
    badge: 'badge-purple',
    nav: [
      { to: '/org',                     label: 'Dashboard',      icon: '⊞', end: true },
      { to: '/org/tasks',               label: 'Manage Tasks',   icon: '◫' },
      { to: '/org/needs',               label: 'Needs',          icon: '🚩' },
      { to: '/org/volunteers',          label: 'Volunteers',     icon: '👥' },
      { to: '/org/impact',              label: 'Impact Report',  icon: '📊' },
      { to: '/org/profile',             label: 'Organization',   icon: '🏢' },
      { to: '/org/notifications',       label: 'Notifications',  icon: '🔔', notif: true },
    ]
  },
  super_admin: {
    color: 'bg-rose-500',
    label: 'Admin',
    badge: 'badge-red',
    nav: [
      { to: '/admin',                   label: 'Overview',       icon: '⊞', end: true },
      { to: '/admin/users',             label: 'Users',          icon: '👥' },
      { to: '/admin/orgs',              label: 'Organizations',  icon: '🏢' },
      { to: '/admin/needs',             label: 'Needs Heatmap',  icon: '🗺️' },
      { to: '/admin/analytics',         label: 'Analytics',      icon: '📊' },
    ]
  }
}

export default function Sidebar({ unread = 0, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const cfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.volunteer

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${cfg.color} flex items-center justify-center shadow-glow-sm`}>
            <span className="text-white font-bold text-xs">IL</span>
          </div>
          <div>
            <span className="font-bold text-base-color text-sm leading-none block">ImpactLink</span>
            <span className="text-faint-color text-[10px] leading-none">v2.0</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto btn btn-ghost btn-sm w-7 h-7 p-0 rounded-lg lg:hidden">×</button>
        )}
      </div>

      {/* User info */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} size="md" ring />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-base-color truncate">{user?.name}</p>
            <span className={`${cfg.badge} text-[10px] mt-0.5 inline-block`}>{cfg.label}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {cfg.nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            onClick={onClose}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="text-base leading-none w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.notif && unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme + logout */}
      <div className="p-3 shrink-0 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-2 py-1.5">
          <ThemeToggle />
        </div>
        <button onClick={handleLogout}
          className="nav-link w-full text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
          <span className="text-base w-5 text-center">⊗</span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )
}
