import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../stores/auth'
import { supabase } from '../lib/supabase'
import {
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline'

interface CVSection {
  id: string
  type: 'education' | 'experience' | 'skills' | 'languages' | 'projects'
  title: string
  items: CVItem[]
}

interface CVItem {
  id: string
  title: string
  subtitle?: string
  location?: string
  startDate?: string
  endDate?: string
  current?: boolean
  description?: string
  tags?: string[]
}

function CVBuilder() {
  const { user } = useAuth()
  const [sections, setSections] = useState<CVSection[]>([
    {
      id: 'education',
      type: 'education',
      title: 'Formation',
      items: []
    },
    {
      id: 'experience',
      type: 'experience',
      title: 'Expérience professionnelle',
      items: []
    },
    {
      id: 'skills',
      type: 'skills',
      title: 'Compétences',
      items: []
    }
  ])
  const [loading, setLoading] = useState(false)

  const addItem = (sectionId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, {
            id: crypto.randomUUID(),
            title: '',
          }]
        }
      }
      return section
    }))
  }

  const updateItem = (sectionId: string, itemId: string, updates: Partial<CVItem>) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        }
      }
      return section
    }))
  }

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter(item => item.id !== itemId)
        }
      }
      return section
    }))
  }

  const moveItem = (sectionId: string, itemId: string, direction: 'up' | 'down') => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const items = [...section.items]
        const index = items.findIndex(item => item.id === itemId)
        
        if (direction === 'up' && index > 0) {
          // Ensure both items exist before swapping
          const currentItem = items[index]
          const previousItem = items[index - 1]
          if (currentItem && previousItem) {
            items[index] = previousItem
            items[index - 1] = currentItem
          }
        } else if (direction === 'down' && index < items.length - 1) {
          // Ensure both items exist before swapping
          const currentItem = items[index]
          const nextItem = items[index + 1]
          if (currentItem && nextItem) {
            items[index] = nextItem
            items[index + 1] = currentItem
          }
        }
        
        return { ...section, items }
      }
      return section
    }))
  }

  const saveCV = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('user_cvs')
        .upsert({
          user_id: user.id,
          content: sections,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving CV:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Créateur de CV</h1>
        <p className="text-gray-400 mt-1">
          Créez et personnalisez votre CV professionnel
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">
                {section.title}
              </h2>
              <button
                onClick={() => addItem(section.id)}
                className="btn-secondary flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {section.items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                        placeholder={`Titre ${section.type === 'education' ? 'du diplôme' : 'du poste'}`}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />

                      {section.type !== 'skills' && (
                        <>
                          <input
                            type="text"
                            value={item.subtitle}
                            onChange={(e) => updateItem(section.id, item.id, { subtitle: e.target.value })}
                            placeholder={section.type === 'education' ? "Nom de l'école" : "Nom de l'entreprise"}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="month"
                              value={item.startDate}
                              onChange={(e) => updateItem(section.id, item.id, { startDate: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <input
                              type="month"
                              value={item.endDate}
                              onChange={(e) => updateItem(section.id, item.id, { endDate: e.target.value })}
                              disabled={item.current}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`current-${item.id}`}
                              checked={item.current}
                              onChange={(e) => updateItem(section.id, item.id, { 
                                current: e.target.checked,
                                endDate: e.target.checked ? undefined : item.endDate
                              })}
                              className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
                            />
                            <label
                              htmlFor={`current-${item.id}`}
                              className="text-sm text-gray-400"
                            >
                              En cours
                            </label>
                          </div>

                          <textarea
                            value={item.description}
                            onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                            placeholder="Description"
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => moveItem(section.id, item.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => moveItem(section.id, item.id, 'down')}
                        disabled={index === section.items.length - 1}
                        className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                      >
                        <ArrowDownIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => removeItem(section.id, item.id)}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={saveCV}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le CV'}
        </button>
      </div>
    </div>
  )
}

export default CVBuilder;