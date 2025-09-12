import React from 'react';
import SubscriptionPlanCard from '../components/SubscriptionPlanCard'; // Vérifiez le chemin
import { useTranslation } from 'react-i18next';

// Price IDs fournis par l'utilisateur pour le mode TEST
const PRICE_IDS = {
  OBJECTIF_EMPLOI_ANNUEL: 'price_1RWdSbQIOmiow871HazTXnUJ',
  OBJECTIF_EMPLOI_MENSUEL: 'price_1RWdQNQIOmiow871XZcJO7QK',
  ESSAI_GRATUIT_48H: 'price_1RWdHcQIOmiow871I3yM8fQM',
  RECRUTEUR_BUSINESS_ANNUEL: 'price_1RWHWKQIOmiow871iO6Nn2KC',
  RECRUTEUR_BUSINESS_MENSUEL: 'price_1RWHTwQIOmiow871O2ZWdTfr',
  FREELANCE_STARTER_ANNUEL: 'price_1RWHQbQIOmiow871ySCJbYPW',
  FREELANCE_STARTER_MENSUEL: 'price_1RWHMeQIOmiow871aruWiSAg',
};

const PricingPage: React.FC = () => {
  const { t } = useTranslation('translation');
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">{t('pricing.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">

        <SubscriptionPlanCard 
          planName={t('pricing.plans.essaiGratuit.name', 'Essai Gratuit 48h')}
          price={t('pricing.plans.essaiGratuit.price', 'Gratuit')}
          features={t('pricing.plans.essaiGratuit.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.ESSAI_GRATUIT_48H}
          userType='candidate'
        />

        <SubscriptionPlanCard 
          planName={t('pricing.plans.objectifEmploiMensuel.name', 'Objectif Emploi (Mensuel)')}
          price={t('pricing.plans.objectifEmploiMensuel.price')}
          features={t('pricing.plans.objectifEmploiMensuel.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.OBJECTIF_EMPLOI_MENSUEL}
          userType='candidate'
        />

        <SubscriptionPlanCard 
          planName={t('pricing.plans.objectifEmploiAnnuel.name', 'Objectif Emploi (Annuel)')}
          price={t('pricing.plans.objectifEmploiAnnuel.price')}
          features={t('pricing.plans.objectifEmploiAnnuel.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.OBJECTIF_EMPLOI_ANNUEL}
          userType='candidate'
        />

        <SubscriptionPlanCard 
          planName={t('pricing.plans.freelanceStarterMensuel.name', 'Freelance Starter (Mensuel)')}
          price={t('pricing.plans.freelanceStarterMensuel.price')}
          features={t('pricing.plans.freelanceStarterMensuel.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.FREELANCE_STARTER_MENSUEL}
          userType='freelancer'
        />

        <SubscriptionPlanCard 
          planName={t('pricing.plans.freelanceStarterAnnuel.name', 'Freelance Starter (Annuel)')}
          price={t('pricing.plans.freelanceStarterAnnuel.price')}
          features={t('pricing.plans.freelanceStarterAnnuel.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.FREELANCE_STARTER_ANNUEL}
          userType='freelancer'
        />

        <SubscriptionPlanCard 
          planName={t('pricing.plans.recruteurBusinessMensuel.name', 'Abonnement Recruteur Business (Mensuel)')}
          price={t('pricing.plans.recruteurBusinessMensuel.price')}
          features={t('pricing.plans.recruteurBusinessMensuel.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.RECRUTEUR_BUSINESS_MENSUEL}
          userType='recruiter'
          isEnterprise={true}
        />

        <SubscriptionPlanCard 
          planName={t('pricing.plans.recruteurBusinessAnnuel.name', 'Abonnement Recruteur Business (Annuel)')}
          price={t('pricing.plans.recruteurBusinessAnnuel.price')}
          features={t('pricing.plans.recruteurBusinessAnnuel.features', { returnObjects: true, defaultValue: [] }) as string[]}
          priceId={PRICE_IDS.RECRUTEUR_BUSINESS_ANNUEL}
          userType='recruiter'
          isEnterprise={true}
        />

      </div>
      <p className="text-center text-gray-600 mt-12">
        {t('pricing.footerText')}
      </p>
    </div>
  );
};

export default PricingPage;
