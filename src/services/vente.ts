export interface Vente {

  client_id: string;

  client_telephone?: string;

  mode_paiement: string;

  id: number;

  code_vente: string;

  type_vente: string;

  date_vente: string;

  client_nom: string;

  montant_total: number;

  montant_regle: number;

  montant_restant: number;

  statut: string;

  observation?: string;
}