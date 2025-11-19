import React, { useState } from 'react';

const steps = [
  {
    title: "Bienvenue sur JobNexAI-FireStudio !",
    content: "Ce SaaS vous aide à gérer vos candidatures, abonnements et à tirer parti de l'IA pour booster votre carrière."
  },
  {
    title: "Connexion de votre boîte mail",
    content: "Connectez votre boîte mail pour que le SaaS détecte automatiquement les offres reçues dans vos emails."
  },
  {
    title: "Notifications personnalisées",
    content: "Programmez des alertes pour recevoir des notifications dès qu'une nouvelle offre ou mission correspondant à vos critères est détectée."
  },
  {
    title: "Abonnements adaptés",
    content: "Choisissez un abonnement adapté à votre profil (personne physique, morale, freelance, recruteur)."
  },
  {
    title: "IA personnalisée",
    content: "Renseignez votre propre clé API IA pour utiliser vos crédits OpenAI, Google, etc., directement dans la plateforme."
  },
  {
    title: "Sécurité & Confidentialité",
    content: "Vos données sont traitées conformément au RGPD. Vous pouvez activer la double authentification pour plus de sécurité."
  },
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  if (step >= steps.length) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#f8fafc', borderBottom: '1px solid #ccc', zIndex: 9999, padding: 24 }}>
      <h3>{steps[step].title}</h3>
      <p>{steps[step].content}</p>
      <button
        style={{ marginTop: 12 }}
        onClick={() => {
          if (step === steps.length - 1) onFinish();
          setStep(s => s + 1);
        }}
      >
        {step === steps.length - 1 ? "Terminer" : "Suivant"}
      </button>
    </div>
  );
}
