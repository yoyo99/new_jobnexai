import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ScrapingSitesManager() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchSites() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('scraping_sites').select('*');
      if (error) {
        setError('Erreur lors du chargement des sites de scraping');
        setSites([]);
      } else {
        setSites(data || []);
      }
      setLoading(false);
    }
    fetchSites();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white/5 rounded-lg shadow text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Nom du site</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">URL</th>
          </tr>
        </thead>
        <tbody>
          {sites.map(site => (
            <tr key={site.id} className="border-t border-white/10">
              <td className="px-4 py-2">{site.id}</td>
              <td className="px-4 py-2">{site.name}</td>
              <td className="px-4 py-2">{site.type}</td>
              <td className="px-4 py-2">{site.url}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sites.length === 0 && <div className="p-4 text-gray-400">Aucun site de scraping trouvé.</div>}
    </div>
  );
}
