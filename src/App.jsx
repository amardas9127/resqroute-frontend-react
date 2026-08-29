import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

// Pages
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Ambulances from './pages/Ambulances'
import AddPatient from './pages/AddPatient'
import Profile from './pages/Profile'

// Ambulance Pages
import AmbulanceLogin from './pages/ambulance/AmbulanceLogin'
import AmbulanceDashboard from './pages/ambulance/AmbulanceDashboard'
import AmbulanceTrip from './pages/ambulance/AmbulanceTrip'

// Components
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hospital, setHospital] = useState(null)

  // Ambulance Auth State
  const [isAmbulanceAuthenticated, setIsAmbulanceAuthenticated] = useState(false)
  const [ambulance, setAmbulance] = useState(null)

  useEffect(() => {
    // Check if hospital is logged in
    const storedHospital = localStorage.getItem('hospital')
    if (storedHospital) {
      setHospital(JSON.parse(storedHospital))
      setIsAuthenticated(true)
    }

    // Check if ambulance is logged in
    const storedAmbulance = localStorage.getItem('ambulance')
    if (storedAmbulance) {
      setAmbulance(JSON.parse(storedAmbulance))
      setIsAmbulanceAuthenticated(true)
    }
  }, [])

  const login = (hospitalData) => {
    const payload = {
      id: hospitalData.id,
      name: hospitalData.name,
      email: hospitalData.email
    };
    localStorage.setItem('hospital', JSON.stringify(payload))
    setHospital(payload)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('hospital')
    setHospital(null)
    setIsAuthenticated(false)
  }

  // Ambulance Auth Functions
  const ambulanceLogin = (ambulanceData) => {
    const payload = {
      id: ambulanceData.id,
      ambulance_id: ambulanceData.ambulance_id,
      hospital_id: ambulanceData.hospital_id,
      phone_no: ambulanceData.phone_no
    };
    localStorage.setItem('ambulance', JSON.stringify(payload))
    setAmbulance(payload)
    setIsAmbulanceAuthenticated(true)
  }

  const ambulanceLogout = () => {
    localStorage.removeItem('ambulance')
    setAmbulance(null)
    setIsAmbulanceAuthenticated(false)
  }

  // Layout for authenticated routes (Hospital)
  const AppLayout = ({ children }) => (
    <div className="flex h-screen bg-slate-50">
      <Sidebar onLogout={logout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar hospital={hospital} onLogout={logout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )

  // Protected route wrapper (Hospital)
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return <AppLayout>{children}</AppLayout>
  }

  // Protected route wrapper (Ambulance)
  const AmbulanceProtectedRoute = ({ children }) => {
    const [locationError, setLocationError] = useState(null)

    useEffect(() => {
      if (!isAmbulanceAuthenticated || !ambulance) return;

      let watchId;
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            setLocationError(null)
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            try {
              /* 
              // Temporarily disabled to prevent 400 Bad Request
              await supabase
                .from("ambulance")
                .update({
                  current_latitude: latitude,
                  current_longitude: longitude,
                  last_location_updated: new Date().toISOString()
                })
                .eq("id", ambulance.id);
              */
            } catch (err) {
              console.error("Database location update failed:", err);
            }
          },
          (error) => {
            console.error("Location error:", error);
            if (error.code === 1) {
              setLocationError("GPS permission denied! Tracking disabled.")
            } else {
              setLocationError("Unable to acquire GPS signal.")
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 15000
          }
        );
      } else {
        setLocationError("GPS is not supported on this device.")
      }

      return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      };
    }, [isAmbulanceAuthenticated, ambulance]);

    if (!isAmbulanceAuthenticated) {
      return <Navigate to="/ambulance/login" replace />
    }
    return (
      <div className="h-screen bg-slate-50 flex flex-col">
        {/* Simple top bar for ambulance dashboard */}
        <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
          <div className="font-bold text-lg flex items-center gap-2">
            <span className="text-blue-500">ResQRoute</span> Driver
          </div>
          <button
            onClick={ambulanceLogout}
            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium border border-slate-700"
          >
            Logout
          </button>
        </header>

        {locationError && (
          <div className="bg-rose-600 text-white text-xs font-bold px-4 py-2 text-center shrink-0 shadow-sm flex items-center justify-center gap-2">
            ⚠️ {locationError}
          </div>
        )}

        <main className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </main>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page — always shown at root */}
        <Route path="/" element={<LandingPage />} />

        {/* Hospital Auth Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={login} />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard hospital={hospital} />
          </ProtectedRoute>
        } />

        <Route path="/patients" element={
          <ProtectedRoute>
            <Patients hospital={hospital} />
          </ProtectedRoute>
        } />

        <Route path="/add-patient" element={
          <ProtectedRoute>
            <AddPatient hospital={hospital} />
          </ProtectedRoute>
        } />

        <Route path="/ambulances" element={
          <ProtectedRoute>
            <Ambulances hospital={hospital} />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile hospital={hospital} />
          </ProtectedRoute>
        } />

        {/* Ambulance Routes */}
        <Route path="/ambulance/login" element={
          isAmbulanceAuthenticated ? <Navigate to="/ambulance/dashboard" replace /> : <AmbulanceLogin onLogin={ambulanceLogin} />
        } />

        <Route path="/ambulance/dashboard" element={
          <AmbulanceProtectedRoute>
            <AmbulanceDashboard ambulance={ambulance} />
          </AmbulanceProtectedRoute>
        } />

        <Route path="/ambulance/trip" element={
          <AmbulanceProtectedRoute>
            <AmbulanceTrip ambulance={ambulance} />
          </AmbulanceProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
