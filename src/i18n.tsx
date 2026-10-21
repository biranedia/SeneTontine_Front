// Langue de l'appli : français (par défaut) ou wolof.
// Principe simple : t('texte français') renvoie la traduction wolof si elle existe, sinon le
// français. Les traductions sont dans WO ci-dessous (à faire relire par un locuteur).
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'fr' | 'wo';
const KEY = 'senetontine.lang';

export const WO: Record<string, string> = {
  // Barre d'onglets
  'Accueil': 'Kër',
  'Tontines': 'Natt yi',
  'Profil': 'Sama wàll',

  // Page d'accueil publique
  'Se connecter': 'Duggu',
  'Tontine en ligne · Sénégal': 'Natt ci internet · Senegaal',
  'Vos tontines,\nsimples et transparentes.': 'Sa natt yi,\nyomb te leer.',
  'Organise ta tontine entre proches sans cahier ni disputes : cotisations, tours de rôle et rappels, au même endroit.':
    'Organisal sa natt ak say mbokk te soxlawoo kayit walla xuloo : fey yi, ki ñuy jox ak fàttali yi, ñoom ñépp ci benn bërab.',
  'Créer ma tontine gratuitement': 'Sos sama natt ci dara',
  'J’ai déjà un compte': 'Am naa kont ba noppi',
  'Comment ça marche': 'Naka la doxee',
  'Crée ta tontine': 'Sosal sa natt',
  'Montant, nombre de membres, durée d’un tour. Invite tes proches avec un code ou leur numéro.':
    'Xaalis bi, limu ñi ci bokk, ak diirub benn tour. Wooal say mbokk ak benn kood walla seeni nimero.',
  'Chacun cotise par Wave ou Orange Money': 'Ku nekk dafay fey ak Wave walla Orange Money',
  'Le membre paie directement le créateur, puis déclare son paiement dans l’appli.':
    'Ki bokk ci natt bi dafay fey ki ko sos ci saa si, te wax ci appli bi ne fey na.',
  'Le créateur confirme': 'Ki sos natt bi dafay dëggal',
  'Tout le monde voit qui a payé, qui est en retard, et à qui revient la cagnotte.':
    'Ñépp gis nañu ku fey, ku yeexe, ak kan lañuy jox natt bi.',
  'La cagnotte tourne': 'Natt bi dafay wëndeelu',
  'Chaque tour, un membre reçoit la cagnotte. L’historique reste visible pour tous.':
    'Benn tour bu nekk, kenn ci ñi bokk dafay jot natt bi. Ñépp mën nañu gis li xewoon.',
  'Pourquoi SèneTontine': 'Lu tax SèneTontine',
  'Aucun argent ne transite par l’appli : il va directement au créateur.':
    'Benn xaalis jaaru ci appli bi : ci loxob ki sos natt bi lay dem ci saa si.',
  'Transparence totale : chaque cotisation est tracée.': 'Lépp leer na : fey bu nekk dañu koy bind.',
  'Rappels avant chaque échéance.': 'Fàttali balaa bisu fey bi di agsi.',
  'Épargne personnelle gratuite pour tes propres objectifs.': 'Denc sa xaalis ci sa bopp, ci dara, ngir say jubluwaay.',
  'Tarif': 'Njëg',
  '1re tontine offerte': 'Natt bu jëkk bi, ci dara',
  'Ensuite 2 500 FCFA par nouvelle tontine ou par renouvellement, payés une seule fois par le créateur. Les membres ne paient rien à SèneTontine.':
    'Ginnaaw loolu, 2 500 FCFA ci natt bu bees walla bu ñuy dellu tambali, ki ko sos dafay fey benn yoon rekk. Ñi ci bokk duñu fey dara SèneTontine.',
  'L’épargne personnelle est toujours gratuite.': 'Denc sa xaalis ci sa bopp, ci dara la ba fàww.',
  'Prêt à lancer ta tontine ?': 'Pare nga ngir tambali sa natt ?',
  'Créer mon compte': 'Sos sama kont',
  'Une question ? Écris-nous sur WhatsApp': 'Am nga laaj ? Bindal nu ci WhatsApp',
  'Conditions d’utilisation': 'Sarti jëfandikoo',
  'Confidentialité': 'Sutura',

  // Connexion / inscription
  'Vos tontines, simples et transparentes.': 'Sa natt yi, yomb te leer.',
  'Connexion': 'Duggu',
  'Numéro de téléphone': 'Nimerob telefon',
  'Mot de passe': 'Baatu jàll',
  'Mot de passe oublié ?': 'Fàtte nga sa baatu jàll ?',
  'Pas encore de compte ?': 'Amaguloo kont ?',
  'Créer un compte': 'Sos benn kont',
  'Découvrir SèneTontine': 'Xam SèneTontine',
  'Ça prend moins d’une minute': 'Du yàgg benn simili',
  'Nom complet': 'Sa tur ak sa sant',
  'C’est ton identifiant de connexion et le numéro que tes proches utiliseront pour t’ajouter.':
    'Nimero bii nga koy duggoo, te moo la say mbokk di jëfandikoo ngir yokk la.',
  '8 caractères minimum': '8 araf lu néew',
  'Confirmer le mot de passe': 'Dëggalal baatu jàll bi',
  'J’accepte les': 'Nangu naa',
  'conditions d’utilisation': 'sarti jëfandikoo yi',
  'et la': 'ak',
  'politique de confidentialité': 'sarti sutura yi',
  'Champs manquants': 'Am na lu des',
  'Connexion impossible': 'Mënuloo duggu',
  'Inscription impossible': 'Mënuloo bindu',
  'Réessaie plus tard.': 'Jéemaatal ci kanam.',

  // Installer
  'Installer l’application': 'Samp appli bi',
  'Sur ton téléphone, comme une vraie appli': 'Ci sa telefon, ni appli bu dëgg',

  // Profil
  'Langue': 'Làkk',
  'Aide': 'Ndimbal',
  'Nous contacter sur WhatsApp': 'Jokkoo ak nun ci WhatsApp',
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (fr: string) => string };
const LangContext = createContext<Ctx>({ lang: 'fr', setLang: () => {}, t: (s) => s });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v === 'wo' || v === 'fr') setLangState(v); }).catch(() => {});
  }, []);
  const setLang = (l: Lang) => { setLangState(l); AsyncStorage.setItem(KEY, l).catch(() => {}); };
  const t = (fr: string) => (lang === 'wo' ? WO[fr] ?? fr : fr);
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export const useT = () => useContext(LangContext);
