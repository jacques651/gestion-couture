import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Select,
  Box,
  Pagination,
  Tooltip,
  Modal,
  Divider,
  ThemeIcon,
  PasswordInput,
  SimpleGrid,
} from '@mantine/core';
import {
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconPrinter,
  IconUser,
  IconLock,
  IconUserShield,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { useReactToPrint } from 'react-to-print';
import bcrypt from 'bcryptjs';

interface Utilisateur {
  id: number;
  nom: string;
  login: string;
  role: 'admin' | 'caissier' | 'couturier';
  est_actif: number;
}

const ListeUtilisateurs: React.FC = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [vueForm, setVueForm] = useState(false);
  const [editionId, setEditionId] = useState<number | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const [nom, setNom] = useState('');
  const [login, setLogin] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState<string | null>('couturier');

  const [recherche, setRecherche] = useState('');
  const [filtreRole, setFiltreRole] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const printRef = useRef<HTMLDivElement>(null);

  const chargerDonnees = async () => {
    setLoading(true);
    const db = await getDb();
    const result = await db.select<Utilisateur[]>(`
      SELECT id, nom, login, role, est_actif 
      FROM utilisateurs 
      ORDER BY nom
    `);
    setUtilisateurs(result || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const resetForm = () => {
    setNom('');
    setLogin('');
    setMotDePasse('');
    setRole('couturier');
    setEditionId(null);
  };

  const handleEdit = (u: Utilisateur) => {
    setEditionId(u.id);
    setNom(u.nom);
    setLogin(u.login);
    setRole(u.role);
    setVueForm(true);
  };

  const supprimerUtilisateur = async (id: number) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    const db = await getDb();
    await db.execute(`DELETE FROM utilisateurs WHERE id = ?`, [id]);
    chargerDonnees();
  };

  const sauvegarderUtilisateur = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!login.trim()) {
      alert("Login obligatoire");
      return;
    }

    const db = await getDb();

    try {
      if (editionId === null) {
        if (!motDePasse) {
          alert("Mot de passe obligatoire");
          return;
        }

        const hash = await bcrypt.hash(motDePasse, 10);

        await db.execute(
          `INSERT INTO utilisateurs (nom, login, mot_de_passe_hash, role, est_actif)
           VALUES (?, ?, ?, ?, 1)`,
          [nom, login, hash, role]
        );
      } else {
        if (motDePasse) {
          const hash = await bcrypt.hash(motDePasse, 10);
          await db.execute(
            `UPDATE utilisateurs 
             SET nom=?, login=?, role=?, mot_de_passe_hash=? 
             WHERE id=?`,
            [nom, login, role, hash, editionId]
          );
        } else {
          await db.execute(
            `UPDATE utilisateurs 
             SET nom=?, login=?, role=? 
             WHERE id=?`,
            [nom, login, role, editionId]
          );
        }
      }

      setVueForm(false);
      resetForm();
      chargerDonnees();

    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Liste_Utilisateurs',
  });

  const handleReset = () => {
    setRecherche('');
    setFiltreRole(null);
    chargerDonnees();
    setCurrentPage(1);
  };

  const utilisateursFiltres = utilisateurs.filter(u => {
    return (
      u.nom.toLowerCase().includes(recherche.toLowerCase()) &&
      (filtreRole === null || u.role === filtreRole)
    );
  });

  const totalPages = Math.ceil(utilisateursFiltres.length / itemsPerPage);
  const paginatedData = utilisateursFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const roleColors = {
    admin: { color: 'red', label: 'Admin' },
    caissier: { color: 'green', label: 'Caissier' },
    couturier: { color: 'blue', label: 'Couturier' },
  };

  const roleOptions = [
    { value: 'admin', label: '👑 Admin' },
    { value: 'caissier', label: '💰 Caissier' },
    { value: 'couturier', label: '✂️ Couturier' },
  ];

  const filterOptions = [
    { value: '', label: 'Tous' },
    { value: 'admin', label: 'Admin' },
    { value: 'caissier', label: 'Caissier' },
    { value: 'couturier', label: 'Couturier' },
  ];

  if (vueForm) {
    return (
      <Box style={{ maxWidth: 500, margin: '0 auto' }} p="sm">
        <Stack gap="md">
          <Card withBorder radius="md" p="sm" bg="#1b365d">
            <Group justify="space-between">
              <Group gap="xs">
                <IconUserShield size={18} color="white" />
                <Title order={4} size="h5" c="white">
                  {editionId ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
                </Title>
              </Group>
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                onClick={() => {
                  setVueForm(false);
                  resetForm();
                }}
              >
                Retour
              </Button>
            </Group>
          </Card>

          <Card withBorder radius="md" p="sm">
            <form onSubmit={sauvegarderUtilisateur}>
              <Stack gap="sm">
                <TextInput
                  label="Nom"
                  placeholder="Nom complet"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  leftSection={<IconUser size={14} />}
                  size="sm"
                  required
                />

                <TextInput
                  label="Login"
                  placeholder="Identifiant"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  leftSection={<IconUser size={14} />}
                  size="sm"
                  required
                />

                <PasswordInput
                  label="Mot de passe"
                  placeholder={editionId ? "Laisser vide pour conserver" : "Mot de passe"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  leftSection={<IconLock size={14} />}
                  size="sm"
                  required={!editionId}
                />

                <Select
                  label="Rôle"
                  placeholder="Choisir un rôle"
                  data={roleOptions}
                  value={role}
                  onChange={setRole}
                  size="sm"
                  required
                />

                <Divider />

                <Group justify="space-between">
                  <Button size="sm" variant="light" color="red" onClick={() => setVueForm(false)}>
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    type="submit"
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                  >
                    {editionId ? 'Mettre à jour' : 'Enregistrer'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Box>
    );
  }

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des utilisateurs...</Text>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <IconUsers size={24} color="white" />
                <Title order={2} c="white">Gestion des utilisateurs</Title>
              </Group>
              <Text size="sm" c="gray.3">
                {utilisateursFiltres.length} utilisateur{utilisateursFiltres.length > 1 ? 's' : ''}
              </Text>
            </Stack>
            <Group gap="md">
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
              >
                Instructions
              </Button>
              <ThemeIcon size={48} radius="md" color="white" variant="light">
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total utilisateurs
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconUsers size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {utilisateurs.length}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Administrateurs
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconUserShield size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {utilisateurs.filter(u => u.role === 'admin').length}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Caissiers / Couturiers
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconUser size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {utilisateurs.filter(u => u.role !== 'admin').length}
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group>
              <TextInput
                placeholder="Rechercher par nom..."
                leftSection={<IconSearch size={16} />}
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setCurrentPage(1);
                }}
                size="sm"
                style={{ width: 250 }}
              />
              <Select
                placeholder="Filtrer par rôle"
                data={filterOptions}
                value={filtreRole}
                onChange={setFiltreRole}
                size="sm"
                style={{ width: 130 }}
                clearable
              />
            </Group>
            <Group>
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={handleReset} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Imprimer">
                <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg">
                  <IconPrinter size={18} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  resetForm();
                  setVueForm(true);
                }}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvel utilisateur
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU DES UTILISATEURS */}
        <div ref={printRef}>
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            {utilisateursFiltres.length === 0 ? (
              <Text ta="center" c="dimmed" py={60}>
                Aucun utilisateur trouvé
              </Text>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Login</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Rôle</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((u) => (
                      <Table.Tr key={u.id}>
                        <Table.Td fw={500}>{u.nom}</Table.Td>
                        <Table.Td>{u.login}</Table.Td>
                        <Table.Td>
                          <Badge
                            color={roleColors[u.role].color}
                            variant="light"
                            size="sm"
                          >
                            {roleColors[u.role].label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={6} justify="center">
                            <Tooltip label="Modifier">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="orange"
                                onClick={() => handleEdit(u)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Supprimer">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={() => supprimerUtilisateur(u.id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      color="blue"
                      size="sm"
                    />
                  </Group>
                )}
              </>
            )}
          </Card>
        </div>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions"
          size="md"
          centered
          styles={{
            header: {
              backgroundColor: '#1b365d',
              padding: '16px 20px',
            },
            title: {
              color: 'white',
              fontWeight: 600,
            },
            body: {
              padding: '20px',
            },
          }}
        >
          <Stack gap="md">
            <Text size="sm">1. Utilisez le bouton "Nouvel utilisateur" pour ajouter un utilisateur</Text>
            <Text size="sm">2. La recherche filtre par nom</Text>
            <Text size="sm">3. Le filtre par rôle permet de voir les utilisateurs par catégorie</Text>
            <Text size="sm">4. Cliquez sur ✏️ pour modifier un utilisateur</Text>
            <Text size="sm">5. Cliquez sur 🗑️ pour supprimer un utilisateur</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default ListeUtilisateurs;