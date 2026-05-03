import React from 'react';
import { useAuth } from '../contexts/AuthContext'; 

interface Props {
  fonctionnalite: string;
  children: React.ReactNode;
}

export const CanWrite: React.FC<Props> = ({ fonctionnalite, children }) => {
  const { canWrite } = useAuth();
  
  if (canWrite(fonctionnalite)) return <>{children}</>;
  return null;
};