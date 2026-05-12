export interface Vente {

  id: number;

  code_vente: string;

  type_vente:
    | 'commande'
    | 'pret_a_porter'
    | 'matiere';

  date_vente: string;

  client_id?: number | null;

  client_nom?: string;

  mode_paiement?: string;

  montant_total: number;

  montant_regle: number;

  montant_restant: number;

  statut: string;

  observation?: string;

  created_at?: string;
}