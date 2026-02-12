import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { SubscriptionManager } from './SubscriptionManager'
import { BillingHistory } from './BillingHistory'
import { StripeWebhookInfo } from './StripeWebhookInfo'

export function Billing() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'subscription' | 'history' | 'webhook'>('subscription')

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Facturation</h1>
        <p className="text-gray-400 mt-1">
          Gérez votre abonnement et consultez votre historique de facturation
        </p>
      </motion.div>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscription'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Abonnement
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'webhook'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Webhook
          </button>
        </nav>
      </div>

      <div className="card">
        {activeTab === 'subscription' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SubscriptionManager />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BillingHistory />
          </motion.div>
        )}

        {activeTab === 'webhook' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StripeWebhookInfo />
          </motion.div>
        )}
      </div>
    </div>
  )
}