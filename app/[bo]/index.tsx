import { Redirect, useLocalSearchParams } from 'expo-router';

export default function BackofficeIndex() {
  const { bo } = useLocalSearchParams<{ bo: string }>();
  return <Redirect href={`/${bo}/overview` as any} />;
}
