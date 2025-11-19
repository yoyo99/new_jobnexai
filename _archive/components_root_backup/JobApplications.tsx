import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { downloadApplicationPDF } from '../lib/pdf'
import { trackEvent } from '../lib/monitoring'
import {
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import { JobApplicationForm } from './JobApplicationForm'
import { AutomatedApplications } from './applications/AutomatedApplications'
import { CoverLetterGenerator } from './applications/CoverLetterGenerator'
import { InterviewManager } from './applications/InterviewManager'

interface JobApplication {
  id: string
  job: {
    id: string
    title: string
    company: string
    location: string
    url: string
  }
  status: 'draft' | 'applied' | 'interviewing' | 'offer' | 'rejected' | 'accepted' | 'withdrawn'
  notes: string | null
  applied_at: string | null
  next_step_date: string | null
  next_step_type: 'phone' | 'technical' | 'hr' | 'final' | 'other' | null
  created_at: string
  updated_at: string
}

const statusColumns = [
  { id: 'draft', name: 'Brouillons', color: 'bg-gray-600' },
  { id: 'applied', name: 'Postulées', color: 'bg-blue-600' },
  { id: 'interviewing', name: 'Entretiens', color: 'bg-yellow-600' },
  { id: 'offer', name: 'Offres', color: 'bg-green-600' },
  { id: 'rejected', name: 'Refusées', color: 'bg-red-600' },
]

export function JobApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState<'kanban' | 'automated' | 'cover-letter' | 'interviews'>('kanban')

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs (
            id,
            title,
            company,
            location,
            url
          )
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId as JobApplication['status']

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: newStatus,
          applied_at: newStatus === 'applied' ? new Date().toISOString() : null
        })
        .eq('id', draggableId)

      if (error) throw error

      setApplications(prev =>
        prev.map(app =>
          app.id === draggableId
            ? {
                ...app,
                status: newStatus,
                applied_at: newStatus === 'applied' ? new Date().toISOString() : null
              }
            : app
        )
      )
    } catch (error) {
      console.error('Error updating application status:', error)
    }
  }

  const updateNotes = async () => {
    if (!selectedApplication) return

    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ notes })
        .eq('id', selectedApplication.id)

      if (error) throw error

      setApplications(prev =>
        prev.map(app =>
          app.id === selectedApplication.id
            ? { ...app, notes }
            : app
        )
      )
      setShowNotes(false)
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setApplications(prev => prev.filter(app => app.id !== id))
    } catch (error) {
      console.error('Error deleting application:', error)
    }
  }

  const handleExportPDF = async (application: JobApplication) => {
    try {
      await downloadApplicationPDF(application, {
        includeNotes: true,
        includeTimeline: true,
      })
      trackEvent('application_exported_pdf', {
        applicationId: application.id,
        jobTitle: application.job.title,
        company: application.job.company,
      })
    } catch (error) {
      console.error('Error exporting application:', error)
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Suivi des candidatures</h1>
            <p className="text-gray-400 mt-1">
              Gérez et suivez l'avancement de vos candidatures
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedJobId(undefined)
              setShowForm(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Nouvelle candidature
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-white/10">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'kanban'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Tableau Kanban
          </button>
          <button
            onClick={() => setActiveTab('automated')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'automated'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Candidatures automatisées
          </button>
          <button
            onClick={() => setActiveTab('cover-letter')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cover-letter'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Lettres de motivation
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'interviews'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            Entretiens
          </button>
        </nav>
      </div>

      {activeTab === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {statusColumns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${column.color}`} />
                    {column.name}
                  </h2>
                  <span className="text-sm text-gray-400">
                    {applications.filter(app => app.status === column.id).length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-4"
                    >
                      {applications
                        .filter(app => app.status === column.id)
                        .map((application, index) => (
                          <Draggable
                            key={application.id}
                            draggableId={application.id}
                            index={index}
                          >
                            {(provided) => {
                              const { style, ...dragProps } = provided.draggableProps
                              return (
                                <div
                                  ref={provided.innerRef}
                                  {...dragProps}
                                  {...provided.dragHandleProps}
                                  style={style}
                                >
                                  <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card hover:bg-white/10 transition-colors"
                                  >
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h3 className="font-medium text-white">
                                            {application.job.title}
                                          </h3>
                                          <p className="text-sm text-gray-400">
                                            {application.job.company}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => handleExportPDF(application)}
                                            className="text-gray-400 hover:text-white"
                                            title="Exporter en PDF"
                                          >
                                            <DocumentArrowDownIcon className="h-5 w-5" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setSelectedApplication(application)
                                              setNotes(application.notes || '')
                                              setShowNotes(true)
                                            }}
                                            className="text-gray-400 hover:text-white"
                                          >
                                            <PencilIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => deleteApplication(application.id)}
                                            className="text-gray-400 hover:text-red-400"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {application.next_step_date && (
                                        <div className="flex items-center gap-2 text-sm text-primary-400">
                                          <CalendarIcon className="h-4 w-4" />
                                          <span>
                                            {format(new Date(application.next_step_date), 'dd MMMM yyyy', { locale: fr })}
                                            {application.next_step_type && ` - ${application.next_step_type}`}
                                          </span>
                                        </div>
                                      )}

                                      {application.notes && (
                                        <p className="text-sm text-gray-400 line-clamp-2">
                                          {application.notes}
                                        </p>
                                      )}

                                      <div className="text-xs text-gray-500">
                                        Mise à jour {format(new Date(application.updated_at), 'dd/MM/yyyy', { locale: fr })}
                                      </div>
                                    </div>
                                  </motion.div>
                                </div>
                              )
                            }}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {activeTab === 'automated' && (
        <AutomatedApplications />
      )}

      {activeTab === 'cover-letter' && (
        <CoverLetterGenerator />
      )}

      {activeTab === 'interviews' && (
        <InterviewManager />
      )}

      {showNotes && selectedApplication && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-white mb-4">
              Notes - {selectedApplication.job.title}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-40 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ajoutez vos notes ici..."
            />
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setShowNotes(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={updateNotes}
                className="btn-primary"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <JobApplicationForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={loadApplications}
        jobId={selectedJobId}
      />
    </div>
  )
}