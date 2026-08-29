import { useState } from 'react'

const AmbulanceForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    ambulance_id: initialData?.ambulance_id || '',
    phone_no: initialData?.phone_no || '',
    pin: initialData?.pin || '',
    status: initialData?.status || 'idle',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ambulance ID / Vehicle Number</label>
          <input 
            type="text" 
            name="ambulance_id"
            value={formData.ambulance_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="KA 01 AB 1234"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Contact Phone Number</label>
          <input 
            type="tel" 
            name="phone_no"
            value={formData.phone_no}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Access PIN {initialData && <span className="text-slate-400 font-normal">(leave blank to keep current)</span>}
          </label>
          <input 
            type="password" 
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            required={!initialData}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={initialData ? 'Leave blank to keep current PIN' : '1234'}
            inputMode="numeric"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Current Status</label>
          <select 
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="idle">Idle</option>
            <option value="offline">Offline</option>
            {initialData && <option value="onduty">On Duty</option>}
            <option value="maintenance">Maintenance</option>
          </select>
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
          {loading ? 'Saving...' : 'Save Ambulance'}
        </button>
      </div>
    </form>
  )
}

export default AmbulanceForm
