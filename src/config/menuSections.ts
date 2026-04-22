import {
  Users,
  Settings,
  Scissors,
  LayoutDashboard,
  Building2,
  Package,
  DollarSign,
  CreditCard,
  FileText,
  Calendar,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { Role } from '../types/auth';
import { LucideIcon } from 'lucide-react';

// ================= TYPES =================

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon; // ✅ typage correct
  roles: Role[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

// ================= ROLES FACTORISÉS =================

const ALL_USERS: Role[] = ['admin', 'caissier', 'couturier'];
const ADMIN_ONLY: Role[] = ['admin'];
const ADMIN_CAISSIER: Role[] = ['admin', 'caissier'];

// ================= MENU =================

export const menuSections: MenuSection[] = [
  {
    title: "Principal",
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ALL_USERS },
    ],
  },
  {
    title: "Clients & Commandes",
    items: [
      { id: 'clients_mesures', label: 'Clients avec Mesures', icon: Users, roles: ALL_USERS },
      { id: 'commandes', label: 'Commandes', icon: Scissors, roles: ALL_USERS },
    ],
  },
  {
    title: "Stock & Ventes",
    items: [
      { id: 'matieres', label: 'Matières', icon: Package, roles: ADMIN_CAISSIER },
      { id: 'ventes', label: 'Ventes', icon: DollarSign, roles: ADMIN_CAISSIER },
      { id: 'entrees_stock', label: 'Entrées stock', icon: Package, roles: ADMIN_ONLY },
      { id: 'sorties_stock', label: 'Sorties stock', icon: Package, roles: ADMIN_ONLY },
      { id: 'stock_global', label: 'Stock Global', icon: Package, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Ressources Humaines",
    items: [
      { id: 'employes', label: 'Employés', icon: Users, roles: ADMIN_ONLY },
      { id: 'prestations_types', label: 'Types Prestations', icon: Users, roles: ADMIN_ONLY },
      { id: 'prestations_realisees', label: 'Prestations', icon: Users, roles: ADMIN_ONLY },
      { id: 'emprunts', label: 'Emprunts', icon: Users, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Finances",
    items: [
      { id: 'paiements', label: 'Paiements', icon: CreditCard, roles: ADMIN_CAISSIER },
      { id: 'factures', label: 'Factures & Reçus', icon: FileText, roles: ADMIN_CAISSIER },
      { id: 'depenses', label: 'Dépenses', icon: FileText, roles: ADMIN_ONLY },
      { id: 'journal_caisse', label: 'Journal de caisse', icon: Wallet, roles: ADMIN_CAISSIER },
      { id: 'salaires', label: 'Gestion salaires', icon: Wallet, roles: ADMIN_ONLY },
      { id: 'salaires_historique', label: 'Historique salaires', icon: Calendar, roles: ADMIN_ONLY },
      { id: 'bilan_financier', label: 'Bilan', icon: TrendingUp, roles: ADMIN_CAISSIER },
      { id: 'etats_financiers', label: 'État journalier', icon: Calendar, roles: ADMIN_CAISSIER },
    ],
  },
  
  {
    title: "Configuration",
    items: [
      { id: 'mesures', label: 'Types Mesures', icon: Settings, roles: ADMIN_ONLY },
      { id: 'parametres', label: 'Atelier', icon: Building2, roles: ADMIN_ONLY },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: 'utilisateurs', label: 'Utilisateurs', icon: Users, roles: ADMIN_ONLY },
    ],
  },
];