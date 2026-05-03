// hooks/usePermission.ts
import { useAuth } from '../contexts/AuthContext';
import { getPermissions } from '../database/db';

export const usePermission = () => {
  const { user } = useAuth();

  const canRead = async (fonctionnalite: string): Promise<boolean> => {
    if (user?.role === 'admin') return true;
    if (!user?.id) return false; // ← Protection si user.id est undefined
    const perms = await getPermissions(user.id);
    const p = perms.find((x: any) => x.fonctionnalite === fonctionnalite);
    return p?.lecture === 1;
  };

  const canWrite = async (fonctionnalite: string): Promise<boolean> => {
    if (user?.role === 'admin') return true;
    if (!user?.id) return false; // ← Protection si user.id est undefined
    const perms = await getPermissions(user.id);
    const p = perms.find((x: any) => x.fonctionnalite === fonctionnalite);
    return p?.ecriture === 1;
  };

  return { canRead, canWrite };
};