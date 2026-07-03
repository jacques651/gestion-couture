// components/Navbar.tsx
import React, { useState } from 'react';

import {
  Stack,
  Text,
  Box,
  Divider,
  useMantineTheme,
  ScrollArea,
  Group,
  Tooltip,
  Avatar,
  Badge,
  Menu,
} from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconUsers,
  IconShoppingBag,
  IconReceipt,
  IconMoneybag,
  IconPackage,
  IconRulerMeasure,
  IconSettings,
  IconLogout,
  IconTools,
  IconChartBar,
  IconChevronRight,
  IconChevronDown,
  IconLifebuoy,
  IconDownload,
  IconHelpCircle,
  IconHeadset,
  IconScissors,
  IconUserShield,
  IconNetwork,
  IconFileExcel,
  IconPalette,
  IconTexture,
  IconHanger,
  IconBuildingWarehouse,
  IconUsersGroup,
  IconCertificate,
  IconRuler,
  IconList,
  IconHistory,
  IconLock,
  IconCalendarEvent,
  IconFileInvoice,
} from '@tabler/icons-react';
import { journaliserAction } from '../services/journal';
import ChangerMotDePasse from './parametres/ChangerMotDePasse';

export interface NavItemProps {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[];
  userRole?: string;
  badge?: string;
  onClick?: () => void;
}

export interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  roles?: string[];
  userRole?: string;
}

export interface NavbarProps {
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

// Composant NavItem
function NavItem({ 
  label, 
  path, 
  icon, 
  roles, 
  userRole, 
  badge,
  onClick 
}: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMantineTheme();

  // Vérification des rôles
  if (roles && roles.length > 0 && userRole && !roles.includes(userRole)) {
    return null;
  }

  const active = location.pathname === path;
  const hoverBlue = theme.colors.adminBlue?.[6] || '#3a6a8a';
  const activeBg = '#2a5a7a';
  const textColor = active ? '#ffd700' : '#e0e0e0';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <Tooltip label={badge || label} position="right" withArrow openDelay={500} offset={10}>
      <Box
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          padding: '8px 12px 8px 28px',
          borderRadius: theme.radius.md,
          backgroundColor: active ? activeBg : 'transparent',
          color: textColor,
          fontWeight: active ? 600 : 400,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.2s ease',
          margin: '2px 0',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!active) e.currentTarget.style.backgroundColor = hoverBlue;
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          if (!active) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {icon}
        <Text size="sm" style={{ whiteSpace: 'nowrap' }}>{label}</Text>
        {badge && (
          <Badge size="xs" color="yellow" variant="filled" style={{ marginLeft: 'auto' }}>
            {badge}
          </Badge>
        )}
      </Box>
    </Tooltip>
  );
}

// Composant NavSection
function NavSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false, 
  roles, 
  userRole 
}: SectionProps) {
  const [opened, setOpened] = useState(defaultOpen);
  const theme = useMantineTheme();

  if (roles && roles.length > 0 && userRole && !roles.includes(userRole)) {
    return null;
  }

  return (
    <Box>
      <Box
        onClick={() => setOpened(!opened)}
        style={{
          cursor: 'pointer',
          padding: '10px 12px',
          borderRadius: theme.radius.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          margin: '2px 0',
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.backgroundColor = theme.colors.adminBlue?.[6] || '#3a6a8a';
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Group gap="sm" wrap="nowrap">
          {icon}
          <Text size="sm" fw={600} c="gray.2" tt="uppercase" style={{ whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
            {title}
          </Text>
        </Group>
        <Box c="gray.4">
          {opened ? (
            <IconChevronDown size={16} stroke={1.5} />
          ) : (
            <IconChevronRight size={16} stroke={1.5} />
          )}
        </Box>
      </Box>
      {opened && <Box ml="md">{children}</Box>}
    </Box>
  );
}

// Composant principal Navbar
export default function Navbar({ userRole, userName, onLogout, onNavigate }: NavbarProps) {
  const theme = useMantineTheme();
  const darkBlue = theme.colors.adminBlue?.[8] || '#1b365d';
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Rôles
  const allUsers: string[] = [];
  const adminOnly: string[] = ['admin'];

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'admin': 'Administrateur',
      'couturier': 'Couturier',
      'vendeur': 'Vendeur',
      'caissier': 'Caissier',
      'livreur': 'Livreur'
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleLogout = async () => {
    await journaliserAction({
      utilisateur: userName || 'Utilisateur',
      action: 'LOGOUT',
      table: 'auth',
      idEnregistrement: userRole || 'unknown',
      details: `Déconnexion utilisateur : ${userName || 'Inconnu'}`
    });
    onLogout?.();
  };

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <>
      <Stack gap={0} style={{ height: '100%', backgroundColor: darkBlue }}>
        {/* HEADER - Logo et profil */}
        <Box p="md" pb="xs">
          <Group justify="center" mb="sm" wrap="nowrap">
            <IconScissors size={28} color="#ffd700" />
            <Text
              fw={800}
              size="xl"
              c="yellow"
              style={{
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                letterSpacing: '1px',
                fontSize: '1.3rem',
                whiteSpace: 'nowrap'
              }}
            >
              GESTION COUTURE
            </Text>
          </Group>

          {userName && (
            <>
              <Divider color={theme.colors.adminBlue?.[6]} my="md" />
              <Box style={{ textAlign: 'center' }}>
                <Avatar size="md" radius="xl" color="blue" mx="auto" mb="xs">
                  {userName.charAt(0).toUpperCase()}
                </Avatar>
                <Text size="sm" c="white" fw={600} style={{ whiteSpace: 'nowrap' }}>{userName}</Text>
                <Badge color="yellow" variant="light" size="sm" mt={4}>
                  {getRoleLabel(userRole)}
                </Badge>
              </Box>
            </>
          )}
        </Box>

        <Divider color={theme.colors.adminBlue?.[6]} />

        {/* ZONE DE DÉFILEMENT */}
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap={4} p="md">
            {/* DASHBOARD */}
            <NavItem
              label="Tableau de bord"
              path="/"
              icon={<IconLayoutDashboard size={20} stroke={1.5} />}
              userRole={userRole}
              onClick={() => handleNavigate('dashboard')}
            />

            <Divider color={theme.colors.adminBlue?.[6]} my="sm" />

            {/* ================= SECTION CLIENT ================= */}
            <NavSection
              title="CLIENTS"
              icon={<IconUsers size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
            >
              <NavItem
                label="Liste des clients"
                path="/clients"
                icon={<IconUsers size={18} color="white" stroke={1.5} />}
                roles={allUsers}
                userRole={userRole}
                onClick={() => handleNavigate('clients')}
              />
              <NavItem
                label="Types de mesures"
                path="/types-mesures"
                icon={<IconRuler size={18} color="white" stroke={1.5} />}
                roles={adminOnly}
                userRole={userRole}
                onClick={() => handleNavigate('types_mesures')}
              />
            </NavSection>

            {/* ================= SECTION RÉFÉRENTIELS ================= */}
            <NavSection
              title="RÉFÉRENTIELS"
              icon={<IconCertificate size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
              defaultOpen={false}
            >
              <NavItem 
                label="Tailles" 
                path="/tailles" 
                icon={<IconRulerMeasure size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('tailles')}
              />
              <NavItem 
                label="Couleurs" 
                path="/couleurs" 
                icon={<IconPalette size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('couleurs')}
              />
              <NavItem 
                label="Textures" 
                path="/textures" 
                icon={<IconTexture size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('textures')}
              />
              <NavItem 
                label="Types de tenues" 
                path="/types-tenues" 
                icon={<IconHanger size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('types_tenues')}
              />
              <NavItem 
                label="Catégories matières" 
                path="/categories-matieres" 
                icon={<IconPackage size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('categories_matieres')}
              />
              <NavItem 
                label="Types de prestations" 
                path="/ListeTypesPrestations" 
                icon={<IconTools size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('types_prestations')}
              />
              <NavItem 
                label="Configuration atelier" 
                path="/atelier" 
                icon={<IconSettings size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('atelier')}
              />
            </NavSection>

            {/* ================= SECTION STOCK & INVENTAIRE ================= */}
            <NavSection
              title="STOCK & INVENTAIRE"
              icon={<IconBuildingWarehouse size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
              defaultOpen={false}
            >
              <NavItem 
                label="Inventaire (Tenues)" 
                path="/articles" 
                icon={<IconScissors size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('articles')}
              />
              <NavItem 
                label="Matières premières" 
                path="/matieres" 
                icon={<IconPackage size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('matieres')}
              />
              <NavItem 
                label="Mouvements de stock" 
                path="/mouvements-stock" 
                icon={<IconList size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('mouvements_stock')}
              />
            </NavSection>

            {/* ================= SECTION VENTES ================= */}
            <NavSection
              title="VENTES"
              icon={<IconShoppingBag size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
              defaultOpen={false}
            >
              <NavItem 
                label="Gestion des ventes" 
                path="/ventes" 
                icon={<IconShoppingBag size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('ventes')}
              />
              <NavItem 
                label="Factures & reçus" 
                path="/factures-recus" 
                icon={<IconFileInvoice size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('factures_recus')}
              />
              <NavItem 
                label="Rendez-vous" 
                path="/rendezvous" 
                icon={<IconCalendarEvent size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('rendezvous')}
              />
              <NavItem 
                label="Historique des paiements" 
                path="/historique-paiements" 
                icon={<IconReceipt size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('historique_paiements')}
              />
            </NavSection>

            {/* ================= SECTION FINANCES ================= */}
            <NavSection
              title="FINANCES"
              icon={<IconChartBar size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
            >
              <NavItem 
                label="Dépenses" 
                path="/depenses" 
                icon={<IconMoneybag size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('depenses')}
              />
              <NavItem 
                label="Bilan financier" 
                path="/bilan" 
                icon={<IconChartBar size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('bilan')}
              />
              <NavItem 
                label="Journal de caisse" 
                path="/journal" 
                icon={<IconReceipt size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('journal')}
              />
            </NavSection>

            {/* ================= SECTION RESSOURCES HUMAINES ================= */}
            <NavSection
              title="RESSOURCES HUMAINES"
              icon={<IconUsersGroup size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
            >
              <NavItem 
                label="Employés" 
                path="/employes" 
                icon={<IconUsers size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('employes')}
              />
              <NavItem 
                label="Prestations réalisées" 
                path="/prestations-realisees" 
                icon={<IconTools size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('prestations_realisees')}
              />
              <NavItem 
                label="Salaires" 
                path="/salaires" 
                icon={<IconMoneybag size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('salaires')}
              />
              <NavItem 
                label="Historique salaires" 
                path="/historiques-salaires" 
                icon={<IconHistory size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('historique_salaires')}
              />
              <NavItem 
                label="Emprunts" 
                path="/emprunts" 
                icon={<IconMoneybag size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('emprunts')}
              />
            </NavSection>

            {/* ================= SECTION PARAMÈTRES ================= */}
            <NavSection
              title="PARAMÈTRES"
              icon={<IconSettings size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
            >
              <NavItem 
                label="Utilisateurs" 
                path="/utilisateurs" 
                icon={<IconUserShield size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('utilisateurs')}
              />
              <NavItem 
                label="Configuration serveur" 
                path="/config-serveur" 
                icon={<IconNetwork size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('config_serveur')}
              />
              <NavItem 
                label="Import/Export" 
                path="/import-export" 
                icon={<IconFileExcel size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('import_export')}
              />
              <NavItem 
                label="Journal modifications" 
                path="/journal-modifications" 
                icon={<IconHistory size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('journal_modifications')}
              />
            </NavSection>

            {/* ================= SECTION SUPPORT ================= */}
            <Divider color={theme.colors.adminBlue?.[6]} my="sm" />

            <NavSection
              title="SUPPORT"
              icon={<IconLifebuoy size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
            >
              <NavItem 
                label="Guide d'utilisation" 
                path="/aide" 
                icon={<IconHelpCircle size={18} color="white" stroke={1.5} />} 
                roles={allUsers} 
                userRole={userRole}
                onClick={() => handleNavigate('aide')}
              />
              <NavItem 
                label="Support technique" 
                path="/support" 
                icon={<IconHeadset size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('support')}
              />
              <NavItem 
                label="Exporter pour support" 
                path="/export-support" 
                icon={<IconDownload size={18} color="white" stroke={1.5} />} 
                roles={adminOnly} 
                userRole={userRole}
                onClick={() => handleNavigate('export_support')}
              />
            </NavSection>
          </Stack>
        </ScrollArea>

        {/* FOOTER FIXE - Avec menu utilisateur */}
        <Box p="md" pt="xs">
          <Divider color={theme.colors.adminBlue?.[6]} mb="md" />

          <Menu position="top" width={200} withinPortal>
            <Menu.Target>
              <Box
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: theme.radius.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  marginBottom: '10px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.adminBlue?.[6] || '#3a6a8a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <IconUserShield size={18} stroke={1.5} color="#ffd700" />
                <Text size="sm" c="yellow" fw={500} style={{ whiteSpace: 'nowrap' }}>
                  {userName || 'Utilisateur'}
                </Text>
              </Box>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Mon compte</Menu.Label>
              <Menu.Item leftSection={<IconLock size={14} />} onClick={() => setPasswordModalOpen(true)}>
                Changer le mot de passe
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconLogout size={14} />} onClick={handleLogout} color="red">
                Déconnexion
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Text size="xs" c="dimmed" ta="center" style={{ whiteSpace: 'nowrap' }}>
            © 2026 Gestion Couture
          </Text>
          <Text size="xs" c="dimmed" ta="center" mt={2} style={{ whiteSpace: 'nowrap' }}>
            Version 3.0.0
          </Text>
        </Box>
      </Stack>

      {/* Modal de changement de mot de passe */}
      <ChangerMotDePasse opened={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </>
  );
}

// Exports supplémentaires pour utilisation externe
export { NavItem, NavSection };