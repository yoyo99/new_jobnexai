import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'

export function StripeWebhookInfo() {
  const [copied, setCopied] = useState(false)
  
  // URL de la fonction Edge de Supabase pour le webhook
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  return (
    <div className="bg-white/5 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-medium text-white">Configuration du webhook Stripe</h3>
      
      <p className="text-gray-300">
        Pour configurer le webhook Stripe, vous devez ajouter l'URL suivante dans votre 
        <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 ml-1">
          dashboard Stripe
        </a>:
      </p>
      
      <div className="flex items-center gap-2 bg-white/10 p-3 rounded-lg">
        <code className="text-sm text-white flex-1 overflow-x-auto">{webhookUrl}</code>
        <button 
          onClick={copyToClipboard}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          {copied ? <CheckIcon className="h-5 w-5 text-green-400" /> : <ClipboardIcon className="h-5 w-5" />}
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-300">Événements à écouter:</p>
        <ul className="list-disc list-inside text-gray-300 space-y-1">
          <li>checkout.session.completed</li>
          <li>customer.subscription.updated</li>
          <li>customer.subscription.deleted</li>
        </ul>
      </div>
      
      <div className="mt-4 p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-medium mb-2">Clé secrète Restricted Key</h4>
        <p className="text-gray-300 mb-4">
          Utilisez cette clé d'API restreinte pour les fonctions Edge Supabase:
        </p>
        <div className="bg-white/10 p-3 rounded-lg">
          <code className="text-sm text-white break-all">rk_test_51R9nCKQIOmiow871fPTN2vLxMMSyNSorZnpqWeoV7cJKHQLKcBdr1xHJFPVzNGPmApnMB9HzDs6x4oQzArXxutNG00Ul2TpX6h</code>
        </div>
      </div>
      
      <p className="text-gray-300">
        Une fois configuré, copiez le "Signing Secret" généré par Stripe et ajoutez-le à vos variables d'environnement Supabase sous le nom <code className="bg-white/10 px-2 py-1 rounded">STRIPE_WEBHOOK_SECRET</code>.
      </p>
      
      <div className="bg-yellow-900/30 text-yellow-400 p-4 rounded-lg">
        <p className="text-sm">
          <strong>Note:</strong> Pour tester en local, vous pouvez utiliser l'outil Stripe CLI ou un service comme ngrok pour exposer votre serveur local à internet.
        </p>
      </div>
    </div>
  )
}