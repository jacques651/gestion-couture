// src/services/api.ts
import { getApiUrl as getBackendUrl } from '../utils/backend';

// Fonction pour récupérer l'URL du serveur configurée
const getApiUrl = () => {
  // Utiliser la fonction centralisée de backend.ts
  return getBackendUrl('');
};

export const apiGet = async (url: string) => {
  try {
    // url doit commencer par / (ex: /utilisateurs)
    // getApiUrl retourne déjà le préfixe /api
    const baseUrl = getApiUrl();
    const fullUrl = `${baseUrl}${url}`;
    console.log('📤 GET:', fullUrl);
    
    const response = await fetch(fullUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur API: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API GET error:', error);
    throw error;
  }
};

export const apiPost = async (url: string, data?: any) => {
  try {
    const baseUrl = getApiUrl();
    const fullUrl = `${baseUrl}${url}`;
    console.log('📤 POST:', fullUrl, data);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API POST error details:', errorData);
      throw new Error(errorData.error || errorData.detail || `Erreur API: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API POST error:', error);
    throw error;
  }
};

export const apiPut = async (url: string, data?: any) => {
  try {
    const baseUrl = getApiUrl();
    const fullUrl = `${baseUrl}${url}`;
    console.log('📤 PUT:', fullUrl, data);
    
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API PUT error details:', errorData);
      throw new Error(errorData.error || `Erreur API: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API PUT error:', error);
    throw error;
  }
};

export const apiDelete = async (url: string) => {
  try {
    const baseUrl = getApiUrl();
    const fullUrl = `${baseUrl}${url}`;
    console.log('📤 DELETE:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur API: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API DELETE error:', error);
    throw error;
  }
};