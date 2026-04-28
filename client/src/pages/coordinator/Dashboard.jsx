// Coordinator Dashboard
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { StatCard, Spinner, UrgencyBadge, CategoryBadge, Avatar, Modal } from '../../components/ui/index.jsx'
import MapPicker from '../../components/ui/MapPicker.jsx'
import { fmtDate, formatHours, distanceKm, fmtDistance } from '../../utils/helpers'

// ── CoordDashboard ────────────────────────────────────────────────────────────
export function CoordDashboard() {
  const [tasks,   setTasks]   = useState([])
  const [volunteers, setVols] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tasks/org'),
      api.get('/volunteers'),  // endpoint that returns volunteers with coords
    ]).then(([t, v]) => {
      setTasks(t.data.tasks || [])
      setVols(v.data.volunteers || [])
    }).finally(() => setLoading(false))
  }, [])

  const open    = tasks.filter(t => t.status === 'open').length
  const ip      = tasks.filter(t => t.status === 'in_progress').length
  const done    = tasks.filter(t => t.status === 'completed').length
  const pending = tasks.reduce((s, t) => s + (t.applicants?.filter(a => a.status === 'pending').length || 0), 0)

  return (
    <div className="page-container space-y-8">
      <div>
        <h1 className="page-title">Coordinator Dashboard</h1>
        <p className="text-muted-color text-sm mt-1">Assign volunteers and verify attendance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Open Tasks"         value={open}    accent />
        <StatCard icon="▶️" label="In Progress"        value={ip} />
        <StatCard icon="✅" label="Completed"          value={done} />
        <StatCard icon="⏳" label="Pending Applicants" value={pending} />
      </div>

      {loading ? <div className="flex justify-center py-8"><Spinner size="xl" /></div> : (
        <>
          {/* Tasks needing attention */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Tasks needing attention</h2>
              <Link to="/coordinator/tasks" className="btn btn-ghost btn-md text-teal-500">View all →</Link>
            </div>
            <div className="space-y-3">
              {tasks
                .filter(t => t.status === 'open' && t.applicants?.some(a => a.status === 'pending'))
                .slice(0, 5)
                .map(t => (
                  <div key={t._id} className="surface p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <UrgencyBadge score={t.severityScore} />
                        <CategoryBadge category={t.category} />
                      </div>
                      <p className="font-medium text-sm text-base-color">{t.title}</p>
                      <p className="text-xs text-muted-color flex gap-3 mt-0.5">
                        <span>{t.applicants?.filter(a => a.status === 'pending').length} pending applicants</span>
                        {t.location?.coords?.lat && (
                          <span className="font-mono">{t.location.coords.lat.toFixed(4)}°N, {t.location.coords.lng.toFixed(4)}°E</span>
                        )}
                      </p>
                    </div>
                    <Link to="/coordinator/tasks" className="btn btn-primary btn-sm shrink-0">Review</Link>
                  </div>
                ))}
              {tasks.filter(t => t.status === 'open' && t.applicants?.some(a => a.status === 'pending')).length === 0 && (
                <p className="text-muted-color text-sm">No tasks with pending applicants.</p>
              )}
            </div>
          </div>

          {/* Volunteer location table */}
          {volunteers.length > 0 && (
            <div>
              <h2 className="section-title mb-4">📍 Volunteer locations (precise)</h2>
              <div className="surface overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-color">
                      <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Volunteer</th>
                      <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Skills</th>
                      <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Coordinates</th>
                      <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">City</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map(v => (
                      <tr key={v._id} className="border-b border-color last:border-0 hover:bg-subtle transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Avatar name={v.name} size="sm" />
                            <div>
                              <p className="font-medium text-base-color">{v.name}</p>
                              <p className="text-xs text-faint-color">{v.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {(v.skills || []).slice(0, 3).map(s => (
                              <span key={s} className="badge badge-gray text-xs">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-muted-color">
                          {v.location?.coords?.lat
                            ? `${v.location.coords.lat.toFixed(5)}°N, ${v.location.coords.lng.toFixed(5)}°E`
                            : <span className="text-faint-color italic">Not set</span>
                          }
                        </td>
                        <td className="p-4 text-sm text-base-color">{v.location?.city || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── CoordTasks — assign volunteers with smart distance ranking ────────────────
export function CoordTasks() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [mapTask, setMapTask] = useState(null)

  const load = () => {
    api.get('/tasks/org').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false))
  }
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
                  <div className="flex gap-2 mb-1">
                    <UrgencyBadge score={task.severityScore} />
                    <CategoryBadge category={task.category} />
                  </div>
                  <h3 className="font-semibold text-base-color">{task.title}</h3>
                  <div className="text-xs text-muted-color mt-1 flex flex-wrap gap-3">
                    {task.location?.city     && <span>📍 {task.location.city}</span>}
                    {task.location?.coords?.lat && (
                      <span className="font-mono">
                        {task.location.coords.lat.toFixed(4)}°N, {task.location.coords.lng.toFixed(4)}°E
                      </span>
                    )}
                    {task.scheduledDate      && <span>📅 {fmtDate(task.scheduledDate)}</span>}
                    <span>{task.assignedVolunteers?.length || 0}/{task.maxVolunteers} assigned</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button onClick={() => setMapTask(task)} className="btn btn-secondary btn-sm">
                    🗺 View on map
                  </button>
                  {task.status === 'in_progress' && (
                    <button onClick={() => complete(task._id)} className="btn btn-primary btn-sm">Mark done</button>
                  )}
                  <span className={`badge ${task.status === 'open' ? 'badge-green' : task.status === 'in_progress' ? 'badge-amber' : 'badge-gray'}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Pending applicants — sorted by distance from task */}
              {task.applicants?.filter(a => a.status === 'pending').length > 0 && (
                <div className="border-t border-color pt-3 mt-3">
                  <p className="text-xs font-semibold text-faint-color uppercase mb-2">
                    Pending applicants
                    {task.location?.coords?.lat && ' · sorted by distance'}
                  </p>
                  <div className="space-y-2">
                    {task.applicants
                      .filter(a => a.status === 'pending')
                      .map(a => ({
                        ...a,
                        _km: distanceKm(a.user?.location?.coords, task.location?.coords),
                      }))
                      .sort((a, b) => a._km - b._km)
                      .map(a => (
                        <div key={a.user?._id || a._id} className="surface-elevated rounded-xl p-3 flex items-center gap-3">
                          <Avatar name={a.user?.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-base-color">{a.user?.name}</p>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {(a.user?.skills || []).slice(0, 3).map(s => (
                                <span key={s} className="badge badge-gray">{s}</span>
                              ))}
                              {a._km !== Infinity && (
                                <span className={`badge ${a._km < 5 ? 'badge-teal' : 'badge-gray'}`}>
                                  📍 {fmtDistance(a._km)}
                                </span>
                              )}
                              {a.user?.location?.coords?.lat && (
                                <span className="text-[10px] font-mono text-faint-color">
                                  {a.user.location.coords.lat.toFixed(4)}°N, {a.user.location.coords.lng.toFixed(4)}°E
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => decide(task._id, a.user?._id, 'accepted')}
                              className="btn btn-primary btn-sm">Accept</button>
                            <button onClick={() => decide(task._id, a.user?._id, 'rejected')}
                              className="btn btn-secondary btn-sm text-red-500">Decline</button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Assigned volunteers */}
              {task.assignedVolunteers?.length > 0 && (
                <div className="border-t border-color pt-3 mt-3">
                  <p className="text-xs font-semibold text-faint-color uppercase mb-2">Assigned</p>
                  <div className="flex flex-wrap gap-2">
                    {task.assignedVolunteers.map((v, i) => (
                      <div key={i} className="flex items-center gap-1.5 surface-elevated rounded-full px-2 py-1">
                        <Avatar name={v.name || '?'} size="xs" />
                        <span className="text-xs text-base-color">{v.name || 'Volunteer'}</span>
                        {v.location?.coords?.lat && (
                          <span className="text-[10px] font-mono text-faint-color ml-1">
                            {fmtDistance(distanceKm(v.location.coords, task.location?.coords))}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task location map modal */}
      <Modal open={!!mapTask} onClose={() => setMapTask(null)} title={mapTask?.title || 'Task location'} size="lg">
        {mapTask && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <UrgencyBadge score={mapTask.severityScore} />
              <CategoryBadge category={mapTask.category} />
            </div>
            {mapTask.location?.coords?.lat ? (
              <>
                <MapPicker
                  coords={mapTask.location.coords}
                  onChange={() => {}}
                  height={300}
                  readOnly
                />
                <p className="text-xs font-mono text-faint-color">
                  {mapTask.location.coords.lat.toFixed(5)}°N, {mapTask.location.coords.lng.toFixed(5)}°E
                  {mapTask.location.city ? ` · ${mapTask.location.city}` : ''}
                </p>
              </>
            ) : (
              <p className="text-muted-color text-sm">No precise coordinates set for this task. Ask the NGO to update the task location.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── CoordAttendance ───────────────────────────────────────────────────────────
export function CoordAttendance() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/tasks/org').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false))
  }, [])

  const markAttendance = async (taskId, userId, attended) => {
    await api.put(`/tasks/${taskId}/attendance/${userId}`, { attended })
    api.get('/tasks/org').then(r => setTasks(r.data.tasks || []))
  }

  const inProgress = tasks.filter(t => t.status === 'in_progress')

  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">Attendance Verification</h1>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div> : (
        inProgress.length === 0
          ? <p className="text-muted-color">No tasks currently in progress.</p>
          : inProgress.map(task => (
            <div key={task._id} className="surface p-5">
              <div className="mb-3">
                <div className="flex gap-2 mb-1"><UrgencyBadge score={task.severityScore} /><CategoryBadge category={task.category} /></div>
                <h3 className="font-semibold text-base-color">{task.title}</h3>
                {task.location?.coords?.lat && (
                  <p className="text-xs font-mono text-faint-color mt-0.5">
                    📌 {task.location.coords.lat.toFixed(5)}°N, {task.location.coords.lng.toFixed(5)}°E
                    {task.location.city ? ` · ${task.location.city}` : ''}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {task.assignedVolunteers?.map((v, i) => (
                  <div key={i} className="surface-elevated rounded-xl p-3 flex items-center gap-3">
                    <Avatar name={v.name || '?'} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-base-color">{v.name}</p>
                      {v.location?.coords?.lat && (
                        <p className="text-[10px] font-mono text-faint-color">
                          {v.location.coords.lat.toFixed(4)}°N, {v.location.coords.lng.toFixed(4)}°E
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => markAttendance(task._id, v._id, true)}
                        className="btn btn-primary btn-sm">✓ Present</button>
                      <button onClick={() => markAttendance(task._id, v._id, false)}
                        className="btn btn-secondary btn-sm text-red-500">✗ Absent</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}

// ── CoordVolunteers ───────────────────────────────────────────────────────────
export function CoordVolunteers() {
  const [vols, setVols] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/volunteers').then(r => setVols(r.data.volunteers || [])).finally(() => setLoading(false)) }, [])

  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">Volunteers</h1>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div> : (
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-color">
                <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Name</th>
                <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Skills</th>
                <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Precise location</th>
                <th className="text-left p-4 text-xs text-faint-color font-semibold uppercase">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {vols.map(v => (
                <tr key={v._id} className="border-b border-color last:border-0 hover:bg-subtle transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={v.name} size="sm" />
                      <div>
                        <p className="font-medium text-base-color">{v.name}</p>
                        <p className="text-xs text-faint-color">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {(v.skills || []).slice(0, 4).map(s => <span key={s} className="badge badge-gray">{s}</span>)}
                    </div>
                  </td>
                  <td className="p-4">
                    {v.location?.coords?.lat ? (
                      <div>
                        <p className="font-mono text-xs text-muted-color">
                          {v.location.coords.lat.toFixed(5)}°N, {v.location.coords.lng.toFixed(5)}°E
                        </p>
                        <p className="text-xs text-faint-color mt-0.5">{v.location.city}{v.location.state ? `, ${v.location.state}` : ''}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-faint-color italic">Not pinned yet</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">{v.tasksCompleted || 0} done</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── CoordFlagNeeds ────────────────────────────────────────────────────────────
export function CoordFlagNeeds() {
  const [needs,   setNeeds]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({
    title: '', description: '', category: 'food',
    severityScore: 3, affectedPeople: 0, skillsRequired: [],
    location: { city: '', state: '', coords: null },
  })
  const [coords, setCoords] = useState(null)
  const [saving, setSaving] = useState(false)

  const CATS = ['food','medical','shelter','education','environment','logistics','tech','legal','other']
  const catIcons = { food:'🍱', medical:'🏥', shelter:'🏠', education:'📚', environment:'🌿', logistics:'🚛', tech:'💻', legal:'⚖️', other:'📌' }
  const urgLabels = ['','Minimal','Low','Moderate','High','Critical']

  const load = () => { api.get('/needs').then(r => setNeeds(r.data.needs || [])).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const onMapChange = c => {
    setCoords(c)
    setForm(f => ({ ...f, location: { city: c.city || '', state: c.state || '', coords: { lat: c.lat, lng: c.lng } } }))
  }

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/needs', form)
      setShowForm(false)
      setForm({ title: '', description: '', category: 'food', severityScore: 3, affectedPeople: 0, skillsRequired: [], location: { city: '', state: '', coords: null } })
      setCoords(null)
      load()
    } catch (err) { alert(err.response?.data?.message || 'Failed to create need') }
    finally { setSaving(false) }
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Flag Community Needs</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn btn-primary btn-md">
          {showForm ? '✕ Cancel' : '+ Flag a need'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="surface p-6 space-y-5">
          <h2 className="section-title">New community need</h2>

          <div>
            <label className="label">Title</label>
            <input className="input" required placeholder="e.g. Emergency food packs for flood victims"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-20" placeholder="What's happening? Who is affected? What's needed urgently?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Category multi-select tiles */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CATS.map(c => (
                <button key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, category: c }))}
                  className={`p-2 rounded-xl border text-center transition-all text-xs ${
                    form.category === c
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-semibold'
                      : 'border-color text-muted-color hover:border-teal-400'
                  }`}>
                  <div className="text-base mb-0.5">{catIcons[c]}</div>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Urgency bar */}
          <div>
            <label className="label">
              Urgency —{' '}
              <span className={`font-semibold ${
                form.severityScore >= 5 ? 'text-red-500' :
                form.severityScore >= 4 ? 'text-orange-500' :
                form.severityScore >= 3 ? 'text-amber-500' :
                form.severityScore >= 2 ? 'text-green-500' : 'text-slate-400'
              }`}>
                {urgLabels[form.severityScore]}
              </span>
            </label>
            <div className="flex gap-1.5 mt-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button"
                  onClick={() => setForm({ ...form, severityScore: n })}
                  className={`flex-1 h-3 rounded transition-all ${
                    n <= form.severityScore
                      ? form.severityScore >= 5 ? 'bg-red-500' :
                        form.severityScore >= 4 ? 'bg-orange-500' :
                        form.severityScore >= 3 ? 'bg-amber-500' :
                        form.severityScore >= 2 ? 'bg-green-500' : 'bg-slate-300'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-faint-color mt-1">
              <span>Minimal</span><span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">People affected</label>
              <input type="number" min="0" className="input"
                value={form.affectedPeople}
                onChange={e => setForm({ ...form, affectedPeople: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Location map */}
          <div>
            <label className="label">Location — pin the affected area</label>
            <MapPicker coords={coords} onChange={onMapChange} height={220} />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="label">City (auto-filled)</label>
                <input className="input" value={form.location.city}
                  onChange={e => setForm(f => ({ ...f, location: { ...f.location, city: e.target.value } }))} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={form.location.state}
                  onChange={e => setForm(f => ({ ...f, location: { ...f.location, state: e.target.value } }))} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
            {saving ? 'Submitting…' : 'Flag this need →'}
          </button>
        </form>
      )}

      {/* Active needs list */}
      {loading ? <div className="flex justify-center py-8"><Spinner size="xl" /></div> : (
        <div className="space-y-3">
          {needs.length === 0 && <p className="text-muted-color text-sm">No needs flagged yet.</p>}
          {needs.map(n => (
            <div key={n._id} className="surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <UrgencyBadge score={n.severityScore} />
                    <span className="badge badge-gray">{catIcons[n.category]} {n.category}</span>
                    <span className={`badge ${n.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{n.status}</span>
                  </div>
                  <h3 className="font-semibold text-base-color">{n.title}</h3>
                  <p className="text-xs text-muted-color mt-1 line-clamp-2">{n.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-faint-color">
                    {n.affectedPeople > 0 && <span>👥 {n.affectedPeople.toLocaleString()} affected</span>}
                    {n.location?.city     && <span>📍 {n.location.city}{n.location.state ? `, ${n.location.state}` : ''}</span>}
                    {n.location?.coords?.lat && (
                      <span className="font-mono">{n.location.coords.lat.toFixed(4)}°N, {n.location.coords.lng.toFixed(4)}°E</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Re-exports to match existing barrel imports
export { CoordDashboard  as default }
//export { CoordFlagNeeds  as CoordFlagNeeds }
//export { CoordTasks      as CoordTasks }
//export { CoordAttendance as CoordAttendance }
//export { CoordVolunteers as CoordVolunteers }