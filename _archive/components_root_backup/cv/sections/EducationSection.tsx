import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Education {
  id: string
  degree: string
  school: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

interface EducationProps {
  content: {
    items: Education[]
  }
  onChange: (content: any) => void
}

export function EducationSection({ content, onChange }: EducationProps) {
  const addEducation = () => {
    const newEducation: Education = {
      id: crypto.randomUUID(),
      degree: '',
      school: '',
      location: '',
      startDate: '',
      current: false,
    }

    onChange({
      items: [...content.items, newEducation],
    })
  }

  const updateEducation = (id: string, updates: Partial<Education>) => {
    onChange({
      items: content.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })
  }

  const removeEducation = (id: string) => {
    onChange({
      items: content.items.filter(item => item.id !== id),
    })
  }

  return (
    <div className="space-y-6">
      {content.items.map((education, index) => (
        <motion.div
          key={education.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-white font-medium">Formation {index + 1}</h4>
            <button
              onClick={() => removeEducation(education.id)}
              className="text-red-400 hover:text-red-300"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Diplôme
              </label>
              <input
                type="text"
                value={education.degree}
                onChange={(e) => updateEducation(education.id, { degree: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  École
                </label>
                <input
                  type="text"
                  value={education.school}
                  onChange={(e) => updateEducation(education.id, { school: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  value={education.location}
                  onChange={(e) => updateEducation(education.id, { location: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date de début
                </label>
                <input
                  type="month"
                  value={education.startDate}
                  onChange={(e) => updateEducation(education.id, { startDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date de fin
                </label>
                <input
                  type="month"
                  value={education.endDate}
                  onChange={(e) => updateEducation(education.id, { endDate: e.target.value })}
                  disabled={education.current}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`current-${education.id}`}
                checked={education.current}
                onChange={(e) => updateEducation(education.id, {
                  current: e.target.checked,
                  endDate: e.target.checked ? undefined : education.endDate,
                })}
                className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
              />
              <label
                htmlFor={`current-${education.id}`}
                className="text-sm text-gray-400"
              >
                En cours
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={education.description}
                onChange={(e) => updateEducation(education.id, { description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </motion.div>
      ))}

      <button
        onClick={addEducation}
        className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
      >
        Ajouter une formation
      </button>
    </div>
  )
}