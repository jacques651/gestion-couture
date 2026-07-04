// src/components/MenuUtilisateur.tsx
// Menu du compte utilisateur : Profil, Changer le mot de passe, Déconnexion.
// Utilisé dans le HEADER (en haut) et dans la NAVBAR (en bas).
import React, { useState } from 'react';
import {
  Menu,
  Modal,
  Stack,
  Group,
  Text,
  Avatar,
  Badge,
  Divider,
  Button,
} from '@mantine/core';
import {
  IconUserCircle,
  IconLock,
  IconLogout,
  IconChevronDown,
  IconId,
  IconUserShield,
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';
import ChangerMotDePasse from './parametres/ChangerMotDePasse';

interface MenuUtilisateurProps {
  /** Action de déconnexion (avec confirmation gérée par l'appelant) */
  onLogout?: () => void;
  /** Rendu du déclencheur : 'header' (clair, compact) ou 'navbar' (sur fond bleu) */
  variante?: 'header' | 'navbar';
}

const getRoleLabel = (role?: string) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const MenuUtilisateur: React.FC<MenuUtilisateurProps> = ({ onLogout, variante = 'header' }) => {
  const { user } = useAuth();
  const [profilOpen, setProfilOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (!user) return null;

  const initiale = (user.nom || '?').charAt(0).toUpperCase();

  return (
    <>
      <Menu position={variante === 'navbar' ? 'top' : 'bottom-end'} width={220} withinPortal shadow="md">
        <Menu.Target>
          <Group
            gap={8}
            wrap="nowrap"
            style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
            title="Mon compte"
          >
            <Avatar size="sm" radius="xl" color={variante === 'header' ? 'yellow' : 'blue'}>
              {initiale}
            </Avatar>
            <Text
              size="sm"
              fw={600}
              c={variante === 'header' ? 'white' : 'yellow'}
              style={{ whiteSpace: 'nowrap' }}
            >
              {user.nom}
            </Text>
            <Badge
              size="xs"
              color="yellow"
              variant={variante === 'header' ? 'filled' : 'light'}
              style={variante === 'header' ? { color: '#1b365d' } : undefined}
            >
              {getRoleLabel(user.role)}
            </Badge>
            <IconChevronDown size={14} color={variante === 'header' ? 'white' : '#ffd700'} />
          </Group>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Mon compte</Menu.Label>
          <Menu.Item leftSection={<IconUserCircle size={16} />} onClick={() => setProfilOpen(true)}>
            Mon profil
          </Menu.Item>
          <Menu.Item leftSection={<IconLock size={16} />} onClick={() => setPasswordOpen(true)}>
            Changer le mot de passe
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item leftSection={<IconLogout size={16} />} color="red" onClick={onLogout}>
            Déconnexion
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      {/* ===== MODAL PROFIL ===== */}
      <Modal
        opened={profilOpen}
        onClose={() => setProfilOpen(false)}
        title="👤 Mon profil"
        size="sm"
        centered
        radius="md"
      >
        <Stack gap="md" pt="xs">
          <Group justify="center">
            <Avatar size={70} radius="xl" color="blue">
              <Text size="xl" fw={700}>{initiale}</Text>
            </Avatar>
          </Group>

          <Stack gap="xs">
            <Group gap="xs">
              <IconUserCircle size={18} color="#1b365d" />
              <Text size="sm" c="dimmed" w={110}>Nom</Text>
              <Text size="sm" fw={600}>{user.nom}</Text>
            </Group>
            <Group gap="xs">
              <IconId size={18} color="#1b365d" />
              <Text size="sm" c="dimmed" w={110}>Identifiant</Text>
              <Text size="sm" fw={600}>{user.login}</Text>
            </Group>
            <Group gap="xs">
              <IconUserShield size={18} color="#1b365d" />
              <Text size="sm" c="dimmed" w={110}>Rôle</Text>
              <Badge color="yellow" variant="light">{getRoleLabel(user.role)}</Badge>
            </Group>
          </Stack>

          <Divider />

          <Group grow>
            <Button
              variant="light"
              leftSection={<IconLock size={16} />}
              onClick={() => { setProfilOpen(false); setPasswordOpen(true); }}
            >
              Changer le mot de passe
            </Button>
            <Button
              color="red"
              variant="light"
              leftSection={<IconLogout size={16} />}
              onClick={() => { setProfilOpen(false); onLogout?.(); }}
            >
              Déconnexion
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ===== MODAL MOT DE PASSE ===== */}
      <ChangerMotDePasse opened={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </>
  );
};

export default MenuUtilisateur;
