import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<string|null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        setError('Erreur lors du chargement des utilisateurs');
        setUsers([]);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        (!q ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.full_name && u.full_name.toLowerCase().includes(q)) ||
          (u.id && u.id.toLowerCase().includes(q))
        )
      )
    );
  }, [search, users]);

  const handlePromote = async (userId: string) => {
    setActionMsg(null);
    // À adapter selon ta logique Supabase (champ is_admin ou table roles)
    const { error } = await supabase.from('users').update({ is_admin: true }).eq('id', userId);
    if (error) setActionMsg("Erreur lors de la promotion admin");
    else setActionMsg("Utilisateur promu admin");
  };
  const handleSuspend = async (userId: string) => {
    setActionMsg(null);
    const { error } = await supabase.from('users').update({ is_suspended: true }).eq('id', userId);
    if (error) setActionMsg("Erreur lors de la suspension");
    else setActionMsg("Utilisateur suspendu");
  };
  const handleDelete = async (userId: string) => {
    setActionMsg(null);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) setActionMsg("Erreur lors de la suppression");
    else setActionMsg("Utilisateur supprimé");
  };

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Recherche email, nom, id..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-white/10 text-white placeholder:text-gray-400 border border-white/10 focus:outline-none focus:ring focus:border-primary-400"
        />
        {actionMsg && <span className="text-xs text-primary-300 ml-4">{actionMsg}</span>}
      </div>
      <table className="min-w-full bg-white/5 rounded-lg shadow text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Rôle</th>
            <th className="px-4 py-2 text-left">Statut</th>
            <th className="px-4 py-2 text-left">Créé le</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(user => (
            <tr key={user.id} className="border-t border-white/10">
              <td className="px-4 py-2">{user.id}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.role || (user.is_admin ? 'Admin' : 'Utilisateur')}</td>
              <td className="px-4 py-2">{user.is_suspended ? <span className="text-red-400">Suspendu</span> : <span className="text-green-400">Actif</span>}</td>
              <td className="px-4 py-2">{user.created_at ? new Date(user.created_at).toLocaleString() : ''}</td>
              <td className="px-4 py-2 flex gap-2">
                {!user.is_admin && (
                  <button className="text-xs text-yellow-400 hover:underline" onClick={() => handlePromote(user.id)}>Promouvoir admin</button>
                )}
                {!user.is_suspended && (
                  <button className="text-xs text-orange-400 hover:underline" onClick={() => handleSuspend(user.id)}>Suspendre</button>
                )}
                <button className="text-xs text-red-400 hover:underline" onClick={() => handleDelete(user.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <div className="p-4 text-gray-400">Aucun utilisateur trouvé.</div>}
    </div>
  );
}
