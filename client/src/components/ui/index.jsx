import { getUrgencyLabel, getCategoryInfo } from '../../utils/helpers'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', color = 'teal' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-9 h-9 border-2', xl: 'w-12 h-12 border-3' }[size]
  const c = color === 'teal' ? 'border-teal-500 border-t-transparent' : 'border-current border-t-transparent'
  return <span className={`inline-block rounded-full animate-spin ${s} ${c}`} />
}

// ── PageLoader ────────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-color">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">IL</span>
        </div>
        <Spinner size="lg" />
        <p className="text-faint-color text-sm">Loading ImpactLink…</p>
      </div>
    </div>
  )
}

// ── UrgencyBadge ──────────────────────────────────────────────────────────────
export function UrgencyBadge({ score }) {
  const { label, cls, dot } = getUrgencyLabel(score)
  return (
    <span className={`${cls} flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse-dot`} />
      {label}
    </span>
  )
}

// ── CategoryBadge ─────────────────────────────────────────────────────────────
export function CategoryBadge({ category }) {
  const info = getCategoryInfo(category)
  return <span className={info.color}>{info.icon} {info.label}</span>
}

// ── MatchScore ────────────────────────────────────────────────────────────────
export function MatchScore({ score }) {
  const pct = Math.min(score || 0, 100)
  const color = pct >= 70 ? 'bg-teal-500' : pct >= 40 ? 'bg-amber-500' : 'bg-slate-400'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="match-bar flex-1">
        <div className={`match-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-faint-color w-7 shrink-0">{pct}%</span>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-5xl mb-4 opacity-40">{icon}</div>
      <p className="text-base font-semibold text-base-color mb-1">{title}</p>
      {desc  && <p className="text-sm text-muted-color max-w-xs mb-5">{desc}</p>}
      {action}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, accent = false, trend }) {
  return (
    <div className={`stat-card ${accent ? 'ring-1 ring-teal-500/30' : ''}`}>
      <div className="flex items-start justify-between">
        {icon && <span className="text-2xl">{icon}</span>}
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-green-500' : 'text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-faint-color">{sub}</div>}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 'md', ring }) {
  const s = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }[size]
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  if (src) return <img src={src} alt={name} className={`${s} rounded-full object-cover ${ring ? 'ring-2 ring-teal-500' : ''}`} />
  return (
    <div className={`${s} rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 ${ring ? 'ring-2 ring-teal-500' : ''}`}>
      {initials}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={`relative w-full ${widths[size]} surface shadow-2xl animate-slide-up`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-color">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm w-8 h-8 p-0 rounded-lg text-lg">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── ThemeToggle ───────────────────────────────────────────────────────────────
import { useTheme } from '../../context/ThemeContext'
export function ThemeToggle({ compact }) {
  const { theme, setTheme } = useTheme()
  const options = [
    { value: 'light',  icon: '☀️', label: 'Light'  },
    { value: 'dark',   icon: '🌙', label: 'Dark'   },
    { value: 'system', icon: '💻', label: 'System' },
  ]
  if (compact) {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    const cur = options.find(o => o.value === theme)
    return (
      <button onClick={() => setTheme(next)} className="btn btn-ghost btn-sm gap-1.5 rounded-xl" title={`Switch to ${next} mode`}>
        <span>{cur.icon}</span>
        <span className="hidden sm:inline text-xs">{cur.label}</span>
      </button>
    )
  }
  return (
    <div className="flex rounded-xl p-1" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => setTheme(o.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${theme === o.value ? 'bg-teal-500 text-white' : 'text-faint-color hover:text-base-color'}`}>
          <span>{o.icon}</span> {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', message, onClose }) {
  const styles = {
    info:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    error:   'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  }
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' }
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${styles[type]}`}>
      <span className="text-base shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100 font-bold shrink-0">×</button>}
    </div>
  )
}

// ── Progress ──────────────────────────────────────────────────────────────────
export function Progress({ value, max = 100, color = 'teal', label }) {
  const pct = Math.min((value / max) * 100, 100)
  const colors = { teal: 'bg-teal-500', red: 'bg-red-500', amber: 'bg-amber-500', green: 'bg-green-500' }
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-faint-color mb-1"><span>{label}</span><span>{Math.round(pct)}%</span></div>}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
        <div className={`h-full rounded-full transition-all duration-700 ${colors[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Tooltip wrapper (simple) ──────────────────────────────────────────────────
export function Tip({ text, children }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface-900 dark:bg-surface-700 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
      </div>
    </div>
  )
}
