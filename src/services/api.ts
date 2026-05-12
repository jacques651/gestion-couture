const API_URL = "http://localhost:4000";

/**
 * Gestion centralisée des réponses API
 */
async function handleResponse(
  response: Response
) {

  let data: any = null;

  try {

    data = await response.json();

  } catch {

    data = null;
  }

  // =========================
  // Erreur HTTP
  // =========================
  if (!response.ok) {

    throw new Error(
      data?.error ||
      "Erreur API"
    );
  }

  return data;
}

/**
 * GET
 */
export async function apiGet(
  endpoint: string
) {

  const response =
    await fetch(
      `${API_URL}${endpoint}`
    );

  return handleResponse(response);
}

/**
 * POST
 */
export async function apiPost(
  endpoint: string,
  data: any
) {

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(data),
      }
    );

  return handleResponse(response);
}

/**
 * PUT
 */
export async function apiPut(
  endpoint: string,
  data: any
) {

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(data),
      }
    );

  return handleResponse(response);
}

/**
 * DELETE
 */
export async function apiDelete(
  endpoint: string
) {

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        method: "DELETE",
      }
    );

  return handleResponse(response);
}