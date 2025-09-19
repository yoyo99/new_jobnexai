'use client';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  stripe_product_id?: string;
  stripe_price_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ProductsCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    // Pour l'instant, on utilise des données mockées
    // Plus tard on pourra créer une vraie table products
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Plan Gratuit',
        description: 'Accès de base aux fonctionnalités essentielles',
        price: 0,
        currency: 'EUR',
        interval: 'month',
        features: ['5 recherches par mois', 'Support email', 'Tableau de bord basique'],
        active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      },
      {
        id: '2', 
        name: 'Pro Business',
        description: 'Solution complète pour les recruteurs professionnels',
        price: 29.99,
        currency: 'EUR',
        interval: 'month',
        features: ['Recherches illimitées', 'Support prioritaire', 'Analytics avancées', 'Export données', 'API accès'],
        stripe_product_id: 'prod_stripe_example',
        stripe_price_id: 'price_stripe_example',
        active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      },
      {
        id: '3',
        name: 'Enterprise',
        description: 'Solution sur-mesure pour les grandes entreprises', 
        price: 99.99,
        currency: 'EUR',
        interval: 'month',
        features: ['Tout du Pro', 'Multi-utilisateurs', 'SSO', 'Support dédié', 'Formations', 'SLA garanti'],
        stripe_product_id: 'prod_enterprise_example',
        stripe_price_id: 'price_enterprise_example', 
        active: true,
        created_at: '2025-01-01',
        updated_at: '2025-01-01'
      }
    ];
    
    setProducts(mockProducts);
    setLoading(false);
  };

  const handleStripeLink = (product: Product) => {
    if (product.stripe_product_id) {
      // Lien vers le dashboard Stripe correct
      const stripeUrl = `https://dashboard.stripe.com/test/products/${product.stripe_product_id}`;
      window.open(stripeUrl, '_blank');
      alert(`🔗 Ouverture Stripe Dashboard\n\nProduit: ${product.name}\nStripe ID: ${product.stripe_product_id}\n\n✅ Redirection vers Stripe Dashboard`);
    } else {
      alert(`⚠️ Aucun ID Stripe associé\n\nProduit: ${product.name}\n\n💡 Créez d'abord le produit dans Stripe puis associez l'ID`);
    }
  };

  const handleToggleActive = async (productId: string) => {
    // Logique pour activer/désactiver un produit
    setProducts(prev => 
      prev.map(p => 
        p.id === productId ? { ...p, active: !p.active } : p
      )
    );
  };

  if (loading) return <div className="p-4 text-gray-400">Chargement des produits...</div>;
  if (error) return <div className="p-4 text-red-400">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header avec bouton création */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Catalogue Produits</h2>
          <p className="text-gray-400">Gestion des offres et plans d'abonnement</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          + Nouveau Produit
        </button>
      </div>

      {/* Grille des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
            {/* Header produit */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-primary-400">
                    {product.price === 0 ? 'Gratuit' : `${product.price}€`}
                  </span>
                  {product.price > 0 && (
                    <span className="text-gray-400 text-sm">/{product.interval === 'month' ? 'mois' : 'an'}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${product.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {product.active ? 'Actif' : 'Inactif'}
                </span>
                {product.stripe_product_id && (
                  <button 
                    onClick={() => handleStripeLink(product)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Voir dans Stripe
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4">{product.description}</p>

            {/* Features */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-200 mb-2">Fonctionnalités incluses :</h4>
              <ul className="space-y-1">
                {product.features.map((feature, index) => (
                  <li key={index} className="text-xs text-gray-400 flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-white/10">
              <button 
                onClick={() => handleToggleActive(product.id)}
                className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                  product.active 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {product.active ? 'Désactiver' : 'Activer'}
              </button>
              <button 
                onClick={() => {
                  const newName = prompt(`✏️ MODIFIER NOM PRODUIT\n\nNom actuel: ${product.name}`, product.name);
                  if (newName && newName !== product.name) {
                    setProducts(prev => prev.map(p => 
                      p.id === product.id ? {...p, name: newName} : p
                    ));
                    alert(`✅ Produit modifié !\n\nAncien nom: ${product.name}\nNouveau nom: ${newName}`);
                  }
                  
                  const newPrice = prompt(`💰 MODIFIER PRIX\n\nPrix actuel: ${product.price}€`, product.price.toString());
                  if (newPrice && parseFloat(newPrice) !== product.price) {
                    setProducts(prev => prev.map(p => 
                      p.id === product.id ? {...p, price: parseFloat(newPrice)} : p
                    ));
                    alert(`✅ Prix modifié !\n\nAncien prix: ${product.price}€\nNouveau prix: ${newPrice}€`);
                  }
                }}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
              >
                Modifier
              </button>
              {product.stripe_product_id && (
                <button 
                  onClick={() => handleStripeLink(product)}
                  className="py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-colors"
                >
                  Stripe
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire de création (placeholder) */}
      {showCreateForm && (
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Créer un nouveau produit</h3>
          <form id="create-product-form" className="grid grid-cols-2 gap-4">
            <input name="name" placeholder="Nom du produit" className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white" required />
            <input name="price" placeholder="Prix (€)" type="number" step="0.01" className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white" required />
            <textarea name="description" placeholder="Description" className="col-span-2 px-3 py-2 bg-white/10 border border-white/20 rounded text-white h-20" required></textarea>
            <div className="col-span-2 flex gap-2">
              <button 
                onClick={async () => {
                  try {
                    // Récupérer les données du formulaire
                    const form = document.querySelector('#create-product-form') as HTMLFormElement;
                    const formData = new FormData(form);
                    
                    const productData = {
                      name: formData.get('name') as string || 'Nouveau Produit',
                      description: formData.get('description') as string || 'Description du produit',
                      price: parseFloat(formData.get('price') as string) || 0
                    };

                    // Créer vraiment le produit via l'API
                    const response = await fetch('/api/admin/products/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(productData)
                    });

                    if (response.ok) {
                      const result = await response.json();
                      
                      // Ajouter le produit à la liste locale
                      const newProduct: Product = {
                        id: result.product.id,
                        name: result.product.name,
                        description: result.product.description,
                        price: result.product.price,
                        currency: 'EUR',
                        interval: 'month',
                        features: ['Nouvelle fonctionnalité'],
                        active: true,
                        stripe_product_id: result.stripe_product.id,
                        created_at: result.product.created_at,
                        updated_at: result.product.updated_at
                      };
                      
                      setProducts(prev => [...prev, newProduct]);
                      alert(`✅ Produit "${newProduct.name}" créé avec succès !\n\n🎯 Créé dans Supabase ET Stripe\n💳 Stripe ID: ${result.stripe_product.id}\n💰 Prix: ${newProduct.price}€/mois`);
                      
                      // Reset form
                      form.reset();
                      setShowCreateForm(false);
                    } else {
                      const error = await response.json();
                      alert(`❌ Erreur lors de la création:\n${error.error}`);
                    }
                  } catch (error) {
                    console.error('Erreur création produit:', error);
                    alert('❌ Erreur de connexion lors de la création du produit');
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Créer
              </button>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats rapides */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <h3 className="text-sm font-medium text-gray-200 mb-2">Statistiques Produits</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xl font-bold text-primary-400">{products.length}</div>
            <div className="text-xs text-gray-400">Total Produits</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-400">{products.filter(p => p.active).length}</div>
            <div className="text-xs text-gray-400">Produits Actifs</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-400">{products.filter(p => p.stripe_product_id).length}</div>
            <div className="text-xs text-gray-400">Liés à Stripe</div>
          </div>
        </div>
      </div>
    </div>
  );
}
