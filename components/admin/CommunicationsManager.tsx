'use client';
import { useState } from 'react';
import { FaEnvelope, FaBell, FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'welcome' | 'payment' | 'notification' | 'marketing';
  status: 'active' | 'draft';
  created_at: string;
  last_sent: string | null;
  sent_count: number;
}

export default function CommunicationsManager() {
  const [activeTab, setActiveTab] = useState<'emails' | 'notifications'>('emails');
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Email de bienvenue',
      subject: 'Bienvenue sur JobNexAI !',
      type: 'welcome',
      status: 'active',
      created_at: '2025-01-15',
      last_sent: '2025-09-18',
      sent_count: 247
    },
    {
      id: '2', 
      name: 'Confirmation paiement',
      subject: 'Votre paiement a été confirmé',
      type: 'payment',
      status: 'active',
      created_at: '2025-02-01',
      last_sent: '2025-09-17',
      sent_count: 89
    },
    {
      id: '3',
      name: 'Nouvel abonnement Pro',
      subject: 'Découvrez votre nouveau plan Pro',
      type: 'marketing',
      status: 'draft',
      created_at: '2025-09-10',
      last_sent: null,
      sent_count: 0
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleEdit = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newName = prompt(`✏️ MODIFIER NOM TEMPLATE\n\nNom actuel: ${template.name}`, template.name);
      if (newName && newName !== template.name) {
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? {...t, name: newName} : t
        ));
        alert(`✅ Template modifié !\n\nAncien nom: ${template.name}\nNouveau nom: ${newName}`);
      }
      
      const newSubject = prompt(`✏️ MODIFIER SUJET EMAIL\n\nSujet actuel: ${template.subject}`, template.subject);
      if (newSubject && newSubject !== template.subject) {
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? {...t, subject: newSubject} : t
        ));
        alert(`✅ Sujet modifié !\n\nAncien sujet: ${template.subject}\nNouveau sujet: ${newSubject}`);
      }
    }
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm('Supprimer ce template ?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  const handleToggleStatus = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId 
        ? {...t, status: t.status === 'active' ? 'draft' : 'active'}
        : t
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'text-green-400';
      case 'payment': return 'text-blue-400';
      case 'notification': return 'text-yellow-400';
      case 'marketing': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Communications</h2>
          <p className="text-gray-400">Gestion des emails, notifications et templates</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <FaPlus className="text-sm" />
          Nouveau Template
        </button>
      </div>

      {/* Navigation Onglets */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'emails' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaEnvelope />
          Templates Email
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'notifications' 
              ? 'border-primary-400 text-primary-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FaBell />
          Notifications Push
        </button>
      </div>

      {activeTab === 'emails' ? (
        <div className="space-y-4">
          {/* Debug info */}
          {showCreateForm && <div className="text-green-400 text-sm mb-2">✅ Formulaire activé</div>}
          
          {/* Formulaire création */}
          {showCreateForm && (
            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Nouveau Template Email</h3>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nom du template" className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                <select className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white">
                  <option value="welcome">Bienvenue</option>
                  <option value="payment">Paiement</option>
                  <option value="notification">Notification</option>
                  <option value="marketing">Marketing</option>
                </select>
                <input placeholder="Sujet de l'email" className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 rounded text-white" />
                <textarea placeholder="Contenu du template..." className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 rounded text-white h-32"></textarea>
                <div className="col-span-2 flex gap-2">
                  <button 
                    onClick={() => {
                      alert('Template email créé ! (fonctionnalité démo)');
                      setShowCreateForm(false);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Créer
                  </button>
                  <button 
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des templates */}
          <div className="grid gap-4">
            {templates.map(template => (
              <div key={template.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(template.type)}`}>
                        {template.type}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        template.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {template.status}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">Sujet: {template.subject}</p>
                    <div className="text-sm text-gray-500">
                      Créé le {new Date(template.created_at).toLocaleDateString()} • 
                      {template.sent_count} envois
                      {template.last_sent && ` • Dernier envoi: ${new Date(template.last_sent).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template.id)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 rounded transition-colors"
                      title="Éditer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        const template_obj = templates.find(t => t.id === template.id);
                        if (template_obj) {
                          alert(`👁️ APERÇU TEMPLATE\n\nNom: ${template_obj.name}\nType: ${template_obj.type}\nSujet: ${template_obj.subject}\n\n📧 CONTENU EMAIL:\nBonjour [Nom],\n\nCeci est un exemple de contenu pour le template "${template_obj.name}".\n\nCordialement,\nL'équipe JobNexAI\n\n---\n✅ Aperçu fonctionnel ! Interface complète à développer`);
                        }
                      }}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-green-600/10 rounded transition-colors"
                      title="Prévisualiser"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(template.id)}
                      className={`p-2 rounded transition-colors ${
                        template.status === 'active' 
                          ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-600/10' 
                          : 'text-green-400 hover:text-green-300 hover:bg-green-600/10'
                      }`}
                      title={template.status === 'active' ? 'Désactiver' : 'Activer'}
                    >
                      {template.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/10 rounded transition-colors"
                      title="Supprimer"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Section Notifications Push */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration Notifications Push</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2">Notifications activées</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded" />
                    Nouveaux abonnements
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded" />
                    Paiements échoués
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" className="rounded" />
                    Marketing promotions
                  </label>
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Statistiques push</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Envoyées aujourd'hui:</span>
                    <span className="text-green-400 font-medium">23</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Taux d'ouverture:</span>
                    <span className="text-blue-400 font-medium">67%</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Abonnés actifs:</span>
                    <span className="text-purple-400 font-medium">1,247</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
