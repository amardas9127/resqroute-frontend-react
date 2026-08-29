import { Edit, Trash2, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react'
import { parseLocation } from '../lib/location'

const PatientTable = ({ patients, onEdit, onDelete, onAssign, onComplete, onCancelTrip, hideActions = false }) => {
  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
        <p className="text-slate-500">No patients found. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
            <th className="px-6 py-4">Name</th>
            <th className="px-6 py-4">Age</th>
            <th className="px-6 py-4">Address</th>
            <th className="px-6 py-4">Coordinates</th>
            <th className="px-6 py-4">Condition</th>
            <th className="px-6 py-4">Ambulance</th>
            <th className="px-6 py-4">Status</th>
            {!hideActions && <th className="px-6 py-4 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-sm">
          {patients.map((patient) => (
            <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-900">{patient.name}</td>
              <td className="px-6 py-4 text-slate-600">{patient.age}</td>
              <td className="px-6 py-4 text-slate-600 max-w-[220px]">
                {(() => {
                  const loc = parseLocation(patient.address)
                  return (
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-snug" title={loc.label}>
                        {loc.label || <span className="text-slate-400 italic">No address</span>}
                      </span>
                    </div>
                  )
                })()}
              </td>
              <td className="px-6 py-4 text-slate-500">
                {(() => {
                  const loc = parseLocation(patient.address)
                  return loc.lat != null ? (
                    <div className="flex flex-col gap-0.5 font-mono text-xs">
                      <span className="bg-slate-100 rounded px-1.5 py-0.5 text-slate-700">
                        {loc.lat.toFixed(5)}
                      </span>
                      <span className="bg-slate-100 rounded px-1.5 py-0.5 text-slate-700">
                        {loc.lon.toFixed(5)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">—</span>
                  )
                })()}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${patient.patient_condition === 'severe' ? 'bg-amber-100 text-amber-700' :
                  patient.patient_condition === 'dead' ? 'bg-slate-200 text-slate-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                  {patient.patient_condition || 'normal'}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs">
                {patient.ambulance_id ? (
                  <>
                    {/* <div className="font-medium text-blue-600">ID: {patient.ambulance_id.substring(0, 8)}</div> */}
                    <div>Ph: {patient.ambulance_ph}</div>
                  </>
                ) : 'Not assigned'}
              </td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${patient.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  patient.status === 'cancel' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                  {patient.status || 'assign'}
                </span>
              </td>
              {!hideActions && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 flex-wrap w-36">
                    {patient.status === 'assign' && !patient.ambulance_id && (
                      <button
                        onClick={() => onAssign && onAssign(patient)}
                        title="Assign Ambulance"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Truck size={16} />
                      </button>
                    )}
                    {patient.status === 'assign' && patient.ambulance_id && (
                      <>
                        <button
                          onClick={() => onComplete && onComplete(patient)}
                          title="Complete Trip"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => onCancelTrip && onCancelTrip(patient)}
                          title="Cancel Trip"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onEdit && onEdit(patient)}
                      title="Edit Patient"
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(patient.id)}
                      title="Delete Patient"
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PatientTable
