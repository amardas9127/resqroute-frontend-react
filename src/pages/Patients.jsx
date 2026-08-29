import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, X, Truck, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react'
import PatientTable from '../components/PatientTable'
import PatientForm from '../components/PatientForm'
import { supabase } from '../lib/supabase'

// ─── Toast ────────────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
  error:   <XCircle     size={18} className="text-red-500    shrink-0" />,
  info:    <Info        size={18} className="text-blue-500   shrink-0" />,
}

const Toast = ({ toasts, dismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className="pointer-events-auto flex items-center gap-3 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-3 min-w-[280px] max-w-sm animate-[fadeInUp_.2s_ease]"
      >
        {TOAST_ICONS[t.type] ?? TOAST_ICONS.info}
        <span className="text-sm text-slate-700 flex-1">{t.message}</span>
        <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>
    ))}
  </div>
)

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, confirmLabel = 'Confirm', confirmClass = 'bg-red-600 hover:bg-red-700', onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 h-[100%]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 rounded-full p-2 shrink-0">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Patients Page ─────────────────────────────────────────────────────────────
const Patients = ({ hospital }) => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [patientToAssign, setPatientToAssign] = useState(null)
  const [availableAmbulances, setAvailableAmbulances] = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  // Edit Patient State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  // Toast State
  const [toasts, setToasts] = useState([])

  // Confirm Modal State
  const [confirmState, setConfirmState] = useState({ open: false })

  // ── Toast helpers ──
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Confirm helper ──
  const askConfirm = ({ title, message, confirmLabel, confirmClass, onConfirm }) => {
    setConfirmState({ open: true, title, message, confirmLabel, confirmClass, onConfirm })
  }
  const closeConfirm = () => setConfirmState({ open: false })

  useEffect(() => {
    if (!hospital?.id) return

    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patient')
          .select('*')
          .eq('hospital_id', hospital.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPatients(data || [])
      } catch (err) {
        console.error('Error fetching patients:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [hospital])

  const handleDelete = (id) => {
    askConfirm({
      title: 'Delete Patient',
      message: 'Are you sure you want to delete this patient? This action cannot be undone.',
      confirmLabel: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        closeConfirm()
        try {
          const { error } = await supabase
            .from('patient')
            .delete()
            .eq('id', id)
            .eq('hospital_id', hospital.id)

          if (error) throw error
          setPatients(prev => prev.filter(p => p.id !== id))
          showToast('Patient deleted successfully.', 'success')
        } catch (err) {
          console.error('Error deleting patient:', err)
          showToast('Failed to delete patient.', 'error')
        }
      }
    })
  }

  const handleEdit = (patient) => {
    setEditingPatient(patient)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (formData) => {
    setEditLoading(true)
    try {
      const { data, error } = await supabase
        .from('patient')
        .update(formData)
        .eq('id', editingPatient.id)
        .eq('hospital_id', hospital.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setPatients(patients.map(p => p.id === editingPatient.id ? data[0] : p))
      }
      setShowEditModal(false)
      setEditingPatient(null)
      showToast('Patient details updated successfully.', 'success')
    } catch (err) {
      console.error('Error updating patient:', err)
      showToast('Failed to update patient details.', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleComplete = (patient) => {
    askConfirm({
      title: 'Complete Trip',
      message: `Mark the trip for ${patient.name} as completed successfully?`,
      confirmLabel: 'Mark Complete',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
      onConfirm: async () => {
        closeConfirm()
        try {
          const { error } = await supabase.rpc('complete_trip', { p_patient_id: patient.id })
          if (error) throw error
          setPatients(patients.map(p => p.id === patient.id ? { ...p, status: 'success' } : p))
          showToast('Trip marked as completed.', 'success')
        } catch (err) {
          console.error('Error completing trip:', err)
          showToast('Failed to complete trip.', 'error')
        }
      }
    })
  }

  const handleCancelTrip = (patient) => {
    askConfirm({
      title: 'Cancel Trip',
      message: `Are you sure you want to cancel the trip for ${patient.name}?`,
      confirmLabel: 'Cancel Trip',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        closeConfirm()
        try {
          const { error } = await supabase.rpc('cancel_trip', { p_patient_id: patient.id })
          if (error) throw error
          setPatients(patients.map(p => p.id === patient.id ? { ...p, status: 'cancel' } : p))
          showToast('Trip cancelled.', 'info')
        } catch (err) {
          console.error('Error canceling trip:', err)
          showToast('Failed to cancel trip.', 'error')
        }
      }
    })
  }

  const handleAssign = async (patient) => {
    setPatientToAssign(patient)
    setAssignModalOpen(true)
    setModalLoading(true)

    try {
      const { data, error } = await supabase
        .from('ambulance')
        .select('*')
        .eq('hospital_id', hospital.id)
        .eq('status', 'idle')

      if (error) throw error
      setAvailableAmbulances(data || [])
    } catch (err) {
      console.error('Error fetching available ambulances:', err)
      showToast('Failed to load available ambulances.', 'error')
    } finally {
      setModalLoading(false)
    }
  }

  const confirmAssignment = async (ambulanceId, ambulancePhone) => {
    setModalLoading(true)
    try {
      const { error } = await supabase.rpc('assign_ambulance', {
        p_patient_id: patientToAssign.id,
        p_ambulance_id: ambulanceId
      })

      if (error) throw error

      setPatients(patients.map(p =>
        p.id === patientToAssign.id
          ? { ...p, ambulance_id: ambulanceId, ambulance_ph: ambulancePhone, status: 'assign' }
          : p
      ))

      setAssignModalOpen(false)
      setPatientToAssign(null)
      showToast('Ambulance successfully assigned!', 'success')
    } catch (err) {
      console.error('Error assigning ambulance:', err)
      showToast('Failed to assign ambulance. It might have been taken by another dispatcher.', 'error')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <Toast toasts={toasts} dismiss={dismissToast} />

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        confirmClass={confirmState.confirmClass}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all hospital patients</p>
        </div>
        <Link
          to="/add-patient"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Patient
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patients by name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 w-full sm:w-auto justify-center">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <PatientTable
          patients={patients}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onComplete={handleComplete}
          onCancelTrip={handleCancelTrip}
          onAssign={handleAssign}
        />
      )}

      {/* Assign Ambulance Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-blue-600" /> Assign Ambulance
              </h2>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-4">
                Select an available ambulance to assign to <strong>{patientToAssign?.name}</strong>.
              </p>

              {modalLoading && availableAmbulances.length === 0 ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
              ) : availableAmbulances.length === 0 ? (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-lg text-center border border-amber-100">
                  No idle ambulances available right now. Please free up an ambulance first.
                </div>
              ) : (
                <div className="space-y-3">
                  {availableAmbulances.map(amb => (
                    <div key={amb.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">{amb.ambulance_id}</div>
                      </div>
                      <button
                        disabled={modalLoading}
                        onClick={() => confirmAssignment(amb.id, amb.phone_no)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                Edit Patient Details
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPatient(null)
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <PatientForm
                initialData={editingPatient}
                onSubmit={handleEditSubmit}
                onCancel={() => {
                  setShowEditModal(false)
                  setEditingPatient(null)
                }}
                loading={editLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Patients
