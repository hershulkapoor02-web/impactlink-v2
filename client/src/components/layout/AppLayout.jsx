import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import { Avatar, ThemeToggle } from '../ui/index.jsx'
import api from '../../services/api'

// Mobile bottom nav items per role
const MOBILE_NAV = {
  volunteer:   [
    { to: '/volunteer',               icon: '⊞', label: 'Home', end: true },
    { to: '/volunteer/tasks',         icon: '◫', label: 'Tasks' },
    { to: '/volunteer/my-tasks',      icon: '✓', label: 'Mine' },
    { to: '/volunteer/notifications', icon: '🔔',label: 'Alerts', notif: true },
    { to: '/volunteer/profile',       icon: '👤', label: 'Profile' },
  ],
  coordinator: [
    { to: '/coordinator',             icon: '⊞', label: 'Home', end: true },
    { to: '/coordinator/tasks',       icon: '◫', label: 'Tasks' },
    { to: '/coordinator/attendance',  icon: '📋',label: 'Attend.' },
    { to: '/coordinator/notifications',icon: '🔔',label: 'Alerts', notif: true },
  ],
  ngo_admin: [
    { to: '/org',                     icon: '⊞', label: 'Home', end: true },
    { to: '/org/tasks',               icon: '◫', label: 'Tasks' },
    { to: '/org/needs',               icon: '🚩', label: 'Needs' },
    { to: '/org/impact',              icon: '📊', label: 'Impact' },
    { to: '/org/notifications',       icon: '🔔', label: 'Alerts', notif: true },
  ],
  super_admin: [
    { to: '/admin',                   icon: '⊞', label: 'Home', end: true },
    { to: '/admin/users',             icon: '👥', label: 'Users' },
    { to: '/admin/orgs',              icon: '🏢', label: 'Orgs' },
    { to: '/admin/analytics',         icon: '📊', label: 'Stats' },
  ],
}

export default function AppLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    api.get('/notifications').then(r => setUnread(r.data.unreadCount || 0)).catch(() => {})
    const id = setInterval(() => {
      api.get('/notifications').then(r => setUnread(r.data.unreadCount || 0)).catch(() => {})
    }, 60000) // poll every 60s
    return () => clearInterval(id)
  }, [])

  const mobileNav = MOBILE_NAV[user?.role] || MOBILE_NAV.volunteer

  return (
    <div className="flex h-screen overflow-hidden bg-base-color">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col h-full">
        <Sidebar unread={unread} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden animate-slide-in">
            <Sidebar unread={unread} onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center px-4 lg:px-6 gap-3 shrink-0"
          style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          {/* Mobile menu button */}
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden btn btn-ghost btn-sm w-9 h-9 p-0 rounded-xl text-lg">
            ☰
          </button>

          {/* Page title — filled by each page via document.title */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <NavLink to={`/${user?.role === 'volunteer' ? 'volunteer' : user?.role === 'coordinator' ? 'coordinator' : user?.role === 'ngo_admin' ? 'org' : 'admin'}/notifications`}
              className="relative btn btn-ghost btn-sm w-9 h-9 p-0 rounded-xl text-lg">
              🔔
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </NavLink>
            <NavLink to={user?.role === 'volunteer' ? '/volunteer/profile' : user?.role === 'coordinator' ? '/coordinator' : '/org/profile'}>
              <Avatar name={user?.name} size="sm" />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 pb-24 lg:pb-6 animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around px-2 py-2"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
          {mobileNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${isActive ? 'text-teal-500' : 'text-faint-color'}`}>
              <span className="relative text-xl leading-none">
                {item.icon}
                {item.notif && unread > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
