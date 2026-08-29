import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation, MapPin, Activity, User, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { parseLocation } from '../../lib/location'

const AmbulanceDashboard = ({ ambulance }) => {
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbAmbulance, setDbAmbulance] = useState(ambulance) // To get fresh status

  useEffect(() => {
    const fetchActiveTrip = async () => {
      if (!ambulance?.id) return
      
      try {
        // Fetch fresh ambulance data to ensure status is up to date
        const { data: freshAmb, error: ambError } = await supabase
          .from('ambulance')
          .select('*')
          .eq('id', ambulance.id)
          .single()
          
        if (ambError) throw ambError
        setDbAmbulance(freshAmb)

        if (freshAmb.status === 'onduty' && freshAmb.assigned_trip_id) {
          const { data: patientData, error: patError } = await supabase
            .from('patient')
            .select('*')
            .eq('id', freshAmb.assigned_trip_id)
            .single()
            
          if (patError) throw patError
          setPatient(patientData)
        } else {
          setPatient(null)
        }
      } catch (err) {
        console.error('Error fetching trip details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveTrip()
    
    // Real-time subscriptions replacing polling
    const dashboardSub = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance', filter: `id=eq.${ambulance.id}` }, () => {
        fetchActiveTrip()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patient' }, () => {
        fetchActiveTrip()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(dashboardSub)
    }
  }, [ambulance])

  const handleStatusChange = async (newStatus) => {
    if (dbAmbulance.status === 'onduty') {
      alert("Cannot change status while on an active trip.")
      return
    }
    
    if (newStatus === 'onduty') return // Prevent manual onduty

    try {
      setLoading(true)
      const { error } = await supabase
        .from('ambulance')
        .update({ status: newStatus })
        .eq('id', ambulance.id)
        
      if (error) throw error
      setDbAmbulance({ ...dbAmbulance, status: newStatus })
    } catch (err) {
      console.error('Error updating status:', err)
      alert("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handleStartNavigation = () => {
    navigate('/ambulance/trip')
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      {/* Driver Identity Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{dbAmbulance.ambulance_id}</h2>
            <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-1">
              <Phone size={14} /> {dbAmbulance.phone_no}
            </p>
          </div>
          {dbAmbulance.status === 'onduty' ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
              On Trip
            </span>
          ) : (
            <select
              value={dbAmbulance.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1.5 border-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none ${
                dbAmbulance.status === 'idle' ? 'bg-emerald-100 text-emerald-700' :
                dbAmbulance.status === 'maintenance' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-100 text-slate-700'
              }`}
            >
              <option value="idle">Idle (Available)</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          )}
        </div>
      </div>

      {/* Trip Information */}
      {dbAmbulance.status === 'idle' ? (
        <div className="bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-12 text-center mt-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Active Trip</h3>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-[250px]">
            You are currently marked as available. Dispatch will assign you automatically.
          </p>
        </div>
      ) : dbAmbulance.status === 'onduty' && patient ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20">
            <div className="flex items-center gap-2 mb-6 opacity-90 text-sm font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              Active Emergency Dispatch
            </div>
            
            <h1 className="text-3xl font-bold mb-1">{patient.name}</h1>
            <p className="text-blue-100 font-medium flex items-center gap-2 mb-6">
              <User size={16} /> {patient.age} years old
            </p>
            
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20">
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-blue-200 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-1">Destination Address</p>
                  <p className="font-semibold leading-snug">{parseLocation(patient.address).label}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center bg-black/20 rounded-2xl p-4 border border-black/10">
              <div>
                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-1">Condition</p>
                <p className={`font-bold capitalize flex items-center gap-1.5 ${patient.patient_condition === 'severe' ? 'text-rose-300' : 'text-emerald-300'}`}>
                  <Activity size={16} /> {patient.patient_condition}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-1">Trip Status</p>
                <p className="font-bold capitalize">{patient.status}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStartNavigation}
            className="w-full bg-slate-900 text-white rounded-2xl p-5 font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-colors active:scale-[0.98]"
          >
            <Navigation size={24} className="text-blue-400" />
            START NAVIGATION
          </button>
        </div>
      ) : (
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl text-center border border-rose-100">
          <AlertCircle className="mx-auto mb-3" size={32} />
          <h3 className="font-bold text-lg mb-1">Vehicle Offline</h3>
          <p className="text-sm">Please report to administration to update your status.</p>
        </div>
      )}
    </div>
  )
}

export default AmbulanceDashboard
