import React, { useState } from 'react';
import { useTranslations } from '../i18n';

interface SearchFormProps {
  onSearch: (keywords: string, location: string, profileSummary: string) => void;
  disabled?: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, disabled }) => {
  const { t } = useTranslations();
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [profileSummary, setProfileSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywords.trim()) {
      onSearch(keywords, location, profileSummary);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-xl space-y-4">
      <div>
        <label htmlFor="keywords" className="block text-sm font-medium text-slate-300 mb-2">
          {t('search.keywords') || 'Keywords'}
        </label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder={t('search.keywordsPlaceholder') || 'e.g. React Developer, Data Scientist'}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-2">
          {t('search.location') || 'Location'}
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('search.locationPlaceholder') || 'e.g. Paris, Remote'}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="profile" className="block text-sm font-medium text-slate-300 mb-2">
          {t('search.profileSummary') || 'Your Profile Summary (Optional)'}
        </label>
        <textarea
          id="profile"
          value={profileSummary}
          onChange={(e) => setProfileSummary(e.target.value)}
          placeholder={t('search.profilePlaceholder') || 'Brief summary of your skills and experience...'}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={disabled || !keywords.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
      >
        {disabled ? (t('search.searching') || 'Searching...') : (t('search.searchButton') || 'Search Jobs')}
      </button>
    </form>
  );
};
