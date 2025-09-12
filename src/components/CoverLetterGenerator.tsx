import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../stores/auth';
import { useTranslation } from 'react-i18next';
import { CVMetadata, getUserCVs, invokeExtractCvText, invokeGenerateCoverLetter } from '../lib/supabase'; // Importer aussi les fonctions pour les lettres de motivation plus tard
import { FaFileAlt, FaSpinner, FaTrash, FaMagic, FaSave } from 'react-icons/fa';

// Importer CoverLetterMetadata et les fonctions associées quand elles seront utilisées activement
import { CoverLetterMetadata /*, createCoverLetter, getUserCoverLetters, updateCoverLetter, deleteCoverLetter */ } from '../lib/supabase';

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
  const [editingLetter, setEditingLetter] = useState<string>(''); // Pour la modification
  const [isSaving, setIsSaving] = useState(false);

  // États généraux
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Charger les CVs de l'utilisateur pour la sélection
  const fetchUserCVs = useCallback(async () => {
    if (user?.id) {
      setIsLoading(true);
      setError(null);
      setFeedbackMessage(null);
      try {
        const cvs = await getUserCVs(user.id);
        setUserCVs(cvs);
        if (cvs.find(cv => cv.is_primary)) {
          setSelectedCvId(cvs.find(cv => cv.is_primary)!.id);
        } else if (cvs.length > 0) {
          setSelectedCvId(cvs[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch user CVs:', err);
        const errorMessage = err instanceof Error ? err.message : t('coverLetterGenerator.errors.fetchCvError');
        setError(errorMessage);
        setFeedbackMessage({ type: 'error', text: errorMessage });
      } finally {
        setIsLoading(false);
      }
    }
  }, [user?.id, t]);

  useEffect(() => {
    fetchUserCVs();
  }, [fetchUserCVs]);

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

  const handleGenerateLetter = async () => {
    if (!user?.id) {
      setError(t('coverLetterGenerator.errors.notAuthenticated'));
      return;
    }
    if (!selectedCvId) {
      setError(t('coverLetterGenerator.errors.noCvSelected'));
      return;
    }
    if (!jobDescription) {
      setError(t('coverLetterGenerator.errors.jobDescriptionRequired'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setFeedbackMessage(null);

    try {
      const cvToUse = userCVs.find(cv => cv.id === selectedCvId);
      if (!cvToUse || !cvToUse.storage_path) {
        throw new Error(t('coverLetterGenerator.errors.cvPathMissing'));
      }

      // Étape 1: Extraire le texte du CV
      setFeedbackMessage({ type: 'success', text: t('coverLetterGenerator.feedback.extractingCv') });
      const cvText = await invokeExtractCvText(cvToUse.storage_path);
      if (!cvText) {
        throw new Error(t('coverLetterGenerator.errors.cvExtractionFailed'));
      }
      //     targetLanguage,
      //     // userId: user.id, // L'user ID sera pris du token dans la fonction Edge
      //     // apiKey: userAISettings.api_keys[userAISettings.feature_engines['cover_letter_generation']] // Logique à affiner
      //   }
      // });

      // if (response.error) throw response.error;
      // const { letter } = response.data;
      // setGeneratedLetter(letter);
      // setEditingLetter(letter);

      // --- Placeholder pour la génération --- 
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simuler l'appel API
      const placeholderLetter = `Cher/Chère équipe de recrutement de ${companyName || 'l\'entreprise'},

Basé sur mon CV (${cvToUse.file_name}) et votre description pour le poste de ${jobTitle || 'ce poste passionnant'},
Je suis très intéressé(e) par cette opportunité. Mes compétences en [Compétence 1] et [Compétence 2] correspondent bien à vos besoins.
${customInstructions ? `\nInstruction spéciale: ${customInstructions}` : ''}

Cordialement,
${user.full_name || 'Le Candidat'}
(Généré en ${targetLanguage})`;
      setGeneratedLetter(placeholderLetter);
      setEditingLetter(placeholderLetter);
      // --- Fin Placeholder --- 

      setFeedbackMessage({ type: 'success', text: t('coverLetterGenerator.success.generationSuccess') });

    } catch (err: any) {
      console.error('Failed to generate cover letter:', err);
      setError(err.message || t('coverLetterGenerator.errors.generationFailed'));
      setFeedbackMessage({ type: 'error', text: err.message || t('coverLetterGenerator.errors.generationFailed') });
    }
    setIsGenerating(false);
  };
  
  const handleSaveLetter = async () => {
    if (!user?.id || !editingLetter || !selectedCvId) {
      setFeedbackMessage({ type: 'error', text: t('coverLetterGenerator.errors.saveFailed') });
      return;
    }
    setIsLoading(true);
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
      
      // Pour l'instant, nous créons toujours une nouvelle lettre.
      // Une logique pour `updateCoverLetter` pourrait être ajoutée si on modifie une lettre existante.
      // const savedLetter = await createCoverLetter(letterDataToSave);
      // console.log('Lettre sauvegardée:', savedLetter);

      // --- Placeholder pour la sauvegarde --- 
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler l'appel API
      const savedLetterPlaceholder = { ...letterDataToSave, id: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      console.log('Lettre sauvegardée (simulation):', savedLetterPlaceholder);
      // --- Fin Placeholder --- 

      setFeedbackMessage({ type: 'success', text: t('coverLetterGenerator.success.saved') });
      if (onLetterGenerated) {
        onLetterGenerated(editingLetter, letterDataToSave);
      }
    } catch (err: any) {
      console.error('Failed to save cover letter:', err);
      setFeedbackMessage({ type: 'error', text: err.message || t('coverLetterGenerator.errors.saveFailed') });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-900 text-white">
      <h2 className="text-2xl font-semibold text-primary-400 flex items-center">
        <FaFileAlt className="mr-3" /> {t('coverLetterGenerator.title')}
      </h2>

      {feedbackMessage && (
        <div className={`p-3 rounded-md text-sm ${feedbackMessage.type === 'success' ? 'bg-green-800' : 'bg-red-800'}`}>
          {feedbackMessage.text}
        </div>
      )}
      {error && !feedbackMessage && (
         <div className='p-3 rounded-md text-sm bg-red-800'>
           {error}
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
            <textarea 
              value={editingLetter}
              onChange={(e) => setEditingLetter(e.target.value)}
              rows={20}
              className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-200"
              placeholder={t('coverLetterGenerator.placeholders.letterOutput')}
            />
          )}
          {generatedLetter && (
            <button 
              onClick={handleSaveLetter}
              disabled={isGenerating || isSaving || !editingLetter}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
              {isSaving ? t('coverLetterGenerator.buttons.saving') : t('coverLetterGenerator.buttons.save')}
            </button>
          )}
        </div>
      </div>
      
  );
};

export default CoverLetterGenerator;
