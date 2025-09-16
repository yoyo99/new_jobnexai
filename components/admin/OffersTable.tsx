import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function OffersTable() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('jobs').select('*');
      if (error) {
        setError('Erreur lors du chargement des offres');
        setOffers([]);
      } else {
        setOffers(data || []);
      }
      setLoading(false);
    }
    fetchOffers();
  }, []);

  if (loading) return <div className="p-4 text-gray-400">Chargement...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white/5 rounded-lg shadow text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Titre</th>
            <th className="px-4 py-2 text-left">Entreprise</th>
            <th className="px-4 py-2 text-left">Lieu</th>
            <th className="px-4 py-2 text-left">Créé le</th>
          </tr>
        </thead>
        <tbody>
          {offers.map(offer => (
            <tr key={offer.id} className="border-t border-white/10">
              <td className="px-4 py-2">{offer.id}</td>
              <td className="px-4 py-2">{offer.title || offer.job_title || ''}</td>
              <td className="px-4 py-2">{offer.company_name || offer.company || ''}</td>
              <td className="px-4 py-2">{offer.location || offer.city || ''}</td>
              <td className="px-4 py-2">{offer.created_at ? new Date(offer.created_at).toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {offers.length === 0 && <div className="p-4 text-gray-400">Aucune offre trouvée.</div>}
    </div>
  );
}
