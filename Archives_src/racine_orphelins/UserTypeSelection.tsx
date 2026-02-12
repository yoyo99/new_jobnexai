import React from 'react';
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../stores/auth'
import {
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

export function UserTypeSelection() {
  const { user, loadUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleUserTypeSelection = async (userType: 'candidate' | 'freelancer' | 'recruiter') => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Mettre à jour le profil utilisateur avec le type sélectionné
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: userType })
        .eq('id', user.id)

      if (error) throw error

      // Recharger les informations utilisateur
      await loadUser()

      // Rediriger vers la page appropriée en fonction du type d'utilisateur
      switch (userType) {
        case 'candidate':
          navigate('/dashboard')
          break
        case 'freelancer':
          navigate('/freelance/projects')
          break
        case 'recruiter':
          navigate('/recruiter/dashboard')
          break
      }
    } catch (error: any) {
      console.error('Error setting user type:', error)
      setError(error.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Bienvenue sur JobNexAI
          </h2>
          <p className="mt-2 text-gray-400">
            Veuillez sélectionner votre profil pour continuer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 rounded-xl p-6 text-center cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => handleUserTypeSelection('candidate')}
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-600/20 mb-4">
              <UserIcon className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Candidat</h3>
            <p className="text-gray-400 text-sm">
              Je cherche un emploi et souhaite utiliser les outils de recherche d'emploi et de gestion de candidatures.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 rounded-xl p-6 text-center cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => handleUserTypeSelection('freelancer')}
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-secondary-600/20 mb-4">
              <DocumentTextIcon className="h-8 w-8 text-secondary-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Freelance</h3>
            <p className="text-gray-400 text-sm">
              Je suis freelance et je cherche des projets ou des missions. J'ai besoin d'outils pour gérer mon activité.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 rounded-xl p-6 text-center cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => handleUserTypeSelection('recruiter')}
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-600/20 mb-4">
              <BriefcaseIcon className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Recruteur</h3>
            <p className="text-gray-400 text-sm">
              Je suis recruteur et je cherche des candidats pour mes offres d'emploi ou des freelances pour des missions.
            </p>
          </motion.div>
        </div>

        {error && (
          <div className="bg-red-900/50 text-red-400 p-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-400"></div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500">
          Vous pourrez modifier votre profil ultérieurement dans les paramètres de votre compte.
        </p>
      </motion.div>
    </div>
  )
}