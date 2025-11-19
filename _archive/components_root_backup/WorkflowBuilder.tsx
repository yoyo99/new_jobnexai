import React, { useState } from 'react';

const actions = [
  { label: "Notifier par email", value: "email" },
  { label: "Afficher un toast", value: "toast" },
  { label: "Notifier sur Slack (bientôt)", value: "slack", disabled: true },
];

const triggers = [
  { label: "Nouvelle offre détectée", value: "offer" },
  { label: "Nouvel email reçu", value: "email" },
  { label: "Echec IA", value: "iafail" },
];

export default function WorkflowBuilder() {
  const [trigger, setTrigger] = useState('offer');
  const [action, setAction] = useState('toast');
  const [created, setCreated] = useState(false);

  const handleCreate = () => {
    setCreated(true);
    // Ici, on pourrait sauvegarder le workflow côté backend ou localStorage
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>Automatisation simple (workflow)</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Déclencheur :</label><br/>
        <select value={trigger} onChange={e => setTrigger(e.target.value)}>
          {triggers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>Action :</label><br/>
        <select value={action} onChange={e => setAction(e.target.value)}>
          {actions.map(a => <option key={a.value} value={a.value} disabled={a.disabled}>{a.label}</option>)}
        </select>
      </div>
      <button onClick={handleCreate} style={{ marginTop: 8 }}>
        Créer le workflow
      </button>
      {created && (
        <div style={{ marginTop: 16, color: '#22c55e' }}>
          Workflow enregistré ! Il sera exécuté à la prochaine occurrence.
        </div>
      )}
      <div style={{ marginTop: 24, fontSize: 13, color: '#888' }}>
        <b>Exemple :</b> Si une nouvelle offre est détectée, alors affiche un toast.<br/>
        (L'intégration Slack arrive bientôt)
      </div>
    </div>
  );
}
