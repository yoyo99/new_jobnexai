import React from 'react';
import { useTranslations } from '../i18n';

interface CoverLetterModalProps {
  content: string;
  isLoading: boolean;
  onClose: () => void;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({ content, isLoading, onClose }) => {
  const { t } = useTranslations();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    alert(t('modal.copied') || 'Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            {t('modal.title') || 'Generated Cover Letter'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-400">{t('modal.generating') || 'Generating your cover letter...'}</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
                {content}
              </div>
            </div>
          )}
        </div>

        {!isLoading && content && (
          <div className="p-6 border-t border-slate-700 flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium"
            >
              {t('modal.copy') || 'Copy to Clipboard'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md transition-colors font-medium"
            >
              {t('modal.close') || 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
