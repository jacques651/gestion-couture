import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface CanWriteProps {
  fonctionnalite: string;
  children: React.ReactNode;
}

export const CanWrite: React.FC<CanWriteProps> = ({ fonctionnalite, children }) => {
  const { canWrite } = useAuth();
  
  if (!canWrite(fonctionnalite)) {
    return null;
  }
  
  return <>{children}</>;
};

export default CanWrite;
