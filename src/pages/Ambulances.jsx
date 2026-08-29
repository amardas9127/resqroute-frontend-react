import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, X, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react'
import AmbulanceTable from '../components/AmbulanceTable'
import AmbulanceForm from '../components/AmbulanceForm'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'

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

// ─── Ambulances Page ───────────────────────────────────────────────────────────
const Ambulances = ({ hospital }) => {
  const [ambulances, setAmbulances] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAmbulance, setEditingAmbulance] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Toast state
  const [toasts, setToasts] = useState([])

  // Confirm modal state
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

  // ── Confirm helpers ──
  const askConfirm = ({ title, message, confirmLabel, confirmClass, onConfirm }) => {
    setConfirmState({ open: true, title, message, confirmLabel, confirmClass, onConfirm })
  }
  const closeConfirm = () => setConfirmState({ open: false })

  useEffect(() => {
    if (!hospital?.id) return

    const fetchAmbulances = async () => {
      try {
        const { data, error } = await supabase
          .from('ambulance')
          .select('*')
          .eq('hospital_id', hospital.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setAmbulances(data || [])
      } catch (err) {
        console.error('Error fetching ambulances:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAmbulances()
  }, [hospital])

  const handleDelete = (ambulance) => {
    // Guard: ambulance on duty — show info toast, no confirm needed
    if (ambulance.status === 'onduty' || ambulance.assigned_trip_id) {
      showToast('Cannot delete an ambulance that is currently on duty or has an active trip assigned.', 'error')
      return
    }

    askConfirm({
      title: 'Remove Ambulance',
      message: `Are you sure you want to remove ambulance "${ambulance.ambulance_id}"? This action cannot be undone.`,
      confirmLabel: 'Remove',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        closeConfirm()
        try {
          const { error } = await supabase
            .from('ambulance')
            .delete()
            .eq('id', ambulance.id)
            .eq('hospital_id', hospital.id)

          if (error) throw error
          setAmbulances(prev => prev.filter(a => a.id !== ambulance.id))
          showToast('Ambulance removed successfully.', 'success')
        } catch (err) {
          console.error('Error deleting ambulance:', err)
          showToast('Failed to delete ambulance. It might be linked to existing records.', 'error')
        }
      }
    })
  }

  const handleEdit = (ambulance) => {
    setEditingAmbulance(ambulance)
    setShowForm(true)
  }

  const handleFormSubmit = async (formData) => {
    setFormLoading(true)
    try {
      if (editingAmbulance) {
        // On edit: only re-hash the PIN if the user typed a new one
        const updatePayload = { ...formData }
        if (formData.pin && formData.pin.trim() !== '') {
          updatePayload.pin = await bcrypt.hash(formData.pin, 10)
        } else {
          // Keep the existing hash — don't overwrite with empty string
          delete updatePayload.pin
        }

        const { data, error } = await supabase
          .from('ambulance')
          .update(updatePayload)
          .eq('id', editingAmbulance.id)
          .eq('hospital_id', hospital.id)
          .select()

        if (error) throw error
        if (data && data.length > 0) {
          setAmbulances(ambulances.map(a => a.id === editingAmbulance.id ? data[0] : a))
        }
        showToast('Ambulance updated successfully.', 'success')
      } else {
        // On create: always hash the PIN
        const hashedPin = await bcrypt.hash(formData.pin, 10)

        const { data, error } = await supabase
          .from('ambulance')
          .insert([{ ...formData, pin: hashedPin, hospital_id: hospital.id }])
          .select()

        if (error) throw error
        if (data && data.length > 0) {
          setAmbulances([data[0], ...ambulances])
        }
        showToast('Ambulance added successfully.', 'success')
      }
      setShowForm(false)
      setEditingAmbulance(null)
    } catch (err) {
      console.error('Error saving ambulance:', err)
      showToast('Error saving ambulance. Please try again.', 'error')
    } finally {
      setFormLoading(false)
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingAmbulance(null)
  }

  return (
    <div className="space-y-6 relative">
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
          <h1 className="text-2xl font-bold text-slate-900">Ambulance Fleet</h1>
          <p className="text-slate-500 text-sm mt-1">Manage hospital ambulances and drivers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Ambulance
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by vehicle number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <AmbulanceTable
          ambulances={ambulances}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal Overlay for Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAmbulance ? 'Edit Ambulance' : 'Add New Ambulance'}
              </h2>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <AmbulanceForm
                initialData={editingAmbulance}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ambulances
