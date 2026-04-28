import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from '../components/ui/index.jsx'
import { getDashboardPath } from '../utils/helpers'

const STATS = [{ v: '2,400+', l: 'Volunteers' }, { v: '180+', l: 'NGOs' }, { v: '8,900+', l: 'Tasks Done' }, { v: '340+', l: 'Communities' }]
const FEATURES = [
  { icon: '🎯', title: 'Smart Matching',     desc: 'Algorithm surfaces the highest-fit volunteers for every task — matching skills, location, and availability in real time.' },
  { icon: '🗺️', title: 'Needs Heatmap',      desc: 'Visual urgency map shows exactly where communities need help most, updated from field surveys and NGO reports.' },
  { icon: '📋', title: 'Check-in & Hours',   desc: 'Volunteers check in on-site. Hours auto-log. Coordinators verify attendance. All in one flow.' },
  { icon: '📊', title: 'Impact Dashboard',   desc: 'NGOs get live charts on hours volunteered, tasks completed, and community needs addressed — exportable.' },
  { icon: '🏅', title: 'Volunteer Certificates', desc: 'Auto-generated certificates with verified hours and tasks for every volunteer, ready to download.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Shift reminders, urgent task alerts, and application updates delivered instantly in-app.' },
]

export default function Landing() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-base-color">
      {/* Nav */}
      <nav className="sticky top-0 z-50 h-16 flex items-center px-6 md:px-10"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/Logo.png" alt="ImpactLink Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="font-bold text-base-color text-lg tracking-tight">ImpactLink</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          {user ? (
            <Link to={getDashboardPath(user.role)} className="btn btn-primary btn-md">Dashboard →</Link>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-md">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-md">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 md:px-10">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-sky-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse-dot" />
            Smart Resource Allocation · Data-Driven Impact
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Connect volunteers to<br />
            <span className="text-gradient">urgent needs</span> that matter
          </h1>
          <p className="text-lg text-muted-color max-w-2xl mx-auto leading-relaxed mb-10">
            ImpactLink aggregates scattered community data from NGOs and intelligently matches
            skilled volunteers with the tasks where they're needed most — powered by real urgency scores.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register"                className="btn btn-primary btn-lg shadow-glow">Join as Volunteer</Link>
            <Link to="/register?role=ngo_admin" className="btn btn-secondary btn-lg">Register your NGO</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-3xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.l} className="surface p-5 text-center animate-slide-up">
              <div className="text-2xl font-bold text-gradient">{s.v}</div>
              <div className="text-xs text-muted-color mt-1 font-medium">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-base-color mb-3">Everything NGOs need to coordinate at scale</h2>
            <p className="text-muted-color max-w-xl mx-auto">From data ingestion to verified hours — one platform, three roles, zero chaos.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="surface p-6 hover:shadow-card transition-all duration-200 group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-base-color mb-2 text-sm">{f.title}</h3>
                <p className="text-muted-color text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="py-20 px-6 md:px-10" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-base-color mb-12">Three roles. One mission.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { role: 'Volunteer',   icon: '🙋', color: 'bg-teal-500',   desc: 'Browse tasks matched to your skills. Track your hours. Earn verified certificates.' },
              { role: 'Coordinator', icon: '📋', color: 'bg-blue-500',   desc: 'Assign volunteers. Verify attendance. Flag urgent community needs in real time.' },
              { role: 'NGO Admin',   icon: '🏢', color: 'bg-violet-500', desc: 'Post tasks. Upload field reports. View impact dashboards. Manage your team.' },
            ].map(r => (
              <div key={r.role} className="surface p-7 text-center">
                <div className={`w-14 h-14 ${r.color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4`}>{r.icon}</div>
                <h3 className="font-bold text-base-color mb-2">{r.role}</h3>
                <p className="text-sm text-muted-color leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center surface p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-base-color mb-4">Ready to make an impact?</h2>
            <p className="text-muted-color mb-8">Join thousands of volunteers and NGOs already coordinating through ImpactLink.</p>
            <Link to="/register" className="btn btn-primary btn-lg shadow-glow">Create free account →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-faint-color text-xs">© 2025 ImpactLink — Data-Driven Volunteer Coordination</p>
      </footer>
    </div>
  )
}