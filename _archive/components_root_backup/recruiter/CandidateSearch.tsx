import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../stores/auth'
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid'
import { CandidateDetailModal } from './CandidateDetailModal'

interface Candidate {
  id: string
  full_name: string
  title: string
  location: string
  avatar_url?: string
  skills: string[]
  experience: number
  education: string
  match_score: number
  availability: 'available' | 'limited' | 'unavailable'
}

export function CandidateSearch() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [experienceMin, setExperienceMin] = useState<number | ''>('')
  const [location, setLocation] = useState('')
  const [availability, setAvailability] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  const skillsList = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python',
    'UI/UX Design', 'Graphic Design', 'Content Writing', 'SEO',
    'Marketing', 'Data Analysis', 'Project Management'
  ]

  useEffect(() => {
    loadCandidates()
  }, [search, selectedSkills, experienceMin, location, availability])

  const loadCandidates = async () => {
    try {
      setLoading(true)
      
      // Simuler un appel API pour récupérer les candidats
      // Dans une vraie application, cela serait remplacé par un appel à Supabase
      const mockCandidates: Candidate[] = [
        {
          id: 'cand1',
          full_name: 'Sophie Martin',
          title: 'Développeuse Full Stack',
          location: 'Paris',
          avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg',
          skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
          experience: 5,
          education: 'Master en Informatique',
          match_score: 92,
          availability: 'available'
        },
        {
          id: 'cand2',
          full_name: 'Thomas Dubois',
          title: 'Product Manager',
          location: 'Lyon',
          avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg',
          skills: ['Product Management', 'Agile', 'UX Research', 'Marketing'],
          experience: 7,
          education: 'MBA',
          match_score: 85,
          availability: 'limited'
        },
        {
          id: 'cand3',
          full_name: 'Julie Moreau',
          title: 'UX Designer',
          location: 'Bordeaux',
          avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg',
          skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
          experience: 4,
          education: 'Bachelor en Design',
          match_score: 78,
          availability: 'available'
        },
        {
          id: 'cand4',
          full_name: 'Nicolas Lambert',
          title: 'DevOps Engineer',
          location: 'Toulouse',
          avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg',
          skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
          experience: 6,
          education: 'Master en Systèmes Informatiques',
          match_score: 88,
          availability: 'unavailable'
        },
        {
          id: 'cand5',
          full_name: 'Alexandre Petit',
          title: 'Data Scientist',
          location: 'Paris',
          avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
          skills: ['Python', 'Machine Learning', 'SQL', 'Data Visualization'],
          experience: 3,
          education: 'Doctorat en Statistiques',
          match_score: 90,
          availability: 'available'
        },
        {
          id: 'cand6',
          full_name: 'Léa Bernard',
          title: 'Marketing Manager',
          location: 'Marseille',
          avatar_url: 'https://randomuser.me/api/portraits/women/6.jpg',
          skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Social Media'],
          experience: 8,
          education: 'Master en Marketing Digital',
          match_score: 75,
          availability: 'limited'
        }
      ]

      // Filtrer les candidats en fonction des critères
      let filteredCandidates = [...mockCandidates]
      
      if (search) {
        const searchLower = search.toLowerCase()
        filteredCandidates = filteredCandidates.filter(
          candidate => 
            candidate.full_name.toLowerCase().includes(searchLower) ||
            candidate.title.toLowerCase().includes(searchLower) ||
            candidate.skills.some(skill => skill.toLowerCase().includes(searchLower))
        )
      }

      if (selectedSkills.length > 0) {
        filteredCandidates = filteredCandidates.filter(
          candidate => selectedSkills.some(skill => candidate.skills.includes(skill))
        )
      }

      if (experienceMin !== '') {
        filteredCandidates = filteredCandidates.filter(
          candidate => candidate.experience >= experienceMin
        )
      }

      if (location) {
        filteredCandidates = filteredCandidates.filter(
          candidate => candidate.location.toLowerCase().includes(location.toLowerCase())
        )
      }

      if (availability) {
        filteredCandidates = filteredCandidates.filter(
          candidate => candidate.availability === availability
        )
      }

      // Simuler les favoris
      const mockFavorites: Record<string, boolean> = {
        'cand1': true,
        'cand5': true
      }

      setCandidates(filteredCandidates)
      setFavorites(mockFavorites)
    } catch (error) {
      console.error('Error loading candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (candidateId: string) => {
    setFavorites(prev => ({
      ...prev,
      [candidateId]: !prev[candidateId]
    }))
    
    // Dans une vraie application, on sauvegarderait ce changement dans la base de données
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setShowDetailModal(true)
  }

  const getAvailabilityLabel = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Disponible'
      case 'limited':
        return 'Disponibilité limitée'
      case 'unavailable':
        return 'Non disponible'
      default:
        return availability
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-600 text-green-100'
      case 'limited':
        return 'bg-yellow-600 text-yellow-100'
      case 'unavailable':
        return 'bg-red-600 text-red-100'
      default:
        return 'bg-gray-600 text-gray-100'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Recherche de candidats</h1>
        <p className="text-gray-400 mt-1">
          Trouvez les meilleurs talents pour vos offres d'emploi
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
              placeholder="Rechercher par nom, titre ou compétence..."
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">Expérience minimum</h3>
                <input
                  type="number"
                  value={experienceMin}
                  onChange={(e) => setExperienceMin(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Années d'expérience"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Localisation</h3>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ville ou région"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-white mb-2">Disponibilité</h3>
                <select
                  value={availability || ''}
                  onChange={(e) => setAvailability(e.target.value || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Toutes les disponibilités</option>
                  <option value="available">Disponible</option>
                  <option value="limited">Disponibilité limitée</option>
                  <option value="unavailable">Non disponible</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedSkills([])
                  setExperienceMin('')
                  setLocation('')
                  setAvailability(null)
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
          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Aucun candidat ne correspond à vos critères</p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:bg-white/10 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={candidate.avatar_url}
                      alt={candidate.full_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-white">{candidate.full_name}</h2>
                      <p className="text-gray-400">{candidate.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <MapPinIcon className="h-4 w-4" />
                        {candidate.location}
                        <span className="mx-1">•</span>
                        <BriefcaseIcon className="h-4 w-4" />
                        {candidate.experience} ans d'expérience
                        <span className="mx-1">•</span>
                        <AcademicCapIcon className="h-4 w-4" />
                        {candidate.education}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {candidate.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600/20 text-primary-400"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 4 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                            +{candidate.skills.length - 4}
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(candidate.availability)}`}>
                        {getAvailabilityLabel(candidate.availability)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full flex items-center">
                        <StarIcon className="h-4 w-4 mr-1" />
                        <span className="font-medium">{candidate.match_score}% match</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavorite(candidate.id)}
                          className="p-2 text-gray-400 hover:text-primary-400 rounded-full hover:bg-white/10 transition-colors"
                        >
                          {favorites[candidate.id] ? (
                            <BookmarkIconSolid className="h-5 w-5 text-primary-400" />
                          ) : (
                            <BookmarkIcon className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleViewCandidate(candidate)}
                          className="btn-primary"
                        >
                          Voir le profil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {selectedCandidate && (
        <CandidateDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedCandidate(null)
          }}
          candidate={selectedCandidate}
        />
      )}
    </div>
  )
}