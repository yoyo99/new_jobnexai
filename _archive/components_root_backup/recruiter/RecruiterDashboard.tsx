import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../stores/auth'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  EyeIcon,
  PlusCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

// Initialiser ChartJS
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export function RecruiterDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    interviewsScheduled: 0,
    viewRate: 0,
    responseRate: 0
  })
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Dans une vraie application, on récupérerait ces données depuis Supabase
      // Ici, on simule des données pour la démonstration
      
      // Statistiques
      const mockStats = {
        activeJobs: 5,
        totalApplications: 47,
        newApplications: 12,
        interviewsScheduled: 8,
        viewRate: 68,
        responseRate: 42
      }
      
      // Candidatures récentes
      const mockRecentApplications = [
        {
          id: 'app1',
          candidate: {
            id: 'cand1',
            name: 'Sophie Martin',
            avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
            title: 'Développeuse Full Stack'
          },
          job: {
            id: 'job1',
            title: 'Développeur React Senior'
          },
          status: 'new',
          created_at: '2025-04-10T10:30:00Z'
        },
        {
          id: 'app2',
          candidate: {
            id: 'cand2',
            name: 'Thomas Dubois',
            avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
            title: 'Product Manager'
          },
          job: {
            id: 'job2',
            title: 'Chef de Projet Digital'
          },
          status: 'reviewing',
          created_at: '2025-04-09T14:15:00Z'
        },
        {
          id: 'app3',
          candidate: {
            id: 'cand3',
            name: 'Julie Moreau',
            avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
            title: 'UX Designer'
          },
          job: {
            id: 'job3',
            title: 'UI/UX Designer'
          },
          status: 'interview',
          created_at: '2025-04-08T09:45:00Z'
        },
        {
          id: 'app4',
          candidate: {
            id: 'cand4',
            name: 'Nicolas Lambert',
            avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg',
            title: 'DevOps Engineer'
          },
          job: {
            id: 'job4',
            title: 'Ingénieur DevOps'
          },
          status: 'rejected',
          created_at: '2025-04-07T16:20:00Z'
        }
      ]
      
      // Entretiens à venir
      const mockUpcomingInterviews = [
        {
          id: 'int1',
          candidate: {
            id: 'cand3',
            name: 'Julie Moreau',
            avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
            title: 'UX Designer'
          },
          job: {
            id: 'job3',
            title: 'UI/UX Designer'
          },
          date: '2025-04-15T14:00:00Z',
          type: 'technical'
        },
        {
          id: 'int2',
          candidate: {
            id: 'cand5',
            name: 'Alexandre Petit',
            avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
            title: 'Data Scientist'
          },
          job: {
            id: 'job5',
            title: 'Data Analyst'
          },
          date: '2025-04-16T10:30:00Z',
          type: 'hr'
        }
      ]

      setStats(mockStats)
      setRecentApplications(mockRecentApplications)
      setUpcomingInterviews(mockUpcomingInterviews)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getInterviewTypeLabel = (type: string) => {
    switch (type) {
      case 'technical':
        return 'Technique'
      case 'hr':
        return 'RH'
      case 'final':
        return 'Final'
      default:
        return type
    }
  }

  // Données pour le graphique des statuts de candidature
  const applicationStatusData = {
    labels: ['Nouvelles', 'En analyse', 'Entretien', 'Offre', 'Embauchés', 'Refusés'],
    datasets: [
      {
        data: [12, 8, 5, 3, 2, 17],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(22, 163, 74, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  }

  // Données pour le graphique des sources de candidature
  const applicationSourceData = {
    labels: ['Site web', 'LinkedIn', 'Indeed', 'Référence', 'Autre'],
    datasets: [
      {
        label: 'Candidatures par source',
        data: [18, 12, 8, 5, 4],
        backgroundColor: 'rgba(236, 72, 153, 0.8)',
      },
    ],
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tableau de bord recruteur</h1>
        <p className="text-gray-400 mt-1">
          Gérez vos offres d'emploi et suivez les candidatures
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/5">
              <BriefcaseIcon className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Offres actives</p>
              <p className="text-2xl font-semibold text-white">
                {stats.activeJobs}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/5">
              <DocumentTextIcon className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">Candidatures</p>
                <span className="text-xs text-green-400 flex items-center">
                  <ArrowUpIcon className="h-3 w-3" />
                  {stats.newApplications}
                </span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {stats.totalApplications}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/5">
              <UserIcon className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Entretiens programmés</p>
              <p className="text-2xl font-semibold text-white">
                {stats.interviewsScheduled}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/5">
              <EnvelopeIcon className="h-6 w-6 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Taux de réponse</p>
              <p className="text-2xl font-semibold text-white">
                {stats.responseRate}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card flex flex-col items-center justify-center py-6"
        >
          <div className="p-4 rounded-full bg-primary-600/20 mb-4">
            <PlusCircleIcon className="h-8 w-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Publier une offre</h3>
          <p className="text-gray-400 text-sm text-center mb-4">
            Créez une nouvelle offre d'emploi et touchez des candidats qualifiés
          </p>
          <Link to="/recruiter/create-job" className="btn-primary">
            Créer une offre
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card flex flex-col items-center justify-center py-6"
        >
          <div className="p-4 rounded-full bg-secondary-600/20 mb-4">
            <UserIcon className="h-8 w-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Rechercher des candidats</h3>
          <p className="text-gray-400 text-sm text-center mb-4">
            Trouvez des candidats correspondant à vos critères
          </p>
          <Link to="/recruiter/candidates" className="btn-primary">
            Rechercher
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card flex flex-col items-center justify-center py-6"
        >
          <div className="p-4 rounded-full bg-green-600/20 mb-4">
            <EyeIcon className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Gérer mes offres</h3>
          <p className="text-gray-400 text-sm text-center mb-4">
            Consultez et gérez vos offres d'emploi actives
          </p>
          <Link to="/recruiter/job-postings" className="btn-primary">
            Voir mes offres
          </Link>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Statuts des candidatures</h2>
          <div className="h-64">
            <Pie 
              data={applicationStatusData} 
              options={{
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: 'white'
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Sources des candidatures</h2>
          <div className="h-64">
            <Bar 
              data={applicationSourceData} 
              options={{
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    }
                  },
                  x: {
                    ticks: {
                      color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Candidatures récentes et entretiens à venir */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Candidatures récentes</h2>
            <Link to="/recruiter/candidates" className="text-sm text-primary-400 hover:text-primary-300">
              Voir tout
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentApplications.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={application.candidate.avatar_url}
                    alt={application.candidate.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <h3 className="text-white font-medium">{application.candidate.name}</h3>
                    <p className="text-sm text-gray-400">{application.job.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                    {getStatusLabel(application.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(application.created_at), 'dd MMM', { locale: fr })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Entretiens à venir</h2>
            <Link to="/recruiter/candidates" className="text-sm text-primary-400 hover:text-primary-300">
              Voir tout
            </Link>
          </div>
          
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={interview.candidate.avatar_url}
                    alt={interview.candidate.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div>
                    <h3 className="text-white font-medium">{interview.candidate.name}</h3>
                    <p className="text-sm text-gray-400">{interview.job.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-primary-400 font-medium">
                    {format(new Date(interview.date), 'dd MMMM à HH:mm', { locale: fr })}
                  </p>
                  <p className="text-xs text-gray-400">
                    Entretien {getInterviewTypeLabel(interview.type)}
                  </p>
                </div>
              </div>
            ))}
            
            {upcomingInterviews.length === 0 && (
              <p className="text-center py-4 text-gray-400">
                Aucun entretien programmé
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}