import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete
} from "./api";

/**
 * VENTES
 */

export const getVentes =
async () => {

  return await apiGet(
    "/ventes"
  );
};

export const getVente =
async (id: number) => {

  return await apiGet(
    `/ventes/${id}`
  );
};

export const createVente =
async (data: any) => {

  return await apiPost(
    "/ventes",
    data
  );
};

export const updateVente =
async (
  id: number,
  data: any
) => {

  return await apiPut(
    `/ventes/${id}`,
    data
  );
};

export const deleteVente =
async (id: number) => {

  return await apiDelete(
    `/ventes/${id}`
  );
};

export const annulerVente =
async (id: number) => {

  return await apiPut(
    `/ventes/${id}/annuler`,
    {}
  );
};

/**
 * DETAILS
 */

export const getVenteDetails =
async (id: number) => {

  return await apiGet(
    `/ventes/${id}/details`
  );
};

/**
 * RENDEZ-VOUS
 */

export const getRendezVous =
async () => {

  return await apiGet(
    "/rendezvous"
  );
};

export const terminerRendezVous =
async (id: number) => {

  return await apiPut(
    `/rendezvous/${id}/terminer`,
    {}
  );
};

export const annulerRendezVous =
async (id: number) => {

  return await apiPut(
    `/rendezvous/${id}/annuler`,
    {}
  );
};

export const payerVente =
async (
  id: number,
  montant: number,
  mode_paiement: string
) => {

  return await apiPut(
    `/ventes/${id}/paiement`,
    {
      montant,
      mode_paiement
    }
  );
};