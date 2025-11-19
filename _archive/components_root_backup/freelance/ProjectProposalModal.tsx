import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Project {
  id: string
  title: string
  client: {
    name: string
  }
  budget_min: number
  budget_max: number
}

interface ProjectProposalModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project
  onSubmit: (projectId: string, proposal: any) => void
}

export function ProjectProposalModal({ isOpen, onClose, project, onSubmit }: ProjectProposalModalProps) {
  const [bidAmount, setBidAmount] = useState(Math.floor((project.budget_min + project.budget_max) / 2))
  const [deliveryTime, setDeliveryTime] = useState('2_weeks')
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!coverLetter.trim()) {
      return
    }
    
    try {
      setLoading(true)
      
      await onSubmit(project.id, {
        bidAmount,
        deliveryTime,
        coverLetter
      })
    } catch (error) {
      console.error('Error submitting proposal:', error)
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
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-white">
              Proposer mes services
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">{project.title}</h2>
            <p className="text-gray-400">Client: {project.client.name}</p>
            <p className="text-gray-400">Budget: {project.budget_min}€ - {project.budget_max}€</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Votre tarif (€)
              </label>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={project.budget_min}
                max={project.budget_max}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Proposez un montant entre {project.budget_min}€ et {project.budget_max}€
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Délai de livraison
              </label>
              <select
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="1_week">1 semaine</option>
                <option value="2_weeks">2 semaines</option>
                <option value="1_month">1 mois</option>
                <option value="2_months">2 mois</option>
                <option value="3_months">3 mois</option>
                <option value="custom">Délai personnalisé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Lettre de motivation
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                placeholder="Présentez-vous, expliquez pourquoi vous êtes qualifié pour ce projet et comment vous comptez l'aborder..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum 100 caractères, maximum 2000 caractères
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !coverLetter.trim() || coverLetter.length < 100}
                className="btn-primary"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma proposition'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}