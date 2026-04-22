import React, { createContext, useContext, useEffect, useState } from 'react';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db';

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
  role: Role;
  mot_de_passe_hash: string;
  est_actif: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Charger session
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed: User = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 REGISTER
  const register = async (nom: string, login: string, password: string, role: Role) => {
    const db = await getDb();

    const hash = bcrypt.hashSync(password, 10);

    await db.execute(
      `INSERT INTO utilisateurs 
      (nom, login, mot_de_passe_hash, role, est_actif)
      VALUES (?, ?, ?, ?, 1)`,
      [nom.trim(), login.trim(), hash, role]
    );
  };

  // 🔹 LOGIN - CORRIGÉ
  const login = async (loginValue: string, password: string): Promise<boolean> => {
    try {
      const db = await getDb();

      // CORRECTION : db.select retourne toujours array, même pour SELECT unique
      const results = await db.select<DbUser>(
        "SELECT * FROM utilisateurs WHERE login = ? AND est_actif = 1",
        [loginValue.trim()]
      );

      // Vérification si array vide
      if (!Array.isArray(results) || results.length === 0) return false;

      const dbUser = results[0] as DbUser;

      const isValid = await bcrypt.compare(password, dbUser.mot_de_passe_hash);
      if (!isValid) return false;

      const userObj: User = {
        id: dbUser.id,
        nom: dbUser.nom,
        login: dbUser.login,
        role: dbUser.role,
      };

      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));

      return true;
    } catch (err) {
      console.error('Erreur login:', err);
      return false;
    }
  };

  // 🔹 LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');

    // 🔥 reset UI (important avec Tauri/React)
    window.location.reload();
  };

  // 🔹 ROLE CHECK
  const hasRole = (roles: Role[]) => {
    return user ? roles.includes(user.role) : false;
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

// 🔹 HOOK
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};