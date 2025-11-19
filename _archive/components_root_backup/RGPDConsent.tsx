import React, { useState } from 'react';

export default function RGPDConsent({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #ccc', zIndex: 9999, padding: 16 }}>
      <p>
        Ce service nécessite l'accès à certaines données personnelles (ex : email, boîte mail, API IA) pour fonctionner. En continuant, vous acceptez le traitement de vos données conformément à notre politique de confidentialité.
      </p>
      <button
        style={{ marginRight: 8 }}
        onClick={() => {
          setVisible(false);
          onAccept();
        }}
      >
        J'accepte
      </button>
      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">En savoir plus</a>
    </div>
  );
}
