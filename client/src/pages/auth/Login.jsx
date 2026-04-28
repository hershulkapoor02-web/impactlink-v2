import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle, Spinner, Alert } from '../../components/ui/index.jsx'
import MapPicker from '../../components/ui/MapPicker.jsx'
import { getDashboardPath } from '../../utils/helpers'

export default function Login() {
  const { login, saveLocation } = useAuth()
  const navigate  = useNavigate()

  const [step,  setStep]  = useState('credentials')  // 'credentials' | 'location'
  const [form,  setForm]  = useState({ email: '', password: '' })
  const [coords, setCoords] = useState(null)   // { lat, lng, city, state }
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [error, setError] = useState('')
  const [busy,  setBusy]  = useState(false)

  // ── Step 1: credentials ──────────────────────────────────────────────────────
  const submitCredentials = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const user = await login(form.email, form.password)
      setLoggedInUser(user)
      // If user already has precise coords, skip location step
      if (user?.location?.coords?.lat) {
        navigate(getDashboardPath(user.role))
      } else {
        setStep('location')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  // ── Step 2: location ─────────────────────────────────────────────────────────
  const confirmLocation = async () => {
    if (coords?.lat) {
      await saveLocation(coords)
    }
    navigate(getDashboardPath(loggedInUser.role))
  }

  const skipLocation = () => navigate(getDashboardPath(loggedInUser.role))

  const demos = [
    { email: 'volunteer@demo.com', label: 'Volunteer' },
    { email: 'coord@demo.com',     label: 'Coordinator' },
    { email: 'ngo@demo.com',       label: 'NGO Admin' },
    { email: 'admin@demo.com',     label: 'Super Admin' },
  ]

  return (
    <div className="min-h-screen bg-base-color flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-teal-600 dark:bg-teal-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IL</span>
            </div>
            <span className="text-white font-bold text-lg">ImpactLink</span>
          </div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Making impact measurable, one task at a time.
          </h2>
          <p className="text-teal-100 text-lg leading-relaxed">
            Connect your skills with communities that need them most.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          {[{ v: '2,400+', l: 'Volunteers' }, { v: '8,900+', l: 'Tasks' }, { v: '180+', l: 'NGOs' }, { v: '12,000+', l: 'Hours' }].map(s => (
            <div key={s.l} className="bg-white/10 rounded-xl p-4">
              <div className="text-white font-bold text-xl">{s.v}</div>
              <div className="text-teal-200 text-xs mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="absolute top-4 right-4"><ThemeToggle compact /></div>

        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">IL</span>
            </div>
            <span className="font-bold text-base-color text-lg">ImpactLink</span>
          </div>

          {/* ── STEP 1: Credentials ── */}
          {step === 'credentials' && (
            <>
              <h1 className="text-2xl font-bold text-base-color mb-1">Welcome back</h1>
              <p className="text-muted-color text-sm mb-7">Sign in to your account</p>

              {error && <div className="mb-5"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

              <form onSubmit={submitCredentials} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input type="email" className="input" placeholder="you@example.com" autoFocus required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" placeholder="••••••••" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full mt-1">
                  {busy ? <><Spinner size="sm" /><span>Signing in…</span></> : 'Sign in →'}
                </button>
              </form>

              <div className="my-6" style={{ borderTop: '1px solid var(--border)' }} />

              <div className="surface-elevated rounded-xl p-4">
                <p className="text-xs font-semibold text-faint-color uppercase tracking-wider mb-3">Quick demo access</p>
                <div className="grid grid-cols-2 gap-2">
                  {demos.map(d => (
                    <button key={d.email} onClick={() => setForm({ email: d.email, password: 'demo1234' })}
                      className="btn btn-secondary btn-sm text-xs justify-start gap-2">
                      <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" />{d.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-faint-color mt-2">Password: <span className="font-mono">demo1234</span></p>
              </div>

              <p className="text-center text-sm text-muted-color mt-6">
                No account? <Link to="/register" className="text-teal-500 font-semibold hover:text-teal-400">Create one free</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 'location' && (
            <>
              <h1 className="text-2xl font-bold text-base-color mb-1">Pin your location</h1>
              <p className="text-muted-color text-sm mb-2">
                This helps us match you with tasks and needs nearby.
              </p>
              <p className="text-xs text-faint-color mb-5">
                📍 Click the map or use the auto-detect button. Your exact coordinates are only visible to coordinators.
              </p>

              <MapPicker coords={coords} onChange={setCoords} height={240} />

              <div className="flex gap-3 mt-5">
                <button
                  onClick={confirmLocation}
                  disabled={busy}
                  className="btn btn-primary btn-lg flex-1"
                >
                  {busy ? <Spinner size="sm" /> : coords?.lat ? 'Confirm location →' : 'Continue without location →'}
                </button>
              </div>

              <button onClick={skipLocation} className="btn btn-ghost btn-sm w-full mt-2 text-faint-color">
                Skip for now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}