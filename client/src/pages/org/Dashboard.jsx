import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  StatCard, Spinner, EmptyState, UrgencyBadge, CategoryBadge,
  Avatar, Alert, Modal, Progress
} from '../../components/ui/index.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { fmtDate, formatHours, getCategoryInfo, CATEGORIES, SKILLS, getUrgencyLabel } from '../../utils/helpers'

const COLORS = ['#14b8a6','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#22c55e','#f97316','#64748b']
const TT = { contentStyle: { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 } }

// ── NGO Dashboard ─────────────────────────────────────────────────────────────
export function OrgDashboard() {
  const [tasks, setTasks]   = useState([])
  const [needs, setNeeds]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/tasks/org'), api.get('/needs')])
      .then(([t, n]) => { setTasks(t.data.tasks || []); setNeeds(n.data.needs || []) })
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: '◫',  label: 'Total Tasks',     value: tasks.length,                                   accent: true },
    { icon: '🟢', label: 'Open',            value: tasks.filter(t => t.status === 'open').length },
    { icon: '▶️', label: 'In Progress',     value: tasks.filter(t => t.status === 'in_progress').length },
    { icon: '✅', label: 'Completed',       value: tasks.filter(t => t.status === 'completed').length },
  ]

  const catData = Object.entries(
    tasks.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc }, {})
  ).map(([name, count]) => ({ name: getCategoryInfo(name).label, count }))

  if (loading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  return (
    <div className="page-container space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Organization Dashboard</h1>
          <p className="text-muted-color text-sm mt-1">Manage tasks, needs, and your volunteer team</p>
        </div>
        <Link to="/org/tasks" className="btn btn-primary btn-md shrink-0">+ New Task</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {catData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Tasks by category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent tasks</h2>
            <Link to="/org/tasks" className="btn btn-ghost btn-sm text-teal-500">All tasks →</Link>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map(t => (
              <div key={t._id} className="flex items-center gap-3 py-2 border-b border-color last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-color truncate">{t.title}</p>
                  <p className="text-xs text-faint-color">{t.applicants?.length || 0} applicants</p>
                </div>
                <span className={`badge ${t.status === 'open' ? 'badge-green' : t.status === 'in_progress' ? 'badge-amber' : 'badge-gray'} shrink-0`}>
                  {t.status.replace('_',' ')}
                </span>
              </div>
            ))}
            {tasks.length === 0 && <EmptyState icon="◫" title="No tasks yet" desc="Create your first task to start matching volunteers." />}
          </div>
        </div>
      </div>

      {/* Top urgent needs */}
      {needs.filter(n => n.status === 'active').length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">🚨 Active community needs</h2>
            <Link to="/org/needs" className="btn btn-ghost btn-sm text-teal-500">Manage →</Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {needs.filter(n => n.status === 'active').slice(0, 3).map(n => (
              <div key={n._id} className="surface p-4">
                <div className="flex gap-2 mb-2"><UrgencyBadge score={n.severityScore} /><CategoryBadge category={n.category} /></div>
                <p className="font-semibold text-sm text-base-color">{n.title}</p>
                {n.affectedPeople > 0 && <p className="text-xs text-muted-color mt-1">👥 {n.affectedPeople.toLocaleString()} affected</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── NGO Tasks ─────────────────────────────────────────────────────────────────
const BLANK_TASK = { title:'', description:'', category:'other', severityScore:3, skillsRequired:[], location:{city:'',state:''}, deadline:'', scheduledDate:'', maxVolunteers:1, minVolunteers:1, durationHours:4 }

export function OrgTasks() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(BLANK_TASK)
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = () => { api.get('/tasks/org').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const addSkill = e => { if (e.key === 'Enter' && skillInput.trim()) { e.preventDefault(); setForm(f => ({ ...f, skillsRequired: [...new Set([...f.skillsRequired, skillInput.trim()])] })); setSkillInput('') } }

  const create = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try { await api.post('/tasks', form); setForm(BLANK_TASK); setShowForm(false); load() }
    catch (err) { setError(err.response?.data?.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  const updateStatus = async (id, status) => {
    await api.put(`/tasks/${id}`, { status }); load()
  }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Task Management</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn btn-primary btn-md">
          {showForm ? '✕ Cancel' : '+ New task'}
        </button>
      </div>

      {showForm && (
        <div className="surface p-6 animate-slide-up">
          <h2 className="section-title mb-5">Create task</h2>
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          <form onSubmit={create} className="space-y-4 mt-4">
            <div>
              <label className="label">Task title</label>
              <input className="input" required placeholder="e.g. Teach literacy to 15 children" value={form.title} onChange={e => setForm({...form,title:e.target.value})} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none h-24" required placeholder="What needs to be done, who benefits…" value={form.description} onChange={e => setForm({...form,description:e.target.value})} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Severity (1–5)</label>
                <select className="input" value={form.severityScore} onChange={e => setForm({...form,severityScore:+e.target.value})}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {['','Minimal','Low','Moderate','High','Critical'][n]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Max volunteers</label>
                <input type="number" className="input" min="1" value={form.maxVolunteers} onChange={e => setForm({...form,maxVolunteers:+e.target.value})} />
              </div>
              <div>
                <label className="label">Est. hours</label>
                <input type="number" className="input" min="1" value={form.durationHours} onChange={e => setForm({...form,durationHours:+e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="label">City</label>
                <input className="input" value={form.location.city} onChange={e => setForm({...form,location:{...form.location,city:e.target.value}})} />
              </div>
              <div>
                <label className="label">State</label>
                <input className="input" value={form.location.state} onChange={e => setForm({...form,location:{...form.location,state:e.target.value}})} />
              </div>
              <div>
                <label className="label">Scheduled date</label>
                <input type="date" className="input" value={form.scheduledDate} onChange={e => setForm({...form,scheduledDate:e.target.value})} />
              </div>
              <div>
                <label className="label">Deadline</label>
                <input type="date" className="input" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})} />
              </div>
            </div>
            <div>
              <label className="label">Required skills (Enter to add)</label>
              <input className="input" placeholder="e.g. Teaching" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill} />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skillsRequired.map(s => (
                  <span key={s} className="badge badge-teal flex items-center gap-1">
                    {s}
                    <button type="button" onClick={() => setForm(f => ({...f,skillsRequired:f.skillsRequired.filter(x=>x!==s)}))} className="opacity-60 hover:opacity-100 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                {saving ? <Spinner size="sm" /> : null} Create task
              </button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div> : tasks.length === 0
        ? <EmptyState icon="◫" title="No tasks yet" desc="Create your first task to start matching volunteers." action={<button onClick={() => setShowForm(true)} className="btn btn-primary btn-md">+ Create task</button>} />
        : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task._id} className="surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2"><UrgencyBadge score={task.severityScore} /><CategoryBadge category={task.category} /></div>
                    <h3 className="font-semibold text-base-color">{task.title}</h3>
                    <p className="text-muted-color text-xs mt-1 line-clamp-2">{task.description}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-faint-color">
                      <span>{task.applicants?.length || 0} applicants</span>
                      <span>{task.assignedVolunteers?.length || 0}/{task.maxVolunteers} assigned</span>
                      {task.deadline && <span>⏰ {fmtDate(task.deadline)}</span>}
                      {task.scheduledDate && <span>📅 {fmtDate(task.scheduledDate)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === 'in_progress' && (
                      <button onClick={() => updateStatus(task._id,'completed')} className="btn btn-primary btn-sm">Mark done</button>
                    )}
                    <span className={`badge ${task.status==='open'?'badge-green':task.status==='in_progress'?'badge-amber':'badge-gray'}`}>
                      {task.status.replace('_',' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ── NGO Needs ─────────────────────────────────────────────────────────────────
const BLANK_NEED = { title:'', description:'', category:'other', severityScore:3, affectedPeople:0, location:{city:'',state:'',area:''} }

export function OrgNeeds() {
  const [needs, setNeeds]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(BLANK_NEED)
  const [saving, setSaving]   = useState(false)

  const load = () => { api.get('/needs').then(r => setNeeds(r.data.needs || [])).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const save = async e => {
    e.preventDefault(); setSaving(true)
    try { await api.post('/needs', form); setForm(BLANK_NEED); setShowForm(false); load() }
    finally { setSaving(false) }
  }

  const del = async id => { if (!confirm('Delete this need?')) return; await api.delete(`/needs/${id}`); setNeeds(n => n.filter(x => x._id !== id)) }

  const resolve = async id => { await api.put(`/needs/${id}`, { status: 'resolved' }); load() }

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Community Needs</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn btn-primary btn-md">{showForm ? '✕ Cancel' : '+ Add need'}</button>
      </div>

      {showForm && (
        <div className="surface p-6 animate-slide-up">
          <form onSubmit={save} className="space-y-4">
            <div><label className="label">Need title</label><input className="input" required value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
            <div><label className="label">Description</label><textarea className="input resize-none h-20" value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div><label className="label">Severity (1–5)</label><input type="number" className="input" min="1" max="5" value={form.severityScore} onChange={e => setForm({...form,severityScore:+e.target.value})} /></div>
              <div><label className="label">People affected</label><input type="number" className="input" min="0" value={form.affectedPeople} onChange={e => setForm({...form,affectedPeople:+e.target.value})} /></div>
              <div><label className="label">City</label><input className="input" value={form.location.city} onChange={e => setForm({...form,location:{...form.location,city:e.target.value}})} /></div>
            </div>
            <div><label className="label">Area / Block / Ward</label><input className="input" placeholder="e.g. Block 7, Ward 12" value={form.location.area} onChange={e => setForm({...form,location:{...form.location,area:e.target.value}})} /></div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>Save need</button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : needs.length === 0 ? <EmptyState icon="🚩" title="No needs documented" desc="Start recording community needs to track impact." />
        : (
          <div className="grid md:grid-cols-2 gap-4">
            {needs.map(n => {
              const urg = getUrgencyLabel(n.severityScore)
              return (
                <div key={n._id} className="surface p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2"><UrgencyBadge score={n.severityScore} /><CategoryBadge category={n.category} /></div>
                      <h3 className="font-semibold text-sm text-base-color">{n.title}</h3>
                      {n.description && <p className="text-xs text-muted-color mt-1 line-clamp-2">{n.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-faint-color">
                        {n.affectedPeople > 0 && <span>👥 {n.affectedPeople.toLocaleString()}</span>}
                        {n.location?.city && <span>📍 {n.location.city}</span>}
                        {n.location?.area && <span>— {n.location.area}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <span className={`badge ${n.status==='active'?'badge-red':n.status==='in_progress'?'badge-amber':'badge-green'}`}>{n.status}</span>
                      {n.status === 'active' && <button onClick={() => resolve(n._id)} className="btn btn-secondary btn-sm">Resolve</button>}
                      <button onClick={() => del(n._id)} className="btn btn-ghost btn-sm text-red-400">Delete</button>
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

// ── NGO Volunteers ─────────────────────────────────────────────────────────────
export function OrgVolunteers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  useEffect(() => { api.get('/users/volunteers?limit=60').then(r => setUsers(r.data.users || [])).finally(() => setLoading(false)) }, [])
  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.skills?.some(s => s.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">👥 Volunteer Pool</h1>
      <input className="input max-w-xs" placeholder="Search by name or skill…" value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : filtered.length === 0 ? <EmptyState icon="👥" title="No volunteers found" desc="Volunteers who sign up and match your org will appear here." />
        : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(u => (
              <div key={u._id} className="surface p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={u.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-base-color truncate">{u.name}</p>
                    <p className="text-xs text-muted-color">{u.availability?.replace('_',' ')} · {u.location?.city || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">{u.skills?.slice(0,5).map(s => <span key={s} className="badge badge-teal">{s}</span>)}</div>
                <div className="flex gap-4 text-xs text-muted-color">
                  <span>✅ {u.tasksCompleted || 0}</span>
                  <span>⏱ {formatHours(u.totalHours)}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ── NGO Impact Report ─────────────────────────────────────────────────────────
export function OrgImpact() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/users/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  const taskStatusData = (stats?.tasksByStatus || []).map(t => ({ name: (t._id||'unknown').replace('_',' '), value: t.count }))
  const catData = (stats?.tasksByCategory || []).map(t => ({ name: getCategoryInfo(t._id||'other').label, count: t.count }))

  return (
    <div className="page-container space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">📊 Impact Report</h1>
          <p className="text-muted-color text-sm mt-1">Your organization's impact metrics</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary btn-md print:hidden">🖨️ Export</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Total Tasks"     value={stats?.totalTasks     || 0} accent />
        <StatCard icon="✅" label="Completed"       value={stats?.completedTasks  || 0} />
        <StatCard icon="👥" label="Volunteers"      value={stats?.totalVolunteers || 0} />
        <StatCard icon="⏱" label="Hours Logged"    value={formatHours(stats?.totalHours || 0)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {taskStatusData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Task status breakdown</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {taskStatusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip {...TT} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {catData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Tasks by category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catData}>
                <XAxis dataKey="name" tick={{ fill:'var(--text-muted)',fontSize:11 }} />
                <YAxis tick={{ fill:'var(--text-muted)',fontSize:11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary table */}
      <div className="surface p-6">
        <h2 className="section-title mb-5">Summary</h2>
        <div className="space-y-3">
          {[
            { label: 'Total tasks created',     value: stats?.totalTasks || 0,      note: 'all statuses' },
            { label: 'Tasks completed',          value: stats?.completedTasks || 0,  note: `${stats?.totalTasks ? Math.round((stats.completedTasks/stats.totalTasks)*100) : 0}% completion rate` },
            { label: 'Active volunteers',        value: stats?.totalVolunteers || 0, note: 'registered on platform' },
            { label: 'Total hours contributed',  value: formatHours(stats?.totalHours || 0), note: 'across all volunteers' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-3 border-b border-color last:border-0">
              <div>
                <span className="text-sm text-base-color font-medium">{row.label}</span>
                <span className="text-xs text-faint-color ml-2">— {row.note}</span>
              </div>
              <span className="font-bold text-teal-500 text-lg">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── NGO Profile ──────────────────────────────────────────────────────────────
export function OrgProfile() {
  const { user } = useAuth()
  const [org, setOrg]     = useState(null)
  const [form, setForm]   = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState(null)

  useEffect(() => {
    api.get('/orgs/mine').then(r => {
      setOrg(r.data.org)
      setForm({ name: r.data.org?.name||'', description: r.data.org?.description||'', website: r.data.org?.website||'', phone: r.data.org?.phone||'', location: r.data.org?.location||{} })
    })
  }, [])

  const save = async e => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try { await api.put(`/orgs/${org._id}`, form); setMsg({ type:'success', text:'Organization saved!' }) }
    catch (err) { setMsg({ type:'error', text: err.response?.data?.message||'Save failed' }) }
    finally { setSaving(false) }
  }

  if (!org) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  return (
    <div className="page-container space-y-6 max-w-2xl">
      <h1 className="page-title">🏢 Organization Profile</h1>

      <div className="surface p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 dark:text-violet-400 text-2xl font-bold shrink-0">
          {org.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="font-bold text-lg text-base-color">{org.name}</h2>
          <div className="flex gap-2 mt-1">
            {org.verificationStatus === 'approved'
              ? <span className="badge-teal">✓ Verified NGO</span>
              : org.verificationStatus === 'pending'
                ? <span className="badge-amber">⏳ Pending verification</span>
                : <span className="badge-red">✗ Not approved</span>
            }
            <span className="badge badge-gray capitalize">{org.category}</span>
          </div>
        </div>
      </div>

      {org.verificationStatus === 'pending' && (
        <Alert type="warning" message="Your organization is awaiting admin verification. You can still create tasks, but they won't be publicly listed until approved." />
      )}

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <form onSubmit={save} className="surface p-6 space-y-4">
        <h3 className="section-title">Organization details</h3>
        <div><label className="label">Name</label><input className="input" value={form.name||''} onChange={e => setForm({...form,name:e.target.value})} /></div>
        <div><label className="label">Description</label><textarea className="input resize-none h-24" placeholder="What does your organization do?" value={form.description||''} onChange={e => setForm({...form,description:e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Website</label><input className="input" placeholder="https://…" value={form.website||''} onChange={e => setForm({...form,website:e.target.value})} /></div>
          <div><label className="label">Phone</label><input className="input" placeholder="+91…" value={form.phone||''} onChange={e => setForm({...form,phone:e.target.value})} /></div>
          <div><label className="label">City</label><input className="input" value={form.location?.city||''} onChange={e => setForm({...form,location:{...form.location,city:e.target.value}})} /></div>
          <div><label className="label">State</label><input className="input" value={form.location?.state||''} onChange={e => setForm({...form,location:{...form.location,state:e.target.value}})} /></div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>{saving ? <Spinner size="sm" /> : null} Save</button>
      </form>
    </div>
  )
}

export default OrgDashboard
