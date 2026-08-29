import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Search, X, MapPin, CheckCircle, Loader2 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet marker icon (webpack/vite asset issue)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom blue pin icon
const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Component that handles click-to-place marker
const ClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng)
    },
  })
  return null
}

// Component that flies the map to a new center when search result changes
const FlyToLocation = ({ position }) => {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { animate: true, duration: 1.2 })
    }
  }, [position, map])
  return null
}

// Reverse geocode lat/lng → human-readable address via Nominatim
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

// Forward geocode search query → list of results via Nominatim bounded to Guwahati
const searchLocation = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&viewbox=91.55,26.25,91.90,26.05&bounded=1&limit=5`,
    { headers: { 'Accept-Language': 'en' } }
  )
  return await res.json()
}

// ─── Main Modal ─────────────────────────────────────────────────────────────
const MapPickerModal = ({ onClose, onConfirm, initialAddress }) => {
  const DEFAULT_CENTER = [26.1445, 91.7362] // Guwahati center
  const DEFAULT_ZOOM = 13

  const [markerPos, setMarkerPos] = useState(null)
  const [displayAddress, setDisplayAddress] = useState('')
  const [reverseLoading, setReverseLoading] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [flyTarget, setFlyTarget] = useState(null)

  const searchDebounce = useRef(null)

  // When user clicks the map
  const handleMapClick = useCallback(async (latlng) => {
    setMarkerPos(latlng)
    setReverseLoading(true)
    const addr = await reverseGeocode(latlng.lat, latlng.lng)
    setDisplayAddress(addr)
    setReverseLoading(false)
    setSearchResults([])
  }, [])

  // When user types in search box
  const handleSearchInput = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    clearTimeout(searchDebounce.current)
    if (val.trim().length < 2) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchLocation(val)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 450)
  }

  // When user picks a search result
  const handleResultSelect = async (result) => {
    const pos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    setMarkerPos(pos)
    setFlyTarget([pos.lat, pos.lng])
    setDisplayAddress(result.display_name)
    setSearchQuery(result.display_name)
    setSearchResults([])
  }

  const handleConfirm = () => {
    if (!markerPos) return
    onConfirm(displayAddress, markerPos)
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)' }}>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            <h2 className="font-bold text-slate-800 text-base">Pick Hospital Location</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors rounded-lg p-1 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pt-3 pb-2 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {searchLoading
                ? <Loader2 size={17} className="animate-spin" />
                : <Search size={17} />
              }
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search city, area, or address..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              autoComplete="off"
            />
          </div>

          {/* Dropdown results */}
          {searchResults.length > 0 && (
            <ul className="absolute left-4 right-4 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[10000] overflow-hidden max-h-52 overflow-y-auto">
              {searchResults.map((r) => (
                <li key={r.place_id}>
                  <button
                    onClick={() => handleResultSelect(r)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-start gap-2 transition-colors"
                  >
                    <MapPin size={14} className="shrink-0 mt-0.5 text-blue-400" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: '340px' }}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%', minHeight: '340px' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onMapClick={handleMapClick} />
            {flyTarget && <FlyToLocation position={flyTarget} />}
            {markerPos && (
              <Marker
                position={markerPos}
                icon={pinIcon}
                draggable={true}
                eventHandlers={{
                  dragend: async (e) => {
                    const pos = e.target.getLatLng()
                    setMarkerPos(pos)
                    setReverseLoading(true)
                    const addr = await reverseGeocode(pos.lat, pos.lng)
                    setDisplayAddress(addr)
                    setReverseLoading(false)
                  }
                }}
              />
            )}
          </MapContainer>

          {/* Hint overlay */}
          {!markerPos && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="bg-slate-900/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2 shadow-lg">
                <MapPin size={13} />
                Click anywhere on the map to drop a pin
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
          {/* Selected address preview */}
          <div className="mb-3 min-h-[40px]">
            {reverseLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Getting address...
              </div>
            ) : markerPos ? (
              <div className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-snug line-clamp-2">{displayAddress}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No location selected yet</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!markerPos || reverseLoading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MapPin size={15} />
              Use This Location
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapPickerModal
