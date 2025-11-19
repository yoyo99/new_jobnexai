import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../stores/auth'
import { supabase } from '../../lib/supabase'
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  CalendarIcon, 
  ClockIcon, 
  BriefcaseIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  BellIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '../LoadingSpinner'

interface Interview {
  id: string
  job_application_id: string
  date: string
  type: 'phone' | 'technical' | 'hr' | 'final' | 'other'
  notes: string | null
  location: string | null
  contact_name: string | null
  contact_email: string | null
  reminder_set: boolean
  job_application: {
    job: {
      title: string
      company: string
      location: string
    }
  }
}

export function InterviewManager() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [interviewDate, setInterviewDate] = useState<string>('')
  const [interviewTime, setInterviewTime] = useState<string>('')
  const [interviewType, setInterviewType] = useState<'phone' | 'technical' | 'hr' | 'final' | 'other'>('phone')
  const [interviewLocation, setInterviewLocation] = useState<string>('')
  const [contactName, setContactName] = useState<string>('')
  const [contactEmail, setContactEmail] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [reminderSet, setReminderSet] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null)

  useEffect(() => {
    if (user) {
      loadInterviews()
      loadApplications()
    }
  }, [user])

  const loadInterviews = async () => {
    try {
      setLoading(true)
      
      // Récupérer les entretiens de l'utilisateur
      const { data, error } = await supabase
        .from('job_interviews')
        .select(`
          *,
          job_application:job_applications (
            job:jobs (
              title,
              company,
              location
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: true })

      if (error) throw error
      setInterviews(data || [])
    } catch (error) {
      console.error('Error loading interviews:', error)
      setError('Erreur lors du chargement des entretiens')
    } finally {
      setLoading(false)
    }
  }

  const loadApplications = async () => {
    try {
      // Récupérer les candidatures en cours d'entretien
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          job:jobs (
            title,
            company,
            location
          )
        `)
        .eq('user_id', user?.id)
        .in('status', ['applied', 'interviewing'])
        .order('updated_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    }
  }

  const handleAddInterview = async () => {
    if (!selectedApplicationId) {
      setError('Veuillez sélectionner une candidature')
      return
    }

    if (!interviewDate || !interviewTime) {
      setError('Veuillez spécifier la date et l\'heure de l\'entretien')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Combiner la date et l'heure
      const dateTime = `${interviewDate}T${interviewTime}:00`
      
      // Créer l'entretien
      const { error } = await supabase
        .from('job_interviews')
        .insert({
          user_id: user?.id,
          job_application_id: selectedApplicationId,
          date: dateTime,
          type: interviewType,
          location: interviewLocation || null,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          notes: notes || null,
          reminder_set: reminderSet
        })

      if (error) throw error

      // Mettre à jour le statut de la candidature
      await supabase
        .from('job_applications')
        .update({
          status: 'interviewing',
          next_step_date: dateTime,
          next_step_type: interviewType
        })
        .eq('id', selectedApplicationId)

      // Réinitialiser le formulaire
      setSelectedApplicationId(null)
      setInterviewDate('')
      setInterviewTime('')
      setInterviewType('phone')
      setInterviewLocation('')
      setContactName('')
      setContactEmail('')
      setNotes('')
      setReminderSet(true)
      setShowAddForm(false)
      
      // Afficher le message de succès
      setSuccess('Entretien ajouté avec succès')
      
      // Recharger les entretiens
      loadInterviews()
    } catch (error) {
      console.error('Error adding interview:', error)
      setError('Erreur lors de l\'ajout de l\'entretien')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInterview = async () => {
    if (!editingInterview) return

    try {
      setLoading(true)
      setError(null)
      
      // Combiner la date et l'heure
      const dateTime = `${interviewDate}T${interviewTime}:00`
      
      // Mettre à jour l'entretien
      const { error } = await supabase
        .from('job_interviews')
        .update({
          date: dateTime,
          type: interviewType,
          location: interviewLocation || null,
          contact_name: contactName || null,
          contact_email: contactEmail || null,
          notes: notes || null,
          reminder_set: reminderSet
        })
        .eq('id', editingInterview.id)

      if (error) throw error

      // Mettre à jour le statut de la candidature
      await supabase
        .from('job_applications')
        .update({
          next_step_date: dateTime,
          next_step_type: interviewType
        })
        .eq('id', editingInterview.job_application_id)

      // Réinitialiser le formulaire
      setEditingInterview(null)
      setInterviewDate('')
      setInterviewTime('')
      setInterviewType('phone')
      setInterviewLocation('')
      setContactName('')
      setContactEmail('')
      setNotes('')
      setReminderSet(true)
      
      // Afficher le message de succès
      setSuccess('Entretien mis à jour avec succès')
      
      // Recharger les entretiens
      loadInterviews()
    } catch (error) {
      console.error('Error updating interview:', error)
      setError('Erreur lors de la mise à jour de l\'entretien')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) {
      return
    }

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('job_interviews')
        .delete()
        .eq('id', interviewId)

      if (error) throw error
      
      // Recharger les entretiens
      loadInterviews()
    } catch (error) {
      console.error('Error deleting interview:', error)
      setError('Erreur lors de la suppression de l\'entretien')
    } finally {
      setLoading(false)
    }
  }

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview)
    
    // Extraire la date et l'heure
    const date = new Date(interview.date)
    setInterviewDate(format(date, 'yyyy-MM-dd'))
    setInterviewTime(format(date, 'HH:mm'))
    
    setInterviewType(interview.type)
    setInterviewLocation(interview.location || '')
    setContactName(interview.contact_name || '')
    setContactEmail(interview.contact_email || '')
    setNotes(interview.notes || '')
    setReminderSet(interview.reminder_set)
  }

  const resetForm = () => {
    setEditingInterview(null)
    setSelectedApplicationId(null)
    setInterviewDate('')
    setInterviewTime('')
    setInterviewType('phone')
    setInterviewLocation('')
    setContactName('')
    setContactEmail('')
    setNotes('')
    setReminderSet(true)
    setShowAddForm(false)
  }

  const getInterviewTypeLabel = (type: string) => {
    switch (type) {
      case 'phone':
        return 'Téléphonique'
      case 'technical':
        return 'Technique'
      case 'hr':
        return 'RH'
      case 'final':
        return 'Final'
      case 'other':
        return 'Autre'
      default:
        return type
    }
  }

  const getInterviewStatusClass = (date: string) => {
    const now = new Date()
    const interviewDate = parseISO(date)
    
    if (isBefore(interviewDate, now)) {
      return 'bg-gray-600 text-gray-100'
    }
    
    if (isBefore(interviewDate, addDays(now, 2))) {
      return 'bg-yellow-600 text-yellow-100'
    }
    
    return 'bg-green-600 text-green-100'
  }

  const getInterviewStatusLabel = (date: string) => {
    const now = new Date()
    const interviewDate = parseISO(date)
    
    if (isBefore(interviewDate, now)) {
      return 'Passé'
    }
    
    if (isBefore(interviewDate, addDays(now, 2))) {
      return 'Imminent'
    }
    
    return 'À venir'
  }

  if (loading && interviews.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement des entretiens..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Gestion des entretiens</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showAddForm ? (
            <>Annuler</>
          ) : (
            <>
              <PlusIcon className="h-5 w-5" />
              Ajouter un entretien
            </>
          )}
        </button>
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

      {(showAddForm || editingInterview) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/5 rounded-lg p-6"
        >
          <h3 className="text-lg font-medium text-white mb-4">
            {editingInterview ? 'Modifier l\'entretien' : 'Ajouter un nouvel entretien'}
          </h3>
          
          <div className="space-y-4">
            {!editingInterview && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Candidature
                </label>
                <select
                  value={selectedApplicationId || ''}
                  onChange={(e) => setSelectedApplicationId(e.target.value || null)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionnez une candidature</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.job.title} - {app.job.company}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Heure
                </label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Type d'entretien
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="phone">Téléphonique</option>
                <option value="technical">Technique</option>
                <option value="hr">RH</option>
                <option value="final">Final</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Lieu (optionnel)
              </label>
              <input
                type="text"
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                placeholder="Ex: Visioconférence Zoom, Bureaux de l'entreprise, etc."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nom du contact (optionnel)
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email du contact (optionnel)
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reminder"
                checked={reminderSet}
                onChange={(e) => setReminderSet(e.target.checked)}
                className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="reminder" className="text-sm text-gray-400">
                Activer les rappels (24h et 1h avant l'entretien)
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={editingInterview ? handleUpdateInterview : handleAddInterview}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : editingInterview ? (
                  'Mettre à jour'
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Entretiens à venir</h3>
        
        {interviews.length === 0 ? (
          <div className="text-center py-6 text-gray-400 bg-white/5 rounded-lg">
            Aucun entretien programmé.
          </div>
        ) : (
          <div className="space-y-4">
            {interviews
              .filter(interview => isAfter(parseISO(interview.date), new Date()))
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((interview) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">
                          {interview.job_application.job.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getInterviewStatusClass(interview.date)}`}>
                          {getInterviewStatusLabel(interview.date)}
                        </span>
                      </div>
                      <p className="text-gray-400">{interview.job_application.job.company}</p>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <CalendarIcon className="h-4 w-4 text-primary-400" />
                          {format(parseISO(interview.date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <ClockIcon className="h-4 w-4 text-primary-400" />
                          {format(parseISO(interview.date), 'HH:mm', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <BriefcaseIcon className="h-4 w-4 text-primary-400" />
                          Entretien {getInterviewTypeLabel(interview.type)}
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <MapPinIcon className="h-4 w-4 text-primary-400" />
                            {interview.location}
                          </div>
                        )}
                      </div>
                      
                      {(interview.contact_name || interview.contact_email) && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                          <UserIcon className="h-4 w-4 text-primary-400" />
                          {interview.contact_name && <span>{interview.contact_name}</span>}
                          {interview.contact_email && (
                            <a 
                              href={`mailto:${interview.contact_email}`}
                              className="text-primary-400 hover:text-primary-300"
                            >
                              {interview.contact_email}
                            </a>
                          )}
                        </div>
                      )}
                      
                      {interview.notes && (
                        <div className="mt-2 text-sm text-gray-300">
                          <p className="italic">{interview.notes}</p>
                        </div>
                      )}
                      
                      {interview.reminder_set && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                          <BellIcon className="h-4 w-4" />
                          Rappels activés
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditInterview(interview)}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInterview(interview.id)}
                        className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Entretiens passés</h3>
        
        {interviews.filter(interview => isBefore(parseISO(interview.date), new Date())).length === 0 ? (
          <div className="text-center py-6 text-gray-400 bg-white/5 rounded-lg">
            Aucun entretien passé.
          </div>
        ) : (
          <div className="space-y-4">
            {interviews
              .filter(interview => isBefore(parseISO(interview.date), new Date()))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((interview) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">
                          {interview.job_application.job.title}
                        </h4>
                        <span className="bg-gray-600 text-gray-100 px-2 py-0.5 rounded-full text-xs">
                          Passé
                        </span>
                      </div>
                      <p className="text-gray-400">{interview.job_application.job.company}</p>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <CalendarIcon className="h-4 w-4 text-primary-400" />
                          {format(parseISO(interview.date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <ClockIcon className="h-4 w-4 text-primary-400" />
                          {format(parseISO(interview.date), 'HH:mm', { locale: fr })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <BriefcaseIcon className="h-4 w-4 text-primary-400" />
                          Entretien {getInterviewTypeLabel(interview.type)}
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <MapPinIcon className="h-4 w-4 text-primary-400" />
                            {interview.location}
                          </div>
                        )}
                      </div>
                      
                      {interview.notes && (
                        <div className="mt-2 text-sm text-gray-300">
                          <p className="italic">{interview.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleDeleteInterview(interview.id)}
                        className="p-2 text-gray-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}