import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../stores/auth'
import { formatPrice } from '../../utils/formatPrice'
import { supabase } from '../../lib/supabase'
import { useDropzone } from 'react-dropzone'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'

interface FreelanceProfile {
  id: string
  user_id: string
  title: string
  hourly_rate: number
  description: string
  skills: string[]
  experience: {
    id: string
    title: string
    company: string
    start_date: string
    end_date?: string
    current: boolean
    description: string
  }[]
  education: {
    id: string
    degree: string
    school: string
    year: number
    description?: string
  }[]
  portfolio: {
    id: string
    title: string
    description: string
    url: string
    image_url?: string
  }[]
  availability: 'available' | 'limited' | 'unavailable'
  languages: {
    language: string
    level: 'basic' | 'conversational' | 'fluent' | 'native'
  }[]
}

function FreelanceProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<FreelanceProfile | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      // Gérer l'upload d'image
      handlePortfolioImageUpload(acceptedFiles[0])
    }
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Dans une vraie application, on récupérerait le profil depuis Supabase
      // Ici, on simule un profil pour la démonstration
      const mockProfile: FreelanceProfile = {
        id: 'profile1',
        user_id: user?.id || '',
        title: 'Développeur Full Stack React / Node.js',
        hourly_rate: 65,
        description: 'Développeur full stack avec 5 ans d\'expérience, spécialisé dans les technologies React, Node.js et TypeScript. J\'ai travaillé sur divers projets allant des applications web aux solutions e-commerce, en passant par les dashboards analytiques.',
        skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'GraphQL', 'AWS'],
        experience: [
          {
            id: 'exp1',
            title: 'Développeur Full Stack Senior',
            company: 'TechInnovate',
            start_date: '2023-01-01',
            current: true,
            description: 'Développement d\'applications web complexes utilisant React, Node.js et MongoDB. Mise en place d\'architectures scalables et de CI/CD pipelines.'
          },
          {
            id: 'exp2',
            title: 'Développeur Front-end',
            company: 'WebSolutions',
            start_date: '2020-03-01',
            end_date: '2022-12-31',
            current: false,
            description: 'Création d\'interfaces utilisateur réactives et accessibles avec React et TypeScript. Collaboration avec les designers UX/UI et l\'équipe back-end.'
          }
        ],
        education: [
          {
            id: 'edu1',
            degree: 'Master en Informatique',
            school: 'Université de Paris',
            year: 2020,
            description: 'Spécialisation en développement web et applications mobiles'
          }
        ],
        portfolio: [
          {
            id: 'port1',
            title: 'E-commerce de produits artisanaux',
            description: 'Plateforme complète avec paiement en ligne, gestion des stocks et interface d\'administration',
            url: 'https://example.com/project1',
            image_url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'port2',
            title: 'Application de suivi de fitness',
            description: 'Application mobile React Native permettant de suivre ses activités sportives et son alimentation',
            url: 'https://example.com/project2',
            image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
          }
        ],
        availability: 'limited',
        languages: [
          { language: 'Français', level: 'native' },
          { language: 'Anglais', level: 'fluent' },
          { language: 'Espagnol', level: 'conversational' }
        ]
      }

      setProfile(mockProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return

    try {
      setSaving(true)
      setMessage(null)

      // Dans une vraie application, on sauvegarderait le profil dans Supabase
      // Simuler un délai pour l'enregistrement
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
      setEditing(false)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
    } finally {
      setSaving(false)
    }
  }

  const handlePortfolioImageUpload = async (file: File) => {
    // Dans une vraie application, on uploaderait l'image vers Supabase Storage
    console.log('Uploading file:', file.name)
  }

  const addPortfolioItem = () => {
    if (!profile) return

    const newItem = {
      id: `port${Date.now()}`,
      title: '',
      description: '',
      url: '',
      image_url: ''
    }

    setProfile({
      ...profile,
      portfolio: [...profile.portfolio, newItem]
    })
  }

  const updatePortfolioItem = (id: string, updates: Partial<FreelanceProfile['portfolio'][0]>) => {
    if (!profile) return

    setProfile({
      ...profile,
      portfolio: profile.portfolio.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    })
  }

  const removePortfolioItem = (id: string) => {
    if (!profile) return

    setProfile({
      ...profile,
      portfolio: profile.portfolio.filter(item => item.id !== id)
    })
  }

  const addSkill = (skill: string) => {
    if (!profile || profile.skills.includes(skill)) return

    setProfile({
      ...profile,
      skills: [...profile.skills, skill]
    })
  }

  const removeSkill = (skill: string) => {
    if (!profile) return

    setProfile({
      ...profile,
      skills: profile.skills.filter(s => s !== skill)
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Profil non trouvé</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Mon Profil Freelance</h1>
        <button
          onClick={() => setEditing(!editing)}
          className={editing ? "btn-secondary" : "btn-primary"}
        >
          {editing ? "Annuler" : "Modifier le profil"}
        </button>
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

      <div className="space-y-8">
        {/* Informations de base */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Informations de base</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Titre professionnel
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Taux horaire
                </label>
                <input
                  type="number"
                  value={profile.hourly_rate}
                  onChange={(e) => setProfile({ ...profile, hourly_rate: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Description
                </label>
                <textarea
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Disponibilité
                </label>
                <select
                  value={profile.availability}
                  onChange={(e) => setProfile({ ...profile, availability: e.target.value as any })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="available">Disponible pour de nouveaux projets</option>
                  <option value="limited">Disponibilité limitée</option>
                  <option value="unavailable">Non disponible actuellement</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-white">{profile.title}</h3>
              <p className="text-primary-400 font-semibold mt-2">{formatPrice(profile.hourly_rate)} / heure</p>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">Disponibilité</h4>
                <p className="text-white">
                  {profile.availability === 'available' && 'Disponible pour de nouveaux projets'}
                  {profile.availability === 'limited' && 'Disponibilité limitée'}
                  {profile.availability === 'unavailable' && 'Non disponible actuellement'}
                </p>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-400">À propos</h4>
                <p className="text-gray-300 mt-1">{profile.description}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Compétences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Compétences</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <div
                    key={skill}
                    className="flex items-center bg-white/10 rounded-full px-3 py-1"
                  >
                    <span className="text-white">{skill}</span>
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-gray-400 hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter une compétence..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        addSkill(input.value.trim())
                        input.value = ''
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Ajouter une compétence..."]') as HTMLInputElement
                    if (input.value.trim()) {
                      addSkill(input.value.trim())
                      input.value = ''
                    }
                  }}
                  className="btn-primary"
                >
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600/20 text-primary-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Portfolio</h2>
            {editing && (
              <button
                onClick={addPortfolioItem}
                className="btn-secondary flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Ajouter un projet
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.portfolio.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 rounded-lg overflow-hidden"
              >
                {editing ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Titre
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updatePortfolioItem(item.id, { title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updatePortfolioItem(item.id, { description: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updatePortfolioItem(item.id, { url: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Image
                      </label>
                      <div
                        {...getRootProps()}
                        className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-white/40 transition-colors"
                      >
                        <input {...getInputProps()} />
                        {item.image_url ? (
                          <div>
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-32 mx-auto object-cover rounded"
                            />
                            <p className="text-sm text-gray-400 mt-2">Cliquez ou glissez pour changer l'image</p>
                          </div>
                        ) : (
                          <p className="text-gray-400">Cliquez ou glissez une image ici</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={() => removePortfolioItem(item.id)}
                        className="text-red-400 hover:text-red-300 flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-white font-medium">{item.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1 mt-2"
                      >
                        Voir le projet
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {profile.portfolio.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              {editing ? (
                <p>Ajoutez des projets à votre portfolio pour montrer votre travail</p>
              ) : (
                <p>Aucun projet dans le portfolio</p>
              )}
            </div>
          )}
        </motion.div>

        {editing && (
          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FreelanceProfile;