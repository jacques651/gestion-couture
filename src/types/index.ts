// src/types/index.ts
export interface Client {
  id: number;
  telephone_id: string;
  nom_prenom: string;
  profil?: string;
  adresse?: string;
  email?: string;
  observations?: string;
  est_supprime?: number;
  date_enregistrement?: string;
}

export interface Article {
  id: number;
  code_article: string;
  type_tenue_id: number;
  taille_id: number;
  couleur_id: number;
  texture_id: number;
  prix_achat: number;
  prix_vente: number;
  quantite_stock: number;
  seuil_alerte: number;
  emplacement: string | null;
  code_barre: string | null;
  notes: string | null;
  image_url: string | null;
  est_disponible: number;
  est_actif: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  type_tenue?: string;
  categorie?: string;
  taille?: string;
  couleur?: string;
  code_hex?: string;
  texture?: string;
  modele?: string;
}

export interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  categorie_id?: number;
  unite?: string;
  prix_achat: number;
  stock_actuel: number;
  seuil_alerte: number;
  reference_fournisseur?: string;
  emplacement?: string;
  est_supprime: number;
  created_at?: string;
  updated_at?: string;
  prix_vente: number;
}

export type VenteType = 'commande' | 'pret_a_porter' | 'matiere';