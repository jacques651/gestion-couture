import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import {
  apiGet,
  apiPost
} from '../services/api';

export type Role =
  | 'admin'
  | 'caissier'
  | 'couturier';

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
    utilisateur?: User;
  }>;

  register: (
    nom: string,
    login: string,
    password: string,
    role: Role
  ) => Promise<void>;

  logout: () => void;

  hasRole: (
    roles: Role[]
  ) => boolean;

  permissions:
    Record<
      string,
      Permission
    >;

  canRead: (
    fonctionnalite: string
  ) => boolean;

  canWrite: (
    fonctionnalite: string
  ) => boolean;
}

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

/**
 * =========================
 * NORMALIZE ROLE
 * =========================
 */
const normalizeRole = (
  role: string
): Role => {

  const r =
    role
      ?.toLowerCase()
      .trim();

  if (
    r === 'admin'
    ||
    r === 'caissier'
    ||
    r === 'couturier'
  ) {

    return r;
  }

  return 'couturier';
};

/**
 * =========================
 * LOAD USER PERMISSIONS
 * =========================
 */
const loadUserPermissions =
  async (
    userId: number
  ): Promise<
    Record<
      string,
      Permission
    >
  > => {

    try {

      const perms =
        await apiGet(
          `/utilisateurs/${userId}/permissions`
        );

      const map:
        Record<
          string,
          Permission
        > = {};

      perms.forEach(
        (p: any) => {

          map[
            p.module
          ] = {

            lecture:
              p.peut_voir === 1,

            ecriture:
              p.peut_modifier === 1
          };
        }
      );

      return map;

    } catch (error) {

      console.error(
        "Erreur permissions:",
        error
      );

      return {};
    }
  };

/**
 * =========================
 * PROVIDER
 * =========================
 */
export const AuthProvider:
React.FC<{
  children: React.ReactNode
}> = ({
  children
}) => {

  const [
    user,
    setUser
  ] = useState<
    User | null
  >(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    permissions,
    setPermissions
  ] = useState<
    Record<
      string,
      Permission
    >
  >({});

  /**
   * =========================
   * LOAD SESSION
   * =========================
   */
  useEffect(() => {

    const init =
    async () => {

      try {

        const stored =

          localStorage.getItem(
            'utilisateur'
          );

        if (stored) {

          const parsed =
            JSON.parse(stored);

          const userObj: User = {

            id:
              parsed.id,

            nom:
              parsed.nom,

            login:
              parsed.login,

            role:
              normalizeRole(
                parsed.role
              )
          };

          setUser(
            userObj
          );

          /**
           * ADMIN
           */
          if (
            userObj.role === 'admin'
          ) {

            setPermissions({});

          } else {

            /**
             * USER PERMISSIONS
             */
            const perms =

              await loadUserPermissions(
                userObj.id
              );

            setPermissions(
              perms
            );

            userObj.permissions =
              perms;
          }
        }

      } catch (err) {

        console.error(
          'Erreur chargement session:',
          err
        );

        localStorage.removeItem(
          'utilisateur'
        );

      } finally {

        setLoading(false);
      }
    };

    init();

  }, []);

  /**
   * =========================
   * REGISTER
   * =========================
   */
  const register = async (

    nom: string,

    login: string,

    password: string,

    role: Role

  ) => {

    await apiPost(

      "/utilisateurs",

      {

        nom:
          nom.trim(),

        login:
          login.trim(),

        mot_de_passe:
          password,

        role,

        est_actif: 1
      }
    );
  };

  /**
   * =========================
   * LOGIN
   * =========================
   */
  const login = async (

    loginValue: string,

    password: string

  ): Promise<{

    success: boolean;

    utilisateur?: User;

  }> => {

    try {

      /**
       * API LOGIN
       */
      const utilisateur =
        await apiPost(

          "/utilisateurs/login",

          {

            login:
              loginValue.trim(),

            mot_de_passe:
              password
          }
        );

      /**
       * USER OBJECT
       */
      const userObj: User = {

        id:
          utilisateur.id,

        nom:
          utilisateur.nom,

        login:
          utilisateur.login,

        role:
          normalizeRole(
            utilisateur.role
          )
      };

      /**
       * SAVE SESSION
       */
      setUser(
        userObj
      );

      localStorage.setItem(

        'utilisateur',

        JSON.stringify(
          userObj
        )
      );

      /**
       * ADMIN
       */
      if (
        userObj.role === 'admin'
      ) {

        setPermissions({});

      } else {

        /**
         * USER PERMISSIONS
         */
        const perms =

          await loadUserPermissions(
            userObj.id
          );

        setPermissions(
          perms
        );

        userObj.permissions =
          perms;
      }

      return {

        success: true,

        utilisateur:
          userObj
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

  /**
   * =========================
   * LOGOUT
   * =========================
   */
  const logout = () => {

    setUser(null);

    setPermissions({});

    localStorage.removeItem(
      'utilisateur'
    );
  };

  /**
   * =========================
   * HAS ROLE
   * =========================
   */
  const hasRole = (
    roles: Role[]
  ) => {

    return user
      ? roles.includes(
          user.role
        )
      : false;
  };

  /**
   * =========================
   * CAN READ
   * =========================
   */
  const canRead = (
    fonctionnalite: string
  ): boolean => {

    if (
      user?.role === 'admin'
    ) {

      return true;
    }

    return (
      permissions[
        fonctionnalite
      ]?.lecture || false
    );
  };

  /**
   * =========================
   * CAN WRITE
   * =========================
   */
  const canWrite = (
    fonctionnalite: string
  ): boolean => {

    if (
      user?.role === 'admin'
    ) {

      return true;
    }

    return (
      permissions[
        fonctionnalite
      ]?.ecriture || false
    );
  };

  return (

    <AuthContext.Provider

      value={{

        user,

        loading,

        isAuthenticated:
          !!user,

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

/**
 * =========================
 * USE AUTH
 * =========================
 */
export const useAuth = () => {

  const context =
    useContext(
      AuthContext
    );

  if (!context) {

    throw new Error(

      'useAuth must be used within AuthProvider'
    );
  }

  return context;
};