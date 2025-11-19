import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { JobPostingDetailModal } from './JobPostingDetailModal'

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

export function JobPostings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'expired' | 'draft'>('all')

  useEffect(() => {
    if (user) {
      loadJobPostings()
    }
  }, [user, filter])

  const loadJobPostings = async () => {
    try {
      setLoading(true)
      
      // Simuler un appel API pour récupérer les offres d'emploi
      // Dans une vraie application, cela serait remplacé par un appel à Supabase
      const mockJobPostings: JobPosting[] = [
        {
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
          requirements: ['5+ ans d\'expérience en React', 'Maîtrise de TypeScript', 'Expérience avec les API GraphQL'],
          status: 'active',
          applications_count: 12,
          views_count: 245,
          created_at: '2025-04-01T00:00:00Z',
          expires_at: '2025-05-01T00:00:00Z'
        },
        {
          id: 'job2',
          title: 'Chef de Projet Digital',
          company: 'TechInnovate',
          location: 'Lyon',
          job_type: 'FULL_TIME',
          salary_min: 45000,
          salary_max: 60000,
          remote_type: 'onsite',
          experience_level: 'mid',
          description: 'Nous cherchons un chef de projet digital pour gérer nos projets web et mobiles...',
          requirements: ['3+ ans d\'expérience en gestion de projet', 'Certification Agile/Scrum', 'Connaissance du secteur digital'],
          status: 'active',
          applications_count: 8,
          views_count: 180,
          created_at: '2025-04-02T00:00:00Z',
          expires_at: '2025-05-02T00:00:00Z'
        },
        {
          id: 'job3',
          title: 'UI/UX Designer',
          company: 'TechInnovate',
          location: 'Bordeaux',
          job_type: 'FULL_TIME',
          salary_min: 40000,
          salary_max: 55000,
          remote_type: 'remote',
          experience_level: 'mid',
          description: 'Nous recherchons un designer UI/UX talentueux pour créer des interfaces utilisateur exceptionnelles...',
          requirements: ['Portfolio de projets UI/UX', 'Maîtrise de Figma', 'Expérience en recherche utilisateur'],
          status: 'paused',
          applications_count: 5,
          views_count: 120,
          created_at: '2025-04-03T00:00:00Z',
          expires_at: '2025-05-03T00:00:00Z'
        },
        {
          id: 'job4',
          title: 'Ingénieur DevOps',
          company: 'TechInnovate',
          location: 'Toulouse',
          job_type: 'FULL_TIME',
          salary_min: 50000,
          salary_max: 65000,
          remote_type: 'hybrid',
          experience_level: 'senior',
          description: 'Nous cherchons un ingénieur DevOps pour améliorer notre infrastructure et nos processus de déploiement...',
          requirements: ['Expérience avec Docker et Kubernetes', 'Connaissance des services AWS', 'Maîtrise des pipelines CI/CD'],
          status: 'expired',
          applications_count: 3,
          views_count: 90,
          created_at: '2025-03-01T00:00:00Z',
          expires_at: '2025-04-01T00:00:00Z'
        },
        {
          id: 'job5',
          title: 'Data Analyst',
          company: 'TechInnovate',
          location: 'Paris',
          job_type: 'FULL_TIME',
          salary_min: 45000,
          salary_max: 55000,
          remote_type: 'hybrid',
          experience_level: 'mid',
          description: 'Nous recherchons un analyste de données pour aider à interpréter nos données et générer des insights...',
          requirements: ['Maîtrise de SQL', 'Expérience avec Python ou R', 'Connaissance des outils de visualisation'],
          status: 'draft',
          applications_count: 0,
          views_count: 0,
          created_at: '2025-04-05T00:00:00Z',
          expires_at: '2025-05-05T00:00:00Z'
        }
      ]

      // Filtrer les offres d'emploi en fonction du filtre sélectionné
      let filteredJobs = [...mockJobPostings]
      
      if (filter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.status === filter)
      }

      setJobPostings(filteredJobs)
    } catch (error) {
      console.error('Error loading job postings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewJobPosting = (job: JobPosting) => {
    setSelectedJob(job)
    setShowDetailModal(true)
  }

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    // Dans une vraie application, on mettrait à jour le statut dans la base de données
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    setJobPostings(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, status: newStatus as any } : job
      )
    )
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre d\'emploi ?')) {
      return
    }
    
    // Dans une vraie application, on supprimerait l'offre dans la base de données
    setJobPostings(prev => prev.filter(job => job.id !== jobId))
  }

  const handleRenewJob = async (jobId: string) => {
    // Dans une vraie application, on renouvellerait l'offre dans la base de données
    const oneMonthLater = new Date()
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
    
    setJobPostings(prev => 
      prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          status: 'active', 
          expires_at: oneMonthLater.toISOString() 
        } : job
      )
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600 text-green-100'
      case 'paused':
        return 'bg-yellow-600 text-yellow-100'
      case 'expired':
        return 'bg-red-600 text-red-100'
      case 'draft':
        return 'bg-gray-600 text-gray-100'
      default:
        return 'bg-gray-600 text-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'paused':
        return 'En pause'
      case 'expired':
        return 'Expirée'
      case 'draft':
        return 'Brouillon'
      default:
        return status
    }
  }

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes offres d'emploi</h1>
          <p className="text-gray-400 mt-1">
            Gérez vos offres d'emploi et suivez les candidatures
          </p>
        </div>
        <Link to="/recruiter/create-job" className="btn-primary flex items-center gap-2">
          <PlusCircleIcon className="h-5 w-5" />
          Créer une offre
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'active'
              ? 'bg-primary-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Actives
        </button>
        <button
          onClick={() => setFilter('paused')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'paused'
              ? 'bg-primary-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          En pause
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'expired'
              ? 'bg-primary-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Expirées
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-lg text-sm ${
            filter === 'draft'
              ? 'bg-primary-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Brouillons
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {jobPostings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucune offre d'emploi trouvée</p>
              <Link to="/recruiter/create-job" className="btn-primary mt-4 inline-flex items-center gap-2">
                <PlusCircleIcon className="h-5 w-5" />
                Créer une offre
              </Link>
            </div>
          ) : (
            jobPostings.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold text-white">{job.title}</h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{job.company}</span>
                      <span className="mx-1">•</span>
                      <span>{job.location}</span>
                      <span className="mx-1">•</span>
                      <span>{getJobTypeLabel(job.job_type)}</span>
                      <span className="mx-1">•</span>
                      <span>{job.remote_type === 'remote' ? 'À distance' : job.remote_type === 'hybrid' ? 'Hybride' : 'Sur site'}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <EyeIcon className="h-4 w-4" />
                        {job.views_count} vues
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <UserGroupIcon className="h-4 w-4" />
                        {job.applications_count} candidatures
                      </div>
                      <div className="text-sm text-gray-400">
                        Expire le {format(new Date(job.expires_at), 'dd MMMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewJobPosting(job)}
                      className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Voir les détails"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleJobStatus(job.id, job.status)}
                      className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title={job.status === 'active' ? 'Mettre en pause' : 'Activer'}
                      disabled={job.status === 'expired' || job.status === 'draft'}
                    >
                      {job.status === 'active' ? (
                        <PauseIcon className="h-5 w-5" />
                      ) : (
                        <PlayIcon className="h-5 w-5" />
                      )}
                    </button>
                    
                    {job.status === 'expired' && (
                      <button
                        onClick={() => handleRenewJob(job.id)}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        title="Renouveler"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    <Link
                      to={`/recruiter/create-job?edit=${job.id}`}
                      className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Modifier"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleViewJobPosting(job)}
                      className="btn-primary"
                    >
                      Voir les candidatures
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {selectedJob && (
        <JobPostingDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedJob(null)
          }}
          job={selectedJob}
        />
      )}
    </div>
  )
}