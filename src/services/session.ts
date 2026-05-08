export interface UtilisateurConnecte {

  id?: number;

  nom: string;

  role: string;

  permissions?: Record<
    string,
    {
      lecture: boolean;
      ecriture: boolean;
    }
  >;
}

const STORAGE_KEY = 'utilisateur_connecte';

// =========================
// SAUVEGARDE SESSION
// =========================
export function sauvegarderSession(
  utilisateur: UtilisateurConnecte
) {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(utilisateur)
  );
}

// =========================
// LIRE SESSION
// =========================
export function getUtilisateurConnecte():
  UtilisateurConnecte | null {

  const raw = localStorage.getItem(
    STORAGE_KEY
  );

  if (!raw) return null;

  try {

    return JSON.parse(raw);

  } catch {

    return null;

  }
}

// =========================
// SUPPRIMER SESSION
// =========================
export function supprimerSession() {

  localStorage.removeItem(
    STORAGE_KEY
  );
}