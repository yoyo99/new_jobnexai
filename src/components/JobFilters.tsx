import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export interface JobFilters {
  search: string;
  location: string;
  contractTypes: string[];
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel: string;
  companySize: string;
  remote: boolean | null; // null = tous, true = remote uniquement, false = présentiel uniquement
  tags: string[];
  sortBy: 'relevance' | 'date' | 'salary' | 'match_score';
  sortOrder: 'asc' | 'desc';
}

interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  availableTags?: string[];
  jobCount?: number;
}

const JobFiltersComponent: React.FC<JobFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTags = [],
  jobCount = 0
}) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<JobFilters>(filters);

  const contractTypeOptions = [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    { value: 'Stage', label: 'Stage' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Alternance', label: 'Alternance' },
    { value: 'Temps partiel', label: 'Temps partiel' }
  ];

  const experienceLevelOptions = [
    { value: '', label: 'Tous niveaux' },
    { value: 'junior', label: 'Junior (0-2 ans)' },
    { value: 'intermediate', label: 'Intermédiaire (2-5 ans)' },
    { value: 'senior', label: 'Senior (5+ ans)' },
    { value: 'lead', label: 'Lead/Manager' }
  ];

  const companySizeOptions = [
    { value: '', label: 'Toutes tailles' },
    { value: 'startup', label: 'Startup (1-50)' },
    { value: 'medium', label: 'PME (50-250)' },
    { value: 'large', label: 'Grande entreprise (250+)' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'date', label: 'Date de publication' },
    { value: 'salary', label: 'Salaire' },
    { value: 'match_score', label: 'Score de compatibilité' }
  ];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleContractType = (contractType: string) => {
    const newTypes = localFilters.contractTypes.includes(contractType)
      ? localFilters.contractTypes.filter(t => t !== contractType)
      : [...localFilters.contractTypes, contractType];
    updateFilter('contractTypes', newTypes);
  };

  const toggleTag = (tag: string) => {
    const newTags = localFilters.tags.includes(tag)
      ? localFilters.tags.filter(t => t !== tag)
      : [...localFilters.tags, tag];
    updateFilter('tags', newTags);
  };

  const clearFilters = () => {
    const defaultFilters: JobFilters = {
      search: '',
      location: '',
      contractTypes: [],
      experienceLevel: '',
      companySize: '',
      remote: null,
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return localFilters.search !== '' ||
           localFilters.location !== '' ||
           localFilters.contractTypes.length > 0 ||
           localFilters.experienceLevel !== '' ||
           localFilters.companySize !== '' ||
           localFilters.remote !== null ||
           localFilters.tags.length > 0 ||
           localFilters.salaryMin !== undefined ||
           localFilters.salaryMax !== undefined;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 mb-6">
      {/* En-tête avec compteur et boutons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FunnelIcon className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Filtres</h3>
          {jobCount > 0 && (
            <span className="bg-primary-600/20 text-primary-400 px-3 py-1 rounded-full text-sm">
              {jobCount} offre{jobCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showAdvanced ? 'Masquer' : 'Filtres avancés'}
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtres principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Recherche */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un poste, entreprise..."
            value={localFilters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Localisation */}
        <div>
          <input
            type="text"
            placeholder="Ville, région..."
            value={localFilters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Tri */}
        <div className="flex space-x-2">
          <select
            value={localFilters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => updateFilter('sortOrder', localFilters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
            title={localFilters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
          >
            {localFilters.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Types de contrat */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Types de contrat
        </label>
        <div className="flex flex-wrap gap-2">
          {contractTypeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => toggleContractType(option.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                localFilters.contractTypes.includes(option.value)
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remote */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Mode de travail
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => updateFilter('remote', null)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              localFilters.remote === null
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => updateFilter('remote', true)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              localFilters.remote === true
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Remote
          </button>
          <button
            onClick={() => updateFilter('remote', false)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              localFilters.remote === false
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Présentiel
          </button>
        </div>
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-4 border-t border-white/10"
        >
          {/* Niveau d'expérience */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Niveau d'expérience
            </label>
            <select
              value={localFilters.experienceLevel}
              onChange={(e) => updateFilter('experienceLevel', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {experienceLevelOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-gray-800">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Taille d'entreprise */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Taille d'entreprise
            </label>
            <select
              value={localFilters.companySize}
              onChange={(e) => updateFilter('companySize', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {companySizeOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-gray-800">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fourchette de salaire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Salaire min (€/an)
              </label>
              <input
                type="number"
                placeholder="30000"
                value={localFilters.salaryMin || ''}
                onChange={(e) => updateFilter('salaryMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Salaire max (€/an)
              </label>
              <input
                type="number"
                placeholder="80000"
                value={localFilters.salaryMax || ''}
                onChange={(e) => updateFilter('salaryMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Tags/Compétences */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Compétences recherchées
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      localFilters.tags.includes(tag)
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default JobFiltersComponent;
