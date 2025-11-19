import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Project {
  id: string
  name: string
  description: string
  technologies: string[]
  url?: string
  startDate: string
  endDate?: string
  current: boolean
}

interface ProjectsProps {
  content: {
    items: Project[]
  }
  onChange: (content: any) => void
}

export function ProjectsSection({ content, onChange }: ProjectsProps) {
  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      technologies: [],
      startDate: '',
      current: false,
    }

    onChange({
      items: [...content.items, newProject],
    })
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    onChange({
      items: content.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })
  }

  const removeProject = (id: string) => {
    onChange({
      items: content.items.filter(item => item.id !== id),
    })
  }

  const addTechnology = (projectId: string) => {
    onChange({
      items: content.items.map(item =>
        item.id === projectId
          ? { ...item, technologies: [...item.technologies, ''] }
          : item
      ),
    })
  }

  const updateTechnology = (projectId: string, index: number, value: string) => {
    onChange({
      items: content.items.map(item =>
        item.id === projectId
          ? {
              ...item,
              technologies: item.technologies.map((tech, i) =>
                i === index ? value : tech
              ),
            }
          : item
      ),
    })
  }

  const removeTechnology = (projectId: string, index: number) => {
    onChange({
      items: content.items.map(item =>
        item.id === projectId
          ? {
              ...item,
              technologies: item.technologies.filter((_, i) => i !== index),
            }
          : item
      ),
    })
  }

  return (
    <div className="space-y-6">
      {content.items.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-white font-medium">Projet {index + 1}</h4>
            <button
              onClick={() => removeProject(project.id)}
              className="text-red-400 hover:text-red-300"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nom du projet
              </label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => updateProject(project.id, { name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Description
              </label>
              <textarea
                value={project.description}
                onChange={(e) => updateProject(project.id, { description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                URL du projet (optionnel)
              </label>
              <input
                type="url"
                value={project.url}
                onChange={(e) => updateProject(project.id, { url: e.target.value })}
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
                  value={project.startDate}
                  onChange={(e) => updateProject(project.id, { startDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date de fin
                </label>
                <input
                  type="month"
                  value={project.endDate}
                  onChange={(e) => updateProject(project.id, { endDate: e.target.value })}
                  disabled={project.current}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`current-${project.id}`}
                checked={project.current}
                onChange={(e) => updateProject(project.id, {
                  current: e.target.checked,
                  endDate: e.target.checked ? undefined : project.endDate,
                })}
                className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
              />
              <label
                htmlFor={`current-${project.id}`}
                className="text-sm text-gray-400"
              >
                Projet en cours
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400">
                  Technologies utilisées
                </label>
                <button
                  onClick={() => addTechnology(project.id)}
                  className="text-primary-400 hover:text-primary-300"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {project.technologies.map((tech, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tech}
                      onChange={(e) => updateTechnology(project.id, i, e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => removeTechnology(project.id, i)}
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
        onClick={addProject}
        className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
      >
        Ajouter un projet
      </button>
    </div>
  )
}