// Coordinator Dashboard
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { StatCard, Spinner, UrgencyBadge, CategoryBadge, Avatar } from '../../components/ui/index.jsx'
import { fmtDate, formatHours } from '../../utils/helpers'

export function CoordDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/tasks/org').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false)) }, [])
  const open = tasks.filter(t => t.status === 'open').length
  const ip   = tasks.filter(t => t.status === 'in_progress').length
  const done = tasks.filter(t => t.status === 'completed').length
  const pending = tasks.reduce((s, t) => s + (t.applicants?.filter(a => a.status === 'pending').length || 0), 0)

  return (
    <div className="page-container space-y-8">
      <div>
        <h1 className="page-title">Coordinator Dashboard</h1>
        <p className="text-muted-color text-sm mt-1">Assign volunteers and verify attendance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Open Tasks"        value={open}    accent />
        <StatCard icon="▶️" label="In Progress"       value={ip} />
        <StatCard icon="✅" label="Completed"         value={done} />
        <StatCard icon="⏳" label="Pending Applicants" value={pending} />
      </div>
      {loading ? <div className="flex justify-center py-8"><Spinner size="xl" /></div> : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Tasks needing attention</h2>
            <Link to="/coordinator/tasks" className="btn btn-ghost btn-md text-teal-500">View all →</Link>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.status === 'open' && t.applicants?.some(a => a.status === 'pending')).slice(0, 5).map(t => (
              <div key={t._id} className="surface p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><UrgencyBadge score={t.severityScore} /><CategoryBadge category={t.category} /></div>
                  <p className="font-medium text-sm text-base-color">{t.title}</p>
                  <p className="text-xs text-muted-color">{t.applicants?.filter(a => a.status === 'pending').length} pending applicants</p>
                </div>
                <Link to="/coordinator/tasks" className="btn btn-primary btn-sm shrink-0">Review</Link>
              </div>
            ))}
            {tasks.filter(t => t.status === 'open' && t.applicants?.some(a => a.status === 'pending')).length === 0 && (
              <p className="text-muted-color text-sm">No tasks with pending applicants.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Coordinator Tasks — assign volunteers
export function CoordTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => { api.get('/tasks/org').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const decide = async (taskId, userId, status) => {
    await api.put(`/tasks/${taskId}/applicants/${userId}`, { status })
    load()
  }

  const complete = async (taskId) => {
    await api.put(`/tasks/${taskId}/complete`)
    load()
  }

  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">Task Board</h1>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div> : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task._id} className="surface p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex gap-2 mb-1"><UrgencyBadge score={task.severityScore} /><CategoryBadge category={task.category} /></div>
                  <h3 className="font-semibold text-base-color">{task.title}</h3>
                  <div className="text-xs text-muted-color mt-1 flex gap-3">
                    {task.location?.city && <span>📍 {task.location.city}</span>}
                    {task.scheduledDate && <span>📅 {fmtDate(task.scheduledDate)}</span>}
                    <span>{task.assignedVolunteers?.length || 0}/{task.maxVolunteers} assigned</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {task.status === 'in_progress' && (
                    <button onClick={() => complete(task._id)} className="btn btn-primary btn-sm">Mark done</button>
                  )}
                  <span className={`badge ${task.status === 'open' ? 'badge-green' : task.status === 'in_progress' ? 'badge-amber' : 'badge-gray'}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Pending applicants */}
              {task.applicants?.filter(a => a.status === 'pending').length > 0 && (
                <div className="surface-elevated rounded-xl p-4 mt-3">
                  <p className="text-xs font-semibold text-muted-color mb-3">Pending applicants</p>
                  <div className="space-y-2">
                    {task.applicants.filter(a => a.status === 'pending').map(app => (
                      <div key={app.user?._id} className="flex items-center gap-3">
                        <Avatar name={app.user?.name || '?'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-base-color">{app.user?.name || 'Volunteer'}</p>
                          <div className="flex gap-1 flex-wrap">{app.user?.skills?.slice(0,3).map(s => <span key={s} className="badge badge-gray">{s}</span>)}</div>
                        </div>
                        <span className="text-xs text-teal-500 font-mono">Match {app.matchScore || 0}%</span>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => decide(task._id, app.user?._id, 'accepted')}  className="btn btn-primary btn-sm">Accept</button>
                          <button onClick={() => decide(task._id, app.user?._id, 'rejected')}  className="btn btn-danger btn-sm">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned volunteers */}
              {task.assignedVolunteers?.length > 0 && (
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-color">
                  <div className="flex -space-x-1.5">
                    {task.assignedVolunteers.slice(0,4).map((v,i) => <Avatar key={i} name={v.name || '?'} size="xs" />)}
                  </div>
                  <span>{task.assignedVolunteers.length} volunteer(s) assigned</span>
                </div>
              )}
            </div>
          ))}
          {tasks.length === 0 && <p className="text-muted-color text-sm">No tasks yet.</p>}
        </div>
      )}
    </div>
  )
}

// Coordinator Attendance — verify check-ins
export function CoordAttendance() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const load = () => { api.get('/tasks/org').then(r => setTasks((r.data.tasks || []).filter(t => t.status === 'in_progress' || t.status === 'completed'))).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const verify = async (taskId, userId, hours) => {
    await api.put(`/tasks/${taskId}/verify/${userId}`, { hoursLogged: hours })
    load()
  }

  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">📋 Attendance & Hours</h1>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div> : (
        <div className="space-y-4">
          {tasks.map(task => (
            <div key={task._id} className="surface p-5">
              <h3 className="font-semibold text-base-color mb-1">{task.title}</h3>
              <p className="text-xs text-muted-color mb-4">{fmtDate(task.scheduledDate)} · {task.location?.city}</p>
              {task.attendance?.length === 0 && <p className="text-sm text-faint-color">No attendance records.</p>}
              <div className="space-y-3">
                {task.attendance?.map(att => (
                  <div key={att.user?._id} className="surface-elevated rounded-xl p-3 flex items-center gap-3">
                    <Avatar name={att.user?.name || '?'} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-color">{att.user?.name || 'Volunteer'}</p>
                      <div className="flex gap-3 text-xs text-muted-color mt-0.5">
                        {att.checkedIn ? <span className="text-teal-500">✓ Checked in {att.checkedInAt ? new Date(att.checkedInAt).toLocaleTimeString() : ''}</span> : <span>Not checked in</span>}
                        {att.checkedOutAt && <span>Out {new Date(att.checkedOutAt).toLocaleTimeString()}</span>}
                        {att.hoursLogged > 0 && <span>{formatHours(att.hoursLogged)} logged</span>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {att.verified ? (
                        <span className="badge-teal text-xs">✓ Verified</span>
                      ) : att.checkedIn ? (
                        <button onClick={() => verify(task._id, att.user?._id, att.hoursLogged || task.durationHours || 4)} className="btn btn-primary btn-sm">Verify</button>
                      ) : <span className="badge-gray text-xs">Absent</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-muted-color">No in-progress or completed tasks.</p>}
        </div>
      )}
    </div>
  )
}

// Coordinator Volunteers list
export function CoordVolunteers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/users/volunteers?limit=50').then(r => setUsers(r.data.users || [])).finally(() => setLoading(false)) }, [])
  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">👥 Volunteers</h1>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u._id} className="surface p-5">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={u.name} size="md" />
                <div>
                  <p className="font-semibold text-sm text-base-color">{u.name}</p>
                  <p className="text-xs text-muted-color">{u.availability?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">{u.skills?.slice(0,4).map(s => <span key={s} className="badge badge-gray">{s}</span>)}</div>
              <div className="flex gap-4 text-xs text-muted-color">
                <span>✅ {u.tasksCompleted || 0} tasks</span>
                <span>⏱ {formatHours(u.totalHours)}</span>
                {u.location?.city && <span>📍 {u.location.city}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Coordinator Flag Needs
export function CoordFlagNeeds() {
  const [needs, setNeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', category: 'other', severityScore: 3, affectedPeople: 0, location: { city: '', area: '' } })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => { api.get('/needs').then(r => setNeeds(r.data.needs || [])).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault(); setSaving(true)
    await api.post('/needs', form)
    setShowForm(false); load(); setSaving(false)
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">🚩 Flag Community Needs</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn btn-primary btn-md">{showForm ? '✕ Cancel' : '+ Flag need'}</button>
      </div>
      {showForm && (
        <div className="surface p-6 animate-slide-up">
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Title</label><input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea className="input resize-none h-20" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {['food','medical','shelter','education','environment','logistics','tech','legal','other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Severity (1-5)</label><input type="number" className="input" min="1" max="5" value={form.severityScore} onChange={e => setForm({ ...form, severityScore: +e.target.value })} /></div>
              <div><label className="label">People affected</label><input type="number" className="input" min="0" value={form.affectedPeople} onChange={e => setForm({ ...form, affectedPeople: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">City</label><input className="input" value={form.location.city} onChange={e => setForm({ ...form, location: { ...form.location, city: e.target.value } })} /></div>
              <div><label className="label">Area / Block</label><input className="input" placeholder="Ward 5, Block C…" value={form.location.area} onChange={e => setForm({ ...form, location: { ...form.location, area: e.target.value } })} /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>Flag this need</button>
          </form>
        </div>
      )}
      {loading ? <div className="flex justify-center py-8"><Spinner size="xl" /></div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {needs.map(n => (
            <div key={n._id} className="surface p-4">
              <div className="flex gap-2 mb-2"><UrgencyBadge score={n.severityScore} /><CategoryBadge category={n.category} /></div>
              <h3 className="font-semibold text-sm text-base-color">{n.title}</h3>
              {n.description && <p className="text-xs text-muted-color mt-1 line-clamp-2">{n.description}</p>}
              <div className="flex gap-3 mt-2 text-xs text-faint-color">
                {n.affectedPeople > 0 && <span>👥 {n.affectedPeople.toLocaleString()}</span>}
                {n.location?.city && <span>📍 {n.location.city}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CoordDashboard
