import { useState, useEffect, useRef } from 'react'

const INITIAL_MISSIONS = [
  {
    id: 1, icon: '🚨', urgent: true,
    tags: [{ t: 'CRITICAL', c: 'red' }, { t: 'Medical', c: 'red' }, { t: 'Kolkata', c: 'gray' }],
    title: 'Emergency Health Camp — Dengue Outbreak',
    loc: '📍 Ward 12, Kolkata  ·  Starts in 45 min',
    needed: 10, joined: 7, color: 'red',
    timeLeft: 44 * 60 + 12,
    skills: ['Healthcare', 'First Aid', 'Nursing'],
    messages: [
      { name: 'Dr. Priya', color: '#14b8a6', av: 'P', text: 'Need volunteers with First Aid kits. Meet at the east gate.', time: '2m ago' },
      { name: 'Rahul', color: '#3b82f6', av: 'R', text: 'I have a kit, coming from Howrah. ETA 30 min.', time: '1m ago' },
      { name: 'Coordinator', color: '#f59e0b', av: 'C', text: 'Please confirm your arrival in this chat when you reach.', time: 'just now' },
    ]
  },
  {
    id: 2, icon: '🍱', urgent: false,
    tags: [{ t: 'ACTIVE', c: 'teal' }, { t: 'Food', c: 'amber' }, { t: 'Sundarbans', c: 'gray' }],
    title: 'Flood Relief Food Distribution',
    loc: '📍 Sundarbans Delta  ·  Ongoing now',
    needed: 15, joined: 9, color: 'amber',
    timeLeft: null,
    skills: ['Logistics', 'Driving', 'Cooking'],
    messages: [
      { name: 'Amit', color: '#f59e0b', av: 'A', text: 'We have 300 packets ready. Need 6 more people to distribute.', time: '5m ago' },
      { name: 'Meera', color: '#14b8a6', av: 'M', text: 'On my way, bringing 2 friends.', time: '3m ago' },
    ]
  },
  {
    id: 3, icon: '📚', urgent: false,
    tags: [{ t: 'OPEN', c: 'blue' }, { t: 'Education', c: 'blue' }, { t: 'Birbhum', c: 'gray' }],
    title: 'Emergency Teaching — No Teachers for 280 Students',
    loc: '📍 Birbhum District School  ·  Tomorrow 9AM',
    needed: 6, joined: 2, color: 'blue',
    timeLeft: 18 * 3600 + 30 * 60,
    skills: ['Teaching', 'Counseling'],
    messages: [
      { name: 'Principal Dey', color: '#3b82f6', av: 'D', text: 'Thank you everyone. Grades 4–6 need coverage most urgently.', time: '1h ago' },
    ]
  },
  {
    id: 4, icon: '🏗️', urgent: false,
    tags: [{ t: 'FULL', c: 'green' }, { t: 'Shelter', c: 'teal' }, { t: 'Jalpaiguri', c: 'gray' }],
    title: 'Temporary Shelter Construction — Flood Survivors',
    loc: '📍 Jalpaiguri Relief Camp  ·  Ongoing',
    needed: 12, joined: 12, color: 'green',
    timeLeft: null,
    skills: ['Construction', 'Logistics'],
    messages: [
      { name: 'Team Lead', color: '#22c55e', av: 'T', text: 'Mission squad complete! Thank you all. Starting at 8AM sharp.', time: '10m ago' },
      { name: 'Arjun', color: '#14b8a6', av: 'A', text: 'Ready. Bringing tools.', time: '8m ago' },
    ]
  },
]

const FAKE_USERS = ['Sourav', 'Tanisha', 'Meera', 'Arjun', 'Priya', 'Rahul', 'Dev', 'Sana']
const FAKE_MSGS = [
  'On my way! ETA 15 min 🏃', 'Bringing a first aid kit', 'Can someone share the exact location pin?',
  'I have a vehicle, can carpool 3 people', 'Already here, waiting at the entrance',
  'Confirming attendance ✓', 'I can bring supplies, what\'s needed most?',
]

const TAG_STYLES = {
  red:   'bg-red-500/10 text-red-400 border border-red-500/20',
  teal:  'bg-teal-500/10 text-teal-400 border border-teal-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  blue:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  green: 'bg-green-500/10 text-green-400 border border-green-500/20',
  gray:  'bg-slate-500/10 text-slate-400 border border-slate-700',
}

const FILL_STYLES = {
  red:   'from-red-500 to-orange-400',
  amber: 'from-amber-500 to-yellow-400',
  blue:  'from-blue-500 to-indigo-400',
  teal:  'from-teal-500 to-cyan-400',
  green: 'from-green-500 to-teal-400',
}

function fmtTime(secs) {
  if (!secs && secs !== 0) return null
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

export default function LiveMissions() {
  const [missions, setMissions] = useState(INITIAL_MISSIONS)
  const [openChat, setOpenChat] = useState(null)
  const [joined, setJoined]     = useState(new Set())
  const [toast, setToast]       = useState(null)
  const [inputs, setInputs]     = useState({})
  const chatRefs                = useRef({})

  // countdown
  useEffect(() => {
    const id = setInterval(() => {
      setMissions(ms => ms.map(m =>
        m.timeLeft > 0 ? { ...m, timeLeft: m.timeLeft - 1 } : m
      ))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // simulate live joins
  useEffect(() => {
    const id = setInterval(() => {
      setMissions(ms => {
        const available = ms.filter(m => m.joined < m.needed)
        if (!available.length) return ms
        const target = available[Math.floor(Math.random() * available.length)]
        const name   = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)]
        const msg    = FAKE_MSGS[Math.floor(Math.random() * FAKE_MSGS.length)]
        showToast('🙋', `${name} joined!`, `"${target.title.slice(0, 30)}…"`)
        return ms.map(m => m.id === target.id
          ? { ...m, joined: m.joined + 1, messages: [...m.messages, { name, color: '#3b82f6', av: name[0], text: msg, time: 'just now' }] }
          : m
        )
      })
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // scroll chat to bottom when messages update
  useEffect(() => {
    if (openChat && chatRefs.current[openChat]) {
      chatRefs.current[openChat].scrollTop = chatRefs.current[openChat].scrollHeight
    }
  }, [missions, openChat])

  const showToast = (icon, title, msg) => {
    setToast({ icon, title, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const handleJoin = (mId) => {
    if (joined.has(mId)) return
    setJoined(prev => new Set([...prev, mId]))
    setMissions(ms => ms.map(m => m.id === mId
      ? { ...m, joined: Math.min(m.joined + 1, m.needed),
          messages: [...m.messages, { name: 'You', color: '#14b8a6', av: 'Y', text: 'Just joined! Ready to help 🙋', time: 'just now' }] }
      : m
    ))
    const m = missions.find(x => x.id === mId)
    showToast('✅', 'Mission Joined!', `You're part of "${m?.title.slice(0, 28)}…"`)
  }

  const handleSend = (mId) => {
    const text = (inputs[mId] || '').trim()
    if (!text) return
    setMissions(ms => ms.map(m => m.id === mId
      ? { ...m, messages: [...m.messages, { name: 'You', color: '#14b8a6', av: 'Y', text, time: 'just now' }] }
      : m
    ))
    setInputs(i => ({ ...i, [mId]: '' }))
  }

  const totalJoined = missions.reduce((s, m) => s + m.joined, 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            ⚡ Live Missions
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time tasks that need volunteers right now</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Missions', value: missions.filter(m => m.joined < m.needed).length },
          { label: 'Volunteers Online', value: 38 + joined.size },
          { label: 'Joined Today',      value: 127 + joined.size },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-teal-400" style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mission cards */}
      {missions.map(m => {
        const pct      = Math.min(Math.round((m.joined / m.needed) * 100), 100)
        const isFull   = m.joined >= m.needed
        const isJoined = joined.has(m.id)
        const chatOpen = openChat === m.id
        const fillColor = isFull ? 'green' : m.color
        const displayed = Math.min(m.needed, 12)

        return (
          <div key={m.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden
              ${m.urgent ? 'border-red-500/40' : 'border-slate-800'}
              ${isFull   ? 'border-green-500/30' : ''}
              bg-slate-900 hover:border-slate-600`}
          >
            {/* Top accent line */}
            <div className={`h-0.5 w-full bg-gradient-to-r ${
              m.urgent ? 'from-red-500 to-transparent' :
              isFull   ? 'from-green-500 to-transparent' :
                         'from-teal-500 to-transparent'
            }`} />

            <div className="p-5">
              {/* Row 1 — icon + info + button */}
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0
                  ${m.urgent ? 'bg-red-500/10' : 'bg-slate-800'}`}>
                  {m.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {m.tags.map(tag => (
                      <span key={tag.t} className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${TAG_STYLES[tag.c]}`}>
                        {tag.t}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{m.loc}</p>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {isFull ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                      ✓ FULL
                    </span>
                  ) : isJoined ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      ✓ JOINED
                    </span>
                  ) : (
                    <button onClick={() => handleJoin(m.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
                        ${m.urgent
                          ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                          : 'bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/20'
                        }`}>
                      JOIN NOW
                    </button>
                  )}
                  {m.timeLeft > 0 && (
                    <span className="font-mono text-[10px] text-slate-500">⏱ {fmtTime(m.timeLeft)}</span>
                  )}
                  {m.timeLeft === null && <span className="text-[10px] text-slate-600">Ongoing</span>}
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">
                    {isFull ? '✅ Squad complete!' : `${m.needed - m.joined} volunteer${m.needed - m.joined !== 1 ? 's' : ''} needed NOW`}
                  </span>
                  <span className={`font-mono font-bold ${isFull ? 'text-green-400' : 'text-teal-400'}`}>
                    {m.joined}/{m.needed} joined
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${FILL_STYLES[fillColor]} transition-all duration-700`}
                    style={{ width: `${pct}%` }} />
                </div>

                {/* Slot indicators */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {Array.from({ length: displayed }).map((_, i) => (
                    <div key={i}
                      className={`w-5 h-5 rounded-md border transition-all duration-300 ${
                        i < m.joined
                          ? `border-transparent ${
                              fillColor === 'red'   ? 'bg-red-500/30' :
                              fillColor === 'amber' ? 'bg-amber-500/30' :
                              fillColor === 'blue'  ? 'bg-blue-500/30' :
                              fillColor === 'green' ? 'bg-green-500/30' :
                                                      'bg-teal-500/30'
                            }`
                          : 'border-slate-700 bg-transparent'
                      }`}
                    />
                  ))}
                  {m.needed > 12 && (
                    <span className="text-[10px] text-slate-600 self-center ml-1">+{m.needed - 12} more</span>
                  )}
                </div>
              </div>

              {/* Skills row + chat toggle */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {m.skills.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700">
                    {s}
                  </span>
                ))}
                <button onClick={() => setOpenChat(chatOpen ? null : m.id)}
                  className="ml-auto text-[11px] text-slate-500 hover:text-teal-400 transition-colors font-medium">
                  {chatOpen ? '▲ Hide chat' : '💬 Team chat & coordinate'}
                </button>
              </div>
            </div>

            {/* Chat panel */}
            {chatOpen && (
              <div className="border-t border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">💬 Mission Chat</span>
                  <span className="text-[10px] text-slate-600">{Math.floor(Math.random() * 5) + 3} online</span>
                </div>

                {/* Messages */}
                <div ref={el => chatRefs.current[m.id] = el}
                  className="h-40 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                  {m.messages.map((msg, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: msg.color + '22', color: msg.color }}>
                        {msg.av}
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold mb-0.5" style={{ color: msg.color }}>
                          {msg.name} <span className="text-slate-600 font-normal ml-1">{msg.time}</span>
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2 p-3 border-t border-slate-800">
                  <input
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-teal-500 transition-colors"
                    placeholder="Message the mission team…"
                    value={inputs[m.id] || ''}
                    onChange={e => setInputs(i => ({ ...i, [m.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSend(m.id)}
                  />
                  <button onClick={() => handleSend(m.id)}
                    className="w-8 h-8 bg-teal-500 hover:bg-teal-400 rounded-lg text-white text-sm flex items-center justify-center flex-shrink-0 transition-colors">
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-900 border border-teal-500/40 rounded-xl px-4 py-3 shadow-2xl max-w-xs animate-slide-up">
          <span className="text-lg flex-shrink-0">{toast.icon}</span>
          <div>
            <div className="text-sm font-bold text-white">{toast.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{toast.msg}</div>
          </div>
        </div>
      )}
    </div>
  )
}
