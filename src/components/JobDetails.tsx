import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeftIcon, HeartIcon, ShareIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase, type Job } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { LoadingSpinner } from './LoadingSpinner'
import { ShareModal } from './ShareModal'

export default function JobDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareJob, setShareJob] = useState<Job | null>(null)
  const [userCV, setUserCV] = useState<string>('')
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [loadingCV, setLoadingCV] = useState(true)

  useEffect(() => {
    loadJobDetails()
    loadUserDocuments()
  }, [id, user])

  const loadJobDetails = async () => {
    if (!id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setJob(data as Job)

      // Vérifier si c'est un favori
      if (user) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('job_id', id)
          .single()
        setIsFavorite(!!favData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'offre:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserDocuments = async () => {
    if (!user) return
    try {
      setLoadingCV(true)
      // Charger le CV
      const { data: cvData } = await supabase
        .from('user_cvs')
        .select('content')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (cvData) {
        setUserCV(cvData.content)
      }

      // Charger la lettre de motivation (si elle existe pour cette offre)
      if (id) {
        const { data: letterData } = await supabase
          .from('cover_letters')
          .select('content')
          .eq('user_id', user.id)
          .eq('job_id', id)
          .single()

        if (letterData) {
          setCoverLetter(letterData.content)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error)
    } finally {
      setLoadingCV(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user || !job) return

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, job_id: job.id })
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, job_id: job.id })
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement de l'offre..." />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-white mb-4">Offre non trouvée</h2>
          <button
            onClick={() => navigate('/app/jobs')}
            className="btn-primary"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-4">
        {/* Header avec bouton retour */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <button
            onClick={() => navigate('/app/jobs')}
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Retour à la recherche
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareJob(job)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ShareIcon className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {isFavorite ? (
                <HeartIconSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche: Détails de l'offre */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
              {/* En-tête de l'offre */}
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-white mb-2">{job.title}</h1>
                <p className="text-lg text-gray-300">{job.company}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {format(new Date(job.created_at), 'd MMMM yyyy', { locale: fr })}
                </p>
              </div>

              {/* Tags et informations */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-primary-500/20 text-primary-300 px-3 py-1 rounded-full text-sm">
                  {job.job_type}
                </span>
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                  {job.experience_level}
                </span>
                {job.remote_type && (
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                    {job.remote_type}
                  </span>
                )}
                {job.salary_min && (
                  <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">
                    {job.salary_min}
                    {job.salary_max ? ` - ${job.salary_max}` : ''} {job.currency}
                  </span>
                )}
              </div>

              {/* Localisation */}
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-400">Localisation</p>
                <p className="text-white font-semibold">{job.location}</p>
              </div>

              {/* Score de correspondance (si disponible) */}
              {(job as any).score && (
                <div className="mb-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-gray-400">Score de correspondance</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((job as any).score, 100)}%` }}
                      />
                    </div>
                    <span className="text-white font-bold text-lg">{Math.round((job as any).score)}%</span>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </div>
              </div>

              {/* Bouton Postuler */}
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Voir l'annonce complète
                <span className="text-sm">↗</span>
              </a>
            </div>
          </motion.div>

          {/* Colonne droite: CV et Lettre de motivation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Section CV */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Votre CV</h3>
              {loadingCV ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : userCV ? (
                <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">
                    {userCV.substring(0, 500)}...
                  </div>
                  <button
                    onClick={() => navigate('/app/cv-builder')}
                    className="btn-secondary w-full mt-4 text-sm"
                  >
                    Voir le CV complet
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Aucun CV disponible</p>
                  <button
                    onClick={() => navigate('/app/cv-builder')}
                    className="btn-primary text-sm"
                  >
                    Créer un CV
                  </button>
                </div>
              )}
            </div>

            {/* Section Lettre de motivation */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Lettre de motivation</h3>
              {loadingCV ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : coverLetter ? (
                <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-300 whitespace-pre-wrap">
                    {coverLetter.substring(0, 500)}...
                  </div>
                  <button
                    onClick={() => navigate('/app/cover-letter-generator')}
                    className="btn-secondary w-full mt-4 text-sm"
                  >
                    Voir la lettre complète
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Aucune lettre disponible</p>
                  <button
                    onClick={() => navigate('/app/cover-letter-generator')}
                    className="btn-primary text-sm"
                  >
                    Générer une lettre
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {shareJob && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareJob(null)}
          job={shareJob}
        />
      )}
    </>
  )
}
