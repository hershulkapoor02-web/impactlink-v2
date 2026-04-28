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

/**
 * Haversine distance between two lat/lng pairs.
 * Returns distance in kilometres.
 *
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number}
 */
export function distanceKm(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return Infinity
  const R   = 6371
  const dLat = deg2rad(b.lat - a.lat)
  const dLng = deg2rad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const chord = sinLat * sinLat +
    Math.cos(deg2rad(a.lat)) * Math.cos(deg2rad(b.lat)) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}

function deg2rad(deg) { return deg * (Math.PI / 180) }

/**
 * Format a distance nicely.
 * e.g. 0.3 → "300 m", 1.2 → "1.2 km", 50 → "50 km"
 */
export function fmtDistance(km) {
  if (km === Infinity || km == null) return '—'
  if (km < 1)  return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/**
 * Composite match score for sorting tasks (0–100).
 * Weights: skill match 50%, proximity 30%, urgency 20%.
 *
 * @param {object} task
 * @param {object} user   — must have skills[] and location.coords
 * @returns {number}
 */
export function computeMatchScore(task, user) {
  // Skill overlap
  const userSkills = user?.skills || []
  const taskSkills = task?.skillsRequired || []
  const skillScore = taskSkills.length === 0
    ? 50
    : Math.round((taskSkills.filter(s => userSkills.includes(s)).length / taskSkills.length) * 100)

  // Proximity (100 = 0 km, 0 = 50+ km)
  const dist = distanceKm(user?.location?.coords, task?.location?.coords)
  const proxScore = dist === Infinity ? 0 : Math.max(0, Math.round(100 - dist * 2))

  // Urgency contribution
  const urgScore = Math.round(((task?.severityScore || 1) / 5) * 100)

  return Math.round(skillScore * 0.5 + proxScore * 0.3 + urgScore * 0.2)
}