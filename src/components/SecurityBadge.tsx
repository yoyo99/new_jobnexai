import { motion } from 'framer-motion'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useLocation } from 'react-router-dom'

export function SecurityBadge() {
  const location = useLocation()

  // Ne pas afficher le badge sur la page de scraping pour éviter le chevauchement
  if (location.pathname === '/app/web-scraping') {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 right-4 z-40"
    >
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-white/10">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-primary-400" />
          <div className="text-xs">
            <p className="font-medium text-white">ISO 27001</p>
            <p className="text-gray-400">RGPD compliant</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}