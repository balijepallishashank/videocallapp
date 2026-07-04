import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-md"
      >
        {/* Big 404 */}
        <div className="relative">
          <div className="text-[9rem] font-black text-white/5 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-7xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
              404
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-black text-white">Page Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </motion.button>
        </div>

        <div className="text-xs text-slate-600">Video Pro · Error 404</div>
      </motion.div>
    </div>
  )
}
