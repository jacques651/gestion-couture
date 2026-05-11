import {
  apiGet
} from "./api";

/**
 * ==============================
 * MESURES CLIENT
 * ==============================
 */
export const getMesuresClient =
async (
  clientId: string
) => {

  return await apiGet(
    `/clients/${clientId}/mesures`
  );
};