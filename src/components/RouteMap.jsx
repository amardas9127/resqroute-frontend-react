import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { analyzeRoutes } from '../lib/api.js'
import { getRoutes, buildPayload } from '../lib/routing.js'
import './RouteMap.css'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/bright' // flat street map style
const LEVEL_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' }
const LEVEL_LABELS = {
  LOW: 'Low traffic',
  MEDIUM: 'Medium traffic',
  HIGH: 'High traffic',
}
// Route line colors on the map: darkest = most recommended (index 0)
const RANK_COLORS = ['#1e3a8a', '#3b82f6', '#93c5fd']

export default function RouteMap({ initialSource = '', initialDestination = '' }) {
  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const selectedRef = useRef(null)

  const [source, setSource] = useState(initialSource)
  const [destination, setDestination] = useState(initialDestination)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [routeCards, setRouteCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [mapReady, setMapReady] = useState(false)

  // Ambulance Movement Simulation State
  const [isSimulating, setIsSimulating] = useState(false)
  const ambulanceMarkerRef = useRef(null)
  const simulationIntervalRef = useRef(null)

  // Simulation Controls State
  const [simHour, setSimHour] = useState(new Date().getHours())
  const [simRain, setSimRain] = useState('none')
  const [simDate, setSimDate] = useState(new Date().toISOString().slice(0, 10))
  const [simFestival, setSimFestival] = useState('auto')
  const [showSimOptions, setShowSimOptions] = useState(true)


  // ---- init map once ----
  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE_URL,
      center: [91.76, 26.18],
      zoom: 12,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.on('load', () => {
      setMapReady(true)
    })
    map.on('error', (e) => {
      console.warn('MapLibre warning:', e?.error?.message) // non-fatal
    })
    mapRef.current = map

    // Force resize after the container settles
    setTimeout(() => {
      map.resize()
    }, 200)

    return () => map.remove()
  }, [])

  function worstLevel(analysis) {
    const levels = (analysis?.segments || [])
      .map((s) => s.traffic?.level)
      .filter(Boolean)
    if (!levels.length) return null
    if (levels.includes('HIGH')) return 'HIGH'
    if (levels.includes('MEDIUM')) return 'MEDIUM'
    return 'LOW'
  }

  function drawRoutes(combined) {
    const map = mapRef.current
    if (!map) return

    document.querySelectorAll('.route-map-marker').forEach((el) => el.remove())
    try { map.removeLayer('route-lines') } catch (_) { }
    try { map.removeLayer('route-fill') } catch (_) { }
    try { map.removeSource('routes') } catch (_) { }

    const places = [
      { coords: combined[0]?._src, color: '#dc2626', emoji: '🏥', title: 'Hospital / Origin' },
      { coords: combined[0]?._dst, color: '#2563eb', emoji: '📍', title: 'Destination' },
    ]
    places.forEach((p) => {
      if (!p.coords) return
      const el = document.createElement('div')
      el.className = 'route-map-marker'
      el.style.background = p.color
      el.style.fontSize = '16px'
      el.title = p.title || ''
      el.textContent = p.emoji
      new maplibregl.Marker({ element: el }).setLngLat(p.coords).addTo(map)
    })


    const features = combined.map((r, i) => {
      const level = worstLevel(r.analysis) || 'LOW'
      const rankColor = RANK_COLORS[i] || RANK_COLORS[RANK_COLORS.length - 1]
      return {
        type: 'Feature',
        properties: { route_id: r.route_id, level, color: rankColor },
        geometry: r.geometry,
      }
    })
    map.addSource('routes', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    })
    map.addLayer({
      id: 'route-fill',
      type: 'line',
      source: 'routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 10, 'line-opacity': 0.25 },
    })
    map.addLayer({
      id: 'route-lines',
      type: 'line',
      source: 'routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['case', ['==', ['get', 'route_id'], selectedRef.current], 7, 3.5],
      },
    })

    map.on('click', 'route-lines', (e) => {
      if (!e.features?.length) return
      const f = e.features[0]
      const route = combined.find((r) => r.route_id === f.properties.route_id)
      if (!route) return
      setSelected(route.route_id)
      selectedRef.current = route.route_id
      map.setPaintProperty('route-lines', 'line-width', [
        'case', ['==', ['get', 'route_id'], selectedRef.current], 7, 3.5,
      ])
      new maplibregl.Popup({ offset: 12 })
        .setLngLat(e.lngLat)
        .setHTML(
          `<strong>${route.route_id}</strong><br/>` +
          `${(route.distanceKm || 0).toFixed(1)} km · ` +
          `${Math.round(route.durationMin || 0)} min · ` +
          `<span style="color:${LEVEL_COLORS[f.properties.level]}">` +
          `${LEVEL_LABELS[f.properties.level]}</span>` +
          `<p style="width:240px; color: black; font-size: 12px;">${route.analysis?.llm_analysis || ''}</p>`,
        )
        .addTo(map)
    })

    // Ensure cursor changes to pointer on hover
    map.on('mouseenter', 'route-lines', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'route-lines', () => {
      map.getCanvas().style.cursor = '';
    });
  }

  async function searchFor(srcVal, dstVal) {
    if (!srcVal.trim() || !dstVal.trim()) return
    setLoading(true)
    setError('')
    setRouteCards([])
    setSelected(null)
    selectedRef.current = null
    try {
      const { source: src, destination: dst, routes } = await getRoutes(
        srcVal.trim(), dstVal.trim(),
      )
      const payload = buildPayload(routes, src, dst, {
        startHour: parseInt(simHour, 10),
        date: simDate,
        rainIntensity: simRain,
        festivalOverride: simFestival,
      })
      const backend = await analyzeRoutes(payload)

      const combined = routes.map((raw, i) => ({
        ...raw,
        route_id: payload[i].route_id,
        _src: [src.lon, src.lat],
        _dst: [dst.lon, dst.lat],
        analysis: backend.routes?.[i],
        distanceKm: raw.distance / 1000,
        durationMin: raw.duration / 60,
      }))
      setRouteCards(combined)
      if (combined[0]) {
        setSelected(combined[0].route_id)
        selectedRef.current = combined[0].route_id
      }

      // We might need to wait for map to be ready
      if (mapRef.current && mapRef.current.isStyleLoaded()) {
        drawRoutes(combined)
      } else {
        mapRef.current.once('styledata', () => drawRoutes(combined))
      }

      const map = mapRef.current
      if (map && combined[0]?.geometry?.coordinates?.length) {
        const coords = combined[0].geometry.coordinates
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0]),
        )
        map.fitBounds(bounds, { padding: 60 })
      }
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  function startAmbulanceSimulation() {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
    }

    const currentRoute = routeCards.find((r) => r.route_id === selected)
    if (!currentRoute || !currentRoute.geometry || !currentRoute.geometry.coordinates) {
      alert('Please search and select a route first!')
      return
    }

    const coords = currentRoute.geometry.coordinates
    if (coords.length === 0) return

    setIsSimulating(true)

    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.remove()
    }

    const el = document.createElement('div')
    el.className = 'route-map-marker ambulance-sim-marker animate-pulse'
    el.style.background = '#e11d48'
    el.style.color = '#ffffff'
    el.style.fontSize = '18px'
    el.style.zIndex = '99'
    el.textContent = '🚑'

    const map = mapRef.current
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(coords[0])
      .addTo(map)

    ambulanceMarkerRef.current = marker
    map.panTo(coords[0], { duration: 300 })

    let step = 0
    const interval = setInterval(() => {
      step += 1
      if (step >= coords.length) {
        clearInterval(interval)
        setIsSimulating(false)
        alert('Ambulance has reached the destination!')
        return
      }

      const nextPos = coords[step]
      marker.setLngLat(nextPos)
      map.panTo(nextPos, { duration: 150 })
    }, 150)

    simulationIntervalRef.current = interval
  }

  function stopAmbulanceSimulation() {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current)
      simulationIntervalRef.current = null
    }
    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.remove()
      ambulanceMarkerRef.current = null
    }
    setIsSimulating(false)
  }

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current)
      if (ambulanceMarkerRef.current) ambulanceMarkerRef.current.remove()
    }
  }, [])

  function handleSearch() {
    stopAmbulanceSimulation()
    searchFor(source, destination)
  }

  // Auto-search if props change and map is ready
  useEffect(() => {
    if (initialSource && initialDestination && mapReady) {
      setSource(initialSource)
      setDestination(initialDestination)
      searchFor(initialSource, initialDestination)
    }
  }, [initialSource, initialDestination, mapReady])


  useEffect(() => {
    selectedRef.current = selected
    const map = mapRef.current
    if (map && map.getLayer('route-lines')) {
      map.setPaintProperty('route-lines', 'line-width', [
        'case', ['==', ['get', 'route_id'], selectedRef.current], 7, 3.5,
      ])
    }
  }, [selected])

  function getRecommendedRouteId(cards) {
    if (!cards || cards.length <= 1) return null
    // 1. Check for flood hazard warnings
    const hasFlood = (r) => {
      const note = r.analysis?.llm_analysis || ''
      return note.includes('Flood Hazard Alert') ||
        (r.analysis?.segments || []).some(s => s.flood_risk_note?.includes('HIGH risk of waterlogging'))
    }

    const nonFlooding = cards.filter(r => !hasFlood(r))
    const candidates = nonFlooding.length > 0 ? nonFlooding : cards

    // 2. Score by traffic level (LOW=1, MEDIUM=2, HIGH=3) then distance
    const scoreTraffic = (r) => {
      const lvl = worstLevel(r.analysis)
      return lvl === 'LOW' ? 1 : lvl === 'MEDIUM' ? 2 : 3
    }

    const sorted = [...candidates].sort((a, b) => {
      const diff = scoreTraffic(a) - scoreTraffic(b)
      if (diff !== 0) return diff
      return (a.distanceKm || 0) - (b.distanceKm || 0)
    })

    return sorted[0]?.route_id
  }

  const recommendedRouteId = getRecommendedRouteId(routeCards)

  return (
    <div className="route-map-app text-left flex-1 w-full h-full">
      <div className="route-map-body">
        <aside className="route-map-sidebar">
          <label>From</label>
          <input value={source} readOnly onChange={(e) => setSource(e.target.value)} placeholder="e.g. Narengi" />
          <label>To</label>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Chandmari" />

          {/* Simulation Controls Box */}
          <div className="route-map-sim-box">
            <div className="route-map-sim-header" onClick={() => setShowSimOptions(!showSimOptions)}>
              <span>⚡ Simulation Parameters</span>
              <span className="route-map-sim-toggle">{showSimOptions ? '▲' : '▼'}</span>
            </div>

            {showSimOptions && (
              <div className="route-map-sim-grid">
                <div>
                  <label>Departure Hour</label>
                  <select value={simHour} onChange={(e) => setSimHour(e.target.value)}>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {h.toString().padStart(2, '0')}:00 {h >= 12 ? 'PM' : 'AM'} {h === 9 ? '(Morning Rush)' : h === 13 ? '(School Rush)' : h === 18 ? '(Evening Peak)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Weather / Rain</label>
                  <select value={simRain} onChange={(e) => setSimRain(e.target.value)}>
                    <option value="none">☀️ Clear / Dry</option>
                    <option value="light">🌦️ Light Rain</option>
                    <option value="moderate">🌧️ Moderate Rain</option>
                    <option value="heavy">⛈️ Heavy Downpour</option>
                  </select>
                </div>

                <div>
                  <label>Date</label>
                  <input type="date" value={simDate} onChange={(e) => setSimDate(e.target.value)} />
                </div>

                <div>
                  <label>Event / Festival</label>
                  <select value={simFestival} onChange={(e) => setSimFestival(e.target.value)}>
                    <option value="auto">Automatic (By Date)</option>
                    <option value="none">No Festival</option>
                    <option value="Rongali Bihu">🎉 Rongali Bihu</option>
                    <option value="Ambubachi Mela (Kamakhya)">🛕 Ambubachi Mela</option>
                    <option value="Holi">🎨 Holi</option>
                    <option value="Republic Day VIP movement">🎖️ Republic Day VIP</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Analyzing…' : 'Search & Analyze'}
          </button>
          {routeCards.length > 0 && (
            <button
              onClick={isSimulating ? stopAmbulanceSimulation : startAmbulanceSimulation}
              style={{
                marginTop: '10px',
                background: isSimulating ? '#dc2626' : '#16a34a',
                color: 'white',
              }}
            >
              {isSimulating ? '⏹️ Stop Simulation' : '🚑 Start Dispatch Simulation'}
            </button>
          )}
          {error && <p className="route-map-error">{error}</p>}



          {routeCards.length === 0 && !loading && (
            <p className="route-map-hint">
              No route searched yet. Enter two places and press “Search & Analyze”.
            </p>
          )}

          {routeCards.map((r) => {
            const level = worstLevel(r.analysis)
            const isRecommended = r.route_id === recommendedRouteId

            return (
              <div
                key={r.route_id}
                className={`route-map-card ${selected === r.route_id ? 'active' : ''}`}
                onClick={() => setSelected(r.route_id)}
              >
                <h3>
                  <span className="route-map-dot" style={{ background: LEVEL_COLORS[level] }} />
                  {r.route_id}
                  {isRecommended && (
                    <span style={{ fontSize: '0.7em', padding: '2px 6px', background: '#22c55e', color: 'white', borderRadius: '4px', marginLeft: '8px' }}>
                      ⭐ Recommended
                    </span>
                  )}
                  <span className="route-map-meta">
                    {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
                  </span>
                </h3>

                <div className="route-map-traffic">
                  {(r.analysis?.segments || []).map((s, idx) => (
                    <span key={idx} className="route-map-chip"
                      style={{ background: LEVEL_COLORS[s.traffic?.level] || '#94a3b8' }}>
                      {s.road_name}
                    </span>
                  ))}
                </div>
                {r.analysis?.event?.event_found ? (
                  <p className="route-map-event">
                    🎉 {r.analysis.event.event_name} — impact{' '}
                    <b>{r.analysis.event.expected_impact}</b>
                  </p>
                ) : (
                  <p className="route-map-event route-map-muted">No festival/event today.</p>
                )}
                {r.analysis?.weather?.available === false ? (
                  <p className="route-map-weather route-map-muted">
                    Weather: unavailable ({r.analysis.weather.error || 'no coordinates'})
                  </p>
                ) : (
                  <p className="route-map-weather">
                    🌦 {r.analysis?.weather?.condition} ({r.analysis?.weather?.temperature_c}°C) ·
                    impact <b>{r.analysis?.weather?.impact}</b>
                  </p>
                )}
                <p className="route-map-llm">{r.analysis?.llm_analysis || ''}</p>
              </div>
            )
          })}
        </aside>

        <div className="route-map-map" ref={mapContainer} />
      </div>
    </div>
  )
}
