// app/api/client.ts
import { Platform } from 'react-native';

// Client HTTP centralise vers le backend Spring Boot.
//
// HTTPS via Cloudflare Tunnel (solution temporaire de dev, voir note plus bas) : le tunnel
// expose ton backend local (localhost:8080) sur une URL publique en HTTPS, sans avoir besoin
// d'un nom de domaine ou d'un serveur. Lance-le avec :
//   cloudflared tunnel --url http://localhost:8080
// et copie l'URL "https://....trycloudflare.com" qu'il affiche au demarrage ci-dessous.
//
// IMPORTANT : c'est un tunnel "quick" (gratuit, sans compte Cloudflare) - son URL est
// ALEATOIRE et CHANGE a chaque redemarrage de cloudflared. Il faudra donc remettre a jour
// cette constante a chaque fois que tu relances le tunnel. Pour une URL stable (fixe dans le
// temps), il faudrait un compte Cloudflare + un nom de domaine et un "named tunnel" - etape
// suivante logique avant une vraie mise en production.
// En production, EXPO_PUBLIC_API_URL (ex. https://api.senetontine.com/api) remplace le tunnel.
const API_BASE_URL_HTTPS = process.env.EXPO_PUBLIC_API_URL || 'https://bids-landscapes-query-equally.trycloudflare.com/api';

// Repli LAN (sans HTTPS) : utile si tu veux retester en direct sur le meme Wi-Fi sans lancer
// le tunnel. Decommente la ligne EXPORT plus bas pour basculer dessus temporairement.
const API_HOST = '192.168.81.1';
const API_PORT = 8080;
const API_BASE_URL_LAN = `http://${API_HOST}:${API_PORT}/api`;

// Relatif : servi par le relais /api de metro.config.js (même origine que l'app web).
// En production : EXPO_PUBLIC_API_URL (ex. https://api.senetontine.com/api), défini au build.
const API_BASE_URL_WEB = process.env.EXPO_PUBLIC_API_URL || '/api';

// Sur le web (Expo web dans le navigateur DU MEME PC que le backend), on tape directement sur
// localhost plutot que sur le tunnel Cloudflare ou l'IP LAN : c'est plus fiable (le tunnel
// "quick" tombe parfois, et son URL change a chaque redemarrage), et surtout ca marche que le
// backend tourne en local ou non. Sur mobile natif (telephone), Platform.OS n'est jamais 'web'
// donc ce cas ne s'applique pas - le telephone garde le tunnel HTTPS (ou l'IP LAN si decommente).
export const API_BASE_URL = Platform.OS === 'web' ? API_BASE_URL_WEB : API_BASE_URL_HTTPS;
// export const API_BASE_URL = API_BASE_URL_LAN;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    // Erreur reseau (backend pas lance, mauvaise IP, telephone hors du Wi-Fi du PC...)
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifie que le backend tourne et que l'IP configurée est correcte.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || `Erreur serveur (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

// Variante texte brut (pas de JSON.parse) : utilisee pour les exports CSV admin, dont la
// reponse est directement le contenu du fichier plutot qu'un objet JSON.
export async function getRawText(path: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch (err) {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifie que le backend tourne et que l'IP configurée est correcte.");
  }
  const text = await response.text();
  if (!response.ok) {
    throw new ApiError(response.status, text || `Erreur serveur (${response.status})`);
  }
  return text;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
