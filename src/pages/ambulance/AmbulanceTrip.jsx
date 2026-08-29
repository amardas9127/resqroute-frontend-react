import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation, Phone, CheckCircle, ArrowLeft, MapPin } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import RouteMap from '../../components/RouteMap'
import { parseLocation } from '../../lib/location'

const AmbulanceTrip = ({ ambulance }) => {
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [dbAmbulance, setDbAmbulance] = useState(null)
  const [hospitalAddress, setHospitalAddress] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const { data: amb } = await supabase
          .from('ambulance')
          .select('*')
          .eq('id', ambulance.id)
          .single()

        setDbAmbulance(amb)

        if (amb?.status === 'onduty' && amb?.assigned_trip_id) {
          const { data: pat } = await supabase
            .from('patient')
            .select('*')
            .eq('id', amb.assigned_trip_id)
            .single()
          setPatient(pat)

          if (pat?.hospital_id) {
            const { data: hosp } = await supabase
              .from('hospital')
              .select('address')
              .eq('id', pat.hospital_id)
              .single()
            if (hosp) {
              setHospitalAddress(parseLocation(hosp.address).label)
            }
          }
        } else {
          setPatient(null)
          setHospitalAddress('')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrip()

    // Real-time subscriptions
    const ambulanceSub = supabase.channel('ambulance_trip_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulance', filter: `id=eq.${ambulance.id}` }, () => {
        fetchTrip()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ambulanceSub)
    }
  }, [ambulance.id])

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div></div>

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle size={48} className="text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Active Trip</h2>
        <p className="text-slate-400 mb-8">You don't have any ongoing emergency assignments.</p>
        <button onClick={() => navigate('/ambulance/dashboard')} className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors">Return to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-slate-900 text-white flex flex-col">
      {/* Full-screen Map */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {parseLocation(patient.address).label ? (
          <RouteMap initialSource={hospitalAddress} initialDestination={parseLocation(patient.address).label} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MapPin size={48} className="text-slate-600 mb-3" />
            <h3 className="font-bold text-lg text-slate-400">Map Unavailable</h3>
            <p className="text-sm text-slate-500 max-w-[280px] mt-1">
              Patient pickup address is missing or could not be mapped.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AmbulanceTrip
