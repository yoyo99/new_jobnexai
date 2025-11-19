import React from 'react';

export default function AdminSettings() {
  // Variables d'environnement accessibles côté client
  const envVars = [
    { key: 'VITE_SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL },
    { key: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY },
    { key: 'VITE_STRIPE_PUBLIC_KEY', value: import.meta.env.VITE_STRIPE_PUBLIC_KEY },
    { key: 'VITE_ENV', value: import.meta.env.VITE_ENV },
  ];
  return (
    <div className="bg-white/5 rounded-lg shadow p-4">
      <h4 className="text-primary-400 font-semibold mb-4">Variables d'environnement (lecture seule)</h4>
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Variable</th>
            <th className="px-4 py-2 text-left">Valeur</th>
          </tr>
        </thead>
        <tbody>
          {envVars.map(env => (
            <tr key={env.key} className="border-t border-white/10">
              <td className="px-4 py-2 font-mono">{env.key}</td>
              <td className="px-4 py-2 font-mono text-xs break-all">{env.value || <span className="text-gray-500">Non défini</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 text-gray-400 text-xs">Pour toute modification, contactez un administrateur technique.</div>
    </div>
  );
}
