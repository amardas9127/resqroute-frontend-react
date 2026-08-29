import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PatientForm from '../components/PatientForm'
import { supabase } from '../lib/supabase'

const AddPatient = ({ hospital }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      // If assignment is requested, ensure ambulance fields are properly handled
      // This is a simple insert; the RPC assign_ambulance could be called after if an ambulance is assigned here
      const { error } = await supabase
        .from('patient')
        .insert([{
          ...formData,
          hospital_id: hospital.id
        }])

      if (error) throw error

      navigate('/patients')
    } catch (err) {
      console.error('Error adding patient:', err)
      alert('Failed to add patient. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Patient</h1>
          <p className="text-slate-500 text-sm mt-1">Enter patient details into the hospital system</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <PatientForm 
          onSubmit={handleSubmit} 
          onCancel={() => navigate(-1)}
          loading={loading}
        />
      </div>
    </div>
  )
}

export default AddPatient
