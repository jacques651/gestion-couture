export interface ArticleComplet {

  id: number;

  code_article: string;

  modele_id: number;

  taille_id: number;

  couleur_id: number;

  texture_id: number | null;

  modele: string;

  taille: string;

  couleur: string;

  texture?: string;

  prix_achat: number | null;

  prix_vente: number;

  quantite_stock: number;

  seuil_alerte: number;

  emplacement?: string;

  code_barre?: string;

  notes?: string;

  est_disponible: number;

  est_actif?: number;
}