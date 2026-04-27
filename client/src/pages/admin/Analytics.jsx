import { useState, useEffect } from 'react'
import api from '../../services/api'
import { StatCard, Spinner, Progress } from '../../components/ui/index.jsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid, Legend, AreaChart, Area
} from 'recharts'
import { formatHours, getCategoryInfo } from '../../utils/helpers'

const C = ['#14b8a6','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#22c55e','#f97316','#64748b']
const TT = { contentStyle:{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text-primary)',fontSize:12 } }

export default function AdminAnalytics() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/users/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="flex justify-center py-16"><Spinner size="xl" /></div>

  const taskStatusData = (stats?.tasksByStatus || []).map(t => ({ name:(t._id||'').replace('_',' '), value:t.count }))
  const needsCatData   = (stats?.needsByCategory || []).map(n => ({ name:getCategoryInfo(n._id||'other').label, count:n.count, avg:Math.round(n.avgUrgency||0) }))
  const taskCatData    = (stats?.tasksByCategory || []).map(t => ({ name:getCategoryInfo(t._id||'other').label, count:t.count }))

  // Simulated growth (replace with real time-series data when added to backend)
  const growth = [
    { m:'Aug', users:210,  tasks:55,  hours:180  },
    { m:'Sep', users:420,  tasks:145, hours:410  },
    { m:'Oct', users:680,  tasks:220, hours:720  },
    { m:'Nov', users:920,  tasks:310, hours:1100 },
    { m:'Dec', users:1340, tasks:490, hours:1850 },
    { m:'Jan', users:stats?.totalUsers||0, tasks:stats?.totalTasks||0, hours:Math.round((stats?.totalHours||0)) },
  ]

  const completionRate = stats?.totalTasks ? Math.round((stats.completedTasks/stats.totalTasks)*100) : 0

  return (
    <div className="page-container space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">📊 Platform Analytics</h1>
          <p className="text-muted-color text-sm mt-1">Complete performance metrics across ImpactLink</p>
        </div>
        <button onClick={() => window.print()} className="btn btn-secondary btn-md print:hidden">🖨️ Export</button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Total Users"       value={stats?.totalUsers||0}      accent />
        <StatCard icon="🙋" label="Volunteers"        value={stats?.totalVolunteers||0} />
        <StatCard icon="🏢" label="Organizations"     value={stats?.totalNGOs||0} />
        <StatCard icon="⏱" label="Hours Volunteered" value={formatHours(stats?.totalHours||0)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="📋" label="Total Tasks"    value={stats?.totalTasks||0} />
        <StatCard icon="✅" label="Completed"      value={stats?.completedTasks||0} />
        <StatCard icon="📈" label="Completion Rate" value={`${completionRate}%`} />
      </div>

      {/* Completion progress */}
      <div className="surface p-6">
        <h2 className="section-title mb-5">Operational health</h2>
        <div className="space-y-4">
          <Progress value={completionRate} label="Task completion rate" color="teal" />
          <Progress value={stats?.totalUsers ? Math.min((stats.totalVolunteers/stats.totalUsers)*100,100) : 0} label="Volunteer percentage of users" color="green" />
          <Progress value={stats?.totalNGOs ? Math.min((stats.totalNGOs/50)*100,100) : 0} label="NGO onboarding progress (target: 50)" color="amber" />
        </div>
      </div>

      {/* Growth area chart */}
      <div className="surface p-6">
        <h2 className="section-title mb-5">Platform growth over time</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={growth}>
            <defs>
              <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#14b8a6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="m" tick={{ fill:'var(--text-muted)',fontSize:11 }} />
            <YAxis tick={{ fill:'var(--text-muted)',fontSize:11 }} />
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ color:'var(--text-secondary)',fontSize:12 }} />
            <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#gu)" name="Users" />
            <Area type="monotone" dataKey="tasks" stroke="#14b8a6" strokeWidth={2} fill="url(#gt)" name="Tasks" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task status donut */}
        {taskStatusData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Task status distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}
                  label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {taskStatusData.map((_,i) => <Cell key={i} fill={C[i%C.length]} />)}
                </Pie>
                <Tooltip {...TT} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Needs by category horizontal bar */}
        {needsCatData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Community needs by category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={needsCatData} layout="vertical">
                <XAxis type="number" tick={{ fill:'var(--text-muted)',fontSize:11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill:'var(--text-secondary)',fontSize:11 }} width={80} />
                <Tooltip {...TT} />
                <Bar dataKey="count" radius={[0,4,4,0]}>
                  {needsCatData.map((_,i) => <Cell key={i} fill={C[i%C.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tasks by category bar */}
        {taskCatData.length > 0 && (
          <div className="surface p-6">
            <h2 className="section-title mb-5">Tasks by category</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskCatData}>
                <XAxis dataKey="name" tick={{ fill:'var(--text-muted)',fontSize:10 }} />
                <YAxis tick={{ fill:'var(--text-muted)',fontSize:11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {taskCatData.map((_,i) => <Cell key={i} fill={C[i%C.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary table */}
        <div className="surface p-6">
          <h2 className="section-title mb-5">Platform summary</h2>
          <div className="space-y-3">
            {[
              { label:'Total registered accounts', value:stats?.totalUsers||0,       note:'all roles' },
              { label:'Active volunteers',          value:stats?.totalVolunteers||0,  note:`${stats?.totalUsers?Math.round((stats.totalVolunteers/stats.totalUsers)*100):0}% of users` },
              { label:'Organizations onboarded',   value:stats?.totalNGOs||0,        note:'registered NGOs' },
              { label:'Tasks created (all time)',   value:stats?.totalTasks||0,       note:'all statuses' },
              { label:'Tasks completed',            value:stats?.completedTasks||0,   note:`${completionRate}% rate` },
              { label:'Total hours contributed',    value:formatHours(stats?.totalHours||0), note:'platform-wide' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-color last:border-0">
                <div>
                  <span className="text-sm text-base-color font-medium">{row.label}</span>
                  <span className="text-xs text-faint-color ml-2">— {row.note}</span>
                </div>
                <span className="font-bold text-teal-500 text-base">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
