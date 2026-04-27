import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState } from '../../components/ui/index.jsx'
import { relativeTime } from '../../utils/helpers'

const TYPE_ICONS = {
  task_assigned:     '✅', task_reminder: '⏰', urgent_task: '🚨',
  application_update:'📋', org_approved:  '🎉', org_rejected: '❌',
  checkin_reminder:  '📍', general:       '🔔',
}

export default function Notifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/notifications').then(r => setNotifs(r.data.notifications || [])).finally(() => setLoading(false)) }, [])

  const markAll  = async () => { await api.put('/notifications/read-all'); setNotifs(n => n.map(x => ({ ...x, isRead: true }))) }
  const markOne  = async id  => { await api.put(`/notifications/${id}/read`); setNotifs(n => n.map(x => x._id === id ? { ...x, isRead: true } : x)) }

  const unread = notifs.filter(n => !n.isRead).length

  return (
    <div className="page-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">🔔 Notifications</h1>
          <p className="text-muted-color text-sm mt-1">{unread} unread</p>
        </div>
        {unread > 0 && <button onClick={markAll} className="btn btn-ghost btn-md">Mark all read</button>}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : notifs.length === 0 ? <EmptyState icon="🔔" title="All caught up!" desc="Notifications about your tasks and applications appear here." />
        : (
          <div className="max-w-2xl space-y-2">
            {notifs.map(n => (
              <div key={n._id} onClick={() => !n.isRead && markOne(n._id)}
                className={`surface p-4 flex gap-4 cursor-pointer hover:shadow-card transition-all ${n.isRead ? 'opacity-60' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${!n.isRead ? 'bg-teal-50 dark:bg-teal-900/30' : 'surface-elevated'}`}>
                  {TYPE_ICONS[n.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-base-color flex-1">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-color mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-faint-color mt-1">{relativeTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
