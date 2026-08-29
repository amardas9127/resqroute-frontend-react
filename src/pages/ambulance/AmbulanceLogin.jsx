import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Key, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import bcrypt from 'bcryptjs'

const AmbulanceLogin = ({ onLogin }) => {
  const navigate = useNavigate()
  const [ambulanceId, setAmbulanceId] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Fetch ambulance by ID only
      const { data, error: fetchError } = await supabase
        .from('ambulance')
        .select('*')
        .ilike('ambulance_id', ambulanceId)
        .maybeSingle()

      if (fetchError || !data) {
        throw new Error('Invalid Ambulance ID or PIN')
      }

      // Verify PIN against the stored bcrypt hash
      const pinMatch = await bcrypt.compare(pin, data.pin)
      if (!pinMatch) {
        throw new Error('Invalid Ambulance ID or PIN')
      }

      onLogin(data)

    } catch (err) {
      console.error(err)
      setError(err.message || 'Invalid Ambulance ID or PIN')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center text-blue-500 mb-4 bg-slate-800 w-20 h-20 rounded-full mx-auto items-center">
          <Truck size={40} />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Driver Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your vehicle credentials to connect to dispatch
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl sm:rounded-2xl border border-slate-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 text-red-200 p-4 rounded-lg text-sm flex items-start gap-3 border border-red-800/50">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300">Ambulance ID</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Truck size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={ambulanceId}
                  onChange={(e) => setAmbulanceId(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="KA 01 AB 1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Access PIN</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••"
                  inputMode="text"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-900/20 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 disabled:opacity-70 transition-all active:scale-[0.98]"
              >
                {loading ? 'Connecting...' : 'Connect to Dispatch'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AmbulanceLogin
