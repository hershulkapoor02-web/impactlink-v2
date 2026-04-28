import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle, Spinner, Alert } from '../../components/ui/index.jsx'
import { SKILLS, getDashboardPath } from '../../utils/helpers'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: params.get('role') || 'volunteer',
    orgName: '', skills: []
  })
  const [error, setBusy_error] = useState('')
  const [busy,  setBusy]  = useState(false)

  const toggleSkill = s => setForm(f => ({ ...f, skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s] }))

  const submit = async e => {
    e.preventDefault(); setBusy_error(''); setBusy(true)
    try {
      const user = await register(form)
      navigate(getDashboardPath(user.role))
    } catch (err) { setBusy_error(err.response?.data?.message || 'Registration failed') }
    finally { setBusy(false) }
  }

  const ROLES = [
    { value: 'volunteer',   label: 'Volunteer',    desc: 'Browse tasks & log hours' },
    { value: 'coordinator', label: 'Coordinator',  desc: 'Assign & verify attendance' },
    { value: 'ngo_admin',   label: 'NGO Admin',    desc: 'Post needs & view impact' },
  ]

  return (
    <div className="min-h-screen bg-base-color flex items-start justify-center px-4 py-10">
      <div className="absolute top-4 right-4"><ThemeToggle compact /></div>
      <div className="w-full max-w-lg animate-slide-up">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">IL</span>
          </div>
          <span className="font-bold text-base-color text-lg">ImpactLink</span>
        </div>

        <div className="surface p-8">
          <h1 className="text-2xl font-bold text-base-color mb-1">Create your account</h1>
          <p className="text-muted-color text-sm mb-7">Join the platform making real social impact</p>

          {error && <div className="mb-5"><Alert type="error" message={error} onClose={() => setBusy_error('')} /></div>}

          {/* Role selector */}
          <div className="mb-5">
            <label className="label">I am a…</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  className={`p-3 rounded-xl border text-left transition-all text-xs ${
                    form.role === r.value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'border-color text-muted-color hover:border-teal-400'
                  }`}>
                  <div className="font-semibold text-sm mb-0.5">{r.label}</div>
                  <div className="text-[10px] opacity-70">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Full name</label>
                <input type="text" className="input" placeholder="Jane Doe" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@example.com" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" placeholder="+91..."
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Password (min. 6 characters)</label>
                <input type="password" className="input" placeholder="••••••••" required minLength={6}
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            {form.role === 'ngo_admin' && (
              <div>
                <label className="label">Organization name</label>
                <input type="text" className="input" placeholder="Your NGO name" required={form.role === 'ngo_admin'}
                  value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} />
              </div>
            )}

            {form.role === 'volunteer' && (
              <div>
                <label className="label">Your skills (select all that apply)</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SKILLS.map(s => (
                    <button key={s} type="button" onClick={() => toggleSkill(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                        form.skills.includes(s)
                          ? 'bg-teal-500 text-white border-teal-500'
                          : 'border-color text-muted-color hover:border-teal-400'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full mt-2">
              {busy ? <><Spinner size="sm" /><span>Creating…</span></> : 'Create account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-color mt-5">
          Already have an account? <Link to="/login" className="text-teal-500 font-semibold hover:text-teal-400">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
