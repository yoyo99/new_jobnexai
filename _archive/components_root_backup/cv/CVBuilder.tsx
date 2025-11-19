import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../stores/auth'
import { supabase } from '../../lib/supabase'
import { CVTemplate } from './CVTemplate'
import { CVEditor } from './CVEditor'
import { CVPreview } from './CVPreview'

interface Template {
  id: string
  name: string
  description: string
  structure: any
  category: string
}

export function CVBuilder() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cv_templates')
        .select('*')
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
      </div>
    )
  }

  if (!selectedTemplate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Créer votre CV</h1>
          <p className="text-gray-400 mt-1">
            Choisissez un modèle pour commencer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <CVTemplate
              key={template.id}
              template={template}
              onSelect={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <CVEditor
        templateId={selectedTemplate}
        onBack={() => setSelectedTemplate(null)}
      />
      <CVPreview templateId={selectedTemplate} />
    </div>
  )
}