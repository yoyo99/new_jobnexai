import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../stores/auth';
import { CVMetadata, getUserCVs, uploadUserCV, deleteUserCV, setPrimaryCV } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { FaUpload, FaTrash, FaCheckCircle, FaTimesCircle, FaSpinner, FaFilePdf } from 'react-icons/fa'; // Exemple d'icônes

interface UserCVsProps {
  userId: string;
}

const UserCVs: React.FC<UserCVsProps> = ({ userId }) => {
  const { t } = useTranslation();
  const [cvs, setCvs] = useState<CVMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchCVs = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const userCVs = await getUserCVs(userId);
      setCvs(userCVs);
    } catch (err: any) {
      setError(err.message || t('userCVs.errors.fetchFailed'));
      console.error('Failed to fetch CVs:', err);
    }
    setIsLoading(false);
  }, [userId, t]);

  useEffect(() => {
    fetchCVs();
  }, [fetchCVs]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // Limite de 5MB
        setFeedbackMessage({ type: 'error', text: t('userCVs.errors.fileTooLarge') });
        setFileToUpload(null);
        return;
      }
      if (!['application/pdf'].includes(file.type)) { // Accepter uniquement les PDF pour l'instant
         setFeedbackMessage({ type: 'error', text: t('userCVs.errors.invalidFileType') });
         setFileToUpload(null);
         return;
      }
      setFileToUpload(file);
      setFeedbackMessage(null);
    }
  };

  const handleUploadCV = async () => {
    if (!fileToUpload || !userId) return;
    if (cvs.length >= 2) {
      setFeedbackMessage({ type: 'error', text: t('userCVs.errors.limitReached') });
      return;
    }
    setUploading(true);
    setFeedbackMessage(null);
    try {
      await uploadUserCV(userId, fileToUpload);
      setFeedbackMessage({ type: 'success', text: t('userCVs.success.upload') });
      fetchCVs(); // Recharger la liste
      setFileToUpload(null); // Réinitialiser le champ de fichier
      const fileInput = document.getElementById('cv-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || t('userCVs.errors.uploadFailed') });
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleDeleteCV = async (cvId: string, storagePath: string) => {
    if (!window.confirm(t('userCVs.confirmDelete'))) return;
    setIsLoading(true); // Peut-être un autre loader pour la suppression spécifique
    setFeedbackMessage(null);
    try {
      await deleteUserCV(cvId, storagePath);
      setFeedbackMessage({ type: 'success', text: t('userCVs.success.delete') });
      fetchCVs(); // Recharger la liste
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || t('userCVs.errors.deleteFailed') });
      console.error('Delete failed:', err);
    }
    setIsLoading(false);
  };

  const handleSetPrimaryCV = async (cvId: string) => {
    setIsLoading(true);
    setFeedbackMessage(null);
    try {
      await setPrimaryCV(userId, cvId);
      setFeedbackMessage({ type: 'success', text: t('userCVs.success.primarySet') });
      fetchCVs(); // Recharger la liste pour refléter le changement
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || t('userCVs.errors.primarySetFailed') });
      console.error('Set primary failed:', err);
    }
    setIsLoading(false);
  };

  if (isLoading && cvs.length === 0) {
    return <div className="flex justify-center items-center p-4"><FaSpinner className="animate-spin text-xl text-primary-400" /> <span className="ml-2">{t('common.loading')}</span></div>;
  }

  if (error && cvs.length === 0) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">{t('userCVs.title')}</h3>

      {feedbackMessage && (
        <div className={`p-3 rounded-md text-sm ${feedbackMessage.type === 'success' ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'}`}>
          {feedbackMessage.text}
        </div>
      )}

      {/* Section d'upload */} 
      {cvs.length < 2 && (
        <div className="bg-white/5 p-4 rounded-lg shadow">
          <label htmlFor="cv-upload-input" className="block text-sm font-medium text-gray-300 mb-1">
            {t('userCVs.uploadLabel')}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              id="cv-upload-input"
              accept=".pdf" // Limiter aux PDF dans l'input
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-500 file:text-white hover:file:bg-primary-600 disabled:opacity-50"
              disabled={uploading}
            />
            <button
              onClick={handleUploadCV}
              disabled={!fileToUpload || uploading || cvs.length >= 2}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50 flex items-center"
            >
              {uploading ? <FaSpinner className="animate-spin mr-2" /> : <FaUpload className="mr-2" />} 
              {t('userCVs.uploadButton')}
            </button>
          </div>
          {fileToUpload && <p className='text-xs text-gray-400 mt-1'>{t('userCVs.selectedFile')}: {fileToUpload.name}</p>}
          <p className="text-xs text-gray-500 mt-1">{t('userCVs.uploadHint', { count: 2 - cvs.length })}</p>
        </div>
      )}
      {cvs.length >= 2 && (
         <p className="text-sm text-amber-500 bg-amber-900/50 p-3 rounded-md">{t('userCVs.limitReachedMessage')}</p>
      )}

      {/* Liste des CVs */} 
      {cvs.length > 0 ? (
        <ul className="space-y-3">
          {cvs.map((cv) => (
            <li key={cv.id} className="bg-white/5 p-3 rounded-lg shadow flex items-center justify-between">
              <div className="flex items-center">
                <FaFilePdf className="text-2xl text-primary-400 mr-3" />
                <div>
                  <p className="font-medium text-white">{cv.file_name}</p>
                  <p className="text-xs text-gray-400">
                    {t('userCVs.uploadedOn', { date: new Date(cv.uploaded_at).toLocaleDateString() })}
                    {cv.file_size && ` - ${(cv.file_size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {cv.is_primary ? (
                  <span className="text-xs inline-flex items-center px-2 py-0.5 rounded-full bg-green-600 text-white">
                    <FaCheckCircle className="mr-1" /> {t('userCVs.primary')}
                  </span>
                ) : (
                  <button 
                    onClick={() => handleSetPrimaryCV(cv.id)}
                    className="text-xs text-gray-400 hover:text-primary-400 p-1 disabled:opacity-50"
                    disabled={isLoading}
                    title={t('userCVs.setAsPrimary')}
                  >
                    {t('userCVs.setAsPrimaryAction')}
                  </button>
                )}
                <button 
                  onClick={() => handleDeleteCV(cv.id, cv.storage_path)}
                  className="text-red-500 hover:text-red-400 p-1 disabled:opacity-50"
                  disabled={isLoading}
                  title={t('userCVs.delete')}
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && <p className="text-gray-400">{t('userCVs.noCVs')}</p>
      )}
    </div>
  );
};

export default UserCVs;
