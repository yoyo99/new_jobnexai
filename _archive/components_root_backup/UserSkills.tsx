import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'

interface Skill {
  id: string
  name: string
  category: string
}

interface UserSkill {
  id: string
  skill_id: string
  proficiency_level: number
  years_experience: number
  skill: Skill
}

export function UserSkills() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [proficiencyLevel, setProficiencyLevel] = useState<number>(3)
  const [yearsExperience, setYearsExperience] = useState<number>(0)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSkills()
    loadUserSkills()
  }, [user])

  const loadSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name')

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error('Error loading skills:', error)
    }
  }

  const loadUserSkills = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_skills')
        .select('*, skill:skills(*)')
        .eq('user_id', user?.id)

      if (error) throw error
      setUserSkills(data || [])
    } catch (error) {
      console.error('Error loading user skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSkill = async () => {
    if (!selectedSkill) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_skills')
        .upsert({
          user_id: user?.id,
          skill_id: selectedSkill,
          proficiency_level: proficiencyLevel,
          years_experience: yearsExperience,
        })

      if (error) throw error
      
      setMessage({ type: 'success', text: t('profile.personalInfo.updateSuccess') })
      loadUserSkills()
      setSelectedSkill('')
      setProficiencyLevel(3)
      setYearsExperience(0)
    } catch (error) {
      console.error('Error adding skill:', error)
      setMessage({ type: 'error', text: t('profile.personalInfo.updateError') })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('user_id', user?.id)
        .eq('skill_id', skillId)

      if (error) throw error
      setMessage({ type: 'success', text: t('profile.personalInfo.updateSuccess') })
      loadUserSkills()
    } catch (error) {
      console.error('Error removing skill:', error)
      setMessage({ type: 'error', text: t('profile.personalInfo.updateError') })
    } finally {
      setSaving(false)
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Ajouter une compétence</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionner une compétence</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={proficiencyLevel}
              onChange={(e) => setProficiencyLevel(Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="1">Débutant</option>
              <option value="2">Élémentaire</option>
              <option value="3">Intermédiaire</option>
              <option value="4">Avancé</option>
              <option value="5">Expert</option>
            </select>
          </div>
          <div>
            <input
              type="number"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value))}
              placeholder="Années d'expérience"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleAddSkill}
            disabled={!selectedSkill || saving}
            className="btn-primary"
          >
            {saving ? t('common.loading') : 'Ajouter la compétence'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Vos compétences</h3>
        <div className="space-y-4">
          {userSkills.map((userSkill) => (
            <motion.div
              key={userSkill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="text-white font-medium">{userSkill.skill.name}</h4>
                <p className="text-sm text-gray-400">
                  {userSkill.skill.category} • {userSkill.years_experience} ans
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= userSkill.proficiency_level
                          ? 'bg-primary-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => handleRemoveSkill(userSkill.skill_id)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  )
}