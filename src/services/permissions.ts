import {
  apiGet
} from "./api";

export interface Permission {

  fonctionnalite: string;

  lecture: boolean;

  ecriture: boolean;
}

/**
 * Vérifier permission
 */
export const aPermission =
async (

  fonctionnalite: string,

  type:
    'lecture'
    |
    'ecriture' = 'lecture'

) => {

  try {

    const session =
      JSON.parse(
        localStorage.getItem(
          "utilisateur"
        ) || "null"
      );

    if (!session)
      return false;

    /**
     * ADMIN
     */
    if (
      session.role === 'admin'
    ) {

      return true;
    }

    /**
     * API
     */
    const permissions =
      await apiGet(
        `/utilisateurs/${session.id}/permissions`
      );

    const perm =
      permissions.find(
        (p: any) =>
          p.module === fonctionnalite
      );

    if (!perm)
      return false;

    if (
      type === 'lecture'
    ) {

      return (
        perm.peut_voir === 1
      );
    }

    return (
      perm.peut_modifier === 1
    );

  } catch (error) {

    console.error(error);

    return false;
  }
};