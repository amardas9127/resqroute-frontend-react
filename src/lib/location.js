/**
 * Location field format: JSON string { label, lat, lon }
 * Stored in the `address` column of both `hospital` and `patient` tables.
 *
 * Legacy records may contain a plain-text address string — the parser
 * falls back gracefully so old data continues to work.
 */

/**
 * Parse the address column value into { label, lat, lon }.
 * @param {string|null} field - raw DB value
 * @returns {{ label: string, lat: number|null, lon: number|null }}
 */
export function parseLocation(field) {
  if (!field) return { label: '', lat: null, lon: null }
  try {
    const obj = JSON.parse(field)
    if (obj && typeof obj.label === 'string') {
      return { label: obj.label, lat: obj.lat ?? null, lon: obj.lon ?? null }
    }
  } catch {
    // Not JSON — treat as legacy plain-text address
  }
  return { label: field, lat: null, lon: null }
}

/**
 * Serialize a human-readable address + Leaflet marker position into the
 * JSON string that gets stored in the DB address column.
 * @param {string} label - display address from Nominatim reverse-geocode
 * @param {{ lat: number, lng: number }} markerPos - Leaflet LatLng object
 * @returns {string} JSON string
 */
export function serializeLocation(label, markerPos) {
  return JSON.stringify({
    label,
    lat: markerPos.lat,
    lon: markerPos.lng,
  })
}
