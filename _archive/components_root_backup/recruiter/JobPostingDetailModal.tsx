import { Dialog } from '@headlessui/react'
import { XMarkIcon, UserIcon, StarIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface JobPosting {
  id: string
  title: string
  company: string
  location: string
  job_type: string
  salary_min: number
  salary_max: number
  remote_type: 'remote' | 'hybrid' | 'onsite'
  experience_level: 'junior' | 'mid' | 'senior'
  description: string
  requirements: string[]
  status: 'active' | 'paused' | 'expired' | 'draft'
  applications_count: number
  views_count: number
  created_at: string
  expires_at: string
}

interface JobPostingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  job: JobPosting
}

export function JobPostingDetailModal({ isOpen, onClose, job }: JobPostingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'applications'>('details')

  const getJobTypeLabel = (jobType: string) => {
    switch (jobType) {
      case 'FULL_TIME':
        return 'Temps plein'
      case 'PART_TIME':
        return 'Temps partiel'
      case 'CONTRACT':
        return 'CDD'
      case 'FREELANCE':
        return 'Freelance'
      case 'INTERNSHIP':
        return 'Stage'
      default:
        return jobType
    }
  }

  const getRemoteTypeLabel = (remoteType: string) => {
    switch (remoteType) {
      case 'remote':
        return 'À distance'
      case 'hybrid':
        return 'Hybride'
      case 'onsite':
        return 'Sur site'
      default:
        return remoteType
    }
  }

  const getExperienceLevelLabel = (level: string) => {
    switch (level) {
      case 'junior':
        return 'Junior (0-2 ans)'
      case 'mid':
        return 'Confirmé (3-5 ans)'
      case 'senior':
        return 'Senior (5+ ans)'
      default:
        return level
    }
  }

  // Données fictives pour la démonstration
  const mockApplications = [
    {
      id: 'app1',
      candidate: {
        id: 'cand1',
        name: 'Sophie Martin',
        title: 'Développeuse Full Stack',
        avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
        match_score: 92
      },
      status: 'new',
      created_at: '2025-04-10T10:30:00Z'
    },
    {
      id: 'app2',
      candidate: {
        id: 'cand2',
        name: 'Thomas Dubois',
        title: 'Product Manager',
        avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
        match_score: 85
      },
      status: 'reviewing',
      created_at: '2025-04-09T14:15:00Z'
    },
    {
      id: 'app3',
      candidate: {
        id: 'cand3',
        name: 'Julie Moreau',
        title: 'UX Designer',
        avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
        match_score: 78
      },
      status: 'interview',
      created_at: '2025-04-08T09:45:00Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-600 text-blue-100'
      case 'reviewing':
        return 'bg-yellow-600 text-yellow-100'
      case 'interview':
        return 'bg-green-600 text-green-100'
      case 'offer':
        return 'bg-purple-600 text-purple-100'
      case 'hired':
        return 'bg-primary-600 text-primary-100'
      case 'rejected':
        return 'bg-red-600 text-red-100'
      default:
        return 'bg-gray-600 text-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'Nouvelle'
      case 'reviewing':
        return 'En cours d\'analyse'
      case 'interview':
        return 'Entretien'
      case 'offer':
        return 'Offre'
      case 'hired':
        return 'Embauché'
      case 'rejected':
        return 'Refusé'
      default:
        return status
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
        <Dialog.Panel className="w-full max-w-4xl h-[90vh] overflow-y-auto rounded-lg bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-white">
              Détails de l'offre d'emploi
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">{job.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-gray-400">
              <span>{job.company}</span>
              <span className="mx-1">•</span>
              <span>{job.location}</span>
              <span className="mx-1">•</span>
              <span>{getJobTypeLabel(job.job_type)}</span>
            </div>
          </div>

          <div className="mb-6 border-b border-white/10">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-primary-400 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Détails de l'offre
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-primary-400 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                Candidatures ({job.applications_count})
              </button>
            </nav>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Salaire</h3>
                  <p className="text-white font-medium">
                    {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} €
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Type de travail</h3>
                  <p className="text-white font-medium">
                    {getRemoteTypeLabel(job.remote_type)}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Niveau d'expérience</h3>
                  <p className="text-white font-medium">
                    {getExperienceLevelLabel(job.experience_level)}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-2">Description du poste</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-line">{job.description}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-2">Prérequis</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Date de publication</h3>
                  <p className="text-white">
                    {format(new Date(job.created_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Date d'expiration</h3>
                  <p className="text-white">
                    {format(new Date(job.expires_at), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Link
                  to={`/recruiter/create-job?edit=${job.id}`}
                  className="btn-secondary"
                >
                  Modifier l'offre
                </Link>
                <button className="btn-primary">
                  Promouvoir l'offre
                </button>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-medium">Candidatures reçues</h3>
                <div className="flex gap-2">
                  <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="all">Tous les statuts</option>
                    <option value="new">Nouvelles</option>
                    <option value="reviewing">En analyse</option>
                    <option value="interview">Entretien</option>
                    <option value="rejected">Refusées</option>
                  </select>
                  <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="recent">Plus récentes</option>
                    <option value="match">Meilleur match</option>
                  </select>
                </div>
              </div>
              
              {mockApplications.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-lg">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Aucune candidature pour cette offre</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockApplications.map((application) => (
                    <div
                      key={application.id}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img
                            src={application.candidate.avatar_url}
                            alt={application.candidate.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="text-white font-medium">{application.candidate.name}</h4>
                            <p className="text-sm text-gray-400">{application.candidate.title}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <StarIcon className="h-5 w-5 text-yellow-400" />
                            <span className="text-white font-medium">{application.candidate.match_score}%</span>
                          </div>
                          
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </span>
                          
                          <span className="text-sm text-gray-400">
                            {format(new Date(application.created_at), 'dd MMM', { locale: fr })}
                          </span>
                          
                          <button className="btn-primary text-sm">
                            Voir le profil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}