// Routing + geocoding (free): Nominatim (geocode) + OpenRouteService (routes).
// ORS provides reliable alternative routes via its alternative_routes config.
// Also converts an ORS route (segments[].steps[].name) into the "segments"
// format our backend expects (road_name + hour per road).

// Defensive env access: works both inside Vite (import.meta.env) and in
// plain Node for testing.
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}

const NOMINATIM_URL =
  env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search'

// OpenRouteService – free tier: 40 req/min, 2000 req/day
// Sign up at https://openrouteservice.org/dev/#/signup for a free API key
const ORS_URL =
  env.VITE_ORS_URL ||
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson'
const ORS_KEY = env.VITE_ORS_KEY || ''

// Nominatim's policy requires a proper User-Agent identifying the app.
// (Browsers ignore this header for fetch and send their own, which is fine.)
const HEADERS = {
  Accept: 'application/json,text/plain,*/*',
  'User-Agent': 'AmbulanceRouteIntelligence/0.1 (hackathon demo)',
}

// Strictly prefer real neighbourhood/city places over random POIs
// (schools, shops, etc.) that can match a search inside Guwahati.
const PREFERRED_PLACE_TYPES = [
  'city', 'town', 'village', 'suburb', 'borough',
  'municipality', 'state_district', 'county',
]

/** Turn a place name ("Narengi") into coordinates via Nominatim. */
export async function geocode(place) {
  const query = place
  const params = new URLSearchParams({
    format: 'json',
    limit: '5',
    countrycodes: 'in',
    // viewbox keeps results inside greater Guwahati (west,north,east,south)
    viewbox: '91.50,26.32,91.98,26.02',
    bounded: '1',
    q: query,
  })
  const url = `${NOMINATIM_URL}?${params.toString()}`
  const response = await fetch(url, { headers: HEADERS })
  if (!response.ok) throw new Error(`Geocoding failed for "${place}"`)
  const results = await response.json()
  if (!results || !results.length) {
    throw new Error(
      `Could not find "${place}". Try adding a city (e.g. "Narengi, Guwahati").`,
    )
  }
  const best =
    results.find((r) => PREFERRED_PLACE_TYPES.includes(r.addresstype)) ||
    results[0]
  return {
    lat: parseFloat(best.lat),
    lon: parseFloat(best.lon),
    label: best.display_name,
  }
}

/** Get 1-3 route alternatives between two places via OpenRouteService. */
export async function getRoutes(source, destination) {
  const from = await geocode(source)
  const to = await geocode(destination)

  if (!ORS_KEY) {
    throw new Error(
      'Missing ORS API key. Add VITE_ORS_KEY to your .env file. ' +
      'Get a free key at https://openrouteservice.org/dev/#/signup',
    )
  }

  const body = {
    coordinates: [
      [from.lon, from.lat],
      [to.lon, to.lat],
    ],
    alternative_routes: {
      target_count: 3,   // request up to 3 routes
      share_factor: 0.6, // alternatives must differ by ≥40% of segments
      weight_factor: 1.6, // alternatives can be up to 1.6× the optimal duration
    },
  }

  const response = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ORS_KEY,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    throw new Error(
      errBody?.error?.message ||
      `Routing failed (${response.status}). Check your ORS API key.`,
    )
  }

  const data = await response.json()
  if (!data.features || !data.features.length) {
    throw new Error('No route found between those places')
  }

  // Transform ORS GeoJSON features into the shape App.jsx expects:
  //   { geometry, distance (metres), duration (seconds), segments[].steps[] }
  const allRoutes = data.features.map((f) => ({
    geometry: f.geometry,
    distance: f.properties.summary.distance,
    duration: f.properties.summary.duration,
    segments: f.properties.segments, // ORS segments containing steps
  }))

  // Deduplicate: ORS can return routes that traverse the exact same roads
  // but differ by a trivial junction or geometry (e.g. 7.8 km vs 7.9 km).
  // Fingerprint by the ordered sequence of unique road names — if two routes
  // use the same roads in the same order, only keep the first (shorter) one.
  const seen = new Set()
  const routes = allRoutes.filter((r) => {
    // Extract ordered road names from the route's steps, dedup consecutive
    const roads = []
    for (const seg of r.segments || []) {
      for (const step of seg.steps || []) {
        const name = step.name
        if (name && name !== '-' && roads[roads.length - 1] !== name) {
          roads.push(name)
        }
      }
    }
    const key = roads.join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { source: from, destination: to, routes }
}

/**
 * Merge an ORS route's steps into per-road segments with arrival hours.
 * ORS format: route.segments[].steps[].name
 */
export function buildSegments(route, startHour) {
  const merged = []
  let last = null
  for (const segment of route.segments || []) {
    for (const step of segment.steps || []) {
      const road = step.name
      if (!road || road === '-') continue // skip unnamed stretches
      if (last && last.road === road) {
        last.duration += step.duration || 0
      } else {
        last = { road, duration: step.duration || 0 }
        merged.push(last)
      }
    }
  }

  let cumulativeSeconds = 0
  return merged
    .filter((s) => s.duration > 1)
    .map((s) => {
      const hour = (startHour + Math.floor(cumulativeSeconds / 3600)) % 24
      cumulativeSeconds += s.duration
      return { road_name: s.road, hour }
    })
}

/** Build the exact payload our backend's /analyze-routes expects. */
export function buildPayload(routes, source, destination) {
  const startHour = new Date().getHours()
  return routes.map((route, i) => ({
    route_id: `route_${String.fromCharCode(65 + i)}`, // A, B, C...
    segments: buildSegments(route, startHour),
    date: new Date().toISOString().slice(0, 10),
    latitude: source.lat, // weather is sampled near the trip origin
    longitude: source.lon,
  }))
}
