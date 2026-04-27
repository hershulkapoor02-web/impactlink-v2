import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { StatCard, Spinner } from '../../components/ui/index.jsx'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { formatHours, getCategoryInfo } from '../../utils/helpers'

const COLORS = ['#14b8a6','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#22c55e','#f97316','#64748b']
const TT = { contentStyle: { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:12 } }

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/users/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  const taskStatusData = (stats?.tasksByStatus || []).map(t => ({ name:(t._id||'unknown').replace('_',' '), value:t.count }))
  const needsCatData   = (stats?.needsByCategory || []).map(n => ({ name: getCategoryInfo(n._id||'other').label, count:n.count, avg:Math.round(n.avgUrgency||0) }))
  const taskCatData    = (stats?.tasksByCategory || []).map(t => ({ name: getCategoryInfo(t._id||'other').label, count:t.count }))

  const growth = [
    { m:'Sep', users:420,  tasks:145 },
    { m:'Oct', users:680,  tasks:220 },
    { m:'Nov', users:920,  tasks:310 },
    { m:'Dec', users:1340, tasks:490 },
    { m:'Jan', users:1780, tasks:670 },
    { m:'Now', users:stats?.totalUsers||0, tasks:stats?.totalTasks||0 },
  ]

  return (
    <div className="page-container space-y-8">
      <div>
        <h1 className="page-title">Platform Overview</h1>
        <p className="text-muted-color text-sm mt-1">ImpactLink system-wide metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Users"       value={stats?.totalUsers     || 0} accent />
        <StatCard icon="🙋" label="Volunteers"        value={stats?.totalVolunteers || 0} />
        <StatCard icon="🏢" label="Organizations"     value={stats?.totalNGOs       || 0} />
        <StatCard icon="✅" label="Tasks Total"       value={stats?.totalTasks      || 0} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="🏁" label="Completed Tasks"  value={stats?.completedTasks  || 0} />
        <StatCard icon="⏱" label="Hours Volunteered" value={formatHours(stats?.totalHours || 0)} />
        <StatCard icon="📈" label="Completion Rate"  value={`${stats?.totalTasks ? Math.round((stats.completedTasks/stats.totalTasks)*100) : 0}%`} />
      </div>

      {/* Growth chart */}
      <div className="surface p-6">
        <h2 className="section-title mb-5">Platform growth</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="m" tick={{ fill:'var(--text-muted)',fontSize:11 }} />
            <YAxis tick={{ fill:'var(--text-muted)',fontSize:11 }} />
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ color:'var(--text-secondary)',fontSize:12 }} />
            <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} dot={{ r:3 }} name="Users" />
            <Line type="monotone" dataKey="tasks" stroke="#14b8a6" strokeWidth={2} dot={{ r:3 }} name="Tasks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task status pie */}
        {taskStatusData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Task statuses</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {taskStatusData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ color:'var(--text-secondary)',fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Needs by category */}
        {needsCatData.length > 0 && (
          <div className="surface p-6 lg:col-span-2">
            <h2 className="section-title mb-5">Community needs by category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={needsCatData} layout="vertical">
                <XAxis type="number" tick={{ fill:'var(--text-muted)',fontSize:11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill:'var(--text-secondary)',fontSize:11 }} width={80} />
                <Tooltip {...TT} />
                <Bar dataKey="count" radius={[0,4,4,0]} fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { to:'/admin/users',     icon:'👥', label:'Manage Users',     desc:'View & deactivate accounts', color:'border-violet-200 dark:border-violet-800' },
          { to:'/admin/orgs',      icon:'🏢', label:'Approve NGOs',      desc:'Review org registrations',  color:'border-cyan-200 dark:border-cyan-800' },
          { to:'/admin/needs',     icon:'🗺️', label:'Needs Heatmap',     desc:'Community urgency view',    color:'border-red-200 dark:border-red-800' },
          { to:'/admin/analytics', icon:'📊', label:'Full Analytics',    desc:'Deep platform metrics',     color:'border-amber-200 dark:border-amber-800' },
        ].map(c => (
          <Link key={c.to} to={c.to} className={`surface p-5 hover:shadow-card transition-all border-l-4 ${c.color}`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <h3 className="font-semibold text-sm text-base-color">{c.label}</h3>
            <p className="text-xs text-muted-color mt-0.5">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
