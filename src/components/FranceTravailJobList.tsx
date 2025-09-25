import React, { useState } from 'react'
import { useFranceTravailJobs, FranceTravailJobFilters } from '../hooks/useFranceTravailJobs'

interface Props {
  className?: string
}

export function FranceTravailJobList({ className }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [remoteOnly, setRemoteOnly] = useState<boolean | undefined>(undefined)
  const [salaryMin, setSalaryMin] = useState<number | undefined>(undefined)
  
  const filters: FranceTravailJobFilters = {
    motsCles: searchTerm || undefined,
    location: location || undefined,
    isRemote: remoteOnly,
    salaryMin,
    mock: true, // En mode mock pour l'instant
    limit: 20
  }

  const { jobs, loading, error, refetch } = useFranceTravailJobs(filters)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    refetch()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Formulaire de recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🇫🇷 Recherche France Travail
        </h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mots-clés
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: React, Python, Chef de projet..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Paris, Lyon, Marseille..."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salaire minimum (€)
              </label>
              <input
                type="number"
                value={salaryMin || ''}
                onChange={(e) => setSalaryMin(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 40000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de travail
              </label>
              <select
                value={remoteOnly === undefined ? '' : remoteOnly ? 'remote' : 'onsite'}
                onChange={(e) => setRemoteOnly(
                  e.target.value === 'remote' ? true : 
                  e.target.value === 'onsite' ? false : undefined
                )}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="remote">Télétravail uniquement</option>
                <option value="onsite">Présentiel uniquement</option>
              </select>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {/* Résultats */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Résultats ({jobs.length})
            </h3>
            {error && (
              <div className="text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Chargement des offres...</p>
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune offre trouvée pour ces critères</p>
            </div>
          )}

          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {job.title}
                    </h4>
                    
                    {job.company && (
                      <p className="text-sm text-gray-600 mb-2">
                        🏢 {job.company}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      {job.location && (
                        <span>📍 {job.location}</span>
                      )}
                      
                      {job.contractType && job.contractType.length > 0 && (
                        <span>📝 {job.contractType.join(', ')}</span>
                      )}
                      
                      {job.salary && (
                        <span>💰 {job.salary}€</span>
                      )}
                      
                      {job.isRemote && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          🏠 Télétravail
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {job.description}
                    </p>
                    
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="text-gray-500 text-xs">
                            +{job.skills.length - 5} autres
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Voir l'offre
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
