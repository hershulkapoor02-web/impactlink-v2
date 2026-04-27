import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Spinner, EmptyState, UrgencyBadge, CategoryBadge } from '../../components/ui/index.jsx'
import { getHeatLevel, getUrgencyLabel, getCategoryInfo, CATEGORIES, relativeTime } from '../../utils/helpers'

export default function NeedsHeatmap() {
  const [needs, setNeeds]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState({ category: '', status: 'active' })
  const [view, setView]         = useState('grid')  // 'grid' | 'list'
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams({ limit: 100 })
    if (filter.category) p.set('category', filter.category)
    if (filter.status)   p.set('status', filter.status)
    api.get(`/needs?${p}`).then(r => setNeeds(r.data.needs || [])).finally(() => setLoading(false))
  }, [filter])

  // Group by city for heatmap
  const byCity = needs.reduce((acc, n) => {
    const city = n.location?.city || 'Unknown'
    if (!acc[city]) acc[city] = []
    acc[city].push(n)
    return acc
  }, {})

  const cityEntries = Object.entries(byCity).sort((a, b) => {
    const aMax = Math.max(...a[1].map(n => n.urgencyScore || 0))
    const bMax = Math.max(...b[1].map(n => n.urgencyScore || 0))
    return bMax - aMax
  })

  const totalCritical = needs.filter(n => n.severityScore >= 5).length
  const totalPeople   = needs.reduce((s, n) => s + (n.affectedPeople || 0), 0)

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">🗺️ Community Needs Heatmap</h1>
        <p className="text-muted-color text-sm mt-1">Urgency-weighted view of all reported community needs</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total needs',          value: needs.length,      color: 'text-base-color' },
          { label: 'Critical (severity 5)', value: totalCritical,    color: 'text-red-500' },
          { label: 'Cities affected',      value: Object.keys(byCity).length, color: 'text-amber-500' },
          { label: 'People affected',      value: totalPeople.toLocaleString(), color: 'text-teal-500' },
        ].map(s => (
          <div key={s.label} className="surface p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-color mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="surface p-4 flex flex-wrap gap-3 items-center">
        <select className="input w-44" value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select className="input w-36" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <div className="ml-auto flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {[{ key:'grid', icon:'⊞' }, { key:'list', icon:'☰' }].map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${view===v.key ? 'bg-teal-500 text-white' : 'text-faint-color hover:text-base-color'}`}>
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap legend */}
      <div className="flex items-center gap-3 text-xs text-muted-color">
        <span>Urgency:</span>
        {[
          { level:1, label:'Low',      cls:'heat-1' },
          { level:2, label:'Moderate', cls:'heat-2' },
          { level:3, label:'High',     cls:'heat-3' },
          { level:4, label:'Critical', cls:'heat-4' },
          { level:5, label:'Severe',   cls:'heat-5' },
        ].map(h => (
          <div key={h.level} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-color ${h.cls}`}>
            <span className="font-medium text-xs">{h.label}</span>
          </div>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size="xl" /></div>
        : needs.length === 0 ? <EmptyState icon="🗺️" title="No needs found" desc="No community needs match your current filters." />
        : view === 'grid' ? (
          /* GRID / HEATMAP VIEW */
          <div className="space-y-6">
            {cityEntries.map(([city, cityNeeds]) => {
              const maxUrg = Math.max(...cityNeeds.map(n => n.urgencyScore || 0))
              const heatLevel = getHeatLevel(maxUrg)
              return (
                <div key={city}>
                  {/* City header */}
                  <div className={`flex items-center gap-3 mb-3 p-3 rounded-xl heat-${heatLevel} border border-color`}>
                    <span className="text-lg">📍</span>
                    <h3 className="font-bold text-base-color">{city}</h3>
                    <span className="badge badge-gray ml-1">{cityNeeds.length} need{cityNeeds.length !== 1 ? 's' : ''}</span>
                    <div className="ml-auto flex gap-2 text-xs text-muted-color">
                      <span>👥 {cityNeeds.reduce((s,n) => s + (n.affectedPeople||0), 0).toLocaleString()} affected</span>
                    </div>
                  </div>

                  {/* Need cards grid */}
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 pl-4">
                    {cityNeeds
                      .sort((a,b) => (b.urgencyScore||0) - (a.urgencyScore||0))
                      .map(need => {
                        const hLevel = getHeatLevel(need.urgencyScore || 0)
                        return (
                          <button key={need._id} onClick={() => setSelected(selected?._id === need._id ? null : need)}
                            className={`text-left surface p-4 hover:shadow-card transition-all duration-200 heat-${hLevel} ${selected?._id === need._id ? 'ring-2 ring-teal-500' : ''}`}>
                            <div className="flex gap-2 mb-2 flex-wrap">
                              <UrgencyBadge score={need.severityScore} />
                              <CategoryBadge category={need.category} />
                            </div>
                            <h4 className="font-semibold text-sm text-base-color leading-snug">{need.title}</h4>
                            {need.description && <p className="text-xs text-muted-color mt-1 line-clamp-2">{need.description}</p>}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-faint-color">
                              {need.affectedPeople > 0 && <span>👥 {need.affectedPeople.toLocaleString()}</span>}
                              {need.location?.area && <span>— {need.location.area}</span>}
                              {need.reportCount > 1 && <span>📊 {need.reportCount} reports</span>}
                              <span className="ml-auto">{relativeTime(need.dateReported)}</span>
                            </div>

                            {/* Urgency score bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-[10px] text-faint-color mb-1">
                                <span>Urgency score</span><span>{Math.round(need.urgencyScore || 0)}</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--bg-subtle)' }}>
                                <div className={`h-full rounded-full transition-all ${
                                  hLevel >= 4 ? 'bg-red-500' : hLevel >= 3 ? 'bg-orange-500' : hLevel >= 2 ? 'bg-amber-500' : 'bg-teal-500'
                                }`} style={{ width: `${Math.min((need.urgencyScore||0)/100*100,100)}%` }} />
                              </div>
                            </div>
                          </button>
                        )
                      })
                    }
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-2">
            {needs.sort((a,b) => (b.urgencyScore||0) - (a.urgencyScore||0)).map((need, i) => (
              <div key={need._id} className={`surface p-4 flex items-start gap-4 heat-${getHeatLevel(need.urgencyScore||0)}`}>
                <div className="text-xl font-bold text-faint-color w-7 shrink-0 text-center">#{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <UrgencyBadge score={need.severityScore} />
                    <CategoryBadge category={need.category} />
                    <span className={`badge ${need.status==='active'?'badge-red':need.status==='in_progress'?'badge-amber':'badge-green'}`}>{need.status}</span>
                  </div>
                  <h3 className="font-semibold text-sm text-base-color">{need.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-faint-color">
                    {need.location?.city && <span>📍 {need.location.city}{need.location.area ? ` — ${need.location.area}` : ''}</span>}
                    {need.affectedPeople > 0 && <span>👥 {need.affectedPeople.toLocaleString()}</span>}
                    {need.reportCount > 0 && <span>📊 {need.reportCount} reports</span>}
                    {need.orgId?.name && <span>🏢 {need.orgId.name}</span>}
                    <span>{relativeTime(need.dateReported)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-lg font-bold ${getHeatLevel(need.urgencyScore||0)>=4?'text-red-500':getHeatLevel(need.urgencyScore||0)>=3?'text-orange-500':'text-amber-500'}`}>
                    {Math.round(need.urgencyScore || 0)}
                  </div>
                  <div className="text-[10px] text-faint-color">score</div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Detail panel for selected need */}
      {selected && (
        <div className="fixed bottom-6 right-6 w-80 surface shadow-2xl p-5 z-40 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base-color text-sm">Need detail</h3>
            <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm w-7 h-7 p-0 rounded-lg text-base">×</button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <UrgencyBadge score={selected.severityScore} />
            <CategoryBadge category={selected.category} />
          </div>
          <h4 className="font-semibold text-base-color mb-1">{selected.title}</h4>
          {selected.description && <p className="text-xs text-muted-color mb-3 leading-relaxed">{selected.description}</p>}
          <div className="space-y-1.5 text-xs text-muted-color">
            {selected.location?.city    && <div>📍 {selected.location.city}{selected.location.area ? `, ${selected.location.area}` : ''}</div>}
            {selected.affectedPeople > 0 && <div>👥 {selected.affectedPeople.toLocaleString()} people affected</div>}
            {selected.reportCount > 0   && <div>📊 Reported {selected.reportCount} times</div>}
            {selected.orgId?.name       && <div>🏢 {selected.orgId.name}</div>}
            <div>🕐 {relativeTime(selected.dateReported)}</div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-faint-color mb-1">
              <span>Urgency score</span>
              <span className="font-bold">{Math.round(selected.urgencyScore || 0)}/100</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--bg-subtle)' }}>
              <div className={`h-full rounded-full ${getHeatLevel(selected.urgencyScore||0)>=4?'bg-red-500':'bg-amber-500'}`}
                style={{ width:`${Math.min((selected.urgencyScore||0)/100*100,100)}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
