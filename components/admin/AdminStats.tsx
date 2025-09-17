
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function AdminStats() {
  const [stats, setStats] = useState<{users: number, jobs: number, subs: number}>({users: 0, jobs: 0, subs: 0});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: jobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
        const { count: subs } = await supabase.from('user_subscriptions').select('*', { count: 'exact', head: true });
        setStats({ users: users ?? 0, jobs: jobs ?? 0, subs: subs ?? 0 });
      } catch (e) {
        setError('Erreur lors du chargement des statistiques');
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-primary-800 rounded-lg p-6 text-center text-white">
        <div className="text-3xl font-bold">{stats.users}</div>
        <div className="mt-2 text-primary-200">Utilisateurs</div>
      </div>
      <div className="bg-primary-800 rounded-lg p-6 text-center text-white">
        <div className="text-3xl font-bold">{stats.jobs}</div>
        <div className="mt-2 text-primary-200">Offres</div>
      </div>
      <div className="bg-primary-800 rounded-lg p-6 text-center text-white">
        <div className="text-3xl font-bold">{stats.subs}</div>
        <div className="mt-2 text-primary-200">Abonnements</div>
      </div>
    </div>
  );
}
