import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<string|null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    async function fetchUsers() {
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
        console.log('RPC failed, using fallback...', rpcError);
        const result = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            is_admin,
            user_type,
            created_at,
            updated_at
          `);
        
        if (result.error) {
          error = result.error;
          data = null;
        } else {
          // Mapper les données pour correspondre au format attendu
          data = result.data?.map(profile => ({
            user_id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            is_admin: profile.is_admin,
            user_type: profile.user_type,
            registered_at: profile.created_at,
            last_sign_in_at: null, // pas accessible depuis profiles
            email_confirmed_at: profile.created_at // approximation
          })) || [];
        }
      }
      if (error) {
        setError('Erreur lors du chargement des utilisateurs');
        setUsers([]);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    }
    fetchUsers();
  }, [refreshFlag]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        (!q ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.user_id && u.user_id.toLowerCase().includes(q))
        )
      )
    );
  }, [search, users]);

  const confirmAndRun = async (message: string, cb: () => Promise<void>) => {
    if (window.confirm(message)) {
      await cb();
      setRefreshFlag(f => f + 1);
    }
  };

  const handlePromote = async (userId: string) => {
    setActionMsg(null);
    await confirmAndRun('Confirmer la promotion admin ?', async () => {
      const { error } = await supabase.from('profiles').update({ is_admin: true }).eq('id', userId);
      setActionMsg(error ? 'Erreur lors de la promotion admin' : 'Utilisateur promu admin');
    });
  };
  const handleSuspend = async (userId: string) => {
    setActionMsg(null);
    await confirmAndRun('Confirmer la suspension de cet utilisateur ?', async () => {
      const { error } = await supabase.from('profiles').update({ is_suspended: true }).eq('id', userId);
      setActionMsg(error ? 'Erreur lors de la suspension' : 'Utilisateur suspendu');
    });
  };
  const handleDelete = async (userId: string) => {
    setActionMsg(null);
    await confirmAndRun('Supprimer définitivement cet utilisateur ?', async () => {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      setActionMsg(error ? 'Erreur lors de la suppression' : 'Utilisateur supprimé');
    });
  };

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Recherche par email, nom, prénom, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 border border-white/10 focus:outline-none focus:ring focus:border-primary-400"
        />
        {actionMsg && <span className="text-xs text-primary-300 ml-4">{actionMsg}</span>}
      </div>
      <table className="min-w-full bg-white/5 rounded-lg shadow text-sm">
        <thead>
          <tr className="bg-white/5">
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Nom Utilisateur</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Nom/Prénom</th>
            <th className="px-4 py-2 text-left">Rôle</th>
            <th className="px-4 py-2 text-left">Statut</th>
            <th className="px-4 py-2 text-left">Connexion</th>
            <th className="px-4 py-2 text-left">Créé le</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(user => (
            <tr key={user.user_id} className="border-t border-white/10">
              <td className="px-4 py-2 font-mono text-xs">{user.user_id?.substring(0, 8) || '-'}...</td>
              <td className="px-4 py-2">{user.email?.split('@')[0] || <span className="text-gray-500 italic">-</span>}</td>
              <td className="px-4 py-2">{user.email || <span className="text-gray-500 italic">-</span>}</td>
              <td className="px-4 py-2">{user.full_name || <span className="text-gray-500 italic">-</span>}</td>
              <td className="px-4 py-2">{user.is_admin ? <span className="text-yellow-400 font-semibold">Admin</span> : <span className="text-blue-400">Utilisateur</span>}</td>
              <td className="px-4 py-2">{user.email_confirmed_at ? <span className="text-green-400">Actif</span> : <span className="text-orange-400">En attente</span>}</td>
              <td className="px-4 py-2">{
                user.last_sign_in_at ? (
                  <div className="flex flex-col">
                    <span className="text-green-400 text-xs">Dernière connexion</span>
                    <span className="text-gray-300 text-xs">{new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                  </div>
                ) : <span className="text-gray-400">Jamais connecté</span>
              }</td>
              <td className="px-4 py-2">{user.registered_at ? new Date(user.registered_at).toLocaleDateString() : '-'}</td>
              <td className="px-4 py-2 flex gap-2">
                <button className="text-xs text-yellow-400 hover:underline disabled:opacity-50" disabled={user.is_admin} onClick={() => handlePromote(user.user_id)}>Promouvoir admin</button>
                <button className="text-xs text-orange-400 hover:underline disabled:opacity-50" disabled={false} onClick={() => handleSuspend(user.user_id)}>Suspendre</button>
                <button className="text-xs text-red-400 hover:underline" onClick={() => handleDelete(user.user_id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <div className="p-4 text-gray-400">Aucun utilisateur trouvé.</div>}
    </div>
  );
}

