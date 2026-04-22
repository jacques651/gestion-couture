import React, { createContext, useContext, useEffect, useState } from 'react';
import bcrypt from 'bcryptjs';
import { getDb } from '../../database/db';

export type Role = 'admin' | 'caissier' | 'couturier';

export interface User {
  id: number;
  nom: string;
  login: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  register: (nom: string, login: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
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
  return 'admin'; // fallback sécurisé
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          role: normalizeRole(parsed.role || 'admin')
        });
      }
    } catch {
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = async (nom: string, login: string, password: string, role: Role) => {
    const db = await getDb();
    const hash = bcrypt.hashSync(password, 10);
    await db.execute(
      `INSERT INTO utilisateurs 
      (nom, login, mot_de_passe_hash, role, est_actif)
      VALUES (?, ?, ?, ?, 1)`,
      [nom.trim(), login.trim().toLowerCase(), hash, role]
    );
  };

  const login = async (loginValue: string, password: string): Promise<boolean> => {
    try {
      const db = await getDb();
      const result = await db.select<DbUser[]>(
        `SELECT * FROM utilisateurs 
         WHERE LOWER(login) = LOWER(?) 
         AND est_actif = 1`,
        [loginValue.trim()]
      );
      if (!result || result.length === 0) return false;
      const dbUser = result[0];
      const isValid = await bcrypt.compare(password, dbUser.mot_de_passe_hash);
      if (!isValid) return false;
      const userObj: User = {
        id: dbUser.id,
        nom: dbUser.nom,
        login: dbUser.login,
        role: normalizeRole(dbUser.role),
      };
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      return true;
    } catch (err) {
      console.error('Erreur login:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Ne pas recharger toute la page, juste rediriger si besoin
    // window.location.reload(); // à éviter
  };

  const hasRole = (roles: Role[]) => {
    if (!user || !user.role) return false;
    const current = normalizeRole(user.role);
    return roles.some(r => normalizeRole(r) === current);
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
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};