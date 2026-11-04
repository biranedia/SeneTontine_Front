// app/[bo]/index.tsx — Redirige /<clé> vers /<clé>/overview automatiquement.
import { Redirect, useLocalSearchParams } from 'expo-router';
import { backofficeKey } from '@/src/api/client';

export default function AdminIndex() {
  const { bo } = useLocalSearchParams<{ bo: string }>();
  const key = bo ?? backofficeKey();
  return <Redirect href={`/${key}/overview` as any} />;
}
