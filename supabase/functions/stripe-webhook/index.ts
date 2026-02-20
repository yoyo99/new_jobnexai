import Stripe from 'npm:stripe@^14.0.0';
import { createClient } from 'npm:@supabase/supabase-js@^2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // Permet une chaîne de version API personnalisée du dashboard Stripe
  // deno-lint-ignore-next-line no-explicit-any
  apiVersion: '2023-10-16', // Consistent API version
  // typescript: true, // Optionnel: pour une meilleure inférence de type si supporté
});
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Get CORS headers for this request
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[STRIPE WEBHOOK] OPTIONS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  // Read body once
  let rawBodyForLoggingAndProcessing: string;
  try {
    rawBodyForLoggingAndProcessing = await req.text();
    console.log(`[STRIPE WEBHOOK] Request body length: ${rawBodyForLoggingAndProcessing?.length || 0}`);
  } catch (bodyError: any) {
    console.error(`[STRIPE WEBHOOK] Failed to read request body: ${bodyError.message}`);
    return new Response('Failed to read request body', { status: 500, headers: corsHeaders });
  }

  try {
    // **** NEW DEBUG LOG ****
    console.log('[STRIPE WEBHOOK DEBUG] Entering main try block.');
    const signature = req.headers.get('stripe-signature')
    // **** NEW DEBUG LOG ****
    console.log(`[STRIPE WEBHOOK DEBUG] Stripe Signature Header: ${signature}`);
    if (!signature) {
      // **** NEW DEBUG LOG ****
      console.error('[STRIPE WEBHOOK DEBUG] No signature provided. Throwing error.');
      throw new Error('No signature provided')
    }

    // const body = await req.text(); // Already read into rawBodyForLoggingAndProcessing
    const body = rawBodyForLoggingAndProcessing!; // Use the already read body, assert not null as we'd return 500 if it was
    
    // SECURITY: La vérification de signature est OBLIGATOIRE
    // Ne jamais traiter un webhook sans vérifier la signature Stripe
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log(`[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET: ${webhookSecret ? 'configured' : 'MISSING'}`);

    if (!webhookSecret) {
      console.error('[STRIPE WEBHOOK] CRITICAL: STRIPE_WEBHOOK_SECRET is not configured. Rejecting request.');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured. Contact administrator.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let event;
    try {
      console.log('[STRIPE WEBHOOK] Verifying signature...');
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      console.log('[STRIPE WEBHOOK] Signature verification SUCCESSFUL.');
    } catch (sigError: any) {
      console.error(`[STRIPE WEBHOOK] Signature verification FAILED: ${sigError.message}`);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // **** NEW DEBUG LOG ****
    console.log(`[STRIPE WEBHOOK DEBUG] Event type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('[STRIPE WEBHOOK DEBUG] Processing checkout.session.completed.');
        const session = event.data.object as Stripe.Checkout.Session; // Cast for better type safety
        console.log('[STRIPE WEBHOOK DEBUG] Checkout session object (metadata only):', JSON.stringify(session.metadata));

        const userId = session.metadata?.supabase_user_id;
        const userTypeFromMetadata = session.metadata?.user_type as 'candidate' | 'freelancer' | 'recruiter' | 'admin' | null;
        const supabaseProductIdFromSession = session.metadata?.supabase_product_id;
        console.log(`[STRIPE WEBHOOK DEBUG] Extracted from session metadata - userId: ${userId}, userType: ${userTypeFromMetadata}, supabase_product_id (from session): ${supabaseProductIdFromSession}`);

        if (!session.subscription) {
          console.error('[STRIPE WEBHOOK DEBUG] CRITICAL: session.subscription is null or undefined.');
          return new Response('Webhook Error: Missing session.subscription', { status: 400 });
        }

        const subscriptionDetails = await stripe.subscriptions.retrieve(
          session.subscription as string, // Ensure it's treated as a string ID
          {
            expand: ['items.data.price.product', 'customer'], // Expand customer if its details are needed later
          }
        );
        console.log(`[STRIPE WEBHOOK DEBUG] Subscription details metadata: ${JSON.stringify(subscriptionDetails.metadata)}`);
        const productFromSubItem = subscriptionDetails.items.data[0]?.price?.product;
        let productMetadataFromSubItemLog = "Product not expanded, not an object, or no metadata";
        if (productFromSubItem && typeof productFromSubItem === 'object' && 'metadata' in productFromSubItem) {
          productMetadataFromSubItemLog = JSON.stringify((productFromSubItem as Stripe.Product).metadata);
        }
        console.log(`[STRIPE WEBHOOK DEBUG] Product metadata from subscription item: ${productMetadataFromSubItemLog}`);
        console.log(`[STRIPE WEBHOOK DEBUG] Price lookup_key from subscription item: ${subscriptionDetails.items.data[0]?.price?.lookup_key}`);

        let supabaseProductIdFromProductMeta: string | undefined | null = null;
        // productFromSubItem is defined in the preceding chunk
        if (productFromSubItem && typeof productFromSubItem === 'object' && 'metadata' in productFromSubItem) {
          supabaseProductIdFromProductMeta = (productFromSubItem as Stripe.Product).metadata?.supabase_product_id;
        }

        const planLookupKey = supabaseProductIdFromSession || // 1. From session metadata (highest priority)
                             subscriptionDetails.metadata?.supabase_product_id || // 2. From subscription object metadata
                             supabaseProductIdFromProductMeta || // 3. From product metadata on the price item (safe access)
                             subscriptionDetails.items.data[0]?.price?.lookup_key || // 4. From price's lookup_key
                             'default_plan_if_not_found'; // 5. Default

        console.log(`[STRIPE WEBHOOK DEBUG] Determined planLookupKey: ${planLookupKey}`);

        const customerId = session.customer
        const subscriptionId = session.subscription
        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: subscriptionDetails.status, // ex: 'active', 'trialing'
          plan: planLookupKey,
          current_period_end: subscriptionDetails.current_period_end
            ? new Date(subscriptionDetails.current_period_end * 1000).toISOString()
            : null,
          cancel_at: subscriptionDetails.cancel_at
            ? new Date(subscriptionDetails.cancel_at * 1000).toISOString()
            : null, // cancel_at_period_end field removed as column doesn't exist
        };

        let attempts = 0;
        let upsertSuccess = false;
        let lastError;

        while (attempts < 3 && !upsertSuccess) {
          attempts++;
          console.log(`[STRIPE WEBHOOK DEBUG] Attempt ${attempts} to upsert subscription for user ${userId}. Data: ${JSON.stringify(subscriptionData, null, 2)}`);
          // Assurez-vous que 'supabase' est bien votre client Supabase initialisé avec la SERVICE_ROLE_KEY
          const { error } = await supabase 
            .from('subscriptions')
            .upsert(subscriptionData, {
              onConflict: 'user_id', // Cible la colonne user_id pour le conflit
            });

          if (error) {
            lastError = error;
            console.error(`Upsert attempt ${attempts} failed for user ${userId}:`, error);
            if (attempts < 3) {
              console.log(`Waiting 2 seconds before retry for user ${userId}...`);
              await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s
            }
          } else {
            upsertSuccess = true;
            console.log(`[STRIPE WEBHOOK DEBUG] Subscription upserted successfully for user ${userId} on attempt ${attempts} to plan ${planLookupKey}.`);
          }
        }

        if (!upsertSuccess) {
          console.error(`Failed to upsert subscription for user ${userId} after ${attempts} attempts. Last error:`, lastError);
          return new Response(`Webhook Error: Failed to update Supabase. Last error: ${lastError?.message}`, { status: 500 });
        }
          // **** NEW DEBUG LOG ****
        console.log(`[STRIPE WEBHOOK DEBUG] Successfully processed checkout.session.completed for user ${userId}.`);

        // **** NOUVEAU : Mettre à jour le statut de l'abonnement dans la table profiles ****
        console.log(`[STRIPE WEBHOOK DEBUG] Updating profiles table for user ${userId} with status: ${subscriptionDetails.status}`);
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ subscription_status: subscriptionDetails.status })
          .eq('id', userId);

        if (profileUpdateError) {
          console.error(`[STRIPE WEBHOOK DEBUG] CRITICAL: Failed to update profile status for user ${userId}:`, profileUpdateError.message);
          // Ne pas bloquer le processus pour cette erreur, mais la logger comme critique.
        } else {
          console.log(`[STRIPE WEBHOOK DEBUG] Successfully updated profile status for user ${userId}.`);
        }
        // **** FIN DE LA MISE À JOUR DU PROFIL ****
      // La re-lecture immédiate est maintenant moins critique avec la logique de réessai et la contrainte unique.
        // Vous pouvez la décommenter si vous souhaitez conserver une vérification explicite.
        /*
        console.log(`Attempting to re-read subscription for user ${userId} with service role key...`);
        const { data: reReadData, error: reReadError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId); // Lire en utilisant le user_id suffit maintenant
        if (reReadError) {
          console.error('Error re-reading subscription immediately after upsert:', reReadError);
        } else {
          console.log('Re-read subscription data immediately after upsert:', JSON.stringify(reReadData, null, 2));
          if (!reReadData || reReadData.length === 0) {
            console.warn('WARN: Re-read attempt returned no data for the subscription just upserted.');
          }
        }
        */

        // Envoyer un email de confirmation après la mise à jour réussie de la BDD
        const userEmail = session.customer_details?.email;
        if (userEmail && planLookupKey && planLookupKey !== 'free') { 
          try {
            console.log(`Attempting to send confirmation email to ${userEmail} for plan ${planLookupKey}`);
            const emailHtml = `<h1>Merci pour votre abonnement !</h1><p>Votre plan '${planLookupKey}' est maintenant actif.</p><p>Connectez-vous à votre compte pour profiter de toutes les fonctionnalités.</p>`;
            const emailText = `Merci pour votre abonnement ! Votre plan '${planLookupKey}' est maintenant actif. Connectez-vous à votre compte pour profiter de toutes les fonctionnalités.`;
            const { data: emailSendData, error: emailError } = await supabase.functions.invoke("send-notification-email", {
              body: {
                to: userEmail,
                subject: "Confirmation de votre abonnement JobNexAI",
                html: emailHtml,
                text: emailText,
              },
              headers: { 
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              }
            });

            if (emailError) {
              console.error(`Error invoking send-notification-email function: ${emailError.message}`);
              if(emailSendData) {
                console.error('Response data from failed email invocation:', emailSendData);
              }
            } else {
              console.log(`Successfully invoked send-notification-email for ${userEmail}. Response:`, emailSendData);
            }
          } catch (e: unknown) {
            if (e instanceof Error) {
              console.error(`Exception when trying to invoke send-notification-email: ${e.message}`);
            } else {
              console.error('An unknown error occurred during send-notification-email invocation:', e);
            }
          }
        } else if (!userEmail) {
          console.warn("Could not send confirmation email: User email not found in checkout session details.");
        } else if (planLookupKey === 'free'){
          console.log("Skipping email confirmation for free plan.");
        }

        // Mettre à jour le type d'utilisateur si nécessaire
        if (userTypeFromMetadata) { // Use the variable derived from session metadata
          console.log(`[STRIPE WEBHOOK DEBUG] Attempting to update profile for userId: ${userId} with user_type: ${userTypeFromMetadata}`);
          const { error: userTypeError } = await supabase
            .from('profiles')
            .update({ user_type: userTypeFromMetadata })
            .eq('id', userId);
            
          if (userTypeError) {
            console.error(`[STRIPE WEBHOOK DEBUG] Error updating user_type for ${userId}:`, userTypeError);
            // Decide if this should be a critical error that stops processing or just a warning
            // For now, we'll log and continue, but this might need re-evaluation.
            // throw userTypeError; // Uncomment to make it critical
          } else {
            console.log(`[STRIPE WEBHOOK DEBUG] Successfully updated user_type for userId: ${userId} to ${userTypeFromMetadata}`);
          }
        } else {
          console.log(`[STRIPE WEBHOOK DEBUG] No userTypeFromMetadata found in session, skipping profile update for user_type.`);
        }
        
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: typeof subscription.current_period_end === 'number' 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null, // Set to null if invalid
            cancel_at: subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000).toISOString()
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) throw error
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            cancel_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) throw error
        break
      }
    }

    // **** NEW DEBUG LOG ****
    console.log('[STRIPE WEBHOOK DEBUG] Successfully processed event (or no relevant event type found), sending 200 OK.');
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
} catch (e: unknown) {
  // **** NEW DEBUG LOG ****
  if (e instanceof Error) {
    console.error('[STRIPE WEBHOOK DEBUG] CAUGHT ERROR in main try block:', e.message, e.stack);
    return new Response(`Webhook error: ${e.message}`, { status: 400 });
  }
  console.error('[STRIPE WEBHOOK DEBUG] CAUGHT ERROR in main try block (unknown type):', e);
  return new Response('Webhook error: An unknown error occurred', { status: 400 });
}
}) // Closing Deno.serve