import React, { useState, useRef, useEffect } from 'react';
import { RefreshCcw, ChevronDown, LogOut } from 'lucide-react';
import { Role } from '../../types/auth';
import {
  apiPost
} from '../../services/api';
import { PageKey } from '../../types/pages';
import { menuSections } from '../../config/menuSections';

interface HeaderProps {
  pageActuelle: PageKey;
  setPage: (page: PageKey) => void;
  hasRole: (roles: Role[]) => boolean;
  onLogout: () => void;
  userName: string;
  userRole?: Role;
}

const Header: React.FC<HeaderProps> = ({
  pageActuelle,
  setPage,
  hasRole,
  onLogout,
  userRole,
  userName,
}) => {

  const [isResetting, setIsResetting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ nettoyage timeout (important)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 🔹 sections visibles
  const visibleSections = menuSections.filter(section =>
    section.items.some(item => hasRole(item.roles))
  );

  const handleMouseEnter = (sectionTitle: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(sectionTitle);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  // 🔴 RESET
  const handleReset = async () => {
    if (isResetting) return;

    const confirm1 = 
globalThis.confirm("⚠️ Supprimer TOUTES les données ?");
    if (!confirm1) return;

    const confirm2 = 
globalThis.confirm("Cette action est irréversible. Confirmer ?");
    if (!confirm2) return;

    try {
      setIsResetting(true);

      await apiPost(
  '/admin/reset',
  {}
);

      alert("Base réinitialisée avec succès !");
      location.reload();

    } catch (error) {
      console.error(error);
      alert("❌ Erreur lors du reset");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="bg-blue-900 border-b px-6 py-1 flex items-center gap-4 relative shadow-sm">

      {/* LOGO */}
      <div className="mr-4 border-r pr-4 py-2">
        <span className="font-bold text-white text-lg uppercase tracking-wider">
          Gestion Couture
        </span>
      </div>

      {/* MENU */}
      <nav className="flex items-center gap-1 flex-1">

        {visibleSections.map(section => {
          const visibleItems = section.items.filter(item => hasRole(item.roles));
          const isOpen = openDropdown === section.title;

          const IconComp = visibleItems.length > 0 ? visibleItems[0].icon : null;

          return (
            <div
              key={section.title}
              className="relative"
              onMouseEnter={() => handleMouseEnter(section.title)}
              onMouseLeave={handleMouseLeave}
            >

              {/* BOUTON SECTION */}
              <button
                className={`flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-semibold transition ${
                  isOpen
                    ? 'bg-white text-blue-700 border-b-2 border-blue-600'
                    : 'text-white hover:bg-blue-800'
                }`}
              >
                {IconComp && <IconComp size={18} />}
                <span>{section.title}</span>
                <ChevronDown size={14} className={`transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* DROPDOWN */}
              {isOpen && (
                <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-xl z-50 py-2">

                  {visibleItems.map(item => {
                    const ItemIcon = item.icon;
                    const isActive = pageActuelle === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setPage(item.id as PageKey);
                          setOpenDropdown(null);
                        }}
                        className={`flex items-center gap-3 w-full px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        <ItemIcon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                </div>
              )}
            </div>
          );
        })}

      </nav>

      {/* USER */}
      <div className="flex items-center gap-3 ml-auto border-l pl-4">

        {/* RESET ADMIN */}
        {userRole === 'admin' && (
          <button
            onClick={handleReset}
            disabled={isResetting}
            title="Réinitialiser la base"
            className="p-2 text-red-400 hover:text-red-600 transition disabled:opacity-50"
          >
            {isResetting ? (
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCcw size={20} />
            )}
          </button>
        )}

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className="p-2 text-white hover:text-gray-300 transition"
        >
          <LogOut size={20} />
        </button>

        {/* USER INFO */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-white">{userName}</span>
          <span className="text-[10px] text-gray-300">{userRole}</span>
        </div>

      </div>

    </header>
  );
};

export default Header;