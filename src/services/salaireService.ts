import {

  apiGet,
  apiPost

} from "./api";

export interface SalaireDetail {

  brut: number;

  retenues: number;

  net: number;

  dejaPaye: number;

  resteAPayer: number;
}

/**
 * =========================
 * CALCUL SALAIRE
 * =========================
 */
export const calculerSalaireEmploye =
async (

  employeId: number

): Promise<SalaireDetail> => {

  const res =
    await apiGet(
      `/salaires/${employeId}`
    );

  return {

    brut:
      Number(
        res?.brut || 0
      ),

    retenues:
      Number(
        res?.retenues || 0
      ),

    net:
      Number(
        res?.net || 0
      ),

    dejaPaye:
      Number(
        res?.dejaPaye || 0
      ),

    resteAPayer:
      Number(
        res?.resteAPayer || 0
      )
  };
};

/**
 * =========================
 * PAYER SALAIRE
 * =========================
 */
export const payerSalaire =
async (

  employeId: number,

  montant: number,

  mode: string,

  observation: string

) => {

  /**
   * VALIDATION
   */
  if (

    !montant
    ||
    montant <= 0

  ) {

    throw new Error(
      "Montant invalide"
    );
  }

  /**
   * API
   */
  return await apiPost(

    `/salaires/${employeId}/payer`,

    {

      montant,

      mode,

      observation
    }
  );
};