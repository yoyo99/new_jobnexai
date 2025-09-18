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
      // Fallback en cas de problème avec la fonction RPC
      let data, error;
      try {
        const result = await supabase.rpc('get_admin_dashboard');
        data = result.data;
        error = result.error;
      } catch (rpcError) {
        // Fallback vers les tables directes si RPC échoue
        console.log('RPC failed for subscriptions, using fallback...', rpcError);
        const result = await supabase
          .from('subscriptions')
          .select(`
            id,
            user_id,
            status,
            plan,
            current_period_end,
            cancel_at,
            created_at,
            updated_at,
            stripe_customer_id,
            stripe_subscription_id,
            profiles:user_id (email, full_name)
          `);
        
        if (result.error) {
          error = result.error;
          data = null;
        } else {
          // Mapper les données pour correspondre au format attendu
          data = result.data?.map(sub => ({
            subscription_id: sub.id,
            user_id: sub.user_id,
            email: sub.profiles?.email || sub.user_id,
            subscription_plan: sub.plan,
            subscription_status: sub.status,
            subscription_created_at: sub.created_at,
            subscription_updated_at: sub.updated_at,
            stripe_customer_id: sub.stripe_customer_id,
            stripe_subscription_id: sub.stripe_subscription_id
          })) || [];
        }
      }
      
      if (error) {
        setError('Erreur lors du chargement des abonnements');
        setSubs([]);
      } else if (data) {
        // Filtrer seulement ceux qui ont des abonnements
        const subsData = Array.isArray(data) ? 
          data.filter((item: any) => item.subscription_id !== null) : 
          data;
        setSubs(subsData);
      } else {
        setSubs([]);
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

