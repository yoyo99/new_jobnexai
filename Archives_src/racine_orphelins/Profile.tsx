import { useState } from 'react'
import CryptoJS from 'crypto-js';
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { UserPreferences } from './UserPreferences'
import { UserSkills } from './UserSkills'
import { JobAlerts } from './JobAlerts'
import { useTranslation } from 'react-i18next'
import { SubscriptionManager } from './SubscriptionManager'
import { StripeWebhookInfo } from './StripeWebhookInfo'

export function Profile() {
  const { user, subscription, loadUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: user?.full_name || '',
    userType: user?.user_type || '', // physique, morale, freelance
    legalStatus: user?.legal_status || '', // particulier, auto-entrepreneur, société
    companyName: user?.company_name || '',
    siren: user?.siren || '',
    tva: user?.tva || '',
    fiscalCountry: user?.fiscal_country || '',
    address: user?.address || '',
    aiApiKey: '',
    aiApiKeyDecrypted: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'skills' | 'alerts' | 'subscription' | 'webhook'>('profile')

  const handleSubmit = async (e: React.FormEvent) => {
    // Chiffrement de la clé API IA avant envoi
    let encryptedApiKey = '';
    if (form.aiApiKey) {
      encryptedApiKey = CryptoJS.AES.encrypt(form.aiApiKey, process.env.REACT_APP_API_KEY_SECRET || 'default_secret').toString();
    }
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: form.fullName, ai_api_key: encryptedApiKey })
        .eq('id', user?.id)

      if (error) throw error

      await loadUser()
      setMessage({ type: 'success', text: t('profile.personalInfo.updateSuccess') })
    } catch (error) {
      setMessage({ type: 'error', text: t('profile.personalInfo.updateError') })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">{t('profile.title')}</h1>
        <p className="text-gray-400 mt-1">{t('profile.subtitle')}</p>
      </motion.div>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
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
            onClick={() => setActiveTab('preferences')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Préférences
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'skills'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Compétences
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Alertes
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

      {activeTab === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-6">{t('profile.personalInfo.title')}</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
                {t('auth.email')}
              </label>
              <input
                type="email"
                id="email"
                value={user?.email}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white opacity-50"
              />
            </div>
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-400 mb-1">
                Type d'utilisateur
              </label>
              <select
                id="userType"
                value={form.userType}
                onChange={e => setForm({ ...form, userType: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="">Sélectionner</option>
                <option value="physique">Personne physique</option>
                <option value="morale">Personne morale (société)</option>
                <option value="freelance">Freelance/Auto-entrepreneur</option>
              </select>
            </div>
            {/* Statut légal pour les personnes physiques */}
            {form.userType === 'physique' && (
              <div>
                <label htmlFor="legalStatus" className="block text-sm font-medium text-gray-400 mb-1">
                  Statut légal
                </label>
                <select
                  id="legalStatus"
                  value={form.legalStatus}
                  onChange={e => setForm({ ...form, legalStatus: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="particulier">Particulier</option>
                  <option value="auto-entrepreneur">Auto-entrepreneur/Freelance</option>
                </select>
              </div>
            )}
            {/* Champs société/freelance */}
            {(form.userType === 'morale' || form.legalStatus === 'auto-entrepreneur' || form.userType === 'freelance') && (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-400 mb-1">
                    Raison sociale / Nom entreprise
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={form.companyName}
                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required={form.userType === 'morale'}
                  />
                </div>
                <div>
                  <label htmlFor="siren" className="block text-sm font-medium text-gray-400 mb-1">
                    N° de société (SIREN/SIRET)
                  </label>
                  <input
                    type="text"
                    id="siren"
                    value={form.siren}
                    onChange={e => setForm({ ...form, siren: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                    required={form.userType === 'morale' || form.legalStatus === 'auto-entrepreneur' || form.userType === 'freelance'}
                  />
                </div>
                <div>
                  <label htmlFor="tva" className="block text-sm font-medium text-gray-400 mb-1">
                    N° de TVA intracommunautaire (si applicable)
                  </label>
                  <input
                    type="text"
                    id="tva"
                    value={form.tva}
                    onChange={e => setForm({ ...form, tva: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </>
            )}
            {/* Pays de résidence fiscale (obligatoire pour tous) */}
            <div>
              <label htmlFor="fiscalCountry" className="block text-sm font-medium text-gray-400 mb-1">
                Pays de résidence fiscale
              </label>
              <input
                type="text"
                id="fiscalCountry"
                value={form.fiscalCountry}
                onChange={e => setForm({ ...form, fiscalCountry: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            {/* Adresse postale (pour facturation) */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-400 mb-1">
                Adresse postale
              </label>
              <input
                type="text"
                id="address"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            {/* Champ nom complet */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-1">
                {t('profile.personalInfo.fullName')}
              </label>
              <input
                type="text"
                id="fullName"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {/* Rappel RGPD & sécurité */}
            <div className="text-xs text-gray-400 bg-white/5 p-2 rounded">
              <b>Conformité RGPD & ISO27001 :</b> Vos données sont chiffrées, stockées en Europe, et utilisées uniquement pour la gestion de votre abonnement et la facturation. Vous pouvez exercer vos droits à tout moment (accès, rectification, suppression).<br/>
              Pour toute question, consultez notre <a href="/privacy-policy" className="underline" target="_blank" rel="noopener noreferrer">politique de confidentialité</a>.
            </div>
            {/* Champ API Key IA (explication) */}
            <div>
              <label htmlFor="aiApiKey" className="block text-sm font-medium text-gray-400 mb-1">
                Clé API IA personnelle
                <span className="text-xs text-gray-400 block">(Vous pouvez utiliser votre propre clé OpenAI, Google, etc. pour bénéficier de vos crédits personnels. <a href="/aide-api-key" className="underline" target="_blank" rel="noopener noreferrer">En savoir plus</a>)</span>
              </label>
              <input
                type="password"
                id="aiApiKey"
                value={form.aiApiKey}
                onChange={e => setForm({ ...form, aiApiKey: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                autoComplete="off"
              />
            </div>
            {message && (
              <div className={`rounded-md p-4 ${
                message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
          </form>
        </motion.div>
      )}

      {activeTab === 'subscription' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <SubscriptionManager />
        </motion.div>
      )}

      {activeTab === 'preferences' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <UserPreferences />
        </motion.div>
      )}

      {activeTab === 'skills' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <UserSkills />
        </motion.div>
      )}

      {activeTab === 'alerts' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <JobAlerts />
        </motion.div>
      )}

      {activeTab === 'webhook' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <StripeWebhookInfo />
        </motion.div>
      )}
    </div>
  )
}