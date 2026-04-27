import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Spinner, Avatar } from '../../components/ui/index.jsx'
import { fmtDate, formatHours } from '../../utils/helpers'

export default function VolunteerCertificate() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const certRef = useRef()

  useEffect(() => {
    api.get('/users/me/certificate').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  const printCert = () => window.print()

  if (loading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  const totalHours = data?.user?.totalHours || 0
  const taskCount  = data?.completedTasks?.length || 0

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🏅 Volunteer Certificate</h1>
          <p className="text-muted-color text-sm mt-1">Your verified contribution record</p>
        </div>
        <button onClick={printCert} className="btn btn-primary btn-md print:hidden">
          🖨️ Print / Download
        </button>
      </div>

      {/* Certificate card */}
      <div ref={certRef} className="surface p-10 max-w-2xl mx-auto relative overflow-hidden"
        style={{ background: 'var(--bg-surface)', minHeight: 480 }}>
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative text-center">
          {/* Logo + title */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center shadow-glow">
              <span className="text-white font-bold text-lg">IL</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-teal-500 uppercase tracking-[0.2em] mb-2">Certificate of Contribution</p>
          <p className="text-muted-color text-sm mb-8">This is to certify that</p>

          {/* Volunteer name */}
          <div className="flex justify-center mb-2">
            <Avatar name={data?.user?.name} size="xl" ring />
          </div>
          <h2 className="text-3xl font-bold text-base-color mt-3 mb-1">{data?.user?.name}</h2>
          <p className="text-muted-color text-sm mb-8">has actively volunteered on the ImpactLink platform</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="surface-elevated rounded-2xl p-5 text-center">
              <div className="text-4xl font-bold text-gradient">{formatHours(totalHours)}</div>
              <div className="text-xs text-muted-color mt-1 font-medium">Total Hours Volunteered</div>
            </div>
            <div className="surface-elevated rounded-2xl p-5 text-center">
              <div className="text-4xl font-bold text-gradient">{taskCount}</div>
              <div className="text-xs text-muted-color mt-1 font-medium">Tasks Completed</div>
            </div>
          </div>

          {/* Task list */}
          {data?.completedTasks?.length > 0 && (
            <div className="text-left mb-8">
              <p className="text-xs font-semibold text-faint-color uppercase tracking-wider mb-3">Contributions include</p>
              <div className="space-y-2">
                {data.completedTasks.slice(0, 6).map(t => (
                  <div key={t._id} className="flex items-center justify-between text-sm">
                    <span className="text-base-color font-medium line-clamp-1 flex-1 mr-4">{t.title}</span>
                    <div className="flex items-center gap-3 shrink-0 text-faint-color text-xs">
                      {t.orgId?.name && <span>{t.orgId.name}</span>}
                      {t.completedAt && <span>{fmtDate(t.completedAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {data?.user?.skills?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-8">
              {data.user.skills.map(s => (
                <span key={s} className="badge-teal">{s}</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="divider pt-6">
            <div className="flex items-center justify-between text-xs text-faint-color mt-4">
              <span>Joined {fmtDate(data?.user?.joinedAt)}</span>
              <span className="text-teal-500 font-semibold">ImpactLink Platform</span>
              <span>Generated {fmtDate(new Date())}</span>
            </div>
          </div>
        </div>
      </div>

      {taskCount === 0 && totalHours === 0 && (
        <div className="surface p-6 max-w-2xl mx-auto text-center">
          <p className="text-muted-color text-sm">Complete tasks and log hours to build your certificate. 🌱</p>
        </div>
      )}
    </div>
  )
}
