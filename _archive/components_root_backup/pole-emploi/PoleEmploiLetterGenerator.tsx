import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

import { supabase } from '../../src/lib/supabase'
import { useAuth } from '../../stores/auth'

const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

type JobApplicationStatus =
  | 'draft'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'

type SupabaseJobApplication = {
  id: string
  status: JobApplicationStatus
  notes: string | null
  applied_at: string | null
  created_at: string
  job: {
    id: string
    title: string
    company: string
    location: string
  } | null
}

type PoleEmploiApplication = {
  company_name: string
  job_title: string
  application_date: string
  application_method: 'online' | 'email' | 'post' | 'network' | 'other'
  status: 'pending' | 'rejected' | 'interview' | 'accepted'
  location?: string
  contract_type?: string
  notes?: string
}

type PoleEmploiLetterPayload = {
  user_info: {
    lastname: string
    firstname: string
    address: string
    postal_code?: string
    city?: string
    pole_emploi_id: string
  }
  period: [number, number]
  summary: {
    applications: PoleEmploiApplication[]
    trainings: string[]
    networking_events: string[]
    personal_projects: string[]
  }
  template_type: 'standard' | 'detailed'
  format: 'word'
}

function mapStatus(status: JobApplicationStatus): PoleEmploiApplication['status'] {
  switch (status) {
    case 'interviewing':
      return 'interview'
    case 'offer':
    case 'accepted':
      return 'accepted'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

function sanitizeApplications(applications: SupabaseJobApplication[]): PoleEmploiApplication[] {
  return applications
    .filter((app) => app.job)
    .map((app) => ({
      company_name: app.job?.company ?? 'Entreprise',
      job_title: app.job?.title ?? 'Poste',
      application_date: app.applied_at ?? app.created_at,
      application_method: 'online',
      status: mapStatus(app.status),
      location: app.job?.location ?? undefined,
      notes: app.notes ?? undefined,
    }))
}

export function PoleEmploiLetterGenerator() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<SupabaseJobApplication[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [template, setTemplate] = useState<'standard' | 'detailed'>('standard')
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    address: '',
    postal_code: '',
    city: '',
    pole_emploi_id: '',
  })

  useEffect(() => {
    if (!user) return

    setForm((prev) => ({
      ...prev,
      firstname: user.full_name?.split(' ')[0] ?? prev.firstname,
      lastname: user.full_name?.split(' ').slice(1).join(' ') || prev.lastname,
    }))
  }, [user])

  useEffect(() => {
    if (!user) return

    const loadApplications = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('job_applications')
          .select(
            `id, status, notes, applied_at, created_at, job:jobs (id, title, company, location)`
          )
          .eq('user_id', user.id)

        if (error) throw error
        setApplications((data as SupabaseJobApplication[]) ?? [])
      } catch (error) {
        console.error('Erreur chargement candidatures:', error)
        toast.error('Impossible de charger vos candidatures pour le moment.')
      } finally {
        setIsLoading(false)
      }
    }

    loadApplications()
  }, [user])

  const filteredApplications = useMemo(() => {
    const month = selectedMonth
    const year = selectedYear
    return applications.filter((app) => {
      const date = new Date(app.applied_at ?? app.created_at)
      return date.getMonth() === month && date.getFullYear() === year
    })
  }, [applications, selectedMonth, selectedYear])

  const poleEmploiApplications = useMemo(
    () => sanitizeApplications(filteredApplications),
    [filteredApplications]
  )

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour générer un courrier.')
      return
    }

    if (!form.firstname || !form.lastname || !form.address || !form.pole_emploi_id) {
      toast.error('Merci de compléter les informations obligatoires (nom, prénom, adresse, identifiant).')
      return
    }

    if (poleEmploiApplications.length === 0) {
      toast.error('Aucune candidature trouvée pour la période sélectionnée.')
      return
    }

    const payload: PoleEmploiLetterPayload = {
      user_info: {
        firstname: form.firstname,
        lastname: form.lastname,
        address: form.address,
        postal_code: form.postal_code || undefined,
        city: form.city || undefined,
        pole_emploi_id: form.pole_emploi_id,
      },
      period: [selectedMonth + 1, selectedYear],
      summary: {
        applications: poleEmploiApplications,
        trainings: [],
        networking_events: [],
        personal_projects: [],
      },
      template_type: template,
      format: 'word',
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/pole-emploi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error ?? 'Erreur lors de la génération du courrier')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = `lettre_pole_emploi_${form.lastname}_${format(new Date(), 'yyyy-MM-dd')}.docx`
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Courrier généré avec succès !')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erreur inattendue')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Informations personnelles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Prénom *</label>
            <input
              name="firstname"
              value={form.firstname}
              onChange={handleInputChange}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nom *</label>
            <input
              name="lastname"
              value={form.lastname}
              onChange={handleInputChange}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Adresse complète *</label>
            <input
              name="address"
              value={form.address}
              onChange={handleInputChange}
              placeholder="12 rue de Paris, 75000 Paris"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Code postal</label>
            <input
              name="postal_code"
              value={form.postal_code}
              onChange={handleInputChange}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Ville</label>
            <input
              name="city"
              value={form.city}
              onChange={handleInputChange}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Identifiant Pôle Emploi *</label>
            <input
              name="pole_emploi_id"
              value={form.pole_emploi_id}
              onChange={handleInputChange}
              placeholder="1234567A"
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Sélection de la période
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Mois</label>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            >
              {MONTHS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Année</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
              min={2000}
              max={2100}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Modèle</label>
            <select
              value={template}
              onChange={(event) => setTemplate(event.target.value as 'standard' | 'detailed')}
              className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-white"
            >
              <option value="standard">Standard (recommandé)</option>
              <option value="detailed">Détaillé</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Candidatures du mois ({poleEmploiApplications.length})
          </h2>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isLoading}
            className="px-4 py-2 rounded-md bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition disabled:opacity-60"
          >
            {isGenerating ? 'Génération en cours...' : 'Générer le courrier'}
          </button>
        </div>

        {isLoading ? (
          <p className="text-slate-300">Chargement des candidatures...</p>
        ) : poleEmploiApplications.length === 0 ? (
          <p className="text-slate-400">
            Aucune candidature trouvée pour {MONTHS[selectedMonth].toLowerCase()} {selectedYear}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-800/60">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">
                    Entreprise
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">
                    Poste
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">
                    Méthode
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-300">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {poleEmploiApplications.map((app) => (
                  <tr key={`${app.company_name}-${app.job_title}-${app.application_date}`}>
                    <td className="px-4 py-2 text-sm text-slate-200">
                      {format(new Date(app.application_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-200">{app.company_name}</td>
                    <td className="px-4 py-2 text-sm text-slate-200">{app.job_title}</td>
                    <td className="px-4 py-2 text-sm text-slate-200">{app.application_method}</td>
                    <td className="px-4 py-2 text-sm text-slate-200">{app.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-400">
          Astuce : assurez-vous que toutes vos candidatures sont saisies dans `{`job_applications`}`
          avant de générer le courrier.
        </p>
      </div>
    </div>
  )
}
