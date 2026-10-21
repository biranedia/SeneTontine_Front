// app/lib/secureStorage.ts — Stockage local de la session (token + profil minimal)
// Sur mobile natif : Expo SecureStore (Keychain iOS / Keystore Android chiffré par l'OS) - un
// token d'authentification valable jusqu'à 30 jours ne doit pas rester en clair dans
// AsyncStorage, qui est un simple fichier non chiffré lisible par tout accès physique au
// stockage de l'app (ou par un appareil rooté/jailbreaké). Sur le web (pas de Keychain/Keystore
// OS), on retombe sur AsyncStorage, dont l'implémentation web est un wrapper autour de
// localStorage - c'est déjà le niveau de protection standard d'une session web classique.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const useSecureStore = Platform.OS !== 'web';

export async function getItem(key: string): Promise<string | null> {
  return useSecureStore ? SecureStore.getItemAsync(key) : AsyncStorage.getItem(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

export async function removeItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}
