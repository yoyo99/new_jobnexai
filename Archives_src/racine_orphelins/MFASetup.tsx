import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { trackError, trackEvent } from '../lib/monitoring'
import QRCode from 'qrcode'

interface MFASetupProps {
  onComplete: () => void
  onCancel: () => void
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [step, setStep] = useState<'select' | 'totp' | 'sms'>('select')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setupTOTP = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (error) throw error

      const qr = await QRCode.toDataURL(data.totp.qr_code)
      setQrCode(qr)
      setSecret(data.totp.secret)
      setStep('totp')

      trackEvent('auth.mfa.totp.setup_started')
    } catch (error) {
      trackError(error as Error, { context: 'auth.mfa.totp.setup' })
      setError('Erreur lors de la configuration de l\'authentification à deux facteurs')
    } finally {
      setLoading(false)
    }
  }

  const verifyTOTP = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        code: verificationCode,
      })

      if (error) throw error

      trackEvent('auth.mfa.totp.setup_completed')
      onComplete()
    } catch (error) {
      trackError(error as Error, { context: 'auth.mfa.totp.verify' })
      setError('Code de vérification incorrect')
    } finally {
      setLoading(false)
    }
  }

  const setupSMS = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.mfa.enroll({
        factorType: 'sms',
        phoneNumber,
      })

      if (error) throw error

      setStep('sms')
      trackEvent('auth.mfa.sms.setup_started')
    } catch (error) {
      trackError(error as Error, { context: 'auth.mfa.sms.setup' })
      setError('Erreur lors de la configuration de l\'authentification par SMS')
    } finally {
      setLoading(false)
    }
  }

  const verifySMS = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.mfa.verify({
        factorId: 'sms',
        code: verificationCode,
      })

      if (error) throw error

      trackEvent('auth.mfa.sms.setup_completed')
      onComplete()
    } catch (error) {
      trackError(error as Error, { context: 'auth.mfa.sms.verify' })
      setError('Code de vérification incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === 'select' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-medium text-white">
            Choisissez une méthode d'authentification à deux facteurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={setupTOTP}
              disabled={loading}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="text-white font-medium">Application d'authentification</h3>
              <p className="text-sm text-gray-400 mt-1">
                Utilisez une application comme Google Authenticator
              </p>
            </button>
            <button
              onClick={() => setStep('sms')}
              disabled={loading}
              className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <h3 className="text-white font-medium">SMS</h3>
              <p className="text-sm text-gray-400 mt-1">
                Recevez un code par SMS
              </p>
            </button>
          </div>
        </motion.div>
      )}

      {step === 'totp' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="text-lg font-medium text-white">
            Configuration de l'application d'authentification
          </h2>
          <div className="space-y-4">
            <p className="text-gray-400">
              1. Scannez ce QR code avec votre application d'authentification
            </p>
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-gray-400">
              2. Si vous ne pouvez pas scanner le QR code, entrez ce code manuellement :
            </p>
            <pre className="bg-white/5 p-4 rounded-lg text-white font-mono text-sm">
              {secret}
            </pre>
            <p className="text-gray-400">
              3. Entrez le code généré par votre application :
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={verifyTOTP}
              disabled={loading || !verificationCode}
              className="btn-primary"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>
        </motion.div>
      )}

      {step === 'sms' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="text-lg font-medium text-white">
            Configuration de l'authentification par SMS
          </h2>
          <div className="space-y-4">
            <p className="text-gray-400">
              Entrez votre numéro de téléphone pour recevoir les codes de vérification
            </p>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+33612345678"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {verificationCode && (
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Code de vérification"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={verificationCode ? verifySMS : setupSMS}
              disabled={loading || !phoneNumber}
              className="btn-primary"
            >
              {loading ? 'Vérification...' : verificationCode ? 'Vérifier' : 'Envoyer le code'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}