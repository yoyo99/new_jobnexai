import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../stores/auth'
import { supabase } from '../../lib/supabase'
import { generateBulkApplicationMessages } from '../../lib/ai'
import { 
  PaperAirplaneIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon
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

interface ApplicationMessage {
  jobId: string
  message: string
  selected: boolean
}

export function AutomatedApplications() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJobs, setSelectedJobs] = useState<Record<string, boolean>>({})
  const [applicationMessages, setApplicationMessages] = useState<ApplicationMessage[]>([])
  const [cv, setCV] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }))
  }

  const selectAllJobs = () => {
    const newSelection: Record<string, boolean> = {}
    jobs.forEach(job => {
      newSelection[job.id] = true
    })
    setSelectedJobs(newSelection)
  }

  const deselectAllJobs = () => {
    setSelectedJobs({})
  }

  const generateApplicationMessages = async () => {
    if (!cv) {
      setError('Veuillez d\'abord créer un CV dans la section CV Builder')
      return
    }

    const selectedJobsList = jobs.filter(job => selectedJobs[job.id])
    
    if (selectedJobsList.length === 0) {
      setError('Veuillez sélectionner au moins une offre d\'emploi')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      
      const jobDescriptions = selectedJobsList.map(job => ({
        id: job.id,
        description: job.description
      }))

      const messages = await generateBulkApplicationMessages(cv, jobDescriptions)
      
      // Formater les messages avec l'état de sélection
      const formattedMessages = messages.map(msg => ({
        ...msg,
        selected: true
      }))

      setApplicationMessages(formattedMessages)
    } catch (error) {
      console.error('Error generating application messages:', error)
      setError('Erreur lors de la génération des messages de candidature')
    } finally {
      setGenerating(false)
    }
  }

  const toggleMessageSelection = (jobId: string) => {
    setApplicationMessages(prev => 
      prev.map(msg => 
        msg.jobId === jobId ? { ...msg, selected: !msg.selected } : msg
      )
    )
  }

  const submitApplications = async () => {
    const selectedMessages = applicationMessages.filter(msg => msg.selected)
    
    if (selectedMessages.length === 0) {
      setError('Veuillez sélectionner au moins un message à envoyer')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      // Pour chaque message sélectionné, créer une candidature
      for (const message of selectedMessages) {
        const job = jobs.find(j => j.id === message.jobId)
        
        if (!job) continue

        // Créer la candidature dans la base de données
        const { error } = await supabase
          .from('job_applications')
          .insert({
            user_id: user?.id,
            job_id: message.jobId,
            status: 'applied',
            notes: message.message,
            applied_at: new Date().toISOString()
          })

        if (error) throw error
      }

      setSuccess(`${selectedMessages.length} candidature(s) envoyée(s) avec succès`)
      
      // Réinitialiser l'état
      setSelectedJobs({})
      setApplicationMessages([])
      
      // Recharger les offres après un court délai
      setTimeout(() => {
        loadJobs()
      }, 2000)
    } catch (error) {
      console.error('Error submitting applications:', error)
      setError('Erreur lors de l\'envoi des candidatures')
    } finally {
      setSubmitting(false)
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Candidatures automatisées</h2>
        <div className="flex gap-2">
          <button
            onClick={selectAllJobs}
            className="btn-secondary text-sm"
          >
            Tout sélectionner
          </button>
          <button
            onClick={deselectAllJobs}
            className="btn-secondary text-sm"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 text-green-400 p-4 rounded-lg">
          {success}
        </div>
      )}

      {!cv && (
        <div className="bg-yellow-900/50 text-yellow-400 p-4 rounded-lg">
          Veuillez d'abord créer un CV dans la section CV Builder pour utiliser cette fonctionnalité.
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Aucune offre d'emploi correspondant à votre profil n'a été trouvée.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-400">
            Sélectionnez les offres d'emploi pour lesquelles vous souhaitez générer des candidatures automatisées.
          </p>
          
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors ${
                  selectedJobs[job.id] ? 'border border-primary-500' : 'border border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedJobs[job.id] || false}
                      onChange={() => toggleJobSelection(job.id)}
                      className="h-5 w-5 rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{job.title}</h3>
                    <p className="text-gray-400">{job.company} • {job.location}</p>
                    <p className="mt-2 text-sm text-gray-300 line-clamp-2">{job.description}</p>
                    <div className="mt-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300 text-sm"
                      >
                        Voir l'offre →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={generateApplicationMessages}
              disabled={generating || Object.keys(selectedJobs).filter(id => selectedJobs[id]).length === 0 || !cv}
              className="btn-primary flex items-center gap-2"
            >
              {generating ? (
                <>
                  <LoadingSpinner size="sm" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5" />
                  Générer les messages de candidature
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {applicationMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-6"
        >
          <h2 className="text-xl font-semibold text-white">Messages de candidature générés</h2>
          
          <div className="space-y-4">
            {applicationMessages.map((appMsg) => {
              const job = jobs.find(j => j.id === appMsg.jobId)
              
              return (
                <div
                  key={appMsg.jobId}
                  className={`bg-white/5 rounded-lg p-4 ${
                    appMsg.selected ? 'border border-primary-500' : 'border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={appMsg.selected}
                        onChange={() => toggleMessageSelection(appMsg.jobId)}
                        className="h-5 w-5 rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{job?.title}</h3>
                      <p className="text-gray-400">{job?.company} • {job?.location}</p>
                      
                      <div className="mt-4 bg-white/10 rounded-lg p-4">
                        <p className="text-white whitespace-pre-line">{appMsg.message}</p>
                      </div>
                      
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            // Régénérer ce message spécifique
                            setGenerating(true)
                            generateBulkApplicationMessages(cv, [{ id: appMsg.jobId, description: job?.description || '' }])
                              .then(messages => {
                                if (messages.length > 0) {
                                  setApplicationMessages(prev => 
                                    prev.map(msg => 
                                      msg.jobId === appMsg.jobId 
                                        ? { ...msg, message: messages[0].message } 
                                        : msg
                                    )
                                  )
                                }
                              })
                              .catch(error => {
                                console.error('Error regenerating message:', error)
                                setError('Erreur lors de la régénération du message')
                              })
                              .finally(() => {
                                setGenerating(false)
                              })
                          }}
                          className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Régénérer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={submitApplications}
              disabled={submitting || applicationMessages.filter(msg => msg.selected).length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Envoyer les candidatures
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}