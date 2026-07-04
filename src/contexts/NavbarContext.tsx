import React, { createContext, useContext, useState } from 'react';

interface NavbarContextType {
  isNavbarOpen: boolean;
  toggleNavbar: () => void;
  closeNavbar: () => void;
  openNavbar: () => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const NavbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);

  const toggleNavbar = () => setIsNavbarOpen(!isNavbarOpen);
  const closeNavbar = () => setIsNavbarOpen(false);
  const openNavbar = () => setIsNavbarOpen(true);

  return (
    <NavbarContext.Provider value={{ isNavbarOpen, toggleNavbar, closeNavbar, openNavbar }}>
      {children}
    </NavbarContext.Provider>
  );
};

export const useNavbar = () => {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error('useNavbar must be used within a NavbarProvider');
  }
  return context;
};