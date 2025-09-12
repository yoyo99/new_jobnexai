import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Version résiliente pour éviter les problèmes d'importation statique
// Utilisation du backend HTTP pour charger les traductions en runtime au lieu de les importer

// Initialisation de i18next avec backend HTTP
console.log('Initialisation du module i18n...');

try {
  i18n
    .use(Backend) // Charge les traductions depuis le serveur (public/locales)
    .use(LanguageDetector) // Détecte la langue du navigateur
    .use(initReactI18next)
    .init({
    // Plus besoin de pré-charger les ressources, elles seront chargées dynamiquement
    lng: 'fr', // langue par défaut
    fallbackLng: 'en',
    ns: [
      'common', // Contient les traductions communes (navigation, auth, forms, etc.)
      'translation' // Contient les traductions spécifiques aux pages
    ],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    // Améliorations pour la résilience
    partialBundledLanguages: true,
    // Configuration du backend pour charger les traductions
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Ajout de la détection de la langue
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage', 'cookie']
    }
  }).catch(error => {
    console.error("Erreur lors de l'initialisation d'i18next:", error);
    // Fallback minimal pour éviter de bloquer l'application
    i18n.init({
      lng: 'fr',
      resources: {
        fr: {
          translation: {
            welcome: 'Bienvenue sur JobNexAI',
            error: 'Une erreur est survenue'
          }
        },
        en: {
          translation: {
            welcome: 'Welcome to JobNexAI',
            error: 'An error occurred'
          }
        }
      }
    });
  });
} catch (error) {
  console.error("Erreur critique lors de l'initialisation d'i18next:", error);
  // Créer une instance minimale en cas d'erreur critique
  i18n
    .use(initReactI18next)
    .init({
      lng: 'fr',
      resources: {
        fr: {
          translation: {
            welcome: 'Bienvenue sur JobNexAI',
            error: 'Une erreur est survenue'
          }
        },
        en: {
          translation: {
            welcome: 'Welcome to JobNexAI',
            error: 'An error occurred'
          }
        }
      },
      interpolation: { escapeValue: false }
    });
}

export default i18n;
