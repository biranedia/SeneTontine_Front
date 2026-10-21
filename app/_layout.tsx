import '@/src/lib/webAlert';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { Loading } from '@/src/components/ui';
import { colors } from '@/src/theme';

// Écrans accessibles sans être connecté : connexion, inscription, pages légales.
const PUBLIC_SEGMENTS = [undefined, 'register', 'legal'];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const wanted = React.useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const first = segments[0] as string | undefined;
    const onPublic = PUBLIC_SEGMENTS.includes(first);
    const onAuthScreen = first === undefined || first === 'register';
    if (!user && !onPublic) {
      wanted.current = pathname; // mémorisé en mémoire uniquement, jamais dans l'URL
      router.replace('/');
    } else if (user && onAuthScreen) {
      const back = wanted.current;
      wanted.current = null;
      router.replace((back || '/accueil') as any);
    }
  }, [user, loading, segments]);

  if (loading) return <Loading />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <PaperProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }} />
        </AuthGate>
      </AuthProvider>
    </PaperProvider>
  );
}
