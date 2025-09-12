import React, { useState, useEffect, useCallback } from 'react';
import { getUserAISettings, saveUserAISettings, UserAISettingsData } from '../lib/supabase';

/**
 * Sélecteur de moteur IA préféré + gestion des clés API utilisateur.
 * Options : OpenAI (défaut), Gemini, Claude, Cohere, HuggingFace, Mistral, IA interne.
 * Les clés API sont stockées côté Supabase si connecté, sinon localStorage.
 */

const IA_ENGINES = [
  { id: 'openai', label: 'OpenAI (GPT-3.5/4)', placeholder: 'sk-...' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'API Key Gemini' },
  { id: 'claude', label: 'Anthropic Claude', placeholder: 'sk-ant-' },
  { id: 'cohere', label: 'Cohere', placeholder: 'API Key Cohere' },
  { id: 'huggingface', label: 'HuggingFace', placeholder: 'hf_' },
  { id: 'mistral', label: 'Mistral AI', placeholder: 'API Key Mistral' },
  { id: 'custom', label: 'IA interne/maison', placeholder: 'Token interne' },
];

interface UserAISettingsProps {
  userId?: string;
  defaultEngine?: string;
  defaultApiKeys?: Record<string, string>;
  onChange?: (featureEngines: Record<string, string>, apiKeys: Record<string, string>) => void;
}

const AI_FEATURES_CONFIG = [
  { id: 'cv_creator', label: 'Créateur de CV', defaultEngine: 'openai' },
  { id: 'optimized_search', label: 'Recherche optimisée', defaultEngine: 'openai' },
  // Ajoutez d'autres fonctionnalités ici au besoin
];

const UserAISettings: React.FC<UserAISettingsProps> = ({ userId, defaultEngine = 'openai', defaultApiKeys = {}, onChange }) => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(defaultApiKeys);
  const [featureEngines, setFeatureEngines] = useState<Record<string, string>>({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const initializeDefaultEngines = useCallback(() => {
    const initialEngines: Record<string, string> = {};
    AI_FEATURES_CONFIG.forEach(feature => {
      initialEngines[feature.id] = feature.defaultEngine;
    });
    setFeatureEngines(initialEngines);
    setApiKeys(defaultApiKeys);
  }, [defaultApiKeys]);

  useEffect(() => {
    const loadSettings = async () => {
      if (userId) {
        try {
          const supabaseSettings = await getUserAISettings(userId);
          if (supabaseSettings) {
            const initialFeatureEngines: Record<string, string> = {};
            AI_FEATURES_CONFIG.forEach(feature => {
              initialFeatureEngines[feature.id] = supabaseSettings.feature_engines[feature.id] || feature.defaultEngine;
            });
            setFeatureEngines(initialFeatureEngines);
            setApiKeys(supabaseSettings.api_keys || defaultApiKeys);
          } else {
            initializeDefaultEngines();
          }
        } catch (error) {
          console.error("Erreur lors du chargement des paramètres IA depuis Supabase:", error);
          initializeDefaultEngines(); // Fallback aux défauts en cas d'erreur
        }
      } else {
        // Utilisateur non connecté, charger depuis localStorage
        const localSettings = localStorage.getItem('user_ai_settings');
        if (localSettings) {
          const parsed = JSON.parse(localSettings) as UserAISettingsData;
          const initialFeatureEngines: Record<string, string> = {};
          AI_FEATURES_CONFIG.forEach(feature => {
            initialFeatureEngines[feature.id] = (parsed.feature_engines && parsed.feature_engines[feature.id]) || feature.defaultEngine;
          });
          setFeatureEngines(initialFeatureEngines);
          setApiKeys(parsed.api_keys || defaultApiKeys);
        } else {
          initializeDefaultEngines();
        }
      }
    };
    loadSettings();
  }, [userId, defaultApiKeys, initializeDefaultEngines]);

  const handleFeatureEngineChange = (featureId: string, newEngine: string) => {
    setFeatureEngines(prev => ({ ...prev, [featureId]: newEngine }));
    setShowSaveButton(true);
    setSaveStatus(null); // Réinitialiser le statut de sauvegarde lors d'un nouveau changement
  };

  const handleApiKeyChange = (engineId: string, newKey: string) => {
    setApiKeys(prev => ({ ...prev, [engineId]: newKey }));
    setShowSaveButton(true);
    setSaveStatus(null); // Réinitialiser le statut de sauvegarde
  };

  const handleSaveSettings = async () => {
    setSaveStatus(null);
    const settingsToSave: UserAISettingsData = { feature_engines: featureEngines, api_keys: apiKeys };
    try {
      if (userId) {
        await saveUserAISettings(userId, settingsToSave);
        setSaveStatus({ message: 'Paramètres IA sauvegardés avec succès dans Supabase !', type: 'success' });
      } else {
        localStorage.setItem('user_ai_settings', JSON.stringify(settingsToSave));
        setSaveStatus({ message: 'Paramètres IA sauvegardés localement !', type: 'success' });
      }
      setShowSaveButton(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres IA:', error);
      setSaveStatus({ message: 'Échec de la sauvegarde des paramètres IA.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400 mb-4">
        Configurez ici les moteurs d'intelligence artificielle pour les fonctionnalités de JobNexAI. 
        Vous pouvez choisir parmi plusieurs moteurs et utiliser vos propres clés API pour ceux qui le nécessitent. 
        Par défaut, une option gratuite (comme OpenAI GPT-3.5) est utilisée si aucune configuration spécifique n'est fournie.
      </p>
      {AI_FEATURES_CONFIG.map(feature => (
        <div key={feature.id} className="p-4 border border-gray-700 rounded-lg">
          <label htmlFor={`engine-${feature.id}`} className="block text-base font-semibold text-white mb-2">
            Moteur IA pour : {feature.label}
          </label>
          <select
            id={`engine-${feature.id}`}
            value={featureEngines[feature.id] || feature.defaultEngine}
            onChange={e => handleFeatureEngineChange(feature.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
          >
            {IA_ENGINES.map(engine => (
              <option key={engine.id} value={engine.id}>{engine.label}</option>
            ))}
          </select>
        </div>
      ))}

      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Gestion des Clés API</h3>
        <p className="text-sm text-gray-400 mb-4">
          Entrez ici vos clés API pour les moteurs que vous avez sélectionnés ci-dessus. Une clé n'est nécessaire que si le moteur l'exige.
          La clé API n’est jamais partagée en dehors de votre navigateur (pour cette version démo) ou de nos serveurs sécurisés (en production).
        </p>
        {IA_ENGINES.filter(engine => 
            Object.values(featureEngines).includes(engine.id) && engine.placeholder !== '' // Afficher seulement si l'engine est utilisé et nécessite une clé
          ).map(engine => (
          <div key={`api-key-${engine.id}`} className="mb-4">
            <label htmlFor={`apikey-${engine.id}`} className="block text-sm font-medium text-gray-400 mb-1">
              Clé API pour {engine.label}
            </label>
            <input
              id={`apikey-${engine.id}`}
              type="text" // Change to password in a real app for better security UX
              value={apiKeys[engine.id] || ''}
              onChange={e => handleApiKeyChange(engine.id, e.target.value)}
              placeholder={engine.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoComplete="off"
            />
          </div>
        ))}
      </div>

      {showSaveButton && (
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSaveSettings}
            className="btn-primary"
          >
            Enregistrer les Paramètres IA
          </button>
        </div>
      )}
      {saveStatus && (
        <p className={`mt-4 text-sm ${saveStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {saveStatus.message}
        </p>
      )}
    </div>
  );
};

export default UserAISettings;
