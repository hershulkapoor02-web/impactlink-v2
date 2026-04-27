// Leaderboard.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Avatar, Spinner, EmptyState } from '../../components/ui/index.jsx'
import { formatHours } from '../../utils/helpers'

export function VolunteerLeaderboard() {
  const { user } = useAuth()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/users/leaderboard').then(r => setLeaders(r.data.users || [])).finally(() => setLoading(false)) }, [])

  return (
    <div className="page-container space-y-6">
      <div>
        <h1 className="page-title">🏆 Leaderboard</h1>
        <p className="text-muted-color text-sm mt-1">Top volunteers by hours contributed</p>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : leaders.length === 0 ? <EmptyState icon="🏆" title="No data yet" desc="Complete tasks to appear on the leaderboard." />
        : (
          <div className="max-w-2xl space-y-2">
            {leaders.map((v, i) => (
              <div key={v._id} className={`surface p-4 flex items-center gap-4 ${v._id === user?._id ? 'ring-1 ring-teal-500' : ''}`}>
                <div className="w-8 text-center font-bold text-lg shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-faint-color text-sm">#{i+1}</span>}
                </div>
                <Avatar name={v.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-base-color truncate">{v.name}</span>
                    {v._id === user?._id && <span className="badge-teal text-[10px]">You</span>}
                  </div>
                  {v.skills?.length > 0 && <p className="text-xs text-faint-color truncate">{v.skills.slice(0,3).join(' · ')}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-teal-500">{formatHours(v.totalHours)}</div>
                  <div className="text-xs text-faint-color">{v.tasksCompleted} tasks</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default VolunteerLeaderboard
