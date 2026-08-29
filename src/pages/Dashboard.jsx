import { useState, useEffect } from 'react'
import { Users, Ambulance as AmbulanceIcon, Activity, MapPin, CheckCircle, Siren, Wrench } from 'lucide-react'
import { supabase } from '../lib/supabase'
import StatCard from '../components/StatCard'
import PatientTable from '../components/PatientTable'

const Dashboard = ({ hospital }) => {
  const [stats, setStats] = useState({
    totalAmbulances: 0,
    availableAmbulances: 0,
    onDutyAmbulances: 0,
    unavailableAmbulances: 0,
    totalPatients: 0,
    activeTrips: 0
  })
  const [recentPatients, setRecentPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!hospital?.id) return;
      
      try {
        // Run all count queries in parallel for efficiency
        const [
          { count: totalAmbulances },
          { count: availableAmbulances },
          { count: onDutyAmbulances },
          { count: offlineAmbulances },
          { count: maintenanceAmbulances },
          { count: totalPatients },
          { count: activeTrips },
          { data: recentPatientsData }
        ] = await Promise.all([
          supabase.from('ambulance').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id),
          supabase.from('ambulance').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('status', 'idle'),
          supabase.from('ambulance').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('status', 'onduty'),
          supabase.from('ambulance').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('status', 'offline'),
          supabase.from('ambulance').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('status', 'maintenance'),
          supabase.from('patient').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id),
          supabase.from('patient').select('*', { count: 'exact', head: true }).eq('hospital_id', hospital.id).eq('status', 'assign'),
          supabase.from('patient').select('*').eq('hospital_id', hospital.id).order('created_at', { ascending: false }).limit(5)
        ])

        setStats({
          totalAmbulances: totalAmbulances || 0,
          availableAmbulances: availableAmbulances || 0,
          onDutyAmbulances: onDutyAmbulances || 0,
          unavailableAmbulances: (offlineAmbulances || 0) + (maintenanceAmbulances || 0),
          totalPatients: totalPatients || 0,
          activeTrips: activeTrips || 0
        })

        setRecentPatients(recentPatientsData || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [hospital])

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hospital Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Live overview of your hospital's emergency fleet</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Ambulances" 
          value={stats.totalAmbulances} 
          icon={<AmbulanceIcon size={24} className="text-blue-600" />} 
          colorClass="bg-blue-100"
        />
        <StatCard 
          title="Available Ambulances" 
          value={stats.availableAmbulances} 
          icon={<CheckCircle size={24} className="text-emerald-600" />} 
          colorClass="bg-emerald-100"
        />
        <StatCard 
          title="On Duty Ambulances" 
          value={stats.onDutyAmbulances} 
          icon={<Siren size={24} className="text-amber-600" />} 
          colorClass="bg-amber-100"
        />
        <StatCard 
          title="Offline / Maintenance" 
          value={stats.unavailableAmbulances} 
          icon={<Wrench size={24} className="text-slate-600" />} 
          colorClass="bg-slate-200"
        />
        <StatCard 
          title="Total Patients" 
          value={stats.totalPatients} 
          icon={<Users size={24} className="text-indigo-600" />} 
          colorClass="bg-indigo-100"
        />
        <StatCard 
          title="Active Trips" 
          value={stats.activeTrips} 
          icon={<MapPin size={24} className="text-rose-600" />} 
          colorClass="bg-rose-100"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">Recent Patients</h2>
        </div>
        <PatientTable patients={recentPatients} hideActions />
      </div>
    </div>
  )
}

export default Dashboard
