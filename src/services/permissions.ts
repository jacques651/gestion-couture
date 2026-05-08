import {
  getUtilisateurConnecte
} from './session';

export type Permission =
  | '*'
  | 'dashboard'
  | 'clients'
  | 'mesures'
  | 'ventes'
  | 'factures'
  | 'paiements'
  | 'depenses'
  | 'employes'
  | 'salaires'
  | 'stocks'
  | 'parametres'
  | 'journal'
  | 'utilisateurs';

// =========================
// Permissions par rôle
// =========================
const permissionsParRole:
  Record<string, Permission[]> = {

  admin: ['*'],

  caissier: [
    'dashboard',
    'clients',
    'ventes',
    'factures',
    'paiements'
  ],

  couturier: [
    'dashboard',
    'clients',
    'mesures'
  ],

  gestionnaire: [
    'dashboard',
    'clients',
    'ventes',
    'depenses',
    'stocks',
    'employes'
  ]
};

// =========================
// Vérifier permission
// =========================
export function aPermission(
  permission: Permission
): boolean {

  const utilisateur =
    getUtilisateurConnecte();

  if (!utilisateur) {
    return false;
  }

  const perms =
    permissionsParRole[
      utilisateur.role
    ] || [];

  // Admin = accès total
  if (perms.includes('*')) {
    return true;
  }

  return perms.includes(permission);
}