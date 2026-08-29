import { useState } from 'react'
import MapPickerModal from './MapPickerModal'
import { serializeLocation, parseLocation } from '../lib/location'

const PatientForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    age: initialData?.age || '',
    address: initialData?.address || '',
    patient_condition: initialData?.patient_condition || 'normal'
  })
  const [showMap, setShowMap] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMapConfirm = (address, markerPos) => {
    setFormData(prev => ({ ...prev, address: serializeLocation(address, markerPos) }))
    setShowMap(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Patient Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="35"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Patient Condition</label>
            <select
              name="patient_condition"
              value={formData.patient_condition}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="severe">Severe</option>
              <option value="dead">Critical</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Address</label>
          <div className="relative">
            <textarea
              name="address"
              value={parseLocation(formData.address).label}
              onClick={() => setShowMap(true)}
              readOnly
              required
              rows="2"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors placeholder:text-slate-400"
              placeholder="Click to pick location on map..."
            ></textarea>
            {formData.address && (
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="absolute right-3 bottom-3 text-blue-500 hover:text-blue-700 text-xs font-medium"
              >
                Change
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save Patient'}
          </button>
        </div>
      </form>

      {/* Map Picker Modal */}
      {showMap && (
        <MapPickerModal
          onClose={() => setShowMap(false)}
          onConfirm={handleMapConfirm}
          initialAddress={parseLocation(formData.address).label}
        />
      )}
    </>
  )
}

export default PatientForm
