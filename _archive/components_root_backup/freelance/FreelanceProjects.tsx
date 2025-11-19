import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
  ClockIcon,
  CurrencyEuroIcon,
  MapPinIcon,
  TagIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'
import { ProjectProposalModal } from './ProjectProposalModal'

interface Project {
  id: string
  title: string
  description: string
  client: {
    id: string
    name: string
    avatar_url?: string
    rating: number
  }
  budget_min: number
  budget_max: number
  duration: string
  skills: string[]
  location: string
  remote: boolean
  deadline: string
  created_at: string
  status: 'open' | 'in_progress' | 'completed'
}

export function FreelanceProjects() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [budgetMin, setBudgetMin] = useState<number | ''>('')
  const [budgetMax, setBudgetMax] = useState<number | ''>('')
  const [remote, setRemote] = useState<boolean | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const durations = [
    { value: 'less_than_1_month', label: 'Moins d\'un mois' },
    { value: '1_to_3_months', label: '1 à 3 mois' },
    { value: '3_to_6_months', label: '3 à 6 mois' },
    { value: 'more_than_6_months', label: 'Plus de 6 mois' },
  ]

  const skillsList = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
    'UI/UX Design', 'Graphic Design', 'Content Writing', 'SEO',
    'Marketing', 'Data Analysis', 'Project Management'
  ]

  useEffect(() => {
    loadProjects()
  }, [search, selectedSkills, budgetMin, budgetMax, remote, duration])

  const loadProjects = async () => {
    try {
      setLoading(true)
      
      // Simuler un appel API pour récupérer les projets
      // Dans une vraie application, cela serait remplacé par un appel à Supabase
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Développement d\'une application mobile React Native',
          description: 'Nous recherchons un développeur React Native expérimenté pour créer une application mobile de e-commerce. L\'application doit être compatible iOS et Android, avec des fonctionnalités de paiement, de gestion de profil et de notifications push.',
          client: {
            id: 'client1',
            name: 'TechSolutions SAS',
            avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
            rating: 4.8
          },
          budget_min: 5000,
          budget_max: 8000,
          duration: '1_to_3_months',
          skills: ['React Native', 'JavaScript', 'Mobile Development', 'API Integration'],
          location: 'Paris',
          remote: true,
          deadline: '2025-06-15T00:00:00Z',
          created_at: '2025-04-01T00:00:00Z',
          status: 'open'
        },
        {
          id: '2',
          title: 'Refonte de site web e-commerce',
          description: 'Notre entreprise cherche un développeur front-end pour refondre notre site e-commerce existant. Le site doit être responsive, rapide et optimisé pour le SEO. Nous utilisons React et Next.js.',
          client: {
            id: 'client2',
            name: 'ModaShop',
            avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
            rating: 4.5
          },
          budget_min: 3000,
          budget_max: 6000,
          duration: 'less_than_1_month',
          skills: ['React', 'Next.js', 'CSS', 'E-commerce'],
          location: 'Lyon',
          remote: true,
          deadline: '2025-05-20T00:00:00Z',
          created_at: '2025-04-02T00:00:00Z',
          status: 'open'
        },
        {
          id: '3',
          title: 'Développement d\'une API REST pour une application de gestion',
          description: 'Nous avons besoin d\'un développeur back-end pour créer une API REST complète pour notre application de gestion interne. L\'API doit être sécurisée, bien documentée et performante.',
          client: {
            id: 'client3',
            name: 'GestionPro',
            avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
            rating: 4.2
          },
          budget_min: 4000,
          budget_max: 7000,
          duration: '1_to_3_months',
          skills: ['Node.js', 'Express', 'MongoDB', 'API Design'],
          location: 'Bordeaux',
          remote: false,
          deadline: '2025-06-30T00:00:00Z',
          created_at: '2025-04-03T00:00:00Z',
          status: 'open'
        },
        {
          id: '4',
          title: 'Création de contenu pour blog tech',
          description: 'Nous recherchons un rédacteur technique pour créer du contenu pour notre blog spécialisé dans les nouvelles technologies. Les articles doivent être bien recherchés, engageants et optimisés pour le SEO.',
          client: {
            id: 'client4',
            name: 'TechBlog Media',
            avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
            rating: 4.9
          },
          budget_min: 1000,
          budget_max: 2000,
          duration: 'more_than_6_months',
          skills: ['Content Writing', 'SEO', 'Technical Writing', 'Research'],
          location: 'Toulouse',
          remote: true,
          deadline: '2025-05-15T00:00:00Z',
          created_at: '2025-04-04T00:00:00Z',
          status: 'open'
        },
        {
          id: '5',
          title: 'Design d\'interface utilisateur pour application mobile',
          description: 'Nous avons besoin d\'un designer UI/UX pour créer l\'interface utilisateur de notre nouvelle application mobile de fitness. Le design doit être moderne, intuitif et suivre les dernières tendances.',
          client: {
            id: 'client5',
            name: 'FitTech',
            avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
            rating: 4.7
          },
          budget_min: 2500,
          budget_max: 4000,
          duration: 'less_than_1_month',
          skills: ['UI/UX Design', 'Figma', 'Mobile Design', 'Prototyping'],
          location: 'Marseille',
          remote: true,
          deadline: '2025-05-10T00:00:00Z',
          created_at: '2025-04-05T00:00:00Z',
          status: 'open'
        },
        {
          id: '6',
          title: 'Développement d\'un dashboard analytique',
          description: 'Nous recherchons un développeur full-stack pour créer un dashboard analytique pour notre plateforme SaaS. Le dashboard doit inclure des graphiques, des tableaux et des filtres avancés.',
          client: {
            id: 'client6',
            name: 'AnalyticsPro',
            avatar_url: 'https://randomuser.me/api/portraits/women/6.jpg',
            rating: 4.6
          },
          budget_min: 6000,
          budget_max: 9000,
          duration: '3_to_6_months',
          skills: ['React', 'Node.js', 'D3.js', 'Data Visualization'],
          location: 'Lille',
          remote: true,
          deadline: '2025-07-01T00:00:00Z',
          created_at: '2025-04-06T00:00:00Z',
          status: 'open'
        }
      ]

      // Filtrer les projets en fonction des critères
      let filteredProjects = [...mockProjects]
      
      if (search) {
        const searchLower = search.toLowerCase()
        filteredProjects = filteredProjects.filter(
          project => 
            project.title.toLowerCase().includes(searchLower) ||
            project.description.toLowerCase().includes(searchLower) ||
            project.client.name.toLowerCase().includes(searchLower)
        )
      }

      if (selectedSkills.length > 0) {
        filteredProjects = filteredProjects.filter(
          project => selectedSkills.some(skill => project.skills.includes(skill))
        )
      }

      if (budgetMin !== '') {
        filteredProjects = filteredProjects.filter(
          project => project.budget_max >= budgetMin
        )
      }

      if (budgetMax !== '') {
        filteredProjects = filteredProjects.filter(
          project => project.budget_min <= budgetMax
        )
      }

      if (remote !== null) {
        filteredProjects = filteredProjects.filter(
          project => project.remote === remote
        )
      }

      if (duration) {
        filteredProjects = filteredProjects.filter(
          project => project.duration === duration
        )
      }

      // Simuler les favoris
      const mockFavorites: Record<string, boolean> = {
        '1': true,
        '4': true
      }

      setProjects(filteredProjects)
      setFavorites(mockFavorites)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (projectId: string) => {
    setFavorites(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
    
    // Dans une vraie application, on sauvegarderait ce changement dans la base de données
  }

  const handleApplyToProject = (project: Project) => {
    setSelectedProject(project)
    setShowProposalModal(true)
  }

  const handleSubmitProposal = async (projectId: string, proposal: any) => {
    try {
      // Simuler l'envoi d'une proposition
      console.log('Proposition envoyée:', { projectId, ...proposal })
      
      // Fermer le modal
      setShowProposalModal(false)
      setSelectedProject(null)
      
      // Afficher un message de succès (dans une vraie application)
    } catch (error) {
      console.error('Error submitting proposal:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Projets Freelance</h1>
        <p className="text-gray-400 mt-1">
          Trouvez des projets qui correspondent à vos compétences et à vos intérêts
        </p>
      </div>

      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Filtres avancés
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-6"
          >
            <div>
              <h3 className="text-sm font-medium text-white mb-2">Compétences</h3>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => {
                      if (selectedSkills.includes(skill)) {
                        setSelectedSkills(selectedSkills.filter(s => s !== skill))
                      } else {
                        setSelectedSkills([...selectedSkills, skill])
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedSkills.includes(skill)
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Budget</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Min €"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Max €"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Durée</h3>
                <select
                  value={duration || ''}
                  onChange={(e) => setDuration(e.target.value || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Toutes les durées</option>
                  {durations.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-white mb-2">Type de travail</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setRemote(null)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    remote === null
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setRemote(true)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    remote === true
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  À distance
                </button>
                <button
                  onClick={() => setRemote(false)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    remote === false
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Sur site
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedSkills([])
                  setBudgetMin('')
                  setBudgetMax('')
                  setRemote(null)
                  setDuration(null)
                }}
                className="btn-secondary"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun projet ne correspond à vos critères</p>
            </div>
          ) : (
            projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h2 className="text-xl font-semibold text-white">{project.title}</h2>
                      <button
                        onClick={() => toggleFavorite(project.id)}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {favorites[project.id] ? (
                          <BookmarkIconSolid className="h-6 w-6" />
                        ) : (
                          <BookmarkIcon className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-400">
                      <div className="flex items-center">
                        <img
                          src={project.client.avatar_url}
                          alt={project.client.name}
                          className="h-6 w-6 rounded-full mr-2"
                        />
                        {project.client.name}
                      </div>
                      <span className="mx-2">•</span>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {project.location}
                        {project.remote && <span className="ml-1">(Remote)</span>}
                      </div>
                      <span className="mx-2">•</span>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {durations.find(d => d.value === project.duration)?.label}
                      </div>
                    </div>
                    
                    <p className="mt-4 text-gray-300 line-clamp-3">{project.description}</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600/20 text-primary-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col items-end justify-between">
                    <div className="text-right">
                      <div className="flex items-center text-primary-400 font-semibold">
                        <CurrencyEuroIcon className="h-5 w-5 mr-1" />
                        {project.budget_min.toLocaleString()} - {project.budget_max.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-400">
                        Date limite: {format(new Date(project.deadline), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => handleApplyToProject(project)}
                        className="btn-primary"
                      >
                        Proposer mes services
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {selectedProject && (
        <ProjectProposalModal
          isOpen={showProposalModal}
          onClose={() => {
            setShowProposalModal(false)
            setSelectedProject(null)
          }}
          project={selectedProject}
          onSubmit={handleSubmitProposal}
        />
      )}
    </div>
  )
}