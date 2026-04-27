import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { StatCard, UrgencyBadge, CategoryBadge, MatchScore, EmptyState, Spinner, Progress, Avatar } from '../../components/ui/index.jsx'
import TaskCard from '../../components/ui/TaskCard.jsx'
import { relativeTime, fmtDate, formatHours } from '../../utils/helpers'

export default function VolunteerDashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState({ matches: [], myTasks: [], notifs: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/tasks/my-matches'),
      api.get('/tasks/mine'),
      api.get('/notifications'),
    ]).then(([m, t, n]) => setData({
      matches:  m.data.tasks  || [],
      myTasks:  t.data.tasks  || [],
      notifs:   n.data.notifications?.slice(0, 5) || [],
    })).finally(() => setLoading(false))
  }, [])

  const reload = () => {
    api.get('/tasks/my-matches').then(r => setData(d => ({ ...d, matches: r.data.tasks || [] })))
  }

  const assigned  = data.myTasks.filter(t => t.assignedVolunteers?.some(v => (v._id || v) === user?._id))
  const applied   = data.myTasks.filter(t => t.applicants?.some(a => (a.user?._id || a.user) === user?._id && a.status === 'pending'))
  const completed = data.myTasks.filter(t => t.status === 'completed' && t.assignedVolunteers?.some(v => (v._id || v) === user?._id))

  const profilePct = [user?.name, user?.bio, user?.skills?.length > 0, user?.location?.city].filter(Boolean).length * 25

  if (loading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Good to see you, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted-color text-sm mt-1">Here's your volunteer activity at a glance.</p>
        </div>
        <Link to="/volunteer/tasks" className="btn btn-primary btn-md shrink-0">Browse Tasks →</Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✅" label="Tasks Applied"  value={user?.tasksApplied  || applied.length}  accent />
        <StatCard icon="🎯" label="Active Assignments" value={assigned.length} />
        <StatCard icon="🏁" label="Completed" value={user?.tasksCompleted || completed.length} />
        <StatCard icon="⏱" label="Total Hours" value={formatHours(user?.totalHours)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Best matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">✦ Best matches for you</h2>
            <Link to="/volunteer/matches" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
          {data.matches.length === 0
            ? <EmptyState icon="🔍" title="No matches yet" desc="Complete your profile with skills and location to see personalized task matches." action={<Link to="/volunteer/profile" className="btn btn-primary btn-md">Complete profile</Link>} />
            : <div className="grid md:grid-cols-2 gap-3">
                {data.matches.slice(0, 4).map(t => (
                  <TaskCard key={t._id} task={t} userRole="volunteer" userId={user?._id} onUpdate={reload} />
                ))}
              </div>
          }
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Profile health */}
          <div className="surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title text-sm">Profile health</h3>
              <span className="text-xs font-semibold text-teal-500">{profilePct}%</span>
            </div>
            <Progress value={profilePct} color="teal" />
            <div className="mt-4 space-y-2">
              {[
                { label: 'Name & email',    done: !!user?.name },
                { label: 'Skills added',    done: user?.skills?.length > 0 },
                { label: 'Location set',    done: !!user?.location?.city },
                { label: 'Bio written',     done: !!user?.bio },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2.5 text-xs">
                  <span className={item.done ? 'text-teal-500' : 'text-faint-color'}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className={item.done ? 'text-base-color' : 'text-faint-color'}>{item.label}</span>
                </div>
              ))}
            </div>
            {profilePct < 100 && (
              <Link to="/volunteer/profile" className="btn btn-secondary btn-sm w-full justify-center mt-4">
                Complete profile
              </Link>
            )}
          </div>

          {/* Recent notifications */}
          <div className="surface p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title text-sm">Recent alerts</h3>
              <Link to="/volunteer/notifications" className="btn btn-ghost btn-sm text-teal-500">See all</Link>
            </div>
            {data.notifs.length === 0
              ? <p className="text-faint-color text-xs">No notifications yet.</p>
              : <div className="space-y-3">
                  {data.notifs.map(n => (
                    <div key={n._id} className={`flex gap-3 ${!n.isRead ? 'opacity-100' : 'opacity-50'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-teal-500' : 'bg-muted'}`} />
                      <div>
                        <p className="text-xs font-medium text-base-color">{n.title}</p>
                        <p className="text-xs text-muted-color line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-faint-color mt-0.5">{relativeTime(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* My active tasks */}
          {assigned.length > 0 && (
            <div className="surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title text-sm">Active tasks</h3>
                <Link to="/volunteer/my-tasks" className="btn btn-ghost btn-sm">All →</Link>
              </div>
              <div className="space-y-2">
                {assigned.slice(0, 3).map(t => (
                  <div key={t._id} className="surface-elevated rounded-xl p-3">
                    <p className="text-xs font-medium text-base-color line-clamp-1">{t.title}</p>
                    <p className="text-[10px] text-faint-color mt-0.5">
                      {t.orgId?.name} · {t.scheduledDate ? fmtDate(t.scheduledDate) : 'No date set'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
