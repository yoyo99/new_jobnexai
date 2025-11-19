import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../stores/auth'
import { supabase } from '../../lib/supabase'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { HeaderSection } from './sections/HeaderSection'
import { ExperienceSection } from './sections/ExperienceSection'
import { EducationSection } from './sections/EducationSection'
import { SkillsSection } from './sections/SkillsSection'
import { ProjectsSection } from './sections/ProjectsSection'

interface EditorProps {
  templateId: string
  onBack: () => void
}

export function CVEditor({ templateId, onBack }: EditorProps) {
  const { user } = useAuth()
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadCV()
  }, [templateId])

  const loadCV = async () => {
    try {
      setLoading(true)
      const { data: template, error: templateError } = await supabase
        .from('cv_templates')
        .select('structure')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError

      const { data: cv, error: cvError } = await supabase
        .from('user_cvs')
        .select('sections')
        .eq('user_id', user?.id)
        .eq('template_id', templateId)
        .single()

      if (!cvError) {
        setSections(cv.sections)
      } else {
        setSections(template.structure.sections)
      }
    } catch (error) {
      console.error('Error loading CV:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveCV = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const { error } = await supabase
        .from('user_cvs')
        .upsert({
          user_id: user?.id,
          template_id: templateId,
          sections,
        })

      if (error) throw error
      setMessage({ type: 'success', text: 'CV enregistré avec succès' })
    } catch (error) {
      console.error('Error saving CV:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement du CV' })
    } finally {
      setSaving(false)
    }
  }

  const updateSection = (index: number, content: any) => {
    setSections(prev =>
      prev.map((section, i) =>
        i === index ? { ...section, content } : section
      )
    )
  }

  const renderSectionEditor = (section: any, index: number) => {
    switch (section.type) {
      case 'header':
        return (
          <HeaderSection
            content={section.content}
            onChange={(content) => updateSection(index, content)}
          />
        )
      case 'experience':
        return (
          <ExperienceSection
            content={section.content}
            onChange={(content) => updateSection(index, content)}
          />
        )
      case 'education':
        return (
          <EducationSection
            content={section.content}
            onChange={(content) => updateSection(index, content)}
          />
        )
      case 'skills':
        return (
          <SkillsSection
            content={section.content}
            onChange={(content) => updateSection(index, content)}
          />
        )
      case 'projects':
        return (
          <ProjectsSection
            content={section.content}
            onChange={(content) => updateSection(index, content)}
          />
        )
      default:
        return (
          <div className="text-gray-400">
            Éditeur non disponible pour cette section
          </div>
        )
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
    <div className="w-1/2 bg-background border-r border-white/10 p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-medium text-white">Éditer votre CV</h2>
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <h3 className="text-white font-medium mb-4">{section.title}</h3>
            {renderSectionEditor(section, index)}
          </motion.div>
        ))}
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-900/50 text-green-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={saveCV}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}