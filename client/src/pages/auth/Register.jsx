import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle, Spinner, Alert } from '../../components/ui/index.jsx'
import MapPicker from '../../components/ui/MapPicker.jsx'
import { SKILLS, getDashboardPath } from '../../utils/helpers'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [step, setStep] = useState('details')   // 'details' | 'location'
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: params.get('role') || 'volunteer',
    orgName: '', skills: [],
    location: { city: '', state: '', coords: null },
  })
  const [coords, setCoords] = useState(null)
  const [error, setError]   = useState('')
  const [busy,  setBusy]    = useState(false)

  const toggleSkill = s => setForm(f => ({
    ...f,
    skills: f.skills.includes(s) ? f.skills.filter(x => x !== s) : [...f.skills, s],
  }))

  const ROLES = [
    { value: 'volunteer',   label: 'Volunteer',    desc: 'Browse tasks & log hours' },
    { value: 'coordinator', label: 'Coordinator',  desc: 'Assign & verify attendance' },
    { value: 'ngo_admin',   label: 'NGO Admin',    desc: 'Post needs & view impact' },
  ]

  // Step 1 → Step 2
  const goToLocation = e => {
    e.preventDefault()
    setStep('location')
  }

  // Step 2 → submit
  const submit = async () => {
    setError(''); setBusy(true)
    try {
      const payload = {
        ...form,
        location: coords
          ? { city: coords.city || '', state: coords.state || '', coords: { lat: coords.lat, lng: coords.lng } }
          : form.location,
      }
      const user = await register(payload)
      navigate(getDashboardPath(user.role))
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
      setStep('details')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-color flex items-start justify-center px-4 py-10">
      <div className="absolute top-4 right-4"><ThemeToggle compact /></div>

      <div className="w-full max-w-lg animate-slide-up">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">IL</span>
          </div>
          <span className="font-bold text-base-color text-lg">ImpactLink</span>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {['Account details', 'Your location'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full mb-1 transition-all ${
                (step === 'details' && i === 0) || step === 'location' ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
              <p className={`text-xs ${i === (step === 'details' ? 0 : 1) ? 'text-teal-500 font-semibold' : 'text-faint-color'}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="surface p-8">
          {error && <div className="mb-5"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

          {/* ── STEP 1: Account details ── */}
          {step === 'details' && (
            <>
              <h1 className="text-2xl font-bold text-base-color mb-1">Create your account</h1>
              <p className="text-muted-color text-sm mb-7">Join the platform making real social impact</p>

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

              <form onSubmit={goToLocation} className="space-y-4">
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
                    <input type="tel" className="input" placeholder="+91 9000000000"
                      value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Password</label>
                    <input type="password" className="input" placeholder="min 8 characters" required minLength={8}
                      value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                  {form.role === 'ngo_admin' && (
                    <div className="col-span-2">
                      <label className="label">Organisation name</label>
                      <input type="text" className="input" placeholder="Helping Hands NGO" required
                        value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} />
                    </div>
                  )}
                </div>

                {form.role === 'volunteer' && (
                  <div>
                    <label className="label">Skills <span className="text-faint-color font-normal">(select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SKILLS.map(s => (
                        <button key={s} type="button" onClick={() => toggleSkill(s)}
                          className={`btn btn-sm ${form.skills.includes(s) ? 'btn-primary' : 'btn-secondary'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-full">
                  Next: Set location →
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 'location' && (
            <>
              <h1 className="text-2xl font-bold text-base-color mb-1">Where are you based?</h1>
              <p className="text-muted-color text-sm mb-2">
                Pin your location so we can match nearby tasks and needs.
              </p>
              <p className="text-xs text-faint-color mb-5">
                📍 Click the map, drag the pin, or hit "Use my location". Your exact coordinates are only visible to coordinators for assigned tasks.
              </p>

              <MapPicker coords={coords} onChange={setCoords} height={260} />

              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => setStep('details')} className="btn btn-secondary btn-lg">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="btn btn-primary btn-lg flex-1"
                >
                  {busy ? <><Spinner size="sm" /><span>Creating account…</span></> : 'Create account →'}
                </button>
              </div>

              {!coords?.lat && (
                <button type="button" onClick={submit} disabled={busy} className="btn btn-ghost btn-sm w-full mt-2 text-faint-color">
                  Skip for now
                </button>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-color mt-6">
          Already have an account? <Link to="/login" className="text-teal-500 font-semibold hover:text-teal-400">Sign in</Link>
        </p>
      </div>
    </div>
  )
}