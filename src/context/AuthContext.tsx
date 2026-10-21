// app/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as secureStorage from '../lib/secureStorage';
import { setAuthToken } from '../api/client';
import * as authApi from '../api/auth';

interface AuthUser {
  userId: number;
  fullName: string;
  phone: string;
  role: 'MEMBER' | 'ADMIN';
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean; // true pendant la restauration de session au demarrage
  login: (phone: string, password: string) => Promise<void>;
  register: (fullName: string, phone: string, email: string | null, password: string, acceptedTerms: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutOtherDevices: () => Promise<void>;
  // Met à jour le nom affiché après une modification de profil.
  setFullName: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'senetontine_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let raw = await secureStorage.getItem(STORAGE_KEY);
        if (!raw) {
          // Migration ponctuelle : les sessions ouvertes AVANT ce changement ont été
          // enregistrées dans AsyncStorage (non chiffré). On les reprend une seule fois vers
          // le stockage sécurisé plutôt que de déconnecter silencieusement tout le monde au
          // premier lancement après la mise à jour.
          const legacy = await AsyncStorage.getItem(STORAGE_KEY);
          if (legacy) {
            raw = legacy;
            await secureStorage.setItem(STORAGE_KEY, legacy);
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
        if (raw) {
          const saved = JSON.parse(raw);
          setUser({ userId: saved.userId, fullName: saved.fullName, phone: saved.phone, role: saved.role ?? 'MEMBER' });
          setToken(saved.token);
          setAuthToken(saved.token);
        }
      } catch {
        // session corrompue ou illisible : on repart simplement sur un etat deconnecte
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (auth: authApi.AuthResponse) => {
    setUser({ userId: auth.userId, fullName: auth.fullName, phone: auth.phone, role: auth.role ?? 'MEMBER' });
    setToken(auth.token);
    setAuthToken(auth.token);
    // SecureStore (Keychain/Keystore chiffré par l'OS) plutôt qu'AsyncStorage : ce blob
    // contient le token d'authentification, valable jusqu'à 30 jours (voir
    // TokenAuthFilter.MAX_ABSOLUTE_TTL_DAYS côté back) - il ne doit pas rester en clair sur
    // le disque d'un téléphone perdu/volé ou rooté. Voir app/lib/secureStorage.ts.
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const auth = await authApi.login(phone, password);
    await persist(auth);
  }, [persist]);

  const register = useCallback(async (fullName: string, phone: string, email: string | null, password: string, acceptedTerms: boolean) => {
    const auth = await authApi.register(fullName, phone, email, password, acceptedTerms);
    await persist(auth);
  }, [persist]);

  const logout = useCallback(async () => {
    // Revoque le token cote serveur avant de l'effacer localement. Best-effort : si le
    // reseau est coupe, on deconnecte quand meme localement (le token expirera de lui-meme
    // au plus tard selon la fenetre glissante cote backend).
    try {
      await authApi.logout();
    } catch {
      // pas bloquant
    }
    setUser(null);
    setToken(null);
    setAuthToken(null);
    await secureStorage.removeItem(STORAGE_KEY);
    // Ceinture et bretelles : au cas où une session "legacy" (voir migration ci-dessus)
    // n'aurait pas encore été nettoyée d'AsyncStorage pour une raison quelconque.
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const logoutOtherDevices = useCallback(async () => {
    await authApi.logoutOthers();
  }, []);

  const setFullName = useCallback(async (fullName: string) => {
    setUser((prev) => (prev ? { ...prev, fullName } : prev));
    try {
      const raw = await secureStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        await secureStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, fullName }));
      }
    } catch {
      // le nom reste correct en mémoire pour cette session
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, logoutOtherDevices, setFullName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>');
  return ctx;
}
