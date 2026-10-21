// /<clé> seul → /<clé>/overview. La clé est lue dans l'adresse réelle (et non dans les
// paramètres de route, qui valent « [bo] » sur la page générée à l'avance).
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BackofficeIndex() {
  const { bo } = useLocalSearchParams<{ bo: string }>();
  const fromUrl = Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.pathname.split('/').filter(Boolean)[0] : undefined;
  const key = fromUrl && fromUrl !== '[bo]' && fromUrl !== '%5Bbo%5D' ? fromUrl : bo;
  useEffect(() => {}, []);
  return <Redirect href={`/${key}/overview` as any} />;
}
