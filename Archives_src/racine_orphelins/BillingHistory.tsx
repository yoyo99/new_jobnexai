import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { InvoiceHistory } from './InvoiceHistory'
import { PaymentMethodList } from './PaymentMethodList'

export function BillingHistory() {
  const { user, subscription } = useAuth()
  const [activeTab, setActiveTab] = useState<'invoices' | 'payment-methods'>('invoices')

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-white">Historique de facturation</h2>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Factures
          </button>
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment-methods'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Méthodes de paiement
          </button>
        </nav>
      </div>

      {activeTab === 'invoices' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <InvoiceHistory />
        </motion.div>
      )}

      {activeTab === 'payment-methods' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PaymentMethodList />
        </motion.div>
      )}
    </div>
  )
}