import { useForm } from 'react-hook-form'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { toast } from 'react-hot-toast'

interface JobApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  jobId?: string
}

interface FormValues {
  status: string
  notes: string
  nextStepDate: string
  nextStepType: string
}

export function JobApplicationForm({ isOpen, onClose, onSubmit, jobId }: JobApplicationFormProps) {
  const { user } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    defaultValues: {
      status: 'draft',
      notes: '',
      nextStepDate: '',
      nextStepType: ''
    }
  })

  const onSubmitForm = async (data: FormValues) => {
    if (!user || !jobId) {
      toast.error('Utilisateur non authentifié')
      return
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          user_id: user.id,
          job_id: jobId,
          status: data.status,
          notes: data.notes || null,
          next_step_date: data.nextStepDate || null,
          next_step_type: data.nextStepType || null,
          applied_at: data.status === 'applied' ? new Date().toISOString() : null
        })

      if (error) {
        throw error
      }

      toast.success('Candidature créée avec succès !')
      onSubmit()
      onClose()
      reset()
    } catch (error) {
      console.error('Error creating application:', error)
      toast.error(`Erreur lors de la création: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
              disabled={isSubmitting}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Statut
              </label>
              <select
                {...register('status', { required: 'Le statut est obligatoire' })}
                className={`w-full bg-white/5 border ${errors.status ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
              >
                <option value="draft">Brouillon</option>
                <option value="applied">Postulée</option>
                <option value="interviewing">En entretien</option>
              </select>
              {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes', {
                  maxLength: {
                    value: 2000,
                    message: 'Les notes ne peuvent pas dépasser 2000 caractères'
                  }
                })}
                className={`w-full h-32 bg-white/5 border ${errors.notes ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                placeholder="Ajoutez vos notes ici..."
              />
              {errors.notes && <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Prochaine étape
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="date"
                    {...register('nextStepDate', {
                      validate: (value) => {
                        if (value && new Date(value) < new Date()) {
                          return 'La date ne peut pas être dans le passé'
                        }
                        return true
                      }
                    })}
                    className={`w-full bg-white/5 border ${errors.nextStepDate ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  />
                  {errors.nextStepDate && <p className="mt-1 text-sm text-red-500">{errors.nextStepDate.message}</p>}
                </div>
                <div>
                  <select
                    {...register('nextStepType')}
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
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Création...' : 'Créer la candidature'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}