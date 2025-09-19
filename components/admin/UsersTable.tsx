import { useEffect, useState } from 'react';

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  is_admin: boolean;
  registered_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState<string|null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [refreshFlag]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 🔥 CONNEXION DIRECTE SUPABASE - Plus d'APIs défaillantes !
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      console.log('🚀 CONNEXION DIRECTE SUPABASE UTILISATEURS...');

      // Récupération DIRECTE table profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_type,
          is_admin,
          created_at,
          updated_at,
          last_sign_in_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (profilesError) {
        throw new Error(`Supabase profiles error: ${profilesError.message}`);
      }

      // Transformation en format User
      const realUsers: User[] = (profiles || []).map((profile: any) => ({
        user_id: profile.id,
        email: profile.email || 'email@inconnu.com',
        full_name: profile.full_name || 'Nom inconnu',
        user_type: profile.user_type || (profile.is_admin ? 'admin' : 'free'),
        is_admin: profile.is_admin || false,
        registered_at: profile.created_at,
        last_sign_in_at: profile.last_sign_in_at,
        email_confirmed_at: profile.created_at // Approximation
      }));

      console.log(`✅ VRAIES DONNÉES SUPABASE CHARGÉES: ${realUsers.length} utilisateurs`);
      console.log('👥 Premiers utilisateurs:', realUsers.slice(0, 3).map(u => u.email));
      
      setUsers(realUsers);
      setError(null);
      setLoading(false);
      return;

    } catch (error) {
      console.error('💥 ERREUR CONNEXION DIRECTE SUPABASE:', error);
      setError(`❌ ERREUR SUPABASE: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback minimal si Supabase échoue
      const fallbackUsers: User[] = [
        {
          user_id: 'usr_admin_001',
          email: 'admin@jobnexai.com', 
          full_name: 'Administrateur Principal',
          user_type: 'admin',
          is_admin: true,
          registered_at: '2025-01-15T10:30:00Z',
          last_sign_in_at: '2025-09-18T16:45:00Z',
          email_confirmed_at: '2025-01-15T10:30:00Z'
        },
        {
          user_id: 'usr-002',
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          user_type: 'premium',
          is_admin: false,
          registered_at: '2025-02-20T14:20:00Z',
          last_sign_in_at: '2025-09-17T09:15:00Z',
          email_confirmed_at: '2025-02-20T14:20:00Z'
        },
        {
          user_id: 'usr-003',
          email: 'jane.smith@company.com',
          full_name: 'Jane Smith',
          user_type: 'free',
          is_admin: false,
          registered_at: '2025-03-10T12:00:00Z',
          last_sign_in_at: '2025-09-16T11:30:00Z',
          email_confirmed_at: '2025-03-10T12:00:00Z'
        },
        {
          user_id: 'adm-004',
          email: 'support@jobnex.ai',
          full_name: 'Support Team',
          user_type: 'admin',
          is_admin: true,
          registered_at: '2025-01-01T10:00:00Z',
          last_sign_in_at: '2025-09-18T17:00:00Z',
          email_confirmed_at: '2025-01-01T10:00:00Z'
        },
        {
          user_id: 'usr-005',
          email: 'marie.dupont@freelance.fr',
          full_name: 'Marie Dupont',
          user_type: 'premium',
          is_admin: false,
          registered_at: '2025-04-05T14:30:00Z',
          last_sign_in_at: '2025-09-15T10:45:00Z',
          email_confirmed_at: '2025-04-05T14:30:00Z'
        }
      ];
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

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
      // TODO: Implémenter la vraie logique Supabase plus tard
      console.log('Promoting user:', userId);
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? {...user, is_admin: true, user_type: 'admin'} : user
      ));
      setActionMsg('Utilisateur promu admin (démo)');
    });
  };
  const handleSuspend = async (userId: string) => {
    setActionMsg(null);
    await confirmAndRun('Confirmer la suspension de cet utilisateur ?', async () => {
      // TODO: Implémenter la vraie logique Supabase plus tard
      console.log('Suspending user:', userId);
      setUsers(prev => prev.map(user => 
        user.user_id === userId ? {...user, user_type: 'suspended'} : user
      ));
      setActionMsg('Utilisateur suspendu (démo)');
    });
  };
  const handleDelete = async (userId: string) => {
    setActionMsg(null);
    await confirmAndRun('Supprimer définitivement cet utilisateur ?', async () => {
      // TODO: Implémenter la vraie logique Supabase plus tard
      console.log('Deleting user:', userId);
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      setActionMsg('Utilisateur supprimé (démo)');
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
