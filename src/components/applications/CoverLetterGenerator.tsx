import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../stores/auth';
import { supabase } from '../../lib/supabase';
import { generateCoverLetter } from '../../services/aiService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowPathIcon,
  ClipboardIcon,
  CheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../LoadingSpinner';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  matchScore?: number;
}

export function CoverLetterGenerator() {
  const { user } = useAuth();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<string>('fr');
  const [tone, setTone] = useState<'professional' | 'conversational' | 'enthusiastic'>('professional');
  const [localError, setLocalError] = useState<string | null>(null);

  // --- DATA FETCHING with React Query ---
  const { data: jobs, isLoading: isLoadingJobs, error: jobsError } = useQuery<Job[], Error>({
    queryKey: ['jobs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: suggestions, error } = await supabase
        .from('job_suggestions')
        .select('job_id, match_score, job:jobs(id, title, company, location, description, url)')
        .eq('user_id', user.id)
        .order('match_score', { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return (suggestions as any[])
        .filter(s => s.job)
        .map(s => ({ ...s.job, matchScore: s.match_score }));
    },
    enabled: !!user,
  });

  const { data: cv, isLoading: isLoadingCV, error: cvError } = useQuery<any, Error>({
    queryKey: ['cv', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('user_cvs').select('content').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data?.content || null;
    },
    enabled: !!user,
  });

  // --- MUTATION with React Query ---
  const { mutate: runGenerateCoverLetter, isPending: isGenerating, data: coverLetter, error: generationError } = useMutation<string, Error, { jobId: string; cv: any }>({
    mutationFn: async ({ jobId, cv }) => {
      const selectedJob = jobs?.find(j => j.id === jobId);
      if (!selectedJob) throw new Error('Offre d\'emploi non trouvée');
      if (!user?.id) throw new Error('Utilisateur non authentifié');
      return generateCoverLetter(JSON.stringify(cv), selectedJob.description, language, tone, user.id);
    },
    onSuccess: () => {
      setLocalError(null);
    },
  });

  const handleGenerateClick = () => {
    setLocalError(null);
    if (!cv) {
      setLocalError('Veuillez d\'abord créer un CV dans la section CV Builder');
      return;
    }
    if (!selectedJobId) {
      setLocalError('Veuillez sélectionner une offre d\'emploi');
      return;
    }
    runGenerateCoverLetter({ jobId: selectedJobId, cv });
  };

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoadingJobs || isLoadingCV) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Chargement des données..." />
      </div>
    );
  }

  const displayError = localError || generationError?.message || jobsError?.message || cvError?.message;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Générateur de lettres de motivation</h2>

      {displayError && (
        <div className="bg-red-900/50 text-red-400 p-4 rounded-lg">
          {displayError}
        </div>
      )}

      {!isLoadingCV && !cv && !cvError && (
        <div className="bg-yellow-900/50 text-yellow-400 p-4 rounded-lg">
          Veuillez d'abord créer un CV dans la section CV Builder pour utiliser cette fonctionnalité.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">1. Sélectionnez une offre d'emploi</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {jobs && jobs.length > 0 ? (
              jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${selectedJobId === job.id
                      ? 'bg-primary-500/30 ring-2 ring-primary-500'
                      : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                  <div className="font-bold">{job.title}</div>
                  <div className="text-sm text-gray-400">{job.company} - {job.location}</div>
                  {job.matchScore && (
                    <div className="text-xs text-primary-400 mt-1">Score de compatibilité: {job.matchScore}%</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                Aucune offre d'emploi correspondante trouvée.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">2. Configurez la génération</h3>
          <div className="bg-white/10 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Langue
              </label>
              <div className="flex gap-2">
                <button onClick={() => setLanguage('fr')} className={`px-4 py-2 rounded-lg text-sm ${language === 'fr' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  Français
                </button>
                <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-sm ${language === 'en' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  English
                </button>
                <button onClick={() => setLanguage('es')} className={`px-4 py-2 rounded-lg text-sm ${language === 'es' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  Español
                </button>
                <button onClick={() => setLanguage('de')} className={`px-4 py-2 rounded-lg text-sm ${language === 'de' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  Deutsch
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Ton</label>
              <div className="flex gap-2">
                <button onClick={() => setTone('professional')} className={`px-4 py-2 rounded-lg text-sm ${tone === 'professional' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  Professionnel
                </button>
                <button onClick={() => setTone('conversational')} className={`px-4 py-2 rounded-lg text-sm ${tone === 'conversational' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  Conversationnel
                </button>
                <button onClick={() => setTone('enthusiastic')} className={`px-4 py-2 rounded-lg text-sm ${tone === 'enthusiastic' ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                  Enthousiaste
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating || !selectedJobId || !cv}
                className="btn-primary flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5" />
                    Générer la lettre de motivation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {coverLetter && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Lettre de motivation générée</h3>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Régénérer
              </button>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Copié !
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-5 w-5" />
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-6 whitespace-pre-line">
            <p className="text-white">{coverLetter}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}