import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ambulance, Mail, Lock, Building, Phone, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import bcrypt from 'bcryptjs'
import MapPickerModal from '../components/MapPickerModal'
import { serializeLocation, parseLocation } from '../lib/location'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleMapConfirm = (address, markerPos) => {
    setFormData(prev => ({ ...prev, address: serializeLocation(address, markerPos) }))
    setShowMap(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('hospital')
        .select('id')
        .eq('email', formData.email)
        .single()

      if (existingUser) {
        throw new Error('Email is already registered')
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(formData.password, 10)

      // Insert hospital data
      const { error: insertError } = await supabase
        .from('hospital')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          email: formData.email,
          password: hashedPassword
        }])

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Email is already registered')
        throw insertError
      }

      // If successful, redirect to login page
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } })

    } catch (err) {
      console.error(err)
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center text-blue-600 mb-4">
            <Ambulance size={48} />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            Register new hospital
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">Hospital Name</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City General Hospital"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Address</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <input
                    type="text"
                    name="address"
                    required
                    value={parseLocation(formData.address).label}
                    onChange={handleChange}
                    onClick={() => setShowMap(true)}
                    readOnly
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    placeholder="Click to pick location on map..."
                  />
                  {formData.address && (
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-blue-700 text-xs font-medium"
                    >

                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={11} />
                  Click the field to open the map and pin your exact location
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
                >
                  {loading ? 'Registering...' : 'Register Hospital'}
                </button>
              </div>
            </form>
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

export default Register
