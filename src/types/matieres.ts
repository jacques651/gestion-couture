export interface Matiere {

  id: number;

  code_matiere: string;

  designation: string;

  categorie_id: number;

  unite: string;

  prix_achat: number;

  stock_actuel: number;

  seuil_alerte: number;

  reference_fournisseur?: string;

  emplacement?: string;

  est_supprime: number;

  created_at?: string;
}