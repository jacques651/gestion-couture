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
  IconLayersOff,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconCoin,
  IconTag,
  IconCheck,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireTypePrestation from './FormulaireTypePrestation';

interface TypePrestation {
  id: number;
  nom: string;
  prix_par_defaut: number;
  est_active: number;
}

const ListeTypesPrestations: React.FC = () => {
  const [types, setTypes] = useState<TypePrestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [typeEdition, setTypeEdition] = useState<TypePrestation | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const chargerTypes = async () => {
    setLoading(true);
    const db = await getDb();
    const result = await db.select<TypePrestation[]>(`
      SELECT id, nom, prix_par_defaut, est_active
      FROM types_prestations
      WHERE est_active = 1
      ORDER BY nom
    `);
    setTypes(result || []);
    setLoading(false);
  };

  useEffect(() => {
    chargerTypes();
  }, []);

  const supprimerType = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer le type "${nom}" ?`)) return;
    const db = await getDb();
    await db.execute("UPDATE types_prestations SET est_active = 0 WHERE id = ?", [id]);
    await chargerTypes();
    setSuccessMessage(`Type "${nom}" supprimé avec succès`);
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

  const totalValeur = typesFiltres.reduce((sum, t) => sum + t.prix_par_defaut, 0);

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconLayersOff size={40} stroke={1.5} />
            <Text>Chargement des types de prestations...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  if (vueForm) {
    return (
      <FormulaireTypePrestation
        type={typeEdition || undefined}
        onSuccess={() => { 
          setVueForm(false); 
          setTypeEdition(null); 
          chargerTypes();
          setSuccessMessage(typeEdition ? 'Type modifié avec succès' : 'Type créé avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
        onCancel={() => { setVueForm(false); setTypeEdition(null); }}
      />
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
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconLayersOff size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Types de prestations</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gérez les différents types de prestations de votre atelier
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {typesFiltres.length} type{typesFiltres.length > 1 ? 's' : ''} actif{typesFiltres.length > 1 ? 's' : ''}
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

          {/* Statistiques KPI */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total prestations</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconLayersOff size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{types.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Types de prestations</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Valeur totale</Text>
                <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                  <IconCoin size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="cyan">{totalValeur.toLocaleString()} FCFA</Text>
              <Text size="xs" c="dimmed" mt={4}>Somme des valeurs par défaut</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Valeur moyenne</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconCoin size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">
                {types.length > 0 ? Math.round(totalValeur / types.length).toLocaleString() : 0} FCFA
              </Text>
              <Text size="xs" c="dimmed" mt={4}>Par type de prestation</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
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

          {/* Tableau des types de prestations */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {typesFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconLayersOff size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun type de prestation trouvé</Text>
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
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Valeur par défaut</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white', width: 120 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td fw={500}>
                          <Group gap="xs">
                            <Avatar size="sm" radius="xl" color="violet">
                              <IconTag size={12} />
                            </Avatar>
                            {t.nom}
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge color="green" variant="light" size="md">
                            {t.prix_par_defaut.toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
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

          {/* Modal Instructions */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Types de prestations"
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
                  <Text size="sm">1️⃣ Utilisez "Nouveau type" pour ajouter un type de prestation</Text>
                  <Text size="sm">2️⃣ La recherche filtre par nom de prestation</Text>
                  <Text size="sm">3️⃣ Cliquez sur ✏️ pour modifier un type</Text>
                  <Text size="sm">4️⃣ Cliquez sur 🗑️ pour supprimer un type</Text>
                  <Text size="sm">5️⃣ Les types supprimés sont désactivés, pas définitivement supprimés</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Exemples de prestations :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Couture</Badge>
                    <Text size="xs">Confection de vêtements sur mesure</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Retouche</Badge>
                    <Text size="xs">Retouches et modifications</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Brodage</Badge>
                    <Text size="xs">Brodages personnalisés</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">Ourlet</Badge>
                    <Text size="xs">Ourlets pour pantalons/jupes</Text>
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

export default ListeTypesPrestations;