// src/components/utilisateurs/ListeUtilisateurs.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Container, Stack, Card, Title, Text, Group, Button,
  Table, Badge, ActionIcon, Tooltip, Avatar,
  Center, Modal, Alert, LoadingOverlay,
} from '@mantine/core';
import {
  IconPlus, IconEdit, IconTrash, IconRefresh,
  IconLock, IconLockOpen, IconShield,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';
import FormulaireUtilisateur from './FormulaireUtilisateur';

interface Utilisateur {
  id: number;
  nom: string;
  login: string;
  role: string;
  est_actif: number;
}

const ListeUtilisateurs: React.FC = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [desactiverId, setDesactiverId] = useState<number | null>(null);
  const [desactiverModalOpen, setDesactiverModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const data = await db.select<Utilisateur[]>(
        `SELECT id, nom, login, role, est_actif FROM utilisateurs ORDER BY nom`
      );
      setUtilisateurs(data || []);
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  // Désactiver/Réactiver un utilisateur
  const handleToggleActif = async () => {
    if (!desactiverId) return;
    try {
      const db = await getDb();
      const user = utilisateurs.find(u => u.id === desactiverId);
      const newStatus = user?.est_actif === 1 ? 0 : 1;
      await db.execute(`UPDATE utilisateurs SET est_actif = ? WHERE id = ?`, [newStatus, desactiverId]);
      const message = newStatus === 0 ? 'Utilisateur désactivé' : 'Utilisateur réactivé';
      notifications.show({ title: 'Succès', message, color: 'green' });
      setDesactiverModalOpen(false);
      setDesactiverId(null);
      loadUsers();
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };

  // Supprimer définitivement
  const handleDeleteDefinitif = async () => {
    if (!deleteUserId) return;
    try {
      const db = await getDb();
      await db.execute(`DELETE FROM permissions WHERE utilisateur_id = ?`, [deleteUserId]);
      await db.execute(`DELETE FROM utilisateurs WHERE id = ?`, [deleteUserId]);
      notifications.show({ title: 'Succès', message: 'Utilisateur supprimé définitivement', color: 'green' });
      setDeleteModalOpen(false);
      setDeleteUserId(null);
      loadUsers();
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };

  if (showForm) {
    return (
      <FormulaireUtilisateur
        utilisateur={editUser || undefined}
        onSuccess={() => { setShowForm(false); setEditUser(null); loadUsers(); }}
        onCancel={() => { setShowForm(false); setEditUser(null); }}
      />
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge color="red" variant="light">🔑 Admin</Badge>;
      case 'caissier': return <Badge color="green" variant="light">💵 Caissier</Badge>;
      case 'couturier': return <Badge color="blue" variant="light">🧵 Couturier</Badge>;
      default: return <Badge color="gray" variant="light">👤 {role}</Badge>;
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <LoadingOverlay visible />
        <Text>Chargement...</Text>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* HEADER */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconShield size={26} color="white" />
                </Avatar>
                <Box>
                  <Title order={2} c="white">Utilisateurs</Title>
                  <Text c="gray.3" size="xs">Gérez les comptes et permissions</Text>
                </Box>
              </Group>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => { setEditUser(null); setShowForm(true); }}
                variant="white"
                color="dark"
                radius="md"
              >
                Nouvel utilisateur
              </Button>
            </Group>
          </Card>

          {/* TABLEAU */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group mb="md">
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={loadUsers} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                <Table.Tr>
                  <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Login</Table.Th>
                  <Table.Th style={{ color: 'white' }}>Rôle</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'center' }}>Statut</Table.Th>
                  <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {utilisateurs.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" py={40}>
                      <Text c="dimmed">Aucun utilisateur</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  utilisateurs.map(u => (
                    <Table.Tr key={u.id}>
                      <Table.Td>
                        <Group gap="xs">
                          <Avatar size="sm" radius="xl" color="blue">
                            {u.nom.charAt(0).toUpperCase()}
                          </Avatar>
                          <Text size="sm" fw={500}>{u.nom}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><Text size="sm">{u.login}</Text></Table.Td>
                      <Table.Td>{getRoleBadge(u.role)}</Table.Td>
                      <Table.Td ta="center">
                        <Badge
                          color={u.est_actif === 1 ? 'green' : 'red'}
                          variant="filled"
                          size="sm"
                        >
                          {u.est_actif === 1 ? 'Actif' : 'Désactivé'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              variant="light" color="yellow" size="sm"
                              onClick={() => { setEditUser(u); setShowForm(true); }}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={u.est_actif === 1 ? 'Désactiver' : 'Réactiver'}>
                            <ActionIcon
                              variant="light" color={u.est_actif === 1 ? 'orange' : 'green'} size="sm"
                              onClick={() => { setDesactiverId(u.id); setDesactiverModalOpen(true); }}
                            >
                              {u.est_actif === 1 ? <IconLock size={14} /> : <IconLockOpen size={14} />}
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer définitivement">
                            <ActionIcon
                              variant="light" color="red" size="sm"
                              onClick={() => { setDeleteUserId(u.id); setDeleteModalOpen(true); }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>

          {/* MODAL DÉSACTIVATION/RÉACTIVATION */}
          <Modal
            opened={desactiverModalOpen}
            onClose={() => { setDesactiverModalOpen(false); setDesactiverId(null); }}
            title={utilisateurs.find(u => u.id === desactiverId)?.est_actif === 1 ? 'Désactiver' : 'Réactiver'}
            size="sm"
            centered
            radius="md"
          >
            <Stack gap="md">
              <Alert color={utilisateurs.find(u => u.id === desactiverId)?.est_actif === 1 ? 'orange' : 'green'} variant="light">
                <Text size="sm">
                  {utilisateurs.find(u => u.id === desactiverId)?.est_actif === 1
                    ? "L'utilisateur ne pourra plus se connecter."
                    : "L'utilisateur pourra à nouveau se connecter."}
                </Text>
              </Alert>
              <Group justify="flex-end" gap="sm">
                <Button variant="light" size="xs" onClick={() => { setDesactiverModalOpen(false); setDesactiverId(null); }}>Annuler</Button>
                <Button
                  color={utilisateurs.find(u => u.id === desactiverId)?.est_actif === 1 ? 'orange' : 'green'}
                  size="xs"
                  onClick={handleToggleActif}
                >
                  {utilisateurs.find(u => u.id === desactiverId)?.est_actif === 1 ? 'Désactiver' : 'Réactiver'}
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* MODAL SUPPRESSION DÉFINITIVE */}
          <Modal
            opened={deleteModalOpen}
            onClose={() => { setDeleteModalOpen(false); setDeleteUserId(null); }}
            title="Suppression définitive"
            size="sm"
            centered
            radius="md"
          >
            <Stack gap="md">
              <Alert color="red" variant="light">
                <Text size="sm" fw={500}>Supprimer définitivement cet utilisateur ?</Text>
                <Text size="xs" mt={4}>Cette action est irréversible. Les permissions seront également supprimées.</Text>
              </Alert>
              <Group justify="flex-end" gap="sm">
                <Button variant="light" size="xs" onClick={() => { setDeleteModalOpen(false); setDeleteUserId(null); }}>Annuler</Button>
                <Button color="red" size="xs" onClick={handleDeleteDefinitif} leftSection={<IconTrash size={14} />}>Supprimer</Button>
              </Group>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ListeUtilisateurs;