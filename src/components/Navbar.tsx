// src/components/Navbar.tsx
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
} from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconUsers,
  IconShoppingBag,
  IconReceipt,
  IconMoneybag,
  IconBuildingStore,
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
  IconCash,
} from '@tabler/icons-react';
import { Role } from '../types/auth';

// Types
export interface NavItemProps {
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: Role[];
  userRole?: Role;
  badge?: string;
}

export interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  roles?: Role[];
  userRole?: Role;
}

export interface NavbarProps {
  userRole?: Role;
  userName?: string;
  onLogout?: () => void;
  onNavigate?: (page: string) => void;
}

// Composant NavItem
function NavItem({ label, path, icon, roles, userRole, badge }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMantineTheme();

  if (roles && userRole && !roles.includes(userRole)) {
    return null;
  }

  const active = location.pathname === path;

  const hoverBlue = theme.colors.adminBlue?.[6] || '#3a6a8a';
  const activeBg = '#2a5a7a';
  const textColor = active ? '#ffd700' : '#e0e0e0';

  return (
    <Tooltip label={badge || label} position="right" withArrow openDelay={500} offset={10}>
      <Box
        onClick={() => navigate(path)}
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
function NavSection({ title, icon, children, defaultOpen = false, roles, userRole }: SectionProps) {
  const [opened, setOpened] = useState(defaultOpen);
  const theme = useMantineTheme();

  if (roles && userRole && !roles.includes(userRole)) {
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
export default function Navbar({ userRole, userName, onLogout }: NavbarProps) {
  const theme = useMantineTheme();
  const darkBlue = theme.colors.adminBlue?.[8] || '#1b365d';

  const adminOnly: Role[] = ['admin'];
  const allUsers: Role[] = ['admin', 'caissier', 'couturier'];

  const getRoleLabel = (role?: Role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'caissier': return 'Caissier';
      case 'couturier': return 'Couturier';
      default: return '';
    }
  };

  return (
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
          />

          <Divider color={theme.colors.adminBlue?.[6]} my="sm" />

          {/* SECTION CLIENTS */}
          <NavSection
            title="CLIENTS"
            icon={<IconUsers size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={allUsers}
          >
            <NavItem
              label="Clients"
              path="/clients"
              icon={<IconUsers size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
            />
          </NavSection>

          {/* SECTION STOCK */}
          <NavSection
            title="STOCK"
            icon={<IconPackage size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={allUsers}
            defaultOpen={userRole === 'admin'}
          >
            <NavItem
              label="Matières premières"
              path="/matieres"
              icon={<IconPackage size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
            />
            <NavItem
              label="Gammes de tenues"
              path="/gammes-tenues"
              icon={<IconScissors size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
            />
            <NavItem
              label="Mouvements de stock"
              path="/mouvements-stock"
              icon={<IconBuildingStore size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
          </NavSection>

          {/* SECTION VENTES (UNIFIÉE) */}
          <NavSection
            title="VENTES"
            icon={<IconShoppingBag size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={allUsers}
            defaultOpen={true}
          >
            <NavItem
              label="Nouvelle vente"
              path="/ventes/nouvelle"
              icon={<IconCash size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
              badge="Nouveau"
            />
            <NavItem
              label="Historique des ventes"
              path="/ventes"
              icon={<IconReceipt size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
            />
          </NavSection>

          {/* SECTION FINANCES */}
          <NavSection
            title="FINANCES"
            icon={<IconChartBar size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={adminOnly}
          >
            <NavItem
              label="Bilan financier"
              path="/bilan"
              icon={<IconChartBar size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Journal de caisse"
              path="/journal"
              icon={<IconReceipt size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Dépenses"
              path="/depenses"
              icon={<IconMoneybag size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Salaires"
              path="/salaires"
              icon={<IconMoneybag size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Historique des salaires"
              path="/historiques-salaires"
              icon={<IconMoneybag size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />

          </NavSection>

          {/* SECTION RESSOURCES HUMAINES */}
          <NavSection
            title="RESSOURCES HUMAINES"
            icon={<IconUsers size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={adminOnly}
          >
            <NavItem
              label="Employés"
              path="/employes"
              icon={<IconUsers size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Emprunts"
              path="/emprunts"
              icon={<IconMoneybag size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Prestations"
              path="/prestations-realisees"
              icon={<IconTools size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
          </NavSection>

          {/* SECTION RÉFÉRENTIELS */}
          <NavSection
            title="RÉFÉRENTIELS"
            icon={<IconTools size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={adminOnly}
          >
            <NavItem
              label="Types prestations"
              path="/prestations-types"
              icon={<IconTools size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Types mesures"
              path="/mesures"
              icon={<IconRulerMeasure size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
          </NavSection>

          {/* SECTION PARAMÈTRES */}
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
            />
            <NavItem
              label="Atelier"
              path="/parametres"
              icon={<IconSettings size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Configuration réseau"
              path="/config-reseau"
              icon={<IconNetwork size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Import Excel"
              path="/import-clients"
              icon={<IconFileExcel size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
          </NavSection>

          {/* SECTION SUPPORT */}
          <Divider color={theme.colors.adminBlue?.[6]} my="sm" />

          <NavSection
            title="SUPPORT"
            icon={<IconLifebuoy size={20} color="white" stroke={1.5} />}
            userRole={userRole}
            roles={allUsers}
          >
            <NavItem
              label="Support technique"
              path="/support"
              icon={<IconHeadset size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
            />
            <NavItem
              label="Exporter pour support"
              path="/export-support"
              icon={<IconDownload size={18} color="white" stroke={1.5} />}
              roles={adminOnly}
              userRole={userRole}
            />
            <NavItem
              label="Guide d'utilisation"
              path="/aide"
              icon={<IconHelpCircle size={18} color="white" stroke={1.5} />}
              roles={allUsers}
              userRole={userRole}
            />
          </NavSection>
        </Stack>
      </ScrollArea>

      {/* FOOTER FIXE */}
      <Box p="md" pt="xs">
        <Divider color={theme.colors.adminBlue?.[6]} mb="md" />
        {onLogout && (
          <Box
            onClick={onLogout}
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
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.backgroundColor = theme.colors.adminBlue?.[6] || '#3a6a8a';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <IconLogout size={18} stroke={1.5} />
            <Text size="sm" c="yellow" fw={500} style={{ whiteSpace: 'nowrap' }}>Déconnexion</Text>
          </Box>
        )}
        <Text size="xs" c="dimmed" ta="center" style={{ whiteSpace: 'nowrap' }}>
          © 2026 Gestion Couture
        </Text>
        <Text size="xs" c="dimmed" ta="center" mt={2} style={{ whiteSpace: 'nowrap' }}>
          Version 2.0.0
        </Text>
      </Box>
    </Stack>
  );
}

// Exports supplémentaires pour utilisation externe
export { NavItem, NavSection };