import { useState, useEffect } from 'react'
import { Building, Mail, Phone, MapPin, CheckCircle, Edit3, Bell, Camera, Lock, Activity, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MapPickerModal from '../components/MapPickerModal'
import { parseLocation, serializeLocation } from '../lib/location'

const Profile = ({ hospital }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',       // stored as JSON string { label, lat, lon }
    password: ''
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    const fetchHospitalData = async () => {
      if (!hospital?.id) return
      
      try {
        const { data, error } = await supabase
          .from('hospital')
          .select('*')
          .eq('id', hospital.id)
          .single()
        
        if (error) throw error
        if (data) {
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            password: data.password || ''
          })
        }
      } catch (err) {
        console.error('Error fetching hospital details:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchHospitalData()
  }, [hospital])

  const handleMapConfirm = (address, markerPos) => {
    setFormData(prev => ({ ...prev, address: serializeLocation(address, markerPos) }))
    setShowMap(false)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('hospital')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          password: formData.password
        })
        .eq('id', hospital.id)

      if (error) throw error

      setIsEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      alert('Failed to update profile.')
    }
  }

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hospital Profile</h1>
          <p className="text-slate-500 text-sm mt-1">Manage institutional details, preferences, and emergency settings</p>
        </div>
        
        {saved && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-200 shadow-sm animate-bounce">
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">Changes saved successfully</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span className="text-white font-medium flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
              <Camera size={18} /> Change Cover
            </span>
          </div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
          
          {/* Avatar positioning */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative group/avatar cursor-pointer">
              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl border-4 border-white overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative z-10">
                <Building size={56} className="text-blue-500 drop-shadow-md" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-sm">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{formData.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full text-slate-700">
                  <Activity size={14} className="text-emerald-500" />
                  Active Status
                </span>
                <span className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full text-blue-700">
                  <Shield size={14} />
                  Verified Partner
                </span>
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 text-sm font-semibold flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Edit3 size={18} /> Edit Details
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6 animate-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Building size={20} className="text-blue-600" />
                Institutional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Institution Name</label>
                  <div className="relative group">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Primary Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Emergency Hotline</label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>



                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Full Address</label>
                  <div className="relative group">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="text"
                      name="address"
                      value={parseLocation(formData.address).label}
                      onClick={() => setShowMap(true)}
                      readOnly
                      required
                      className="w-full pl-11 pr-20 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm cursor-pointer hover:bg-blue-50 hover:border-blue-400"
                      placeholder="Click to pick location on map..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {parseLocation(formData.address).label ? 'Change' : 'Pick'}
                    </button>
                  </div>
                  {parseLocation(formData.address).lat && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={11} /> Coordinates saved ({parseLocation(formData.address).lat.toFixed(5)}, {parseLocation(formData.address).lon.toFixed(5)})
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Change Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Warning: Stored as plain text.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-8 mt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold text-sm shadow-md shadow-blue-600/20"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-3 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow hover:border-blue-100 group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <Mail size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Email Contact</p>
                <p className="text-slate-900 font-medium">{formData.email}</p>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow hover:border-blue-100 group">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <Phone size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Emergency Hotline</p>
                <p className="text-slate-900 font-medium">{formData.phone}</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow hover:border-blue-100 group">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 mb-4 group-hover:scale-110 transition-transform">
                  <MapPin size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Location</p>
                <p className="text-slate-900 font-medium leading-snug">{parseLocation(formData.address).label}</p>
              </div>
              

            </div>
          )}
        </div>
      </div>

      {/* System Settings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Bell size={22} className="text-slate-500" />
          Notification Preferences
        </h3>
        
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800">Incoming Ambulances Alerts</p>
              <p className="text-sm text-slate-500 mt-0.5">Receive immediate ping when an ambulance is en-route</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-semibold text-slate-800">Daily Digest Email</p>
              <p className="text-sm text-slate-500 mt-0.5">Get a summary of total patients and admissions daily at 8 AM</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>

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

export default Profile
