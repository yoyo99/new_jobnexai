import { useState } from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface SkillCategory {
  id: string
  name: string
  skills: string[]
}

interface SkillsProps {
  content: {
    categories: SkillCategory[]
  }
  onChange: (content: any) => void
}

export function SkillsSection({ content, onChange }: SkillsProps) {
  const addCategory = () => {
    const newCategory: SkillCategory = {
      id: crypto.randomUUID(),
      name: '',
      skills: [],
    }

    onChange({
      categories: [...content.categories, newCategory],
    })
  }

  const updateCategory = (id: string, updates: Partial<SkillCategory>) => {
    onChange({
      categories: content.categories.map(category =>
        category.id === id ? { ...category, ...updates } : category
      ),
    })
  }

  const removeCategory = (id: string) => {
    onChange({
      categories: content.categories.filter(category => category.id !== id),
    })
  }

  const addSkill = (categoryId: string) => {
    onChange({
      categories: content.categories.map(category =>
        category.id === categoryId
          ? { ...category, skills: [...category.skills, ''] }
          : category
      ),
    })
  }

  const updateSkill = (categoryId: string, index: number, value: string) => {
    onChange({
      categories: content.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              skills: category.skills.map((skill, i) =>
                i === index ? value : skill
              ),
            }
          : category
      ),
    })
  }

  const removeSkill = (categoryId: string, index: number) => {
    onChange({
      categories: content.categories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              skills: category.skills.filter((_, i) => i !== index),
            }
          : category
      ),
    })
  }

  return (
    <div className="space-y-6">
      {content.categories.map((category, index) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={category.name}
                onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                placeholder="Nom de la catégorie"
                className="w-full bg-transparent text-white font-medium focus:outline-none"
              />
            </div>
            <button
              onClick={() => removeCategory(category.id)}
              className="text-red-400 hover:text-red-300"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            {category.skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateSkill(category.id, i, e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={() => removeSkill(category.id, i)}
                  className="text-red-400 hover:text-red-300"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}

            <button
              onClick={() => addSkill(category.id)}
              className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Ajouter une compétence
            </button>
          </div>
        </motion.div>
      ))}

      <button
        onClick={addCategory}
        className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
      >
        Ajouter une catégorie
      </button>
    </div>
  )
}