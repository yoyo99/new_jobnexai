import { useEffect, useState } from 'react';
// import { supabase } from '../../src/lib/supabase'; // Temporairement désactivé

export default function PlansManager() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchSubs() {
      setLoading(true);
      setError(null);
      
      try {
        // 🔥 CONNEXION DIRECTE SUPABASE - Plus d'APIs défaillantes !
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        console.log('🚀 CONNEXION DIRECTE SUPABASE ABONNEMENTS...');

        // Récupération DIRECTE table user_subscriptions avec profiles
        const { data: subscriptions, error: subsError } = await supabase
          .from('user_subscriptions')
          .select(`
            subscription_id,
            user_id,
            subscription_plan,
            subscription_status,
            created_at,
            updated_at,
            stripe_customer_id,
            stripe_subscription_id,
            profiles!inner(email, full_name)
          `)
          .eq('subscription_status', 'active')
          .order('created_at', { ascending: false });

        if (subsError) {
          throw new Error(`Supabase subscriptions error: ${subsError.message}`);
        }

        // Transformation en format attendu
        const realSubscriptions = (subscriptions || []).map((sub: any) => ({
          subscription_id: sub.subscription_id,
          user_id: sub.user_id,
          email: sub.profiles?.email || 'email@inconnu.com',
          full_name: sub.profiles?.full_name || 'Nom inconnu',
          subscription_plan: sub.subscription_plan,
          subscription_status: sub.subscription_status,
          subscription_created_at: sub.created_at,
          subscription_updated_at: sub.updated_at,
          stripe_customer_id: sub.stripe_customer_id,
          stripe_subscription_id: sub.stripe_subscription_id
        }));

        console.log(`✅ VRAIES DONNÉES SUPABASE ABONNEMENTS: ${realSubscriptions.length} actifs`);
        console.log('💳 Premiers abonnés:', realSubscriptions.slice(0, 3).map(s => s.email));
        
        setSubs(realSubscriptions);
        setLoading(false);
        return;

      } catch (error) {
        console.error('💥 ERREUR CONNEXION DIRECTE SUPABASE ABONNEMENTS:', error);
        setError(`❌ ERREUR SUPABASE: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Fallback sur données mockées réalistes
      console.log('💫 Fallback: données mockées (API indisponible)');
      
      const mockSubscriptions = [
        {
          subscription_id: 'sub_1',
          user_id: '2',
          email: 'john.doe@example.com',
          subscription_plan: 'Pro Business',
          subscription_status: 'active',
          subscription_created_at: '2025-02-22',
          subscription_updated_at: '2025-09-15',
          stripe_customer_id: 'cus_example1',
          stripe_subscription_id: 'sub_stripe_1'
        },
        {
          subscription_id: 'sub_2',
          user_id: '5',
          email: 'marie.dupont@freelance.fr',
          subscription_plan: 'Pro Business',
          subscription_status: 'active',
          subscription_created_at: '2025-04-07',
          subscription_updated_at: '2025-09-10',
          stripe_customer_id: 'cus_example2',
          stripe_subscription_id: 'sub_stripe_2'
        },
        {
          subscription_id: 'sub_3',
          user_id: '6',
          email: 'company@enterprise.com',
          subscription_plan: 'Enterprise',
          subscription_status: 'trialing',
          subscription_created_at: '2025-09-01',
          subscription_updated_at: '2025-09-18',
          stripe_customer_id: 'cus_example3',
          stripe_subscription_id: 'sub_stripe_3'
        },
        {
          subscription_id: 'sub_4',
          user_id: '7',
          email: 'startup@growth.com',
          subscription_plan: 'Pro Business',
          subscription_status: 'past_due',
          subscription_created_at: '2025-08-15',
          subscription_updated_at: '2025-09-17',
          stripe_customer_id: 'cus_example4',
          stripe_subscription_id: 'sub_stripe_4'
        }
      ];
      
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setSubs(mockSubscriptions);
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

