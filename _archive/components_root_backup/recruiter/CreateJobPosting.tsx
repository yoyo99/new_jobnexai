import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import {
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface JobPosting {
  id?: string
  title: string
  company: string
  location: string
  job_type: string
  salary_min: number | ''
  salary_max: number | ''
  remote_type: 'remote' | 'hybrid' | 'onsite'
  experience_level: 'junior' | 'mid' | 'senior'
  description: string
  requirements: string[]
  status: 'active' | 'paused' | 'draft'
}

export function CreateJobPosting() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Récupérer l'ID de l'offre à modifier depuis les paramètres d'URL
  const searchParams = new URLSearchParams(location.search)
  const editJobId = searchParams.get('edit')
  
  const [jobPosting, setJobPosting] = useState<JobPosting>({
    title: '',
    company: '',
    location: '',
    job_type: 'FULL_TIME',
    salary_min: '',
    salary_max: '',
    remote_type: 'hybrid',
    experience_level: 'mid',
    description: '',
    requirements: [''],
    status: 'draft'
  })

  useEffect(() => {
    if (editJobId) {
      loadJobPosting(editJobId)
    }
  }, [editJobId])

  const loadJobPosting = async (id: string) => {
    try {
      setLoading(true)
      
      // Simuler un appel API pour récupérer l'offre d'emploi
      // Dans une vraie application, cela serait remplacé par un appel à Supabase
      const mockJobPosting = {
        id: 'job1',
        title: 'Développeur React Senior',
        company: 'TechInnovate',
        location: 'Paris',
        job_type: 'FULL_TIME',
        salary_min: 55000,
        salary_max: 70000,
        remote_type: 'hybrid',
        experience_level: 'senior',
        description: 'Nous recherchons un développeur React expérimenté pour rejoindre notre équipe...',
        requirements: [
          '5+ ans d\'expérience en React', 
          'Maîtrise de TypeScript', 
          'Expérience avec les API GraphQL'
        ],
        status: 'active'
      }

      setJobPosting(mockJobPosting)
    } catch (error) {
      console.error('Error loading job posting:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation de base
    if (!jobPosting.title || !jobPosting.description || !jobPosting.location) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires' })
      return
    }
    
    try {
      setSaving(true)
      setMessage(null)
      
      // Simuler un délai pour l'enregistrement
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Dans une vraie application, on sauvegarderait l'offre dans Supabase
      console.log('Saving job posting:', jobPosting)
      
      setMessage({ type: 'success', text: 'Offre d\'emploi enregistrée avec succès' })
      
      // Rediriger vers la liste des offres après un court délai
      setTimeout(() => {
        navigate('/recruiter/job-postings')
      }, 1500)
    } catch (error: any) {
      console.error('Error saving job posting:', error)
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
    } finally {
      setSaving(false)
    }
  }

  const addRequirement = () => {
    setJobPosting({
      ...jobPosting,
      requirements: [...jobPosting.requirements, '']
    })
  }

  const updateRequirement = (index: number, value: string) => {
    const updatedRequirements = [...jobPosting.requirements]
    updatedRequirements[index] = value
    setJobPosting({
      ...jobPosting,
      requirements: updatedRequirements
    })
  }

  const removeRequirement = (index: number) => {
    const updatedRequirements = [...jobPosting.requirements]
    updatedRequirements.splice(index, 1)
    setJobPosting({
      ...jobPosting,
      requirements: updatedRequirements
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/recruiter/job-postings')}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {editJobId ? 'Modifier l\'offre d\'emploi' : 'Créer une offre d\'emploi'}
        </h1>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Informations de base</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Titre du poste *
              </label>
              <input
                type="text"
                value={jobPosting.title}
                onChange={(e) => setJobPosting({ ...jobPosting, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Entreprise *
              </label>
              <input
                type="text"
                value={jobPosting.company}
                onChange={(e) => setJobPosting({ ...jobPosting, company: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Localisation *
                </label>
                <input
                  type="text"
                  value={jobPosting.location}
                  onChange={(e) => setJobPosting({ ...jobPosting, location: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Type de contrat *
                </label>
                <select
                  value={jobPosting.job_type}
                  onChange={(e) => setJobPosting({ ...jobPosting, job_type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="FULL_TIME">Temps plein</option>
                  <option value="PART_TIME">Temps partiel</option>
                  <option value="CONTRACT">CDD</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="INTERNSHIP">Stage</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Salaire minimum
                </label>
                <input
                  type="number"
                  value={jobPosting.salary_min}
                  onChange={(e) => setJobPosting({ ...jobPosting, salary_min: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 45000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Salaire maximum
                </label>
                <input
                  type="number"
                  value={jobPosting.salary_max}
                  onChange={(e) => setJobPosting({ ...jobPosting, salary_max: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 60000"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Type de travail *
                </label>
                <select
                  value={jobPosting.remote_type}
                  onChange={(e) => setJobPosting({ ...jobPosting, remote_type: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="remote">À distance</option>
                  <option value="hybrid">Hybride</option>
                  <option value="onsite">Sur site</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Niveau d'expérience *
                </label>
                <select
                  value={jobPosting.experience_level}
                  onChange={(e) => setJobPosting({ ...jobPosting, experience_level: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="junior">Junior (0-2 ans)</option>
                  <option value="mid">Confirmé (3-5 ans)</option>
                  <option value="senior">Senior (5+ ans)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Description et prérequis</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description du poste *
              </label>
              <textarea
                value={jobPosting.description}
                onChange={(e) => setJobPosting({ ...jobPosting, description: e.target.value })}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400">
                  Prérequis *
                </label>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="text-primary-400 hover:text-primary-300"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                {jobPosting.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ex: 3+ ans d'expérience en développement React"
                    />
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="text-gray-400 hover:text-red-400"
                      disabled={jobPosting.requirements.length <= 1}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Publication</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Statut de l'offre
              </label>
              <select
                value={jobPosting.status}
                onChange={(e) => setJobPosting({ ...jobPosting, status: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Brouillon</option>
                <option value="active">Publier immédiatement</option>
                <option value="paused">Enregistrer mais ne pas publier</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/recruiter/job-postings')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Enregistrement...' : editJobId ? 'Mettre à jour l\'offre' : 'Créer l\'offre'}
          </button>
        </div>
      </form>
    </div>
  )
}