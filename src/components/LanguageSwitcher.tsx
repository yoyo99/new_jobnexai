import React from 'react';
import { useTranslation } from 'react-i18next';
import { Fragment, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    const storedLang = localStorage.getItem('i18nextLng');
    const currentI18nLang = i18n.language.split('-')[0]; // Normalise (ex: 'en-US' -> 'en')

    let targetLang: string;

    if (storedLang) {
      const supportedStoredLang = languages.find(l => l.code === storedLang)?.code;
      if (supportedStoredLang) {
        targetLang = supportedStoredLang;
      } else {
        // Langue invalide dans localStorage, la supprimer et utiliser le fallback
        localStorage.removeItem('i18nextLng');
        const browserLang = navigator.languages?.[0]?.split('-')[0] || navigator.language?.split('-')[0] || 'en';
        targetLang = languages.find(l => l.code === browserLang)?.code || 'en';
      }
    } else {
      // Aucune langue dans localStorage, détecter depuis le navigateur ou utiliser le fallback
      const browserLang = navigator.languages?.[0]?.split('-')[0] || navigator.language?.split('-')[0] || 'en';
      targetLang = languages.find(l => l.code === browserLang)?.code || 'en';
    }

    // Si la langue cible déterminée est différente de la langue actuelle d'i18n, la changer
    if (targetLang !== currentI18nLang) {
      i18n.changeLanguage(targetLang);
    }

    // S'assurer que localStorage est défini sur la langue cible
    if (localStorage.getItem('i18nextLng') !== targetLang) {
      localStorage.setItem('i18nextLng', targetLang);
    }
  }, [i18n]); // Dépendance à l'instance i18n (s'exécute une fois au montage typiquement)

  return (
    <Menu as="div" className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu.Button
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-white/5"
          aria-haspopup="listbox"
          aria-label={t('navigation.changeLanguage')}
        >
          <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
          <span className="hidden md:block">{languages.find(l => l.code === i18n.language)?.name || 'Language'}</span>
        </Menu.Button>
      </motion.div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
        >
          {languages.map((lang) => (
            <Menu.Item key={lang.code}>
              {({ active }) => (
                <button
                  className={`flex items-center gap-3 w-full px-4 py-2 text-sm leading-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                    i18n.language === lang.code
                      ? 'bg-gray-50 text-primary-600'
                      : active
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    localStorage.setItem('i18nextLng', lang.code);
                  }}
                  
                  aria-selected={i18n.language === lang.code}
                  tabIndex={0}
                >
                  <span className="text-base" aria-hidden="true">{lang.flag}</span>
                  {lang.name}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}