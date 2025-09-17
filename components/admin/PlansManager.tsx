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
      const { data, error } = await supabase.from('admin_complete_dashboard').select('subscription_id, user_id, email, subscription_plan, subscription_status, subscription_created_at, subscription_updated_at').not('subscription_id', 'is', null);
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
            <tr key={sub.subscription_id} className="border-t border-white/10">
              <td className="px-4 py-2">{sub.subscription_id}</td>
              <td className="px-4 py-2">{sub.email || sub.user_id}</td>
              <td className="px-4 py-2">{sub.subscription_plan || 'N/A'}</td>
              <td className="px-4 py-2">{sub.subscription_status || 'N/A'}</td>
              <td className="px-4 py-2">{sub.subscription_created_at ? new Date(sub.subscription_created_at).toLocaleDateString() : 'N/A'}</td>
              <td className="px-4 py-2">{sub.subscription_updated_at ? new Date(sub.subscription_updated_at).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {subs.length === 0 && <div className="p-4 text-gray-400">Aucun abonnement trouvé.</div>}
    </div>
  );
}

