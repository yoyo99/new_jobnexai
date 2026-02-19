import { useState } from 'react'
import { motion } from 'framer-motion'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { downloadApplicationPDF } from '../lib/pdf'
import { trackEvent } from '../lib/monitoring'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { JobApplicationForm } from './JobApplicationForm'
import { AutomatedApplications } from './applications/AutomatedApplications'
import { CoverLetterGenerator } from './applications/CoverLetterGenerator'
import { InterviewManager } from './applications/InterviewManager'
import { toast } from 'react-hot-toast'

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
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState<'kanban' | 'automated' | 'cover-letter' | 'interviews'>('kanban')
  const queryClient = useQueryClient()

  const { data: applications = [], isLoading, error } = useQuery<JobApplication[]>({
    queryKey: ['jobApplications', user?.id],
    queryFn: async () => {
      if (!user) return []
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
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (err) => {
      console.error('Error loading applications:', err)
      toast.error('Failed to load applications')
    }
  })

  const { mutate: updateApplicationStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobApplication['status'] }) => {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status,
          applied_at: status === 'applied' ? new Date().toISOString() : null
        })
        .eq('id', id)
      if (error) throw error
      return { id, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications', user?.id] })
      toast.success('Application status updated')
    },
    onError: (err) => {
      console.error('Error updating application status:', err)
      toast.error('Failed to update application status')
    }
  })

  const { mutate: deleteApplicationMutation } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications', user?.id] })
      toast.success('Application deleted successfully')
    },
    onError: (err) => {
      console.error('Error deleting application:', err)
      toast.error('Failed to delete application')
    }
  })

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId as JobApplication['status']
    updateApplicationStatus({ id: draggableId, status: newStatus })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center py-12">
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-2 rounded-lg">
          Failed to load applications. Please refresh the page.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Suivi des candidatures</h1>
            <p className="text-gray-400 mt-1">Gérez et suivez l'avancement de vos candidatures</p>
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
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
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
                                          onClick={() => deleteApplication(application.id)}
                                          className="text-gray-400 hover:text-red-400"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            )}
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

      <JobApplicationForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={() => queryClient.invalidateQueries({ queryKey: ['jobApplications', user?.id] })}
        jobId={selectedJobId}
      />
    </div>
  )
}
