const API_URL = "http://localhost:3001";

export async function apiGet(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error("Erreur API");
  }

  return response.json();
}

export async function apiPost(endpoint: string, data: any) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Erreur API");
  }

  return response.json();
}
export async function apiDelete(endpoint: string) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Erreur API");
  }

  return response.json();
}