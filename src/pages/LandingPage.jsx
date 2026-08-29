import { useNavigate } from 'react-router-dom'
import { Building2, Truck, ShieldCheck, Zap, MapPin, Activity } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col overflow-hidden">

      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
            animation: 'pulse 10s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* Grid overlay */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40">
            <Activity size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            ResQ<span className="text-blue-400">Route</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Emergency Response System
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
          <Zap size={12} />
          Real-time Emergency Coordination Platform
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-3xl">
          Emergency Response,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #0ea5e9 100%)',
            }}
          >
            Redefined
          </span>
        </h1>

        <p className="mt-5 text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
          A unified platform connecting hospital dispatch with ambulance drivers for faster, smarter emergency care.
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          {[
            { icon: <MapPin size={14} />, label: 'Live GPS Tracking' },
            { icon: <ShieldCheck size={14} />, label: 'Secure Access' },
            { icon: <Activity size={14} />, label: 'Real-time Dispatch' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs rounded-full px-4 py-2 backdrop-blur-sm"
            >
              <span className="text-blue-400">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Login Cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">

          {/* Hospital Login Card */}
          <button
            id="hospital-login-btn"
            onClick={() => navigate('/login')}
            className="group relative overflow-hidden text-left rounded-2xl border border-slate-700/60 bg-slate-800/50 backdrop-blur-sm p-7 transition-all duration-300 hover:border-blue-500/50 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {/* Card glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)' }}
            />

            <div className="relative">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:bg-blue-600/25 group-hover:border-blue-500/40 transition-all duration-300">
                <Building2 size={28} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>

              {/* Label */}
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Hospital</div>
              <h2 className="text-xl font-bold text-white mb-2">Hospital Portal</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Manage your fleet, dispatch ambulances, and monitor patients in real-time.
              </p>

              {/* CTA */}
              <div className="mt-6 flex items-center gap-2 text-blue-400 text-sm font-semibold group-hover:text-blue-300 transition-colors">
                Sign In / Register
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>

          {/* Ambulance Login Card */}
          <button
            id="ambulance-login-btn"
            onClick={() => navigate('/ambulance/login')}
            className="group relative overflow-hidden text-left rounded-2xl border border-slate-700/60 bg-slate-800/50 backdrop-blur-sm p-7 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-indigo-900/30 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {/* Card glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }}
            />

            <div className="relative">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mb-5 group-hover:bg-indigo-600/25 group-hover:border-indigo-500/40 transition-all duration-300">
                <Truck size={28} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>

              {/* Label */}
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Ambulance</div>
              <h2 className="text-xl font-bold text-white mb-2">Driver Portal</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect to dispatch, receive trip assignments, and update your status on the go.
              </p>

              {/* CTA */}
              <div className="mt-6 flex items-center gap-2 text-indigo-400 text-sm font-semibold group-hover:text-indigo-300 transition-colors">
                Connect to Dispatch
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </button>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-slate-600 text-xs border-t border-slate-800/60">
        © {new Date().getFullYear()} ResQRoute — Emergency Response Platform. Built for speed, built for life.
      </footer>

      {/* Keyframe for pulse animation (inline style fallback) */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}

export default LandingPage
