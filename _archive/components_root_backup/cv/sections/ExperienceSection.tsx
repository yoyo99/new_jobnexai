import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
  achievements: string[]
}

interface ExperienceProps {
  content: {
    items: Experience[]
  }
  onChange: (content: any) => void
}

export function ExperienceSection({ content, onChange }: ExperienceProps) {
  const addExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      current: false,
      description: '',
      achievements: [],
    }

    onChange({
      items: [...content.items, newExperience],
    })
  }

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange({
      items: content.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })
  }

  const removeExperience = (id: string) => {
    onChange({
      items: content.items.filter(item => item.id !== id),
    })
  }

  const addAchievement = (experienceId: string) => {
    onChange({
      items: content.items.map(item =>
        item.id === experienceId
          ? { ...item, achievements: [...item.achievements, ''] }
          : item
      ),
    })
  }

  const updateAchievement = (experienceId: string, index: number, value: string) => {
    onChange({
      items: content.items.map(item =>
        item.id === experienceId
          ? {
              ...item,
              achievements: item.achievements.map((a, i) =>
                i === index ? value : a
              ),
            }
          : item
      ),
    })
  }

  const removeAchievement = (experienceId: string, index: number) => {
    onChange({
      items: content.items.map(item =>
        item.id === experienceId
          ? {
              ...item,
              achievements: item.achievements.filter((_, i) => i !== index),
            }
          : item
      ),
    })
  }

  return (
    <div className="space-y-6">
      {content.items.map((experience, index) => (
        <motion.div
          key={experience.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-white font-medium">Expérience {index + 1}</h4>
            <button
              onClick={() => removeExperience(experience.id)}
              className="text-red-400 hover:text-red-300"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Titre du poste
                </label>
                <input
                  type="text"
                  value={experience.title}
                  onChange={(e) => updateExperience(experience.id, { title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Entreprise
                </label>
                <input
                  type="text"
                  value={experience.company}
                  onChange={(e) => updateExperience(experience.id, { company: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={experience.location}
                onChange={(e) => updateExperience(experience.id, { location: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date de début
                </label>
                <input
                  type="month"
                  value={experience.startDate}
                  onChange={(e) => updateExperience(experience.id, { startDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date de fin
                </label>
                <input
                  type="month"
                  value={experience.endDate}
                  onChange={(e) => updateExperience(experience.id, { endDate: e.target.value })}
                  disabled={experience.current}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`current-${experience.id}`}
                checked={experience.current}
                onChange={(e) => updateExperience(experience.id, {
                  current: e.target.checked,
                  endDate: e.target.checked ? undefined : experience.endDate,
                })}
                className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
              />
              <label
                htmlFor={`current-${experience.id}`}
                className="text-sm text-gray-400"
              >
                Poste actuel
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                value={experience.description}
                onChange={(e) => updateExperience(experience.id, { description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400">
                  Réalisations
                </label>
                <button
                  onClick={() => addAchievement(experience.id)}
                  className="text-primary-400 hover:text-primary-300"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {experience.achievements.map((achievement, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) => updateAchievement(experience.id, i, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => removeAchievement(experience.id, i)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}

      <button
        onClick={addExperience}
        className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
      >
        Ajouter une expérience
      </button>
    </div>
  )
}