import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../stores/auth'
import { supabase } from '../../lib/supabase'
import { generateCoverLetter } from '../../lib/ai'
import { 
  DocumentTextIcon,
  ArrowPathIcon,
  ClipboardIcon,
  CheckIcon,
  LanguageIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '../LoadingSpinner'

interface Job {
  id: string
  title: string
  company: string
  location: string
  description: string
  url: string
}

export function CoverLetterGenerator() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [cv, setCV] = useState<any>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState<string>('fr')
  const [tone, setTone] = useState<'professional' | 'conversational' | 'enthusiastic'>('professional')

  useEffect(() => {
    if (user) {
      loadJobs()
      loadCV()
    }
  }, [user])

  const loadJobs = async () => {
    try {
      setLoading(true)
      
      // Récupérer les offres d'emploi correspondant au profil de l'utilisateur
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('job_suggestions')
        .select(`
          job_id,
          match_score,
          job:jobs (
            id,
            title,
            company,
            location,
            description,
            url
          )
        `)
        .eq('user_id', user?.id)
        .order('match_score', { ascending: false })
        .limit(10)

      if (suggestionsError) throw suggestionsError

      // Formater les données
      const formattedJobs = suggestions.map(suggestion => ({
        id: suggestion.job.id,
        title: suggestion.job.title,
        company: suggestion.job.company,
        location: suggestion.job.location,
        description: suggestion.job.description || '',
        url: suggestion.job.url,
        matchScore: suggestion.match_score
      }))

      setJobs(formattedJobs)
    } catch (error) {
      console.error('Error loading jobs:', error)
      setError('Erreur lors du chargement des offres d\'emploi')
    } finally {
      setLoading(false)
    }
  }

  const loadCV = async () => {
    try {
      const { data, error } = await supabase
        .from('user_cvs')
        .select('content')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      setCV(data?.content || null)
    } catch (error) {
      console.error('Error loading CV:', error)
      setError('Veuillez d\'abord créer un CV dans la section CV Builder')
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!cv) {
      setError('Veuillez d\'abord créer un CV dans la section CV Builder')
      return
    }

    if (!selectedJobId) {
      setError('Veuillez sélectionner une offre d\'emploi')
      return
    }

    const selectedJob = jobs.find(job => job.id === selectedJobId)
    if (!selectedJob) {
      setError('Offre d\'emploi non trouvée')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      setCoverLetter(null)
      
      const letter = await generateCoverLetter(cv, selectedJob.description, language, tone)
      
      setCoverLetter(letter || 'Erreur lors de la génération de la lettre de motivation')
    } catch (error) {
      console.error('Error generating cover letter:', error)
      setError('Erreur lors de la génération de la lettre de motivation')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!coverLetter) return
    
    navigator.clipboard.writeText(coverLetter)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.error('Error copying text:', err)
      })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement des offres d'emploi..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Générateur de lettres de motivation</h2>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {!cv && (
        <div className="bg-yellow-900/50 text-yellow-400 p-4 rounded-lg">
          Veuillez d'abord créer un CV dans la section CV Builder pour utiliser cette fonctionnalité.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">1. Sélectionnez une offre d'emploi</h3>
          
          {jobs.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              Aucune offre d'emploi correspondant à votre profil n'a été trouvée.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer ${
                    selectedJobId === job.id ? 'border border-primary-500' : 'border border-transparent'
                  }`}
                  onClick={() => setSelectedJobId(job.id)}
                >
                  <h4 className="text-white font-medium">{job.title}</h4>
                  <p className="text-gray-400 text-sm">{job.company} • {job.location}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs bg-primary-600/20 text-primary-400 px-2 py-1 rounded-full">
                      {job.matchScore.toFixed(0)}% de correspondance
                    </span>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Voir l'offre →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">2. Personnalisez votre lettre</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Langue
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    language === 'fr'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    language === 'en'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    language === 'es'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Español
                </button>
                <button
                  onClick={() => setLanguage('de')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    language === 'de'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Deutsch
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Ton
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTone('professional')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    tone === 'professional'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Professionnel
                </button>
                <button
                  onClick={() => setTone('conversational')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    tone === 'conversational'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Conversationnel
                </button>
                <button
                  onClick={() => setTone('enthusiastic')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    tone === 'enthusiastic'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  Enthousiaste
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleGenerateCoverLetter}
                disabled={generating || !selectedJobId || !cv}
                className="btn-primary flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Générer la lettre de motivation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {coverLetter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Lettre de motivation générée</h3>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateCoverLetter}
                disabled={generating}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Régénérer
              </button>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Copié !
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-5 w-5" />
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-6 whitespace-pre-line">
            <p className="text-white">{coverLetter}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}