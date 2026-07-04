// src/utils/backend.ts

// Configuration du backend - Détection automatique de l'IP
const SERVER_IP = window.location.hostname; // S'adapte à l'IP utilisée dans le navigateur
const PORT = 3001;

/**
 * Retourne l'URL complète pour les appels API
 * @param endpoint - Le chemin de l'API (ex: "/utilisateurs/login")
 * @returns L'URL complète avec le préfixe /api
 */
export const getApiUrl = (endpoint: string): string => {
  // En développement (mode Vite), utiliser l'IP du serveur
  if (import.meta.env.DEV) {
    return `http://${SERVER_IP}:${PORT}/api${endpoint}`;
  }
  
  // En production (build), utiliser la même origine
  // Le backend sert déjà le frontend sur le même serveur
  return `/api${endpoint}`;
};

/**
 * URL de base pour l'API
 * Utilisé pour les appels fetch directs sans passer par getApiUrl
 */
export const API_BASE_URL = `/api`;

/**
 * Pour déboguer : affiche l'URL de base utilisée
 */
export const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    return `http://${SERVER_IP}:${PORT}`;
  }
  return '';
};