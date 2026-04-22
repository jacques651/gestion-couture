import React from 'react';
import { useAuth, Role } from '../contexts/AuthContext';

const RouteGuard: React.FC<{ children: React.ReactNode; roles?: Role[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  if (!user) return <div className="text-red-600 text-center">Non autorisé</div>;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="text-center text-red-600 font-medium">
        Accès refusé
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;