import {

  apiGet,
  apiPost,
  apiPut,
  apiDelete

} from "./api";

/**
 * USERS
 */

export const getUtilisateurs =
async () => {

  return await apiGet(
    "/utilisateurs"
  );
};

export const createUtilisateur =
async (data: any) => {

  return await apiPost(
    "/utilisateurs",
    data
  );
};

export const updateUtilisateur =
async (
  id: number,
  data: any
) => {

  return await apiPut(
    `/utilisateurs/${id}`,
    data
  );
};

export const deleteUtilisateur =
async (id: number) => {

  return await apiDelete(
    `/utilisateurs/${id}`
  );
};

export const toggleUtilisateur =
async (
  id: number,
  est_actif: number
) => {

  return await apiPut(
    `/utilisateurs/${id}/statut`,
    {
      est_actif
    }
  );
};

export const loginUtilisateur =
async (
  login: string,
  mot_de_passe: string
) => {

  return await apiPost(
    "/utilisateurs/login",
    {
      login,
      mot_de_passe
    }
  );
};