// src/types/db.ts

export interface CommandeDB {
  id: number;
  client_id: string;
  date_commande: string;
  designation: string;
  nombre: number;
  prix_unitaire: number;
  total: number;
  rendez_vous?: string;
  etat?: string;
  observation?: string;
  est_supprime: number;
}

export interface PaiementDB {
  id: number;
  commande_id: number;
  date_paiement: string;
  montant: number;
  mode?: string;
  observation?: string;
  client_nom?: string;
}

export interface DepenseDB {
  id: number;
  categorie?: string;
  designation?: string;
  montant: number;
  responsable?: string;
  date_depense: string;
  observation?: string;
}

export interface VenteDB {
  id: number;
  type?: string;
  designation?: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  date_vente: string;
}

export interface SalaireDB {
  id: number;
  employe_id: number;
  date_paiement: string;
  montant_brut: number;
  montant_emprunts: number;
  montant_net: number;
  employe_nom?: string;
}

export interface EmpruntDB {
  id: number;
  employe_id: number;
  date_emprunt: string;
  montant: number;
  deduit: number;
  date_deduction?: string;
}