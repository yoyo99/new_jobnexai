import React from 'react';
import { useTranslations } from '../i18n';

export const LoadingState: React.FC = () => {
  const { t } = useTranslations();
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-slate-400 text-lg">{t('loading.analyzing') || 'Analyzing job offers with AI...'}</p>
      <p className="text-slate-500 text-sm mt-2">{t('loading.patience') || 'This may take up to 2 minutes'}</p>
    </div>
  );
};
