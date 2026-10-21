// app/legal/privacy.tsx — Politique de confidentialité
import React from 'react';
import LegalPage, { CONTACT_EMAIL } from '@/src/components/LegalPage';

export default function PrivacyScreen() {
  return (
    <LegalPage
      title="Confidentialité"
      updated="octobre 2026"
      sections={[
        { title: 'Données collectées', body: 'Nom, numéro de téléphone, mot de passe (stocké chiffré, jamais en clair), photo de profil si tu en ajoutes une ; tontines rejointes ; déclarations et confirmations de cotisations (montant, moyen de paiement choisi, référence facultative) ; numéros Wave / Orange Money indiqués par les créateurs ; signalements et notifications.' },
        { title: 'Utilisation', body: 'Ces données servent uniquement au fonctionnement du service : identification, suivi des tontines entre leurs membres, rappels et notifications, sécurité des comptes et traitement des signalements. Aucune publicité, aucune revente, aucun partage commercial.' },
        { title: 'Qui voit quoi', body: 'Les membres d’une même tontine voient les noms, photos et statuts de paiement des autres membres. Les numéros Wave / Orange Money du créateur ne sont visibles que des membres de sa tontine. Les administrateurs de la plateforme peuvent consulter les comptes pour traiter un signalement.' },
        { title: 'Paiements', body: 'Les cotisations entre membres ne passent jamais par l’application. Les frais de création de tontine sont réglés sur la page sécurisée de notre prestataire NabooPay, à qui nous transmettons ton nom et ton numéro pour le paiement ; nous ne voyons ni ne conservons jamais tes codes Wave / Orange Money ou numéros de carte.' },
        { title: 'Sécurité', body: 'Les échanges avec le serveur sont chiffrés (HTTPS). La session est conservée dans le stockage sécurisé du téléphone.' },
        { title: 'Conservation et suppression', body: 'Tu peux supprimer ton compte depuis Profil › Supprimer mon compte. Ton nom, ton numéro et ta photo sont alors effacés immédiatement ; tes cotisations passées restent dans l’historique des tontines concernées sous la mention « Utilisateur supprimé », pour que les comptes des autres membres restent justes.' },
        { title: 'Contact', body: `Pour exercer tes droits ou poser une question : ${CONTACT_EMAIL}.` },
      ]}
    />
  );
}
