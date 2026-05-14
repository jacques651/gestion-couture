// src/services/api.ts

// Fonction pour récupérer l'URL du serveur configurée
const getApiUrl = () => {
  const savedUrl = localStorage.getItem('api_url');
  if (savedUrl) {
    return savedUrl;
  }
  // Valeur par défaut pour le développement
  return 'http://localhost:3001';
};

export const apiGet = async (url: string) => {
  try {
    const baseUrl = getApiUrl();
    const response = await fetch(`${baseUrl}${url}`);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
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
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
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
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
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
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API DELETE error:', error);
    throw error;
  }
};