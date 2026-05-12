import {
  apiGet
} from "./api";

export interface FinanceStats {

  chiffreAffaires: number;

  paiements: number;

  depenses: number;

  benefice: number;
}

export interface LigneJournal {

  date: string;

  montant: number;

  type: 'entree' | 'sortie';

  description: string;

  entree: number;

  sortie: number;

  solde: number;
}

export const getFinanceStats =
  async (): Promise<FinanceStats> => {

    return await apiGet(
      "/finances/stats"
    );
  };

export const getJournal =
  async (): Promise<LigneJournal[]> => {

    return await apiGet(
      "/finances/journal"
    );
  };