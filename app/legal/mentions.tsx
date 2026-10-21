// app/legal/mentions.tsx — Mentions légales (loi n° 2008-08 sur les transactions électroniques).
import React from 'react';
import LegalPage from '@/src/components/LegalPage';
import { SUPPORT_DISPLAY, SUPPORT_EMAIL } from '@/src/config';

export default function MentionsScreen() {
  return (
    <LegalPage
      title="Mentions légales"
      updated="octobre 2026"
      sections={[
        { title: 'Éditeur', body: `SèneTontine est un service édité par Papa Birane Diao, entrepreneur individuel, Dakar (Sénégal).\nE-mail : ${SUPPORT_EMAIL}\nWhatsApp : ${SUPPORT_DISPLAY}` },
        { title: 'Directeur de la publication', body: 'Papa Birane Diao.' },
        { title: 'Hébergement', body: 'Application web : Cloudflare, Inc. (San Francisco, États-Unis), réseau mondial.\nServeur : Render Services, Inc. (San Francisco, États-Unis), centre de Francfort (Allemagne).\nBase de données : Neon, Inc., centre de Francfort (Allemagne).' },
        { title: 'Nature du service', body: 'SèneTontine est un outil de suivi de tontines. Aucune somme ne transite par la plateforme : les cotisations sont réglées directement entre membres via des opérateurs agréés (Wave, Orange Money). Les frais de création sont encaissés par l’intermédiaire du prestataire de paiement NabooPay.' },
        { title: 'Données personnelles', body: 'Les données sont traitées conformément à la loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel. Détails dans la politique de confidentialité.' },
        { title: 'Propriété intellectuelle', body: 'Le nom SèneTontine, le logo, les textes et le code de l’application sont la propriété de leur éditeur. Toute reproduction sans autorisation est interdite.' },
      ]}
    />
  );
}
