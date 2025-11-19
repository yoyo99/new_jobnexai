import { Dialog } from '@headlessui/react'
import { XMarkIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, BriefcaseIcon, AcademicCapIcon, StarIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

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

interface CandidateDetailModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: Candidate
}

export function CandidateDetailModal({ isOpen, onClose, candidate }: CandidateDetailModalProps) {
  const [messageContent, setMessageContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return

    try {
      setSending(true)
      
      // Simuler l'envoi d'un message
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Réinitialiser le formulaire
      setMessageContent('')
      
      // Afficher un message de succès (dans une vraie application)
      alert('Message envoyé avec succès')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
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

  // Données fictives pour la démonstration
  const candidateDetails = {
    email: `${candidate.full_name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: '+33 6 12 34 56 78',
    experience: [
      {
        id: 'exp1',
        title: 'Senior Developer',
        company: 'TechCorp',
        location: 'Paris',
        start_date: '2020-01',
        end_date: null,
        current: true,
        description: 'Développement d\'applications web avec React et Node.js. Mise en place d\'architectures scalables et de CI/CD pipelines.'
      },
      {
        id: 'exp2',
        title: 'Frontend Developer',
        company: 'WebAgency',
        location: 'Lyon',
        start_date: '2017-03',
        end_date: '2019-12',
        current: false,
        description: 'Création d\'interfaces utilisateur réactives et accessibles. Collaboration avec les designers UX/UI.'
      }
    ],
    education: [
      {
        id: 'edu1',
        degree: 'Master en Informatique',
        school: 'Université de Paris',
        year: '2017',
        description: 'Spécialisation en développement web et applications mobiles'
      }
    ],
    languages: [
      { language: 'Français', level: 'Natif' },
      { language: 'Anglais', level: 'Courant' },
      { language: 'Espagnol', level: 'Intermédiaire' }
    ]
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl h-[90vh] overflow-y-auto rounded-lg bg-background p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-white">
              Profil du candidat
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne de gauche - Informations de base */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src={candidate.avatar_url}
                  alt={candidate.full_name}
                  className="h-32 w-32 rounded-full object-cover mb-4"
                />
                <h2 className="text-xl font-semibold text-white">{candidate.full_name}</h2>
                <p className="text-gray-400">{candidate.title}</p>
                
                <div className="flex items-center mt-2">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1 text-white font-medium">{candidate.match_score}% match</span>
                </div>
                
                <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(candidate.availability)}`}>
                  {getAvailabilityLabel(candidate.availability)}
                </span>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-white">{candidate.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-white">{candidateDetails.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-white">{candidateDetails.phone}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-2">Compétences</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600/20 text-primary-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-2">Langues</h3>
                <ul className="space-y-1">
                  {candidateDetails.languages.map((lang, index) => (
                    <li key={index} className="text-gray-300">
                      {lang.language} - <span className="text-gray-400">{lang.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  Télécharger le CV
                </button>
                <button className="btn-secondary w-full">
                  Planifier un entretien
                </button>
              </div>
            </div>
            
            {/* Colonne de droite - Expérience, éducation et message */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center">
                  <BriefcaseIcon className="h-5 w-5 mr-2" />
                  Expérience professionnelle
                </h3>
                <div className="space-y-4">
                  {candidateDetails.experience.map((exp) => (
                    <div key={exp.id} className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium">{exp.title}</h4>
                      <p className="text-gray-400">{exp.company} - {exp.location}</p>
                      <p className="text-sm text-gray-500">
                        {exp.start_date} - {exp.current ? 'Présent' : exp.end_date}
                      </p>
                      <p className="mt-2 text-gray-300">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4 flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  Formation
                </h3>
                <div className="space-y-4">
                  {candidateDetails.education.map((edu) => (
                    <div key={edu.id} className="bg-white/5 rounded-lg p-4">
                      <h4 className="text-white font-medium">{edu.degree}</h4>
                      <p className="text-gray-400">{edu.school} - {edu.year}</p>
                      {edu.description && (
                        <p className="mt-2 text-gray-300">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4">Envoyer un message</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    placeholder="Écrivez votre message au candidat..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !messageContent.trim()}
                      className="btn-primary"
                    >
                      {sending ? 'Envoi...' : 'Envoyer le message'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}