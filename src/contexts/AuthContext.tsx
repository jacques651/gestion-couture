import React, { createContext, useContext, useEffect, useState } from 'react';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db';


export type Role = 'admin' | 'caissier' | 'couturier';

export interface User {
  id: number;
  nom: string;
  login: string;
  role: Role;
  permissions?: Record<
    string,
    {
      lecture: boolean;
      ecriture: boolean;
    }
  >;
}

interface Permission {
  lecture: boolean;
  ecriture: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    login: string,
    password: string
  ) => Promise<{
    success: boolean;
    utilisateur?: any;
  }>;

  register: (nom: string, login: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
  permissions: Record<string, Permission>;
  canRead: (fonctionnalite: string) => boolean;
  canWrite: (fonctionnalite: string) => boolean;
}

type DbUser = {
  id: number;
  nom: string;
  login: string;
  role: string;
  mot_de_passe_hash: string;
  est_actif: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (role: string): Role => {
  const r = role?.toLowerCase().trim();
  if (r === 'admin' || r === 'caissier' || r === 'couturier') return r;
  return 'couturier';
};

const loadUserPermissions = async (userId: number): Promise<Record<string, Permission>> => {
  try {
    const db = await getDb();
    const perms = await db.select<any[]>(
      `SELECT fonctionnalite, lecture, ecriture FROM permissions WHERE utilisateur_id = ?`,
      [userId]
    );
    const map: Record<string, Permission> = {};
    perms.forEach((p: any) => {
      map[p.fonctionnalite] = { lecture: p.lecture === 1, ecriture: p.ecriture === 1 };
    });
    return map;
  } catch {
    return {};
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});

  // Charger session utilisateur et ses permissions
  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const userObj: User = {
            id: parsed.id,
            nom: parsed.nom,
            login: parsed.login,
            role: normalizeRole(parsed.role || 'couturier')
          };
          setUser(userObj);

          // Charger les permissions si ce n'est pas un admin
          if (userObj.role !== 'admin') {
            const perms = await loadUserPermissions(userObj.id);
            setPermissions(perms);
          }
        }
      } catch (err) {
        console.error('Erreur chargement session:', err);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const register = async (nom: string, login: string, password: string, role: Role) => {
    const db = await getDb();
    const hash = bcrypt.hashSync(password, 10);
    await db.execute(
      `INSERT INTO utilisateurs (nom, login, mot_de_passe_hash, role, est_actif) VALUES (?, ?, ?, ?, 1)`,
      [nom.trim(), login.trim(), hash, role]
    );
  };

  const login = async (
    loginValue: string,
    password: string
  ): Promise<{
    success: boolean;
    utilisateur?: User;
  }> => {

    try {

      const db = await getDb();

      const results = await db.select<DbUser[]>(
        `
      SELECT *
      FROM utilisateurs
      WHERE login = ?
      AND est_actif = 1
      `,
        [loginValue.trim()]
      );

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {

        return {
          success: false
        };
      }

      const dbUser = results[0];

      const isValid = await bcrypt.compare(
        password,
        dbUser.mot_de_passe_hash
      );

      if (!isValid) {

        return {
          success: false
        };
      }

      const userObj: User = {
        id: dbUser.id,
        nom: dbUser.nom,
        login: dbUser.login,
        role: normalizeRole(dbUser.role),
      };

      setUser(userObj);

      localStorage.setItem(
        'user',
        JSON.stringify(userObj)
      );

      // Permissions
      if (userObj.role !== 'admin') {

        const perms =
          await loadUserPermissions(
            userObj.id
          );

        setPermissions(perms);

        // AJOUT IMPORTANT
        userObj.permissions = perms;

      } else {

        setPermissions({});
      }

      return {
        success: true,
        utilisateur: userObj
      };

    } catch (err) {

      console.error(
        'Erreur login:',
        err
      );

      return {
        success: false
      };
    }
  };

  const logout = () => {
    setUser(null);
    setPermissions({});
    localStorage.removeItem('user');
  };

  const hasRole = (roles: Role[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const canRead = (fonctionnalite: string): boolean => {
    if (user?.role === 'admin') return true;
    return permissions[fonctionnalite]?.lecture || false;
  };

  const canWrite = (fonctionnalite: string): boolean => {
    if (user?.role === 'admin') return true;
    return permissions[fonctionnalite]?.ecriture || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasRole,
        permissions,
        canRead,
        canWrite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};