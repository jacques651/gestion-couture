import {

  apiGet,
  apiPost,
  apiPut,
  apiDelete

} from "./api";

/**
 * ==============================
 * CREER COMMANDE
 * ==============================
 */
export const createCommande =
async (
  data: {

    client_id: string;

    designation: string;

    nombre: number;

    prix_unitaire: number;

    rendez_vous?: string;

    observation?: string;
  }
) => {

  return await apiPost(
    "/commandes",
    data
  );
};

/**
 * ==============================
 * LISTE COMMANDES
 * ==============================
 */
export const getCommandes =
async () => {

  return await apiGet(
    "/commandes"
  );
};

/**
 * ==============================
 * DETAILS COMMANDE
 * ==============================
 */
export const getCommandeById =
async (
  id: number
) => {

  return await apiGet(
    `/commandes/${id}`
  );
};

/**
 * ==============================
 * AJOUT PAIEMENT
 * ==============================
 */
export const ajouterPaiement =
async (
  data: {

    commande_id: number;

    montant: number;

    mode: string;

    observation?: string;
  }
) => {

  return await apiPost(
    "/commandes/paiements",
    data
  );
};

/**
 * ==============================
 * HISTORIQUE PAIEMENTS
 * ==============================
 */
export const getPaiementsCommande =
async (
  commande_id: number
) => {

  return await apiGet(
    `/commandes/${commande_id}/paiements`
  );
};

/**
 * ==============================
 * SUPPRESSION LOGIQUE
 * ==============================
 */
export const deleteCommande =
async (
  id: number
) => {

  return await apiDelete(
    `/commandes/${id}`
  );
};

/**
 * ==============================
 * UPDATE COMMANDE
 * ==============================
 */
export const updateCommande =
async (

  id: number,

  data: any

) => {

  return await apiPut(

    `/commandes/${id}`,

    data
  );
};