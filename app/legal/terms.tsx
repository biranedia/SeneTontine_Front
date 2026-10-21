// app/legal/terms.tsx — Conditions générales d'utilisation
import React from 'react';
import LegalPage from '@/src/components/LegalPage';
import { SUPPORT_DISPLAY } from '@/src/config';

export default function TermsScreen() {
  return (
    <LegalPage
      title="Conditions d’utilisation"
      updated="octobre 2026"
      sections={[
        { title: '1. Objet', body: 'SèneTontine aide à organiser et suivre des tontines (épargne rotative entre proches) : création du groupe, ordre de passage, suivi des cotisations et des versements, rappels.' },
        { title: '2. Aucun argent ne transite par l’application', body: 'Les cotisations sont envoyées directement par les membres au créateur de la tontine, via Wave ou Orange Money, et le pot est reversé par le créateur au bénéficiaire de chaque tour. SèneTontine n’encaisse, ne détient et ne transfère aucune somme : l’application enregistre uniquement les déclarations et confirmations faites par les membres.' },
        { title: '3. Rôle du créateur', body: 'Le créateur d’une tontine reçoit les cotisations sur ses numéros Wave / Orange Money, confirme leur réception dans l’application et verse le pot au bénéficiaire. Il est seul responsable de la bonne gestion de ces sommes vis-à-vis des membres.' },
        { title: '4. Engagement des membres', body: 'En rejoignant une tontine, chaque membre s’engage à verser sa cotisation à chaque tour jusqu’à la fin, à déclarer ses paiements de bonne foi et à confirmer la réception de son pot. Un membre ayant déjà reçu son tour ne peut pas quitter la tontine avant son terme.' },
        { title: '5. Pénalités de retard', body: 'Une tontine peut prévoir une pénalité par jour de retard. Son montant est calculé à titre indicatif par l’application ; son paiement se règle entre les membres et le créateur.' },
        { title: '6. Tarifs pour les créateurs', body: 'Rejoindre une tontine, déclarer ses paiements et l’épargne personnelle sont gratuits. La première tontine créée par chaque utilisateur est offerte. Chaque tontine supplémentaire, ainsi que le renouvellement d’une tontine terminée, coûte 2 500 FCFA, plus les frais du prestataire de paiement affichés avant validation, payés une seule fois par Wave ou Orange Money via notre prestataire de paiement NabooPay. Ce paiement donne droit à une création (ou un renouvellement) ; il n’est pas récurrent. Les tontines en cours ne sont jamais bloquées.' },
        { title: '7. Épargne personnelle', body: 'Les objectifs d’épargne personnelle sont visibles de toi seul. L’application enregistre les montants que tu déclares mettre de côté ; elle ne détient ni ne déplace aucune somme.' },
        { title: '8. Litiges et modération', body: 'SèneTontine n’est pas partie aux engagements financiers entre membres. Tout membre peut signaler un problème depuis l’application ; les administrateurs peuvent suspendre un compte ou annuler une tontine en cas d’abus.' },
        { title: '9. Compte', body: 'Tu es responsable de la confidentialité de ton mot de passe. Tu peux supprimer ton compte à tout moment depuis ton profil, une fois tes tontines en cours terminées.' },
        { title: '10. Contact', body: `Pour toute question : WhatsApp ${SUPPORT_DISPLAY}.` },
      ]}
    />
  );
}
