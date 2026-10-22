// app/discover.tsx — Les tontines publiques ont été supprimées (risque d'arnaque) :
// on ne rejoint une tontine que sur invitation. Ancienne adresse redirigée vers « Rejoindre ».
import { Redirect } from 'expo-router';

export default function DiscoverRemoved() {
  return <Redirect href="/join" />;
}
