import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Avatar, Alert, Spinner } from '../../components/ui/index.jsx'
import { SKILLS, AVAILABILITY_OPTIONS, formatHours } from '../../utils/helpers'

export default function VolunteerProfile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '', bio: user?.bio || '', phone: user?.phone || '',
    skills: user?.skills || [], availability: user?.availability || 'on_demand',
    location: { city: user?.location?.city || '', state: user?.location?.state || '' }
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState(null)

  const toggleSkill = s => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }))

  const save = async e => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      const { data } = await api.put('/auth/profile', form)
      updateUser(data.user); setMsg({ type: 'success', text: 'Profile saved!' })
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="page-container space-y-6 max-w-2xl">
      <h1 className="page-title">👤 Profile</h1>

      {/* Avatar card */}
      <div className="surface p-6 flex items-center gap-5">
        <Avatar name={user?.name} size="xl" ring />
        <div>
          <h2 className="text-lg font-bold text-base-color">{user?.name}</h2>
          <p className="text-sm text-muted-color">{user?.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge-teal">Volunteer</span>
            {user?.tasksCompleted > 0 && <span className="badge-blue">{user.tasksCompleted} tasks</span>}
            {user?.totalHours > 0 && <span className="badge-green">{formatHours(user.totalHours)}</span>}
          </div>
        </div>
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <form onSubmit={save} className="space-y-5">
        <div className="surface p-6 space-y-4">
          <h3 className="section-title">Basic info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input resize-none h-20" placeholder="Tell NGOs why you volunteer…" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="Kolkata" value={form.location.city} onChange={e => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" placeholder="West Bengal" value={form.location.state} onChange={e => setForm({ ...form, location: { ...form.location, state: e.target.value } })} />
            </div>
          </div>
        </div>

        <div className="surface p-6">
          <h3 className="section-title mb-1">Availability</h3>
          <p className="text-xs text-muted-color mb-4">Helps NGOs know when you can volunteer</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY_OPTIONS.map(o => (
              <button key={o.value} type="button" onClick={() => setForm({ ...form, availability: o.value })}
                className={`btn btn-md ${form.availability === o.value ? 'btn-primary' : 'btn-secondary'}`}>{o.label}</button>
            ))}
          </div>
        </div>

        <div className="surface p-6">
          <h3 className="section-title mb-1">Skills</h3>
          <p className="text-xs text-muted-color mb-4">{form.skills.length} selected — used to match you to relevant tasks</p>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(s => (
              <button key={s} type="button" onClick={() => toggleSkill(s)}
                className={`btn btn-sm ${form.skills.includes(s) ? 'btn-primary' : 'btn-secondary'}`}>{s}</button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? <><Spinner size="sm" /><span>Saving…</span></> : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
