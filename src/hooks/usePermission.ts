import {

  useAuth

} from '../contexts/AuthContext';

import {

  apiGet

} from '../services/api';

export const usePermission = () => {

  const {
    user
  } = useAuth();

  const getUserPermissions =
    async () => {

      if (!user?.id) {
        return [];
      }

      return await apiGet(

        `/permissions/${user.id}`
      );
    };

  const canRead =
    async (
      fonctionnalite: string
    ): Promise<boolean> => {

      if (
        user?.role === 'admin'
      ) {
        return true;
      }

      const perms =
        await getUserPermissions();

      const p =
        perms.find(

          (x: any) =>

            x.fonctionnalite ===
            fonctionnalite
        );

      return p?.lecture === true
        || p?.lecture === 1;
    };

  const canWrite =
    async (
      fonctionnalite: string
    ): Promise<boolean> => {

      if (
        user?.role === 'admin'
      ) {
        return true;
      }

      const perms =
        await getUserPermissions();

      const p =
        perms.find(

          (x: any) =>

            x.fonctionnalite ===
            fonctionnalite
        );

      return p?.ecriture === true
        || p?.ecriture === 1;
    };

  return {

    canRead,

    canWrite
  };
};