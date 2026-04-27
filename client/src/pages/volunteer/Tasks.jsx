// Tasks.jsx — browse all open tasks with filters
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import TaskCard from '../../components/ui/TaskCard.jsx'
import { Spinner, EmptyState } from '../../components/ui/index.jsx'
import { CATEGORIES } from '../../utils/helpers'

export function VolunteerTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [f, setF] = useState({ category: '', urgency: '', search: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ page, limit: 12 })
    if (f.category) p.set('category', f.category)
    if (f.urgency)  p.set('urgency', f.urgency)
    if (f.search)   p.set('search', f.search)
    const { data } = await api.get(`/tasks?${p}`)
    setTasks(data.tasks || []); setTotal(data.total || 0)
    setLoading(false)
  }, [page, f])

  useEffect(() => { load() }, [load])

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">Browse Tasks</h1>
        <p className="text-muted-color text-sm mt-1">{total} tasks available</p>
      </div>
      <div className="surface p-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search tasks…" value={f.search} onChange={e => setF(x => ({ ...x, search: e.target.value }))} />
        <select className="input w-44" value={f.category} onChange={e => setF(x => ({ ...x, category: e.target.value }))}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select className="input w-40" value={f.urgency} onChange={e => setF(x => ({ ...x, urgency: e.target.value }))}>
          <option value="">Any urgency</option>
          {[5,4,3,2,1].map(u => <option key={u} value={u}>{['','Minimal','Low','Moderate','High','Critical'][u]}+</option>)}
        </select>
        {(f.category || f.urgency || f.search) && (
          <button className="btn btn-ghost btn-md" onClick={() => setF({ category: '', urgency: '', search: '' })}>Clear ✕</button>
        )}
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : tasks.length === 0 ? <EmptyState icon="🔍" title="No tasks found" desc="Try adjusting your filters." />
        : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{tasks.map(t => <TaskCard key={t._id} task={t} userRole="volunteer" userId={user?._id} onUpdate={load} />)}</div>
      }
      {total > 12 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn btn-secondary btn-md" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-muted-color text-sm">Page {page} of {Math.ceil(total / 12)}</span>
          <button className="btn btn-secondary btn-md" disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

// Matches.jsx — smart-matched tasks
export function VolunteerMatches() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/tasks/my-matches').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false)) }, [])
  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">✦ Best Matches For You</h1>
        <p className="text-muted-color text-sm mt-1">Tasks ranked by urgency + skill fit + location</p>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : tasks.length === 0 ? <EmptyState icon="✦" title="No matches yet" desc="Add skills and location to your profile to see personalized matches." />
        : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{tasks.map(t => <TaskCard key={t._id} task={t} userRole="volunteer" userId={user?._id} />)}</div>
      }
    </div>
  )
}

// MyTasks.jsx
export function VolunteerMyTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  useEffect(() => { api.get('/tasks/mine').then(r => setTasks(r.data.tasks || [])).finally(() => setLoading(false)) }, [])

  const tabs = ['all', 'pending', 'assigned', 'completed']
  const filtered = tasks.filter(t => {
    if (tab === 'pending')   return t.applicants?.some(a => (a.user?._id || a.user) === user?._id && a.status === 'pending')
    if (tab === 'assigned')  return t.assignedVolunteers?.some(v => (v._id || v) === user?._id) && t.status !== 'completed'
    if (tab === 'completed') return t.status === 'completed'
    return true
  })

  return (
    <div className="page-container space-y-6">
      <h1 className="page-title">My Tasks</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`btn btn-md capitalize ${tab === t ? 'btn-primary' : 'btn-secondary'}`}>{t}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : filtered.length === 0 ? <EmptyState icon="📋" title={`No ${tab} tasks`} desc="Your applied and assigned tasks will appear here." />
        : <div className="space-y-3">{filtered.map(t => <TaskCard key={t._id} task={t} userRole="volunteer" userId={user?._id} />)}</div>
      }
    </div>
  )
}

export default VolunteerTasks
