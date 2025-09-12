// Nécessite EmailJS (https://www.emailjs.com/) :
// SERVICE_ID, TEMPLATE_ID et PUBLIC_KEY doivent être définis dans les variables d'environnement :
// VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import emailjs from 'emailjs-com'

interface ContactSalesModalProps {
  open: boolean
  onClose: () => void
}

export function ContactSalesModal({ open, onClose }: ContactSalesModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
      const templateParams = {
        name,
        email,
        company,
        message,
      };
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      setSent(true)
    } catch (err) {
      setError("Erreur lors de l'envoi. Réessaie plus tard.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-[#181C23] rounded-xl shadow-xl w-full max-w-md p-8 relative"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
              onClick={onClose}
              aria-label="Fermer"
              disabled={loading}
            >
              ×
            </button>
            {sent ? (
              <div className="text-center space-y-4">
                <div className="text-green-400 text-3xl">✓</div>
                <h2 className="text-xl font-bold text-white">Message envoyé !</h2>
                <p className="text-gray-300">Merci, notre équipe commerciale vous contactera rapidement.</p>
                <button className="btn-primary mt-4 w-full" onClick={onClose}>Fermer</button>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold text-white mb-2">Contactez notre équipe commerciale</h2>
                <div>
                  <label htmlFor="name" className="block text-sm text-gray-300 mb-1">Nom complet</label>
                  <input
                    id="name"
                    type="text"
                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm text-gray-300 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm text-gray-300 mb-1">Société</label>
                  <input
                    id="company"
                    type="text"
                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm text-gray-300 mb-1">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="text-red-400 text-sm">{error}</div>}
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? 'Envoi…' : 'Envoyer'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
