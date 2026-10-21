// app/legal/privacy.tsx — Politique de confidentialité
import React from 'react';
import LegalPage from '@/src/components/LegalPage';
import { SUPPORT_DISPLAY, SUPPORT_EMAIL } from '@/src/config';

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
        { title: 'Cadre légal et tes droits', body: 'Ce traitement de données est soumis à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel et à ses textes d’application, sous le contrôle de la Commission de protection des données personnelles (CDP). Tu disposes d’un droit d’accès, de rectification, d’opposition et de suppression de tes données. Tu peux aussi saisir la CDP (www.cdp.sn) si tu estimes que tes droits ne sont pas respectés.' },
        { title: 'Hébergement', body: 'Les données sont hébergées par nos prestataires techniques : Render (serveur) et Neon (base de données), dans des centres situés en Europe (Francfort, Allemagne), et Cloudflare (diffusion de l’application). Ces prestataires appliquent des garanties de sécurité et de confidentialité conformes aux standards internationaux.' },
        { title: 'Contact', body: `Pour exercer tes droits ou poser une question : ${SUPPORT_EMAIL} ou WhatsApp ${SUPPORT_DISPLAY}.` },
      ]}
    />
  );
}
