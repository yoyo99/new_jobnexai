import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, price } = await request.json();

    // Pour le moment, on simule la création dans Stripe
    // Plus tard on peut ajouter l'API Stripe réelle
    const mockStripeProduct = {
      id: `prod_${Date.now()}`,
      name,
      description,
      default_price: {
        id: `price_${Date.now()}`,
        unit_amount: price * 100, // Stripe utilise les centimes
        currency: 'eur',
        recurring: { interval: 'month' }
      }
    };

    console.log('🟢 Produit créé dans Stripe (simulé):', mockStripeProduct);

    // Sauvegarder aussi en base
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        price,
        currency: 'EUR',
        interval: 'month',
        stripe_product_id: mockStripeProduct.id,
        stripe_price_id: mockStripeProduct.default_price.id,
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur sauvegarde produit:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      product,
      stripe_product: mockStripeProduct
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
