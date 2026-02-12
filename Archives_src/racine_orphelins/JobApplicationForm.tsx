import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

interface JobApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  jobId?: string
}

export function JobApplicationForm({ isOpen, onClose, onSubmit, jobId }: JobApplicationFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('draft')
  const [notes, setNotes] = useState('')
  const [nextStepDate, setNextStepDate] = useState('')
  const [nextStepType, setNextStepType] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !jobId) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('job_applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          status,
          notes: notes || null,
          next_step_date: nextStepDate || null,
          next_step_type: nextStepType || null,
          applied_at: status === 'applied' ? new Date().toISOString() : null
        })

      if (error) throw error

      onSubmit()
      onClose()
    } catch (error) {
      console.error('Error creating application:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-white">
              Nouvelle candidature
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Brouillon</option>
                <option value="applied">Postulée</option>
                <option value="interviewing">En entretien</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ajoutez vos notes ici..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Prochaine étape
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    value={nextStepDate}
                    onChange={(e) => setNextStepDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <select
                    value={nextStepType}
                    onChange={(e) => setNextStepType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Type d'étape</option>
                    <option value="phone">Téléphone</option>
                    <option value="technical">Technique</option>
                    <option value="hr">RH</option>
                    <option value="final">Final</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Création...' : 'Créer la candidature'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}