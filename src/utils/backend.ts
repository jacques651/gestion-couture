// src/utils/backend.ts
// Résolution AUTOMATIQUE de l'URL du backend.
// Au démarrage, l'application teste elle-même les adresses possibles
// (dernière adresse enregistrée, localhost, IP du serveur…) et valide
// la connexion sans intervention de l'utilisateur.

const PORT = 3001;
const STORAGE_KEY = 'api_url';

// Base résolue en mémoire (prioritaire sur localStorage)
let resolvedBase: string | null = null;

/** Détecte si on tourne dans Tauri (application de bureau) */
export const isTauri = (): boolean => {
  return (
    '__TAURI_INTERNALS__' in window ||
    '__TAURI__' in window ||
    window.location.protocol === 'tauri:' ||
    window.location.hostname === 'tauri.localhost'
  );
};

/** Détecte si l'app est servie directement par le backend Express (mode web) */
const isServedByBackend = (): boolean => {
  const { protocol, port } = window.location;
  return (protocol === 'http:' || protocol === 'https:') && port === String(PORT);
};

/** Liste ordonnée des adresses candidates à tester */
export const getCandidateUrls = (): string[] => {
  const candidates: string[] = [];

  // 1. Dernière adresse validée
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) candidates.push(saved.replace(/\/+$/, ''));

  // 2. Mode web : même origine que la page
  if (isServedByBackend()) candidates.push(window.location.origin);

  // 3. Mode dev (Vite) : même hôte, port backend
  if (import.meta.env.DEV && window.location.hostname) {
    candidates.push(`http://${window.location.hostname}:${PORT}`);
  }

  // 4. Backend local (sidecar Tauri ou PC serveur)
  candidates.push(`http://localhost:${PORT}`);
  candidates.push(`http://127.0.0.1:${PORT}`);

  // 5. IP réseau du serveur (poste client)
  candidates.push(`http://192.168.2.1:${PORT}`);

  // Dédoublonner en conservant l'ordre
  return [...new Set(candidates)];
};

/** Teste /health sur une base donnée */
export const checkHealth = async (base: string, timeoutMs = 3000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(`${base}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return false;
    const data = await response.json().catch(() => null);
    return data?.success === true;
  } catch {
    return false;
  }
};

/** Enregistre la base validée */
export const saveApiBase = (base: string) => {
  const clean = base.replace(/\/+$/, '');
  resolvedBase = clean;
  localStorage.setItem(STORAGE_KEY, clean);
};

export interface ResolveOptions {
  /** Durée totale maximale de recherche (le backend sidecar peut mettre du temps à démarrer) */
  maxWaitMs?: number;
  /** Callback de progression (tentative, secondes écoulées) */
  onProgress?: (attempt: number, elapsedMs: number) => void;
}

/**
 * Détection automatique du serveur.
 * Boucle sur les candidats avec retries jusqu'à maxWaitMs :
 * indispensable au démarrage de Windows, où le backend/PostgreSQL
 * peuvent mettre plusieurs secondes à être prêts.
 */
export const resolveApiBase = async (options: ResolveOptions = {}): Promise<string | null> => {
  const { maxWaitMs = 45000, onProgress } = options;
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < maxWaitMs) {
    attempt++;
    onProgress?.(attempt, Date.now() - start);

    for (const base of getCandidateUrls()) {
      if (await checkHealth(base, 2500)) {
        saveApiBase(base);
        console.log(`✅ Serveur détecté automatiquement: ${base} (tentative ${attempt})`);
        return base;
      }
    }

    // Pause avant le prochain cycle
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.error('❌ Aucun serveur détecté après', Math.round((Date.now() - start) / 1000), 's');
  return null;
};

/** Base API courante (synchrone) — fallback raisonnable si pas encore résolue */
export const getApiBase = (): string => {
  if (resolvedBase) return resolvedBase;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return saved.replace(/\/+$/, '');

  if (import.meta.env.DEV) return `http://${window.location.hostname}:${PORT}`;
  if (isServedByBackend()) return window.location.origin;
  // Tauri production : backend sidecar local
  return `http://localhost:${PORT}`;
};

/**
 * Retourne l'URL complète pour les appels API
 * @param endpoint - Le chemin de l'API (ex: "/utilisateurs/login")
 * @returns L'URL complète avec le préfixe /api
 */
export const getApiUrl = (endpoint: string): string => {
  return `${getApiBase()}/api${endpoint}`;
};

/** URL de base pour l'API (compatibilité) */
export const API_BASE_URL = `/api`;

/** Pour déboguer : affiche l'URL de base utilisée */
export const getApiBaseUrl = (): string => {
  return getApiBase();
};
