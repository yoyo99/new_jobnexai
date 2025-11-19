import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Version résiliente pour éviter les problèmes d'importation statique
// Utilisation du backend HTTP pour charger les traductions en runtime au lieu de les importer

// Initialisation de i18next avec backend HTTP
console.log("Initialisation du module i18n...");

try {
  i18n
    .use(Backend) // Charge les traductions depuis le serveur (public/locales)
    .use(LanguageDetector) // Détecte la langue du navigateur
    .use(initReactI18next)
    .init({
      // Plus besoin de pré-charger les ressources, elles seront chargées dynamiquement
      lng: "fr", // langue par défaut
      fallbackLng: "fr",
      ns: ["translation"],
      defaultNS: "translation",
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      // Améliorations pour la résilience
      partialBundledLanguages: true,
      // Configuration du backend pour charger les traductions
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      // Ajout de la détection de la langue
      detection: {
        order: [
          "querystring",
          "cookie",
          "localStorage",
          "navigator",
          "htmlTag",
        ],
        lookupQuerystring: "lng",
        lookupCookie: "i18next",
        lookupLocalStorage: "i18nextLng",
        caches: ["localStorage", "cookie"],
      },
    }).then(() => {
      console.log("i18next language:", i18n.language);
    }).catch((error) => {
      console.error("Erreur lors de l'initialisation d'i18next:", error);
      // Fallback minimal pour éviter de bloquer l'application
      i18n.init({
        lng: "fr",
        resources: {
          fr: {
            translation: {
              welcome: "Bienvenue sur JobNexAI",
              error: "Une erreur est survenue",
            },
          },
          en: {
            translation: {
              welcome: "Welcome to JobNexAI",
              error: "An error occurred",
            },
          },
        },
      });
    });
} catch (error) {
  console.error("Erreur critique lors de l'initialisation d'i18next:", error);
  // Créer une instance minimale en cas d'erreur critique
  i18n
    .use(initReactI18next)
    .init({
      lng: "fr",
      resources: {
        fr: {
          translation: {
            welcome: "Bienvenue sur JobNexAI",
            error: "Une erreur est survenue",
          },
        },
        en: {
          translation: {
            welcome: "Welcome to JobNexAI",
            error: "An error occurred",
          },
        },
      },
      interpolation: { escapeValue: false },
    });
}

import React from 'react';
import { useTranslation, I18nextProvider } from 'react-i18next';

export const useTranslations = () => {
  const { t, i18n } = useTranslation();
  return { t, lang: i18n.language };
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default i18n;
