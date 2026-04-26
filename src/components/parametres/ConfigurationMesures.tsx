import React, { useEffect, useState } from 'react';
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
  Box,
  Pagination,
  Tooltip,
  Modal,
  Divider,
  ThemeIcon,
  SimpleGrid,
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
} from '@mantine/core';
import {
  IconRulerMeasure,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconArrowUp,
  IconArrowDown,
  IconCategory,
  IconSortAscending,
  IconCheck,
  IconDimensions,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireTypeMesure from './FormulaireTypeMesure';

interface TypeMesure {
  id: number;
  nom: string;
  unite: string;
  ordre_affichage: number;
  est_active: number;
  categorie: string;
}

const ConfigurationMesures: React.FC = () => {
  const [types, setTypes] = useState<TypeMesure[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [typeEdition, setTypeEdition] = useState<TypeMesure | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  const chargerTypes = async () => {
    setLoading(true);
    const db = await getDb();
    const result = await db.select<TypeMesure[]>(
      "SELECT * FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage ASC"
    );
    setTypes(result);
    setLoading(false);
  };

  useEffect(() => {
    chargerTypes();
  }, []);

  const supprimerType = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer le type de mesure "${nom}" ?`)) return;
    const db = await getDb();
    await db.execute("UPDATE types_mesures SET est_active = 0 WHERE id = ?", [id]);
    await chargerTypes();
    setSuccessMessage(`Type "${nom}" supprimé avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const changerOrdre = async (id: number, actuel: number, direction: 'haut' | 'bas') => {
    const db = await getDb();
    const nouvelOrdre = direction === 'haut' ? actuel - 1 : actuel + 1;
    if (nouvelOrdre < 1 || nouvelOrdre > types.length) return;

    await db.execute(
      "UPDATE types_mesures SET ordre_affichage = ? WHERE ordre_affichage = ?",
      [actuel, nouvelOrdre]
    );
    await db.execute(
      "UPDATE types_mesures SET ordre_affichage = ? WHERE id = ?",
      [nouvelOrdre, id]
    );
    await chargerTypes();
    setSuccessMessage(`Ordre mis à jour avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setRecherche('');
    chargerTypes();
    setCurrentPage(1);
  };

  const typesFiltres = types.filter(t =>
    t.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(typesFiltres.length / itemsPerPage);
  const paginatedData = typesFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = [...new Set(types.map(t => t.categorie).filter(Boolean))];

  if (vueForm) {
    return (
      <FormulaireTypeMesure
        type={typeEdition || undefined}
        onSuccess={() => {
          setVueForm(false);
          setTypeEdition(null);
          chargerTypes();
          setSuccessMessage(typeEdition ? 'Type modifié avec succès' : 'Type créé avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
        onCancel={() => {
          setVueForm(false);
          setTypeEdition(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconRulerMeasure size={40} stroke={1.5} />
            <Text>Chargement des types de mesures...</Text>
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
              icon={<IconCheck size={18} />}
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
                  <IconRulerMeasure size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Configuration des mesures</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gérez les types de mesures pour les clients
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {typesFiltres.length} type{typesFiltres.length > 1 ? 's' : ''} de mesure
                    </Badge>
                    {categories.length > 0 && (
                      <Badge size="sm" variant="white" color="cyan">
                        {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                      </Badge>
                    )}
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

          {/* Statistiques KPI */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total mesures</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconRulerMeasure size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{types.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Types configurés</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Catégories</Text>
                <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                  <IconCategory size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="cyan">{categories.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Différentes catégories</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Ordre</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconSortAscending size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">Personnalisable</Text>
              <Text size="xs" c="dimmed" mt={4}>Utilisez les flèches ↑↓</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher un type de mesure..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 300 }}
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => {
                    setTypeEdition(null);
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouveau type
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des types de mesures */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {typesFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconRulerMeasure size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun type de mesure trouvé</Text>
                <Button variant="light" onClick={() => { setTypeEdition(null); setVueForm(true); }}>
                  Ajouter un type
                </Button>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Unité</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Catégorie</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white', width: 100 }}>Ordre</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white', width: 180 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td fw={500}>
                          <Group gap="xs">
                            <Avatar size="sm" radius="xl" color="violet">
                              <IconDimensions size={12} />
                            </Avatar>
                            {t.nom}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="gray" variant="light" size="md">
                            {t.unite || 'cm'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {t.categorie ? (
                            <Badge color="cyan" variant="light" size="sm">
                              {t.categorie}
                            </Badge>
                          ) : (
                            <Text size="xs" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge color="blue" variant="filled" size="sm">
                            {t.ordre_affichage}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <Tooltip label="Monter (augmenter l'ordre)">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="blue"
                                onClick={() => changerOrdre(t.id, t.ordre_affichage, 'haut')}
                              >
                                <IconArrowUp size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Descendre (diminuer l'ordre)">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="blue"
                                onClick={() => changerOrdre(t.id, t.ordre_affichage, 'bas')}
                              >
                                <IconArrowDown size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Modifier">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="orange"
                                onClick={() => {
                                  setTypeEdition(t);
                                  setVueForm(true);
                                }}
                              >
                                <IconEdit size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Supprimer">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => supprimerType(t.id, t.nom)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
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

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Configuration des mesures"
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
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouveau type" pour ajouter un type de mesure</Text>
                  <Text size="sm">2️⃣ Les flèches ↑ ↓ permettent de réorganiser l'ordre d'affichage</Text>
                  <Text size="sm">3️⃣ La recherche filtre par nom de mesure</Text>
                  <Text size="sm">4️⃣ Cliquez sur ✏️ pour modifier un type existant</Text>
                  <Text size="sm">5️⃣ Cliquez sur 🗑️ pour supprimer un type (désactivation)</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Exemples de mesures :</Text>
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                  <Group gap="xs"><Badge color="blue" size="sm">Tour de poitrine</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Tour de taille</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Tour de hanches</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Longueur dos</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Longueur manche</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Hauteur poitrine</Badge><Text size="xs">cm</Text></Group>
                </SimpleGrid>
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

export default ConfigurationMesures;