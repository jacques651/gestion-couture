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
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
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
  IconUserCheck,
  IconShield,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const supprimerUtilisateur = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer l'utilisateur "${nom}" ?`)) return;
    const db = await getDb();
    await db.execute(`DELETE FROM utilisateurs WHERE id = ?`, [id]);
    chargerDonnees();
    setSuccessMessage(`Utilisateur "${nom}" supprimé avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
        setSuccessMessage(`Utilisateur "${nom}" créé avec succès`);
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
        setSuccessMessage(`Utilisateur "${nom}" modifié avec succès`);
      }

      setVueForm(false);
      resetForm();
      chargerDonnees();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

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

  const roleConfig = {
    admin: { color: 'red', label: 'Administrateur', icon: IconShield, bg: '#fff5f5' },
    caissier: { color: 'green', label: 'Caissier', icon: IconUserCheck, bg: '#ebfbee' },
    couturier: { color: 'blue', label: 'Couturier', icon: IconUser, bg: '#e8f4fd' },
  };

  const roleOptions = [
    { value: 'admin', label: '👑 Administrateur' },
    { value: 'caissier', label: '💰 Caissier' },
    { value: 'couturier', label: '✂️ Couturier' },
  ];

  const filterOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: 'admin', label: '👑 Administrateurs' },
    { value: 'caissier', label: '💰 Caissiers' },
    { value: 'couturier', label: '✂️ Couturiers' },
  ];

  if (vueForm) {
    return (
      <Container size="sm" p="md">
        <Stack gap="lg">
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={45} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  {editionId ? <IconEdit size={22} color="white" /> : <IconUserShield size={22} color="white" />}
                </Avatar>
                <Box>
                  <Title order={2} c="white" size="h3">
                    {editionId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                  </Title>
                  <Text c="gray.3" size="xs">
                    {editionId ? 'Modifiez les informations de l\'utilisateur' : 'Ajoutez un nouvel utilisateur à l\'application'}
                  </Text>
                </Box>
              </Group>
              <Button variant="light" color="white" onClick={() => { setVueForm(false); resetForm(); }} radius="md">
                Retour
              </Button>
            </Group>
          </Card>

          <Card withBorder radius="lg" shadow="md" p="xl">
            <form onSubmit={sauvegarderUtilisateur}>
              <Stack gap="lg">
                <TextInput
                  label="Nom complet"
                  placeholder="Nom et prénom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  leftSection={<IconUser size={16} />}
                  size="md"
                  radius="md"
                  required
                />

                <TextInput
                  label="Identifiant"
                  placeholder="Nom d'utilisateur"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  leftSection={<IconUser size={16} />}
                  size="md"
                  radius="md"
                  required
                />

                <PasswordInput
                  label="Mot de passe"
                  placeholder={editionId ? "Laisser vide pour conserver" : "Mot de passe"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  leftSection={<IconLock size={16} />}
                  size="md"
                  radius="md"
                  required={!editionId}
                />

                <Select
                  label="Rôle"
                  placeholder="Sélectionner un rôle"
                  data={roleOptions}
                  value={role}
                  onChange={setRole}
                  size="md"
                  radius="md"
                  required
                />

                <Divider />

                <Group justify="flex-end" gap="md">
                  <Button 
                    variant="light" 
                    color="red" 
                    onClick={() => setVueForm(false)}
                    radius="md"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                    leftSection={editionId ? <IconEdit size={16} /> : <IconPlus size={16} />}
                    radius="md"
                  >
                    {editionId ? 'Mettre à jour' : 'Créer l\'utilisateur'}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Container>
    );
  }

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconUsers size={40} stroke={1.5} />
            <Text>Chargement des utilisateurs...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full ">
        <Stack gap="lg">
          {/* Notification de succès */}
          {showSuccess && (
            <Notification
              icon={<IconUserCheck size={18} />}
              color="green"
              title="Succès !"
              onClose={() => setShowSuccess(false)}
              radius="md"
            >
              {successMessage}
            </Notification>
          )}

          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconUsers size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Gestion des utilisateurs</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gérez les accès et les rôles des utilisateurs
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {utilisateursFiltres.length} utilisateur{utilisateursFiltres.length > 1 ? 's' : ''}
                    </Badge>
                  </Group>
                </Box>
              </Group>
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
                radius="md"
              >
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Statistiques KPI modernisées */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total utilisateurs</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconUsers size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{utilisateurs.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Comptes actifs</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff5f5' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Administrateurs</Text>
                <ThemeIcon size="lg" radius="md" color="red" variant="light">
                  <IconShield size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="red">{utilisateurs.filter(u => u.role === 'admin').length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Accès total</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Caissiers & Couturiers</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconUserCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{utilisateurs.filter(u => u.role !== 'admin').length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Accès limité</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils modernisée */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher par nom..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 280 }}
                />
                <Select
                  placeholder="Filtrer par rôle"
                  data={filterOptions}
                  value={filtreRole}
                  onChange={setFiltreRole}
                  size="md"
                  radius="md"
                  style={{ width: 180 }}
                  clearable
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Imprimer la liste">
                  <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg" radius="md">
                    <IconPrinter size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => {
                    resetForm();
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouvel utilisateur
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des utilisateurs amélioré */}
          <div ref={printRef}>
            <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
              {utilisateursFiltres.length === 0 ? (
                <Stack align="center" py={60} gap="sm">
                  <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                    <IconUsers size={30} />
                  </ThemeIcon>
                  <Text c="dimmed" size="lg">Aucun utilisateur trouvé</Text>
                  <Button variant="light" onClick={() => { resetForm(); setVueForm(true); }}>
                    Ajouter un utilisateur
                  </Button>
                </Stack>
              ) : (
                <>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th style={{ color: 'white' }}>Utilisateur</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Identifiant</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Rôle</Table.Th>
                        <Table.Th style={{ textAlign: 'center', color: 'white' }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedData.map((u) => {
                        const config = roleConfig[u.role];
                        return (
                          <Table.Tr key={u.id}>
                            <Table.Td fw={500}>
                              <Group gap="xs">
                                <Avatar size="sm" radius="xl" color={config.color}>
                                  <config.icon size={14} />
                                </Avatar>
                                {u.nom}
                              </Group>
                            </Table.Td>
                            <Table.Td>{u.login}</Table.Td>
                            <Table.Td>
                              <Badge color={config.color} variant="light" size="md">
                                {config.label}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" justify="center">
                                <Tooltip label="Modifier">
                                  <ActionIcon size="md" variant="subtle" color="orange" onClick={() => handleEdit(u)}>
                                    <IconEdit size={18} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Supprimer">
                                  <ActionIcon size="md" variant="subtle" color="red" onClick={() => supprimerUtilisateur(u.id, u.nom)}>
                                    <IconTrash size={18} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>

                  {totalPages > 1 && (
                    <Group justify="center" p="md">
                      <Pagination
                        value={currentPage}
                        onChange={setCurrentPage}
                        total={totalPages}
                        color="#1b365d"
                        size="md"
                        radius="md"
                      />
                    </Group>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Gestion des utilisateurs"
            size="md"
            centered
            radius="lg"
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
                padding: '24px',
              },
            }}
          >
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm" mb="md">📌 Fonctionnalités :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouvel utilisateur" pour ajouter un utilisateur</Text>
                  <Text size="sm">2️⃣ La recherche filtre par nom</Text>
                  <Text size="sm">3️⃣ Le filtre par rôle permet de voir les utilisateurs par catégorie</Text>
                  <Text size="sm">4️⃣ Cliquez sur ✏️ pour modifier un utilisateur</Text>
                  <Text size="sm">5️⃣ Cliquez sur 🗑️ pour supprimer un utilisateur</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Rôles et permissions :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <Badge color="red" size="sm">Admin</Badge>
                    <Text size="xs">Accès complet à toutes les fonctionnalités</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="green" size="sm">Caissier</Badge>
                    <Text size="xs">Gestion des paiements et factures</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Couturier</Badge>
                    <Text size="xs">Gestion des commandes et mesures clients</Text>
                  </Group>
                </Stack>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 1.0.0 - Gestion Couture
              </Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ListeUtilisateurs;