import { useState } from 'react'
import { UrgencyBadge, CategoryBadge, MatchScore, Avatar } from '../ui/index.jsx'
import { fmtDate, relativeTime, distanceKm, fmtDistance } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function TaskCard({ task, userRole, userId, onUpdate, compact = false }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)

  const myApp     = task.applicants?.find(a => (a.user?._id || a.user) === userId)
  const isAssigned = task.assignedVolunteers?.some(v => (v._id || v) === userId)
  const canApply  = userRole === 'volunteer' && task.status === 'open' && !myApp && !isAssigned

  // Distance from volunteer's pinned location to task location
  const userCoords = user?.location?.coords
  const taskCoords = task?.location?.coords
  const km = distanceKm(userCoords, taskCoords)
  const showDistance = km !== Infinity

  const apply = async () => {
    setBusy(true)
    try {
      await api.post(`/tasks/${task._id}/apply`)
      onUpdate?.()
    } catch (err) { alert(err.response?.data?.message || 'Could not apply') }
    finally { setBusy(false) }
  }

  const statusStyles = {
    open:        'badge-green',
    in_progress: 'badge-amber',
    completed:   'badge-teal',
    cancelled:   'badge-gray',
  }

  return (
    <div className="surface p-5 flex flex-col gap-3 hover:shadow-card transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <UrgencyBadge score={task.severityScore} />
          <CategoryBadge category={task.category} />
        </div>
        <span className={`badge ${statusStyles[task.status] || 'badge-gray'} shrink-0`}>
          {task.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Title & desc */}
      <div>
        <h3 className="font-semibold text-base-color text-sm leading-snug">{task.title}</h3>
        {!compact && <p className="text-muted-color text-xs mt-1 line-clamp-2">{task.description}</p>}
      </div>

      {/* Skills */}
      {task.skillsRequired?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.skillsRequired.slice(0, 4).map(s => (
            <span key={s} className="badge badge-gray">{s}</span>
          ))}
          {task.skillsRequired.length > 4 && <span className="badge badge-gray">+{task.skillsRequired.length - 4}</span>}
        </div>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint-color">
        {task.orgId?.name    && <span>🏢 {task.orgId.name}</span>}
        {task.location?.city && <span>📍 {task.location.city}</span>}
        {showDistance        && (
          <span className={km < 5 ? 'text-teal-500 font-medium' : ''}>
            🗺 {fmtDistance(km)} away
          </span>
        )}
        {task.durationHours  && <span>⏱ {task.durationHours}h</span>}
        {task.deadline       && <span>⏰ Due {fmtDate(task.deadline)}</span>}
        {task.scheduledDate  && <span>📅 {fmtDate(task.scheduledDate)}</span>}
        <span className="ml-auto">{relativeTime(task.createdAt)}</span>
      </div>

      {/* Exact coords — only shown to coordinators */}
      {userRole === 'coordinator' && taskCoords?.lat && (
        <p className="text-[10px] font-mono text-faint-color">
          📌 {taskCoords.lat.toFixed(5)}°N, {taskCoords.lng.toFixed(5)}°E
        </p>
      )}

      {/* Volunteers progress */}
      {!compact && (
        <div className="flex items-center gap-2 text-xs text-muted-color">
          <div className="flex -space-x-1.5">
            {task.assignedVolunteers?.slice(0, 4).map((v, i) => (
              <Avatar key={i} name={v.name || '?'} size="xs" />
            ))}
          </div>
          <span>{task.assignedVolunteers?.length || 0}/{task.maxVolunteers} volunteers</span>
        </div>
      )}

      {/* Match score */}
      {task.matchScore !== undefined && (
        <div className="flex items-center gap-2 text-xs text-muted-color">
          <span>Match</span>
          <MatchScore score={task.matchScore} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-color">
        {userRole === 'volunteer' && (
          isAssigned ? <span className="badge-teal text-xs">✓ Assigned</span>
          : myApp ? (
            <span className={`badge text-xs ${myApp.status === 'accepted' ? 'badge-green' : myApp.status === 'rejected' ? 'badge-red' : 'badge-gray'}`}>
              {myApp.status === 'pending' ? 'Application pending' : myApp.status === 'accepted' ? '✓ Accepted' : '✗ Not selected'}
            </span>
          ) : canApply ? (
            <button onClick={apply} disabled={busy} className="btn btn-primary btn-sm">
              {busy ? '…' : 'Apply now'}
            </button>
          ) : null
        )}
      </div>
    </div>
  )
}