import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../stores/auth';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon, ServerIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface IMAPConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  mailbox: string;
}

interface JobOffer {
  id: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
  contract_type?: string;
  created_at: string;
  metadata: {
    email_subject: string;
    email_from: string;
    email_date: string;
  };
}

const IMAPJobScraper: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [imapConfig, setImapConfig] = useState<IMAPConfig>({
    host: '',
    port: 993,
    secure: true,
    username: '',
    password: '',
    mailbox: 'INBOX'
  });
  const [loading, setLoading] = useState(false);
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadJobOffers();
      loadIMAPConfig();
    }
  }, [user?.id]);

  const loadJobOffers = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('imap-job-scraper', {
        method: 'GET',
        body: new URLSearchParams({ userId: user.id })
      });

      if (error) throw error;
      setJobOffers(data.offers || []);
    } catch (error) {
      console.error('Error loading job offers:', error);
    }
  };

  const loadIMAPConfig = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('imap_config')
        .eq('user_id', user.id)
        .single();

      if (data?.imap_config) {
        setImapConfig(data.imap_config);
      }
    } catch (error) {
      console.error('Error loading IMAP config:', error);
    }
  };

  const saveIMAPConfig = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          imap_config: imapConfig
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Configuration IMAP sauvegardée' });
    } catch (error) {
      console.error('Error saving IMAP config:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    }
  };

  const handleStartScraping = async () => {
    if (!imapConfig.host || !imapConfig.username || !imapConfig.password) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setMessage({ type: 'success', text: '' });

    try {
      // Sauvegarder la configuration avant de lancer le scraping
      await saveIMAPConfig();

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imap-job-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(imapConfig),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du scraping IMAP');
      }

      toast.success(`Scraping terminé ! ${data.jobsFound || 0} offres trouvées`);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du scraping IMAP';
      setMessage({ type: 'error', text: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="h-6 w-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Scraping IMAP</h2>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="btn-secondary"
          >
            {showConfig ? 'Masquer' : 'Configurer'}
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Configurez votre compte email pour extraire automatiquement les offres d'emploi 
          reçues dans votre boîte mail.
        </p>

        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 mb-6 p-4 bg-white/5 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Serveur IMAP
                </label>
                <input
                  type="text"
                  value={imapConfig.host}
                  onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                  placeholder="imap.gmail.com"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Port
                </label>
                <input
                  type="number"
                  value={imapConfig.port}
                  onChange={(e) => setImapConfig({ ...imapConfig, port: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={imapConfig.username}
                  onChange={(e) => setImapConfig({ ...imapConfig, username: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Mot de passe d'application
                </label>
                <input
                  type="password"
                  value={imapConfig.password}
                  onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Dossier
                </label>
                <input
                  type="text"
                  value={imapConfig.mailbox}
                  onChange={(e) => setImapConfig({ ...imapConfig, mailbox: e.target.value })}
                  placeholder="INBOX"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={imapConfig.secure}
                    onChange={(e) => setImapConfig({ ...imapConfig, secure: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-white/10 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-300">Connexion sécurisée (SSL/TLS)</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={saveIMAPConfig}
                className="btn-secondary"
              >
                Sauvegarder la configuration
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleStartScraping}
            disabled={loading || !imapConfig.host || !imapConfig.username}
            className="btn-primary flex items-center space-x-2"
          >
            <ServerIcon className="h-4 w-4" />
            <span>{loading ? 'Extraction en cours...' : 'Démarrer l\'extraction'}</span>
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-900/50 text-green-400' 
              : 'bg-red-900/50 text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </motion.div>

      {/* Liste des offres extraites */}
      {jobOffers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Offres extraites ({jobOffers.length})
          </h3>
          <div className="space-y-4">
            {jobOffers.map((offer) => (
              <div key={offer.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{offer.title}</h4>
                  <span className="text-xs text-gray-400">
                    {formatDate(offer.created_at)}
                  </span>
                </div>
                <p className="text-primary-400 text-sm mb-2">{offer.company}</p>
                {offer.location && (
                  <p className="text-gray-400 text-sm mb-2">{offer.location}</p>
                )}
                <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                  {offer.description}
                </p>
                <div className="text-xs text-gray-500">
                  <p>De: {offer.metadata.email_from}</p>
                  <p>Sujet: {offer.metadata.email_subject}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IMAPJobScraper;
