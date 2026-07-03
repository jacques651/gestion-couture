// Configuration du backend
export const getApiUrl = (endpoint: string): string => {
  // Utilise toujours localhost pour le développement
  return `http://localhost:3001${endpoint}`;
};

export const API_BASE_URL = 'http://localhost:3001';