import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

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

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white/5 rounded-lg shadow text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-left">Rôle</th>
            <th className="px-4 py-2 text-left">Créé le</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t border-white/10">
              <td className="px-4 py-2">{user.id}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.role || (user.is_admin ? 'Admin' : 'Utilisateur')}</td>
              <td className="px-4 py-2">{user.created_at ? new Date(user.created_at).toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <div className="p-4 text-gray-400">Aucun utilisateur trouvé.</div>}
    </div>
  );
}
