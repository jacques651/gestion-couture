import React from 'react';
import { menuSections } from '../../config/menuSections';
import { LogOut, ChevronRight } from 'lucide-react';
import BoutonSupport from './BoutonSupport';
import { Role } from '../../types/auth';

interface NavigationProps {
  pageActuelle: string;
  setPage: (page: string) => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  hasRole: (roles: Role[]) => boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  pageActuelle,
  setPage,
  onLogout,
  userName,
  userRole,
  hasRole
}) => {
  const getRoleBadgeClass = () => {
    switch (userRole) {
      case 'admin': return 'bg-rose-100 text-rose-800';
      case 'gestionnaire': return 'bg-amber-100 text-amber-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <aside className="w-72 bg-gray-900 flex flex-col h-screen shadow-xl">
      {/* En-tête avec logo et utilisateur */}
      <div className="p-5 border-b border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-lg font-bold text-white whitespace-nowrap">Gestion Couture</h1>
        </div>
        <div className="mt-2 pt-2 border-t border-white/20">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <div className="mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass()}`}>
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Menu de navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter(item => hasRole(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-6">
              <h3 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider px-3 mb-2 whitespace-nowrap">
                {section.title}
              </h3>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pageActuelle === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPage(item.id)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white font-medium shadow-sm backdrop-blur-sm'
                          : 'text-white/80 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          size={16}
                          className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}
                        />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight size={14} className="text-white flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Pied : support + déconnexion */}
      <div className="p-4 border-t border-white/20 mt-auto space-y-2">
        <BoutonSupport />
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-rose-200 hover:bg-white/20 hover:text-rose-100 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Navigation;