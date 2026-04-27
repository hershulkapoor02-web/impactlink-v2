import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState, Avatar, Alert } from '../../components/ui/index.jsx'
import { fmtDate, formatHours } from '../../utils/helpers'

// ── Admin Users ───────────────────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState('all')

  const load = () => {
    setLoading(true)
    const p = new URLSearchParams({ limit: 60 })
    if (tab !== 'all') p.set('role', tab)
    if (search) p.set('search', search)
    api.get(`/users/volunteers?${p}`).then(r => { setUsers(r.data.users||[]); setTotal(r.data.total||0) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab, search])

  const ROLE_BADGE = { volunteer: 'badge-teal', coordinator: 'badge-blue', ngo_admin: 'badge-purple', super_admin: 'badge-red' }

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">👥 User Management</h1>
        <p className="text-muted-color text-sm mt-1">{total} registered users</p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <input className="input max-w-xs" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-1.5">
          {['all','volunteer','coordinator','ngo_admin'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-md capitalize ${tab===t ? 'btn-primary' : 'btn-secondary'}`}>
              {t.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : users.length === 0 ? <EmptyState icon="👥" title="No users found" />
        : (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    {['User','Role','Skills','Tasks','Hours','Location','Joined','Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-faint-color font-semibold text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderBottom:'1px solid var(--border)' }}
                      className="hover:bg-surface-elevated transition-colors last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <p className="font-medium text-base-color">{u.name}</p>
                            <p className="text-faint-color text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><span className={`badge ${ROLE_BADGE[u.role]||'badge-gray'}`}>{u.role?.replace('_',' ')}</span></td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {u.skills?.slice(0,2).map(s => <span key={s} className="badge badge-gray">{s}</span>)}
                          {u.skills?.length > 2 && <span className="text-faint-color text-xs">+{u.skills.length-2}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-teal-500 font-semibold">{u.tasksCompleted||0}</td>
                      <td className="px-5 py-3.5 text-muted-color">{formatHours(u.totalHours)}</td>
                      <td className="px-5 py-3.5 text-muted-color text-xs">{u.location?.city||'—'}</td>
                      <td className="px-5 py-3.5 text-faint-color text-xs">{fmtDate(u.joinedAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      }
    </div>
  )
}

// ── Admin Orgs ────────────────────────────────────────────────────────────────
export function AdminOrgs() {
  const [orgs, setOrgs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('pending')
  const [busy, setBusy]       = useState(null)
  const [msg, setMsg]         = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/orgs?status=${tab}`).then(r => setOrgs(r.data.orgs||[])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const verify = async (id, status, note='') => {
    setBusy(id)
    try {
      await api.put(`/orgs/${id}/verify`, { status, rejectionNote: note })
      setMsg({ type:'success', text: `Organization ${status === 'approved' ? 'approved' : 'rejected'}.` })
      load()
    } catch (err) { setMsg({ type:'error', text: err.response?.data?.message||'Failed' }) }
    finally { setBusy(null) }
  }

  const pendingCount = orgs.filter(o => o.verificationStatus === 'pending').length

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">🏢 Organizations</h1>
        <p className="text-muted-color text-sm mt-1">Review and verify NGO registrations</p>
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <div className="flex gap-2">
        {[
          { key:'pending',  label:`Pending${tab==='pending'?` (${orgs.length})`:''}` },
          { key:'approved', label:'Approved' },
          { key:'rejected', label:'Rejected' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`btn btn-md ${tab===t.key ? 'btn-primary' : 'btn-secondary'}`}>{t.label}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : orgs.length === 0
          ? <EmptyState icon="🏢" title={`No ${tab} organizations`} desc={tab==='pending' ? 'All NGO applications have been reviewed.' : ''} />
          : (
            <div className="space-y-4">
              {orgs.map(org => (
                <div key={org._id} className={`surface p-6 ${org.verificationStatus==='pending' ? 'border-l-4 border-l-amber-400' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-lg shrink-0">
                      {org.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base-color">{org.name}</h3>
                        <span className={`badge ${org.verificationStatus==='approved'?'badge-teal':org.verificationStatus==='pending'?'badge-amber':'badge-red'}`}>
                          {org.verificationStatus}
                        </span>
                        <span className="badge badge-gray capitalize">{org.category?.replace('_',' ')}</span>
                      </div>
                      {org.description && <p className="text-sm text-muted-color line-clamp-2 mb-2">{org.description}</p>}
                      <div className="flex flex-wrap gap-4 text-xs text-faint-color">
                        <span>✉ {org.email}</span>
                        {org.location?.city && <span>📍 {org.location.city}, {org.location.state}</span>}
                        {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-teal-500 hover:text-teal-400">🌐 Website</a>}
                        <span>Registered {fmtDate(org.createdAt)}</span>
                      </div>
                    </div>

                    {org.verificationStatus === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => verify(org._id,'approved')} disabled={busy===org._id}
                          className="btn btn-primary btn-md">
                          {busy===org._id ? <Spinner size="sm" /> : null} ✓ Approve
                        </button>
                        <button onClick={() => { const note = prompt('Rejection reason (optional):'); verify(org._id,'rejected', note||'') }}
                          disabled={busy===org._id} className="btn btn-danger btn-md">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  )
}

export default AdminUsers
