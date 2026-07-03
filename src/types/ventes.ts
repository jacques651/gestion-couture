// src/types/ventes.ts
export interface Vente {
  id: number;
  code_vente: string;
  type_vente: 'commande' | 'pret_a_porter' | 'matiere';
  date_vente: string;
  client_id: number | null;
  client_nom: string | null;
  mode_paiement: string | null;
  montant_total: number;
  montant_regle: number;
  statut: 'EN_ATTENTE' | 'PAYEE' | 'PARTIEL' | 'ANNULEE';
  observation: string | null;
  est_supprime: number;
  created_at?: string;
  updated_at?: string;
  details?: VenteDetail[];
}

export interface VenteDetail {
  id: number;
  vente_id: number;
  article_id?: number;
  matiere_id?: number;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  taille_libelle?: string;
  type_ligne?: 'article' | 'matiere' | 'prestation';
}

export interface PaiementVente {
  id: number;
  vente_id: number;
  montant: number;
  mode_paiement: string;
  observation?: string;
  created_at: string;
}

export interface RendezVous {
  id: number;
  vente_id: number;
  client_id: number;
  date_rendezvous: string;
  heure_rendezvous?: string;
  type_rendezvous: 'essayage' | 'livraison' | 'retrait';
  statut: 'planifie' | 'termine' | 'annule';
  observation?: string;
  created_at: string;
  updated_at: string;
  nom_prenom?: string;
  code_vente?: string;
}

export interface CreateVenteData {
  code_vente: string;
  type_vente: 'commande' | 'pret_a_porter' | 'matiere';
  date_vente: string;
  client_id?: number | null;
  client_nom?: string | null;
  mode_paiement?: string | null;
  montant_total: number;
  montant_regle: number;
  statut: string;
  observation?: string | null;
  details: Array<{
    type_produit: 'article' | 'matiere';
    article_id?: number | null;
    matiere_id?: number | null;
    designation: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    taille_libelle?: string | null;
  }>;
  rendezvous?: {
    client_id: number;
    type_rendezvous: string;
    date_rendezvous: string;
    heure_rendezvous?: string | null;
    statut: string;
  } | null;
}