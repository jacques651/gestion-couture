// src/types/auth.ts
export type Role = 'admin' | 'caissier' | 'couturier' | 'gestionnaire';

export interface User {
  id: number;
  nom: string;
  login: string;
  role: Role;
}

export interface AuthContextType {
  user: User | null;
  login: (loginValue: string, password: string) => Promise<boolean>;
  register: (nom: string, loginValue: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
  loading: boolean;
}