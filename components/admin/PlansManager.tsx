import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function PlansManager() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchSubs() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('user_subscriptions').select('*');
      if (error) {
        setError('Erreur lors du chargement des abonnements');
        setSubs([]);
      } else {
        setSubs(data || []);
      }
      setLoading(false);
    }
    fetchSubs();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white/5 rounded-lg shadow text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Utilisateur</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Statut</th>
            <th className="px-4 py-2 text-left">Début</th>
            <th className="px-4 py-2 text-left">Fin</th>
          </tr>
        </thead>
        <tbody>
          {subs.map(sub => (
            <tr key={sub.id} className="border-t border-white/10">
              <td className="px-4 py-2">{sub.id}</td>
              <td className="px-4 py-2">{sub.user_id}</td>
              <td className="px-4 py-2">{sub.type}</td>
              <td className="px-4 py-2">{sub.status}</td>
              <td className="px-4 py-2">{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : ''}</td>
              <td className="px-4 py-2">{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {subs.length === 0 && <div className="p-4 text-gray-400">Aucun abonnement trouvé.</div>}
    </div>
  );
}

