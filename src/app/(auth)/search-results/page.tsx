'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Loader2, Trash2 } from 'lucide-react'

interface JobSuggestion {
  id: string
  user_id: string
  job_id: string | null
  match_score: number
  created_at: string
}

export default function SearchResultsPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<JobSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadResults()
  }, [user])

  const loadResults = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('job_suggestions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) {
        console.error('❌ Erreur chargement résultats:', fetchError)
        setError('Erreur lors du chargement des résultats')
        return
      }

      setResults(data || [])
      console.log('✅ Résultats chargés:', data)
    } catch (err) {
      console.error('❌ Erreur:', err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const deleteResult = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('job_suggestions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (deleteError) {
        console.error('❌ Erreur suppression:', deleteError)
        return
      }

      setResults(results.filter(r => r.id !== id))
      console.log('✅ Résultat supprimé')
    } catch (err) {
      console.error('❌ Erreur:', err)
    }
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Veuillez vous connecter</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Résultats de Recherche</h1>
          <p className="text-gray-400">Historique de tes recherches d'emploi avec scores IA</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <p className="text-gray-400 text-sm">Total de résultats</p>
            <p className="text-3xl font-bold text-white">{results.length}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <p className="text-gray-400 text-sm">Score moyen</p>
            <p className="text-3xl font-bold text-white">
              {results.length > 0
                ? (
                    results.reduce((sum, r) => sum + (r.match_score || 0), 0) /
                    results.length
                  ).toFixed(1)
                : '0'}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <p className="text-gray-400 text-sm">Offres de qualité (≥70)</p>
            <p className="text-3xl font-bold text-white">
              {results.filter(r => (r.match_score || 0) >= 70).length}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-400">Chargement des résultats...</span>
          </div>
        )}

        {/* Table */}
        {!loading && results.length > 0 && (
          <div className="bg-slate-700/30 rounded-lg border border-slate-600 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600 bg-slate-700/50">
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">Score IA</th>
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">Date</th>
                  <th className="px-6 py-3 text-left text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.id} className="border-b border-slate-600 hover:bg-slate-700/50">
                    <td className="px-6 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getScoreBadgeColor(result.match_score || 0)}`}>
                        {result.match_score?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      {new Date(result.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => deleteResult(result.id)}
                        className="text-gray-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <div className="bg-slate-700/30 rounded-lg border border-slate-600 border-dashed p-12 text-center">
            <p className="text-gray-400 mb-4">Aucun résultat de recherche pour le moment</p>
            <button
              onClick={() => window.location.href = '/app/jobs'}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Lancer une recherche
            </button>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadResults}
            disabled={loading}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                Chargement...
              </>
            ) : (
              'Actualiser'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
