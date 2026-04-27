export const CATEGORIES = [
  { value: 'food',        label: 'Food',         icon: '🍱', color: 'badge-amber'  },
  { value: 'medical',     label: 'Medical',      icon: '🏥', color: 'badge-red'    },
  { value: 'shelter',     label: 'Shelter',      icon: '🏠', color: 'badge-blue'   },
  { value: 'education',   label: 'Education',    icon: '📚', color: 'badge-teal'   },
  { value: 'environment', label: 'Environment',  icon: '🌿', color: 'badge-green'  },
  { value: 'logistics',   label: 'Logistics',    icon: '🚛', color: 'badge-purple' },
  { value: 'tech',        label: 'Tech',         icon: '💻', color: 'badge-blue'   },
  { value: 'legal',       label: 'Legal',        icon: '⚖️', color: 'badge-purple' },
  { value: 'other',       label: 'Other',        icon: '📌', color: 'badge-gray'   },
]

export const SKILLS = [
  'Teaching', 'Healthcare', 'Construction', 'IT/Tech', 'Logistics',
  'Counseling', 'Agriculture', 'Legal', 'Finance', 'Media',
  'Translation', 'Social Work', 'Cooking', 'Driving', 'First Aid',
  'Management', 'Research', 'Design', 'Engineering', 'Nursing',
]

export const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'weekends',  label: 'Weekends only' },
  { value: 'on_demand', label: 'On demand' },
]

export function getUrgencyLabel(score) {
  if (score >= 5) return { label: 'Critical', cls: 'urgency-critical', dot: 'bg-red-500' }
  if (score >= 4) return { label: 'High',     cls: 'urgency-high',     dot: 'bg-orange-500' }
  if (score >= 3) return { label: 'Moderate', cls: 'urgency-moderate', dot: 'bg-amber-500' }
  if (score >= 2) return { label: 'Low',      cls: 'urgency-low',      dot: 'bg-green-500' }
  return               { label: 'Minimal',  cls: 'badge-gray',        dot: 'bg-slate-400' }
}

export function getHeatLevel(urgencyScore) {
  if (urgencyScore >= 80) return 5
  if (urgencyScore >= 60) return 4
  if (urgencyScore >= 40) return 3
  if (urgencyScore >= 20) return 2
  if (urgencyScore > 0)   return 1
  return 0
}

export function getCategoryInfo(val) {
  return CATEGORIES.find(c => c.value === val) || CATEGORIES[CATEGORIES.length - 1]
}

export function formatHours(h) {
  if (!h) return '0h'
  if (h < 1) return `${Math.round(h * 60)}m`
  return `${Math.round(h * 10) / 10}h`
}

export function relativeTime(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date)
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const hr = Math.floor(m / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getDashboardPath(role) {
  if (role === 'volunteer')    return '/volunteer'
  if (role === 'coordinator')  return '/coordinator'
  if (role === 'ngo_admin')    return '/org'
  if (role === 'super_admin')  return '/admin'
  return '/'
}
