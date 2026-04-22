import { Role } from "../contexts/AuthContext";

export const pagePermissions: Record<string, Role[]> = {
  dashboard: ['admin', 'caissier', 'couturier'],
  clients: ['admin', 'caissier', 'couturier'],
  clients_mesures: ['admin','caissier','couturier'], // 🔥 AJOUT CRITIQUE
  commandes: ['admin', 'couturier'],
  paiements: ['admin', 'caissier'],
  factures: ['admin', 'caissier'],
  mesures: ['admin'],
  parametres: ['admin'],
  matieres: ['admin'],
  ventes: ['admin', 'caissier'],
  employes: ['admin'],
  prestations_types: ['admin'],
  prestations_realisees: ['admin', 'couturier'],
  emprunts: ['admin'],
  depenses: ['admin'],
  sorties_tenues: ['admin', 'couturier'],
  bilan_financier: ['admin'],
  etats_financiers: ['admin'],
  entrees_stock: ['admin'],
  sorties_stock: ['admin'],
  utilisateurs: ['admin'],
  journal_caisse: ['admin', 'caissier'],
  salaires: ['admin'],
  stock_global: ['admin'],
  salaires_historique: ['admin'],
};