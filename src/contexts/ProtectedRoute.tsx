import React from 'react';
import { useAuth, Role } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  if (!user) return <div>Non autorisé</div>;

  if (roles && !roles.includes(user.role)) {
    return <div>Accès refusé</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;