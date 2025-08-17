import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../stores/auth';
import { useTranslation } from 'react-i18next';
import { CVMetadata, getUserCVs, invokeExtractCvText, invokeGenerateCoverLetter, pollGeneratedContent, GenerationStatus, exportCoverLetterFromContent } from '../lib/supabase'; // Importer aussi les fonctions pour les lettres de motivation plus tard
import { FaFileAlt, FaSpinner, FaTrash, FaMagic, FaSave, FaDownload, FaPencilAlt, FaEye } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

// Importer CoverLetterMetadata et activer createCoverLetter pour la sauvegarde
import { CoverLetterMetadata, createCoverLetter /*, getUserCoverLetters, updateCoverLetter, deleteCoverLetter */ } from '../lib/supabase';

interface CoverLetterGeneratorProps {
  initialJobTitle?: string;
  initialCompanyName?: string;
  initialJobDescription?: string;
  onLetterGenerated?: (letterContent: string, letterMetadata: Omit<CoverLetterMetadata, 'id' | 'created_at' | 'updated_at'>) => void; // Callback pour quand une lettre est générée/sauvegardée
  // onClose?: () => void; // Utile si utilisé dans un modal
}

const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  initialJobTitle = '',
  initialCompanyName = '',
  initialJobDescription = '',
  onLetterGenerated,
  // onClose
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // États pour le formulaire
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [userCVs, setUserCVs] = useState<CVMetadata[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<string>('fr'); // Langue par défaut ou à détecter

  // États pour la lettre générée
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [editingLetter, setEditingLetter] = useState<string>(''); // Pour la modification
  const [isSaving, setIsSaving] = useState(false);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null); // Pour l'export
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Pour basculer entre l'aperçu et l'édition

  // États généraux
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Charger les CVs de l'utilisateur pour la sélection
  const fetchUserCVs = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);
      setFeedbackMessage(null);
      try {
        const cvs = await getUserCVs(user.id);
        if (cvs && cvs.length > 0) {
          setUserCVs(cvs);
          const primaryCV = cvs.find(cv => cv.is_primary);
          setSelectedCvId(primaryCV ? primaryCV.id : cvs[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch user CVs:', err);
        const errorMessage = err instanceof Error ? err.message : t('coverLetterGenerator.errors.fetchCvError');
        setFeedbackMessage({ type: 'error', text: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  // La fonction `t` est stable et ne doit pas être dans les dépendances.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Dépendances de la fonction de fetch

  useEffect(() => {
    fetchUserCVs();
  }, [fetchUserCVs]); // S'exécute uniquement si la fonction fetchUserCVs change

  // Mettre à jour les états si les props initiales changent
  useEffect(() => {
    setJobTitle(initialJobTitle || '');
  }, [initialJobTitle]);

  useEffect(() => {
    setCompanyName(initialCompanyName || '');
  }, [initialCompanyName]);

  useEffect(() => {
    setJobDescription(initialJobDescription || '');
  }, [initialJobDescription]);

  // Effect for polling the generation status
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const result: GenerationStatus = await pollGeneratedContent(taskId);
        if (result.status === 'completed') {
          clearInterval(interval);
          const finalContent = result.content || '';

          setGeneratedLetter(finalContent);
          setEditingLetter(finalContent);
          setIsGenerating(false);
          setIsEditing(false); // Afficher l'aperçu par défaut
          setLastTaskId(taskId);
          setTaskId(null);
          setFeedbackMessage({ type: 'success', text: t('coverLetterGenerator.feedback.generationSuccess') });
        } else if (result.status === 'failed') {
          clearInterval(interval);
          setFeedbackMessage({ type: 'error', text: result.error || t('coverLetterGenerator.errors.generationError') });
          setIsGenerating(false);
          setTaskId(null);
        }
        // If status is 'pending', do nothing and wait for the next poll
      } catch (err) {
        clearInterval(interval);
        const errorMessage = err instanceof Error ? err.message : t('coverLetterGenerator.errors.pollingError');
        setFeedbackMessage({ type: 'error', text: errorMessage });
        setIsGenerating(false);
        setTaskId(null);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup function to clear the interval when the component unmounts or taskId changes
    return () => clearInterval(interval);
  }, [taskId, t]);

  const handleGenerateLetter = async () => {
    if (!user?.id || !selectedCvId || !jobDescription) {
      setFeedbackMessage({ type: 'error', text: t('coverLetterGenerator.errors.formInvalid') });
      return;
    }

    setIsGenerating(true);
    setFeedbackMessage(null);
    setGeneratedLetter('');
    setEditingLetter('');
    setTaskId(null);

    try {
      const selectedCV = userCVs.find(cv => cv.id === selectedCvId);
      if (!selectedCV) {
        throw new Error('Selected CV not found.');
      }

      const cvText = await invokeExtractCvText(selectedCV.storage_path);

      const newTaskId = await invokeGenerateCoverLetter(
        cvText,
        jobTitle,
        companyName,
        jobDescription,
        targetLanguage,
        customInstructions
      );

      setTaskId(newTaskId);
      // Le polling est maintenant géré par le hook useEffect

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('coverLetterGenerator.errors.startGenerationError');
      setFeedbackMessage({ type: 'error', text: errorMessage });
      setIsGenerating(false);
    }
  };
  
  const handleSaveLetter = async () => {
    if (!user?.id || !editingLetter || !selectedCvId) {
      setFeedbackMessage({ type: 'error', text: t('coverLetterGenerator.errors.saveFailed') });
      return;
    }
    setIsSaving(true);
    try {
      const letterDataToSave: Omit<CoverLetterMetadata, 'id' | 'created_at' | 'updated_at'> & { user_id: string } = {
        user_id: user.id,
        cv_id_used: selectedCvId,
        job_title: jobTitle || null,
        company_name: companyName || null,
        job_description_details: jobDescription || null, // Le champ original était jobDescription, ici c'est le contenu de la description de l'offre
        cover_letter_content: editingLetter,
        language: targetLanguage,
        custom_instructions: customInstructions || null,
        ai_model_used: 'placeholder_model', // TODO: Mettre à jour avec le vrai modèle si applicable
      };
      
      // Création réelle de la lettre côté base
      const savedLetter = await createCoverLetter(letterDataToSave);
      console.log('Lettre sauvegardée:', savedLetter);

      setFeedbackMessage({ type: 'success', text: t('coverLetterGenerator.success.saved') });
      if (onLetterGenerated) {
        onLetterGenerated(editingLetter, letterDataToSave);
      }
    } catch (err: any) {
      console.error('Failed to save cover letter:', err);
      setFeedbackMessage({ type: 'error', text: err.message || t('coverLetterGenerator.errors.saveFailed') });
    }
    setIsSaving(false);
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!editingLetter || editingLetter.trim().length === 0) {
      setFeedbackMessage({ type: 'error', text: 'Export impossible: aucun contenu de lettre à exporter.' });
      return;
    }
    setIsExporting(true);
    try {
      const filenameBase = `${companyName ? companyName + '-' : ''}${jobTitle || 'Cover-Letter'}`.trim() || 'Cover-Letter';
      const res = await exportCoverLetterFromContent(editingLetter, format, filenameBase);
      if ((res as any).signedUrl) {
        window.open((res as any).signedUrl, '_blank');
        setFeedbackMessage({ type: 'success', text: 'Export réussi. Le téléchargement va démarrer.' });
      } else {
        setFeedbackMessage({ type: 'success', text: 'Export terminé.' });
      }
    } catch (err: any) {
      console.error('Export cover letter failed:', err);
      setFeedbackMessage({ type: 'error', text: err.message || 'Échec de l’export de la lettre.' });
    }
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-semibold text-primary-400 flex items-center">
        <FaFileAlt className="mr-3" /> {t('coverLetterGenerator.title')}
      </h2>

      {feedbackMessage && (
                        <div role="alert" data-testid="feedback-alert" className={`p-3 rounded-md text-sm ${feedbackMessage.type === 'success' ? 'bg-green-800' : 'bg-red-800'}`}>
          {feedbackMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulaire de saisie */} 
        <div className="space-y-4 p-6 bg-gray-800 rounded-lg shadow-lg">
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300">{t('coverLetterGenerator.labels.jobTitle')}</label>
            <input type="text" id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} disabled={isGenerating} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300">{t('coverLetterGenerator.labels.companyName')}</label>
            <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isGenerating} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-300">{t('coverLetterGenerator.labels.jobDescription')}</label>
            <textarea id="jobDescription" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} disabled={isGenerating} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder={t('coverLetterGenerator.placeholders.jobDescription')} />
          </div>
          <div>
            <label htmlFor="selectedCvId" className="block text-sm font-medium text-gray-300">{t('coverLetterGenerator.labels.cv')}</label>
            <select 
              id="selectedCvId" 
              value={selectedCvId || ''} 
              onChange={(e) => setSelectedCvId(e.target.value)}
              disabled={isLoading || isGenerating}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="" disabled>{t('coverLetterGenerator.placeholders.selectCv')}</option>
              {userCVs.map(cv => (
                <option key={cv.id} value={cv.id}>{cv.file_name} ({new Date(cv.uploaded_at).toLocaleDateString()})</option>
              ))}
            </select>
            {isLoading && <FaSpinner className="animate-spin text-primary-500 ml-2" />}{/* Ajout d'un margin-left pour le spinner */}
          </div>
        </div>
        <div>
          <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-300">{t('coverLetterGenerator.labels.customInstructions')}</label>
          <textarea id="customInstructions" value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} rows={3} disabled={isGenerating} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder={t('coverLetterGenerator.placeholders.customInstructions')} />
        </div>
        <div>
          <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-300">{t('coverLetterGenerator.labels.language')}</label>
          <select id="targetLanguage" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} disabled={isGenerating} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
            <option value="fr">{t('languages.fr')}</option>
            <option value="en">{t('languages.en')}</option>
            <option value="es">{t('languages.es')}</option>
            <option value="de">{t('languages.de')}</option>
            <option value="it">{t('languages.it')}</option>
            {/* Ajouter d'autres langues si nécessaire */}
          </select>
        </div>
        <button 
          onClick={handleGenerateLetter}
          disabled={isGenerating || !selectedCvId || !jobDescription}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isGenerating ? <FaSpinner className="animate-spin mr-2" /> : <FaMagic className="mr-2" />} 
          {t('coverLetterGenerator.buttons.generate')}
        </button>
      </div>

      {/* Zone d'affichage et d'édition de la lettre */} 
      <div className="space-y-4 p-6 bg-gray-800 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-300">{t('coverLetterGenerator.labels.generatedLetter')}</h3>
        {isGenerating && !generatedLetter && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FaSpinner className="animate-spin text-4xl mb-3" />
            <p>{t('coverLetterGenerator.generating')}</p>
          </div>
        )}
        {(!isGenerating && !generatedLetter) && (
          <>
            <div className="flex flex-col items-center justify-center h-full text-gray-500 italic border-2 border-dashed border-gray-700 rounded-md p-4">
              <FaFileAlt className="text-4xl mb-3" />
              <p>{t('coverLetterGenerator.notGeneratedYet')}</p>
            </div>
            <button 
              onClick={handleGenerateLetter}
              disabled={isGenerating || !selectedCvId || !jobDescription}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isGenerating ? <FaSpinner className="animate-spin mr-2" /> : <FaMagic className="mr-2" />} 
              {t('coverLetterGenerator.buttons.generate')}
            </button>
          </>
        )}
          {generatedLetter && (
            <div className="space-y-4">
              {isEditing ? (
                <textarea 
                  value={editingLetter}
                  onChange={(e) => setEditingLetter(e.target.value)}
                  rows={20}
                  className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-200"
                  placeholder={t('coverLetterGenerator.placeholders.letterOutput')}
                />
              ) : (
                <div className="bg-gray-700 p-4 rounded-md min-h-[400px]">
                  <div className="text-right mb-4 text-gray-300">
                    {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{editingLetter.replace(/\\[Date\\]/g, '').trim()}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
          {generatedLetter && (
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isEditing ? <FaEye className="mr-2" /> : <FaPencilAlt className="mr-2" />}
                {isEditing ? t('coverLetterGenerator.buttons.preview') : t('coverLetterGenerator.buttons.edit', { ns: 'coverLetterGenerator' })}
              </button>
              <button 
                onClick={handleSaveLetter}
                disabled={isGenerating || isSaving || !editingLetter}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
                {isSaving ? t('coverLetterGenerator.buttons.saving') : t('coverLetterGenerator.buttons.save')}
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                disabled={isGenerating || isExporting || !editingLetter.trim()}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-white/10 rounded-md shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <FaSpinner className="animate-spin mr-2" /> : <FaDownload className="mr-2" />}
                Export PDF
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={isGenerating || isExporting || !editingLetter.trim()}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-white/10 rounded-md shadow-sm text-sm font-medium text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <FaSpinner className="animate-spin mr-2" /> : <FaDownload className="mr-2" />}
                Export DOCX
              </button>
            </div>
          )}
        </div>
      </div>
      
  );
};

export default CoverLetterGenerator;
