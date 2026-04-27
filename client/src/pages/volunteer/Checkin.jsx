import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Spinner, EmptyState, Alert } from '../../components/ui/index.jsx'
import { fmtDate, formatHours } from '../../utils/helpers'

export default function VolunteerCheckin() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const load = () => {
    api.get('/tasks/mine').then(r => {
      setTasks((r.data.tasks || []).filter(t =>
        t.assignedVolunteers?.some(v => (v._id || v) === user?._id) && t.status !== 'completed'
      ))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const checkin = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/checkin`)
      setMsg({ type: 'success', text: 'Checked in! Good luck with your shift.' })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Check-in failed' }) }
  }

  const checkout = async (taskId) => {
    try {
      const r = await api.post(`/tasks/${taskId}/checkout`)
      setMsg({ type: 'success', text: `Checked out! You logged ${formatHours(r.data.hoursLogged)}.` })
      load()
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Check-out failed' }) }
  }

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">📍 Task Check-In</h1>
        <p className="text-muted-color text-sm mt-1">Mark your attendance for assigned tasks</p>
      </div>

      {msg && (
        <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : tasks.length === 0 ? (
          <EmptyState icon="📍" title="No tasks to check in to"
            desc="You'll see your assigned upcoming tasks here when you've been accepted to a task." />
        ) : (
          <div className="space-y-4">
            {tasks.map(task => {
              const myAttendance = task.attendance?.find(a => (a.user?._id || a.user) === user?._id)
              const checkedIn  = myAttendance?.checkedIn
              const checkedOut = !!myAttendance?.checkedOutAt
              const hours = myAttendance?.hoursLogged

              return (
                <div key={task._id} className="surface p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base-color">{task.title}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-color">
                        {task.orgId?.name      && <span>🏢 {task.orgId.name}</span>}
                        {task.location?.city   && <span>📍 {task.location.city}</span>}
                        {task.scheduledDate    && <span>📅 {fmtDate(task.scheduledDate)}</span>}
                        {task.durationHours    && <span>⏱ Est. {task.durationHours}h</span>}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {checkedOut ? (
                        <div className="text-center">
                          <span className="badge-teal">✓ Completed</span>
                          {hours > 0 && <p className="text-xs text-muted-color mt-1">{formatHours(hours)} logged</p>}
                          {myAttendance?.verified && <p className="text-xs text-teal-500 mt-0.5">✓ Verified</p>}
                        </div>
                      ) : checkedIn ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="badge-green">🟢 Checked in</span>
                          {myAttendance?.checkedInAt && (
                            <p className="text-xs text-muted-color">
                              Since {new Date(myAttendance.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                          <button onClick={() => checkout(task._id)} className="btn btn-secondary btn-sm mt-1">
                            Check out →
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => checkin(task._id)} className="btn btn-primary btn-md">
                          📍 Check in
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
