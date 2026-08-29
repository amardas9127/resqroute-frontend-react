import { Edit, Trash2 } from 'lucide-react'

const AmbulanceTable = ({ ambulances, onEdit, onDelete }) => {
  if (!ambulances || ambulances.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <p className="text-slate-500">No ambulances found. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
            <th className="px-6 py-4">Ambulance ID</th>
            <th className="px-6 py-4">Phone No</th>
            {/* <th className="px-6 py-4">PIN</th> */}
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Assigned Trip</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm">
          {ambulances.map((ambulance) => (
            <tr key={ambulance.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-900">{ambulance.ambulance_id}</td>
              <td className="px-6 py-4 text-slate-600">{ambulance.phone_no}</td>
              {/* <td className="px-6 py-4 text-slate-600 font-mono">{ambulance.pin}</td> */}
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ambulance.status === 'idle' ? 'bg-emerald-100 text-emerald-700' :
                    ambulance.status === 'onduty' ? 'bg-amber-100 text-amber-700' :
                      ambulance.status === 'maintenance' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                  }`}>
                  {ambulance.status === 'idle' ? 'Available' :
                    ambulance.status === 'onduty' ? 'Currently handling a patient' :
                      ambulance.status === 'offline' ? 'Not available' :
                        ambulance.status === 'maintenance' ? 'Under maintenance' : 'Not available'}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                {ambulance.assigned_trip_id ? ambulance.assigned_trip_id.substring(0, 8) + '...' : 'None'}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit && onEdit(ambulance)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(ambulance)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AmbulanceTable
