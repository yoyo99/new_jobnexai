import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '../../stores/auth';
import type { CoverLetterMetadata } from '../../lib/supabase';
import {
  getUserCoverLetters,
  deleteCoverLetter,
  updateCoverLetter,
  exportCoverLetterFromContent,
} from '../../lib/supabase';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export default function UserCoverLetters() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<CoverLetterMetadata[]>([]);
  const [viewing, setViewing] = useState<CoverLetterMetadata | null>(null);
  const [editing, setEditing] = useState<CoverLetterMetadata | null>(null);
  const [editContent, setEditContent] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canLoad = useMemo(() => !!user?.id, [user?.id]);

  useEffect(() => {
    if (!canLoad) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad]);

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getUserCoverLetters(user.id);
      setLetters(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Impossible de charger vos lettres');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (cl: CoverLetterMetadata) => {
    setEditing(cl);
    setEditContent(cl.cover_letter_content || '');
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    try {
      toast.loading('Enregistrement...', { id: 'save-edit' });
      const updated = await updateCoverLetter(editing.id, {
        cover_letter_content: editContent,
      });
      setLetters(prev => prev.map(l => (l.id === updated.id ? updated : l)));
      toast.success('Lettre mise à jour', { id: 'save-edit' });
      setEditing(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Erreur lors de la mise à jour', { id: 'save-edit' });
    }
  };

  const onDelete = async (cl: CoverLetterMetadata) => {
    if (!cl?.id) return;
    const ok = window.confirm('Supprimer cette lettre ? Cette action est irréversible.');
    if (!ok) return;
    try {
      setDeletingId(cl.id);
      await deleteCoverLetter(cl.id);
      setLetters(prev => prev.filter(l => l.id !== cl.id));
      toast.success('Lettre supprimée');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Suppression impossible');
    } finally {
      setDeletingId(null);
    }
  };

  const onExport = async (cl: CoverLetterMetadata, format: 'pdf' | 'docx') => {
    try {
      setExportingId(cl.id);
      const base = [cl.company_name, cl.job_title].filter(Boolean).join(' - ') || 'Lettre de motivation';
      const { signedUrl } = await exportCoverLetterFromContent(cl.cover_letter_content, format, base);
      if (!signedUrl) throw new Error('URL signée manquante');
      // Ouvrir dans un nouvel onglet
      window.open(signedUrl, '_blank');
      toast.success(`Export ${format.toUpperCase()} prêt`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || `Export ${format.toUpperCase()} échoué`);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-400">Mes Lettres</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => void refresh()} className="btn-secondary">Actualiser</button>
        </div>
      </div>

      {loading ? (
        <div className="card p-6">Chargement de vos lettres...</div>
      ) : letters.length === 0 ? (
        <div className="card p-6">Aucune lettre sauvegardée pour le moment.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Titre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Entreprise</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Langue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Créée</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {letters.map((cl) => (
                  <tr key={cl.id}>
                    <td className="px-4 py-3 text-sm text-white/90">{cl.job_title || '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/90">{cl.company_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/70">{cl.language?.toUpperCase() || '—'}</td>
                    <td className="px-4 py-3 text-sm text-white/70">{formatDate(cl.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-ghost"
                          title="Voir"
                          onClick={() => setViewing(cl)}
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="btn-ghost"
                          title="Éditer"
                          onClick={() => onEdit(cl)}
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="btn-ghost disabled:cursor-not-allowed"
                          title={!cl.cover_letter_content ? 'Contenu vide, export impossible' : 'Exporter en PDF'}
                          disabled={exportingId === cl.id || !cl.cover_letter_content}
                          onClick={() => onExport(cl, 'pdf')}
                        >
                          {exportingId === cl.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          )}
                          <span className="sr-only">PDF</span>
                        </button>
                        <button
                          className="btn-ghost disabled:cursor-not-allowed"
                          title={!cl.cover_letter_content ? 'Contenu vide, export impossible' : 'Exporter en DOCX'}
                          disabled={exportingId === cl.id || !cl.cover_letter_content}
                          onClick={() => onExport(cl, 'docx')}
                        >
                          {exportingId === cl.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <ArrowDownTrayIcon className="w-5 h-5 rotate-180" />
                          )}
                          <span className="sr-only">DOCX</span>
                        </button>
                        <button
                          className="btn-danger"
                          title="Supprimer"
                          disabled={deletingId === cl.id}
                          onClick={() => onDelete(cl)}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Voir */}
      <Transition show={!!viewing} as={Fragment}>
        <Dialog onClose={() => setViewing(null)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="card max-w-3xl w-full p-6">
                  <Dialog.Title className="text-lg font-semibold mb-3">{viewing?.job_title || 'Lettre de motivation'}</Dialog.Title>
                  <div className="prose prose-invert max-w-none text-white/90">
                    <ReactMarkdown>{viewing?.cover_letter_content || ''}</ReactMarkdown>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="btn-secondary" onClick={() => setViewing(null)}>Fermer</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Editer */}
      <Transition show={!!editing} as={Fragment}>
        <Dialog onClose={() => setEditing(null)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="card max-w-3xl w-full p-6">
                  <Dialog.Title className="text-lg font-semibold mb-3">Éditer la lettre</Dialog.Title>
                  <textarea
                    className="w-full min-h-[320px] rounded-md bg-gray-900/60 border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button className="btn-secondary" onClick={() => setEditing(null)}>Annuler</button>
                    <button className="btn-primary" onClick={() => void onSaveEdit()}>Enregistrer</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
