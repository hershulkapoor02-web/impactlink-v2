/**
 * MapPicker.jsx — MapLibre GL JS location picker
 *
 * THE FIX: geolocation is requested before the map initialises.
 * The map waits for the GPS result (or timeout), then opens directly
 * at the user's real position — no Kolkata-first flash.
 */

import { useEffect, useRef, useState } from 'react'

const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
const MAPLIBRE_JS  = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
const TILE_STYLE   = 'https://tiles.openfreemap.org/styles/liberty'

const DEFAULT_LAT  = 22.5726   // Kolkata fallback (only if GPS denied/unavailable)
const DEFAULT_LNG  = 88.3639

let mlPromise = null
function loadML() {
  if (mlPromise) return mlPromise
  mlPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'; link.href = MAPLIBRE_CSS
      document.head.appendChild(link)
    }
    if (window.maplibregl) { resolve(window.maplibregl); return }
    const s = document.createElement('script')
    s.src = MAPLIBRE_JS
    s.onload  = () => resolve(window.maplibregl)
    s.onerror = reject
    document.head.appendChild(s)
  })
  return mlPromise
}

// Request geolocation once, cache the result so multiple MapPicker
// instances on one page don't each trigger a permission prompt.
let geoCache = null          // { lat, lng } | 'denied' | null
let geoPending = null        // Promise while in-flight

function requestGeo() {
  if (geoCache !== null) return Promise.resolve(geoCache)
  if (geoPending) return geoPending
  geoPending = new Promise(resolve => {
    if (!navigator.geolocation) { geoCache = 'denied'; resolve('denied'); return }
    navigator.geolocation.getCurrentPosition(
      pos => {
        geoCache = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        geoPending = null
        resolve(geoCache)
      },
      () => {
        geoCache = 'denied'
        geoPending = null
        resolve('denied')
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    )
  })
  return geoPending
}

export default function MapPicker({ coords, onChange, height = 220, readOnly = false }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)
  const resizeRef    = useRef(null)
  const iconRef      = useRef(null)   // cached ML instance for marker creation

  const [status,   setStatus]   = useState('loading')
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')

  /* ── Init: get GPS first, then open map at real position ─────────────── */
  useEffect(() => {
    if (mapRef.current) return
    let cancelled = false

    async function init() {
      // Step 1 — load MapLibre JS/CSS
      const ml = await loadML().catch(() => null)
      if (!ml || cancelled || !containerRef.current) return

      // Step 2 — decide initial centre:
      //   a) use saved coords if the user already has them
      //   b) request geolocation (non-blocking: if user denies, fall back to Kolkata)
      let initLat, initLng, initZoom

      if (coords?.lat) {
        initLat = coords.lat; initLng = coords.lng; initZoom = 14
      } else if (!readOnly) {
        // Pre-request GPS so the map can open at the real position
        const geo = await requestGeo()
        if (geo !== 'denied') {
          initLat = geo.lat; initLng = geo.lng; initZoom = 14
          // Also surface this to the parent right away
          reverseGeocode(geo.lat, geo.lng, onChange)
        } else {
          initLat = DEFAULT_LAT; initLng = DEFAULT_LNG; initZoom = 12
        }
      } else {
        initLat = DEFAULT_LAT; initLng = DEFAULT_LNG; initZoom = 12
      }

      if (cancelled || !containerRef.current) return

      // Step 3 — create map at the correct position
      const map = new ml.Map({
        container: containerRef.current,
        style: TILE_STYLE,
        center: [initLng, initLat],
        zoom: initZoom,
        attributionControl: false,
        dragRotate: false,
        touchPitch: false,
      })

      map.on('load', () => {
        if (cancelled) return
        setStatus('ready')

        // Place marker if we have a position
        const markerLat = coords?.lat ?? (initLat !== DEFAULT_LAT ? initLat : null)
        const markerLng = coords?.lng ?? (initLng !== DEFAULT_LNG ? initLng : null)
        if (markerLat) {
          markerRef.current = addMarker(ml, map, markerLat, markerLng, readOnly, onChange)
          iconRef.current = ml
        }

        if (!readOnly) {
          map.on('click', e => {
            const { lat, lng } = e.lngLat
            if (markerRef.current) markerRef.current.setLngLat([lng, lat])
            else { markerRef.current = addMarker(ml, map, lat, lng, false, onChange); iconRef.current = ml }
            reverseGeocode(lat, lng, onChange)
          })
        }
      })

      map.on('error', () => setStatus('error'))
      mapRef.current = map
      iconRef.current = ml

      resizeRef.current = new ResizeObserver(() => mapRef.current?.resize())
      resizeRef.current.observe(containerRef.current)
    }

    init()

    return () => {
      cancelled = true
      resizeRef.current?.disconnect()
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
      markerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sync marker when parent updates coords externally ───────────────── */
  useEffect(() => {
    if (!mapRef.current || !coords?.lat) return
    const apply = () => {
      if (markerRef.current) {
        markerRef.current.setLngLat([coords.lng, coords.lat])
      } else if (iconRef.current) {
        markerRef.current = addMarker(iconRef.current, mapRef.current, coords.lat, coords.lng, readOnly, onChange)
      }
      mapRef.current.easeTo({ center: [coords.lng, coords.lat], zoom: 14, duration: 600 })
    }
    mapRef.current.loaded() ? apply() : mapRef.current.once('load', apply)
  }, [coords?.lat, coords?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Manual "Use my location" button ────────────────────────────────── */
  const autoDetect = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return }
    setLocating(true); setGeoError('')
    // Reset cache so we get a fresh reading
    geoCache = null; geoPending = null

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        geoCache = { lat, lng }

        if (mapRef.current) {
          mapRef.current.easeTo({ center: [lng, lat], zoom: 15, duration: 800 })
          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat])
          } else if (iconRef.current) {
            markerRef.current = addMarker(iconRef.current, mapRef.current, lat, lng, false, onChange)
          }
        }
        reverseGeocode(lat, lng, onChange)
        setLocating(false)
      },
      err => {
        setLocating(false)
        if (err.code === 1) setGeoError('Permission denied — allow location in browser settings')
        else if (err.code === 2) setGeoError('Position unavailable — pin manually')
        else setGeoError('Timed out — pin manually')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-2">
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', height }}>
        {status === 'loading' && (
          <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'var(--bg-elevated)', gap:8 }}>
            <span className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" style={{ opacity:0.6 }} />
            <span className="text-xs" style={{ color:'var(--text-muted)', opacity:0.6 }}>Finding your location…</span>
          </div>
        )}
        {status === 'error' && (
          <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'var(--bg-elevated)', gap:8 }}>
            <span style={{ fontSize:28 }}>🗺️</span>
            <span className="text-sm" style={{ color:'var(--text-muted)' }}>Map failed to load</span>
          </div>
        )}
        <div ref={containerRef} style={{ width:'100%', height:'100%' }} />
        {status === 'ready' && !readOnly && !coords?.lat && (
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.55)', color:'#fff', borderRadius:99, padding:'4px 12px', fontSize:11, pointerEvents:'none', whiteSpace:'nowrap', zIndex:5 }}>
            Tap map to pin · or use button below
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={autoDetect} disabled={locating}
            className="btn btn-secondary btn-sm flex items-center gap-1.5">
            {locating
              ? <span className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              : <span>📍</span>}
            {locating ? 'Requesting location…' : 'Use my location'}
          </button>
          {coords?.lat && (
            <span className="text-xs font-mono" style={{ color:'var(--text-muted)' }}>
              {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
              {coords.city ? ` · ${coords.city}` : ''}
            </span>
          )}
          {geoError && <span className="text-xs text-red-500">{geoError}</span>}
        </div>
      )}

      {readOnly && coords?.lat && (
        <p className="text-xs font-mono" style={{ color:'var(--text-muted)' }}>
          {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
          {coords.city ? ` · ${coords.city}` : ''}
        </p>
      )}
    </div>
  )
}

function addMarker(ml, map, lat, lng, readOnly, onChange) {
  const el = document.createElement('div')
  el.innerHTML = `<svg width="28" height="34" viewBox="0 0 28 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <filter id="ms"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#00000040"/></filter>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 20 14 20S28 23.33 28 14C28 6.27 21.73 0 14 0z" fill="#14b8a6" filter="url(#ms)"/>
    <circle cx="14" cy="14" r="6" fill="white"/>
  </svg>`
  el.style.cssText = 'cursor:pointer;width:28px;height:34px;'

  const marker = new ml.Marker({ element: el, draggable: !readOnly, anchor: 'bottom' })
    .setLngLat([lng, lat])
    .addTo(map)

  if (!readOnly) {
    marker.on('dragend', () => {
      const { lat: la, lng: lo } = marker.getLngLat()
      reverseGeocode(la, lo, onChange)
    })
  }
  return marker
}

async function reverseGeocode(lat, lng, callback) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const city    = data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
    const state   = data.address?.state || ''
    const country = data.address?.country || ''
    callback({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)), city, state, country })
  } catch {
    callback({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)), city:'', state:'', country:'' })
  }
}
