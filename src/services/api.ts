// src/services/api.ts
const API_BASE_URL = 'http://127.0.0.1:3001';

export const apiGet = async (url: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`);
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
    const response = await fetch(`${API_BASE_URL}${url}`, {
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
    const response = await fetch(`${API_BASE_URL}${url}`, {
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
    const response = await fetch(`${API_BASE_URL}${url}`, {
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