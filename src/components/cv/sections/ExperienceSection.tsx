import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Sparkles, TrashIcon } from 'lucide-react';
import { Experience } from '@/types/cv';
import { optimizeText } from '@/lib/ai';
import { Autocomplete } from '@/components/shared/Autocomplete';
import { Suggestion } from '@/types/suggestion';

interface ExperienceProps {
  items: Experience[];
  onChange: (items: Experience[]) => void;
}

export function ExperienceSection({ items, onChange }: ExperienceProps) {
  const [repository, setRepository] = useState<'rome' | 'esco'>('rome');
  const [optimizingExperienceId, setOptimizingExperienceId] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: Experience = {
      id: crypto.randomUUID(),
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
    };
    onChange([...items, newExperience]);
  };

  const removeExperience = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const updateExperience = (id: string, updates: Partial<Experience>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const addAchievement = (experienceId: string) => {
    onChange(
      items.map((item) =>
        item.id === experienceId
          ? { ...item, achievements: [...item.achievements, ''] }
          : item
      )
    );
  };

  const removeAchievement = (experienceId: string, achievementIndex: number) => {
    onChange(
      items.map((item) =>
        item.id === experienceId
          ? {
              ...item,
              achievements: item.achievements.filter(
                (_, i) => i !== achievementIndex
              ),
            }
          : item
      )
    );
  };

  const updateAchievement = (
    experienceId: string,
    achievementIndex: number,
    value: string
  ) => {
    onChange(
      items.map((item) =>
        item.id === experienceId
          ? {
              ...item,
              achievements: item.achievements.map((ach, i) =>
                i === achievementIndex ? value : ach
              ),
            }
          : item
      )
    );
  };

    const handleOptimizeDescription = async (id: string, text: string) => {
    setOptimizingExperienceId(id);
    try {
      const optimizedDescription = await optimizeText(text);
      updateExperience(id, { description: optimizedDescription });
    } catch (error) {
      console.error('Failed to optimize description:', error);
    } finally {
      setOptimizingExperienceId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-semibold">Expérience Professionnelle</h3>
          <div className="bg-white/5 p-1 rounded-lg flex text-sm">
            <button 
              onClick={() => setRepository('rome')}
              className={`px-3 py-1 rounded-md transition-colors ${repository === 'rome' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
              France (ROME)
            </button>
            <button 
              onClick={() => setRepository('esco')}
              className={`px-3 py-1 rounded-md transition-colors ${repository === 'esco' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:bg-white/10'}`}>
              Europe (ESCO)
            </button>
          </div>
        </div>
        <button
          onClick={addExperience}
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={20} />
          Ajouter une expérience
        </button>
      </div>

      <div className="space-y-4">
        {items.map((experience) => (
          <motion.div
            key={experience.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white/5 rounded-lg p-6 flex gap-x-6"
          >
            {/* Colonne de gauche pour les dates */}
            <div className="w-1/4 space-y-2 text-sm text-gray-400">
              <div>
                <label className="block font-medium mb-1">Date de début</label>
                <input
                  type="month"
                  value={experience.startDate}
                  onChange={(e) => updateExperience(experience.id, { startDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              {!experience.current && (
                <div>
                  <label className="block font-medium mb-1">Date de fin</label>
                  <input
                    type="month"
                    value={experience.endDate}
                    onChange={(e) => updateExperience(experience.id, { endDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id={`current-${experience.id}`}
                  checked={experience.current}
                  onChange={(e) => updateExperience(experience.id, { current: e.target.checked, endDate: e.target.checked ? undefined : experience.endDate })}
                  className="rounded border-white/10 bg-white/5 text-primary-500 focus:ring-primary-500"
                />
                <label htmlFor={`current-${experience.id}`}>Poste actuel</label>
              </div>
            </div>

            {/* Colonne de droite pour les détails */}
            <div className="flex-1 space-y-4">
              <Autocomplete
                value={experience.title}
                onChange={(value) => updateExperience(experience.id, { title: value })}
                onSelect={(suggestion) => {
                  updateExperience(experience.id, {
                    title: suggestion.label,
                    romeCode: suggestion.code, // La clé reste la même pour la simplicité
                  });
                }}
                apiEndpoint={repository === 'rome' ? '/api/rome-search' : '/api/esco-search'}
              />
              
              <div className="flex items-center gap-4 text-gray-400">
                <input
                  type="text"
                  placeholder="Entreprise"
                  value={experience.company}
                  onChange={(e) => updateExperience(experience.id, { company: e.target.value })}
                  className="w-1/2 bg-transparent focus:outline-none placeholder-gray-500"
                />
                <span className="text-gray-600">|</span>
                <input
                  type="text"
                  placeholder="Lieu"
                  value={experience.location}
                  onChange={(e) => updateExperience(experience.id, { location: e.target.value })}
                  className="w-1/2 bg-transparent focus:outline-none placeholder-gray-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-400">Description</label>
                  <button 
                    type="button"
                    onClick={() => handleOptimizeDescription(experience.id, experience.description)}
                    disabled={!experience.description || optimizingExperienceId === experience.id}
                    className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {optimizingExperienceId === experience.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Optimisation...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Optimiser
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  placeholder="Décrivez vos missions et responsabilités..."
                  value={experience.description}
                  onChange={(e) => updateExperience(experience.id, { description: e.target.value })}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Réalisations</label>
                <ul className="space-y-2 list-disc list-inside">
                  {experience.achievements.map((achievement, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Augmentation du chiffre d'affaires de 20%"
                        value={achievement}
                        onChange={(e) => updateAchievement(experience.id, i, e.target.value)}
                        className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-500"
                      />
                      <button
                        onClick={() => removeAchievement(experience.id, i)}
                        className="text-red-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => addAchievement(experience.id)}
                  className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  + Ajouter une réalisation
                </button>
              </div>
            </div>

            <button
              onClick={() => removeExperience(experience.id)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}