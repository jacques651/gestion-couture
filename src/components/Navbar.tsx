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
  CloseButton,
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
} from '@tabler/icons-react';
import { journaliserAction } from '../services/journal';
import MenuUtilisateur from './MenuUtilisateur';
import { Role } from '../contexts/AuthContext';

export interface NavItemProps {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[];
  userRole?: string;
  badge?: string;
  onNavigate?: () => void;
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
  onClose?: () => void;
}

function NavItem({ label, path, icon, roles, userRole, badge, onNavigate }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMantineTheme();

  if (roles && roles.length > 0 && userRole && !roles.includes(userRole)) {
    return null;
  }

  const active = location.pathname === path;
  const hoverBlue = theme.colors.adminBlue?.[6] || '#3a6a8a';
  const activeBg = '#2a5a7a';
  const textColor = active ? '#ffd700' : '#e0e0e0';

  const handleClick = () => {
    if (path) navigate(path);
    onNavigate?.();
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

function NavSection({ title, icon, children, defaultOpen = false, roles, userRole }: SectionProps) {
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
          {opened ? <IconChevronDown size={16} stroke={1.5} /> : <IconChevronRight size={16} stroke={1.5} />}
        </Box>
      </Box>
      {opened && <Box ml="md">{children}</Box>}
    </Box>
  );
}

export default function Navbar({ userRole, userName, onLogout, onNavigate, onClose }: NavbarProps) {
  const theme = useMantineTheme();
  const darkBlue = theme.colors.adminBlue?.[8] || '#1b365d';

  const allUsers: Role[] = [];
  const adminOnly: Role[] = [];

  const getRoleLabel = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
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
    onClose?.();
  };

  const handleNavigate = (page?: string) => {
    onClose?.();
    if (page) onNavigate?.(page);
  };

  return (
    <>
      <Stack gap={0} style={{ height: '100%', backgroundColor: darkBlue, position: 'relative' }}>
        {/* Bouton de fermeture sur mobile ET desktop */}
        <Box style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
          <CloseButton 
            onClick={onClose} 
            aria-label="Fermer le menu" 
            color="white"
            variant="subtle"
            size="lg"
          />
        </Box>

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

        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap={4} p="md">
            <NavItem
              label="Tableau de bord"
              path="/"
              icon={<IconLayoutDashboard size={20} stroke={1.5} />}
              userRole={userRole}
              onNavigate={() => handleNavigate('dashboard')}
            />

            <Divider color={theme.colors.adminBlue?.[6]} my="sm" />

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
                onNavigate={() => handleNavigate('clients')}
              />
              <NavItem
                label="Types de mesures"
                path="/types-mesures"
                icon={<IconRuler size={18} color="white" stroke={1.5} />}
                roles={adminOnly}
                userRole={userRole}
                onNavigate={() => handleNavigate('types_mesures')}
              />
            </NavSection>

            <NavSection
              title="RÉFÉRENTIELS"
              icon={<IconCertificate size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
              defaultOpen={false}
            >
              <NavItem label="Tailles" path="/tailles" icon={<IconRulerMeasure size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('tailles')} />
              <NavItem label="Couleurs" path="/couleurs" icon={<IconPalette size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('couleurs')} />
              <NavItem label="Textures / Matières" path="/textures" icon={<IconTexture size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('textures')} />
              <NavItem label="Types de tenues" path="/types-tenues" icon={<IconHanger size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('types_tenues')} />
              <NavItem label="Catégories matières" path="/categories-matieres" icon={<IconPackage size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('categories_matieres')} />
              <NavItem label="Types de prestations" path="/ListeTypesPrestations" icon={<IconTools size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('ListeTypesPrestations')} />
              <NavItem label="Configuration atelier" path="/atelier" icon={<IconSettings size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('atelier')} />
            </NavSection>

            <NavSection
              title="STOCK & INVENTAIRE"
              icon={<IconBuildingWarehouse size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
              defaultOpen={false}
            >
              <NavItem label="Inventaire (Tenues)" path="/articles" icon={<IconScissors size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('articles')} />
              <NavItem label="Matières premières" path="/matieres" icon={<IconPackage size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('matieres')} />
              <NavItem label="Mouvements de stock" path="/mouvements-stock" icon={<IconList size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('mouvements_stock')} />
            </NavSection>

            <NavSection
              title="VENTES"
              icon={<IconShoppingBag size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
              defaultOpen={false}
            >
              <NavItem label="Gestion des ventes" path="/ventes" icon={<IconShoppingBag size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('ventes')} />
              <NavItem label="Factures & reçus" path="/factures-recus" icon={<IconShoppingBag size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('factures_recus')} />
              <NavItem label="Rendez-vous" path="/rendezvous" icon={<IconShoppingBag size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('SuiviRendezVous')} />
              <NavItem label="Historique des paiements" path="/historique-paiements" icon={<IconReceipt size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('HistoriquePaiements')} />
            </NavSection>

            <NavSection
              title="FINANCES"
              icon={<IconChartBar size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
            >
              <NavItem label="Dépenses" path="/depenses" icon={<IconMoneybag size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('depenses')} />
              <NavItem label="Bilan financier" path="/bilan" icon={<IconChartBar size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('bilan')} />
              <NavItem label="Journal de caisse" path="/journal" icon={<IconReceipt size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('journal')} />
            </NavSection>

            <NavSection
              title="RESSOURCES HUMAINES"
              icon={<IconUsersGroup size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
            >
              <NavItem label="Employés" path="/employes" icon={<IconUsers size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('employes')} />
              <NavItem label="Prestations réalisées" path="/prestations-realisees" icon={<IconTools size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('prestations_realisees')} />
              <NavItem label="Salaires" path="/salaires" icon={<IconMoneybag size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('salaires')} />
              <NavItem label="Historique salaires" path="/historiques-salaires" icon={<IconHistory size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('historique_salaires')} />
              <NavItem label="Emprunts" path="/emprunts" icon={<IconMoneybag size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('emprunts')} />
            </NavSection>

            <NavSection
              title="PARAMÈTRES"
              icon={<IconSettings size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={adminOnly}
            >
              <NavItem label="Utilisateurs" path="/utilisateurs" icon={<IconUserShield size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('utilisateurs')} />
              <NavItem label="Configuration serveur" path="/config-serveur" icon={<IconNetwork size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('ConfigurationServeur')} />
              <NavItem label="Import/Export" path="/import-export" icon={<IconFileExcel size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('import_export')} />
              <NavItem label="Journal modifications" path="/journal-modifications" icon={<IconHistory size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('journal_modifications')} />
            </NavSection>

            <Divider color={theme.colors.adminBlue?.[6]} my="sm" />

            <NavSection
              title="SUPPORT"
              icon={<IconLifebuoy size={20} color="white" stroke={1.5} />}
              userRole={userRole}
              roles={allUsers}
            >
              <NavItem label="Guide d'utilisation" path="/aide" icon={<IconHelpCircle size={18} color="white" stroke={1.5} />} roles={allUsers} userRole={userRole} onNavigate={() => handleNavigate('aide')} />
              <NavItem label="Support technique" path="/support" icon={<IconHeadset size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('support')} />
              <NavItem label="Exporter pour support" path="/export-support" icon={<IconDownload size={18} color="white" stroke={1.5} />} roles={adminOnly} userRole={userRole} onNavigate={() => handleNavigate('export_support')} />
            </NavSection>
          </Stack>
        </ScrollArea>

        <Box p="md" pt="xs">
          <Divider color={theme.colors.adminBlue?.[6]} mb="md" />

          {/* Utilisateur connecté : clic → Profil / Mot de passe / Déconnexion */}
          <Box mb={10}>
            <MenuUtilisateur onLogout={handleLogout} variante="navbar" />
          </Box>

          <Text size="xs" c="dimmed" ta="center" style={{ whiteSpace: 'nowrap' }}>
            © 2026 Gestion Couture
          </Text>
          <Text size="xs" c="dimmed" ta="center" mt={2} style={{ whiteSpace: 'nowrap' }}>
            Version 3.0.0
          </Text>
        </Box>
      </Stack>
    </>
  );
}

export { NavItem, NavSection };