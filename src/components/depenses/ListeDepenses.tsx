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
  Pagination,
  Tooltip,
  Box,
  Modal,
  Divider,
  ThemeIcon,
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
  SimpleGrid,
  Progress,
} from '@mantine/core';
import {
  IconReceipt,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconMoneybag,
  IconUser,
  IconCalendar,
  IconCheck,
  IconCategory,
  IconTrendingDown,
  IconChartPie,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireDepense from './FormulaireDepense';

interface Depense {
  id: number;
  categorie: string;
  designation: string;
  montant: number;
  responsable: string;
  date_depense: string;
  observation: string;
}

const ListeDepenses: React.FC = () => {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [depenseEdition, setDepenseEdition] = useState<Depense | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  const chargerDepenses = async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const result = await db.select<Depense[]>(
        "SELECT * FROM depenses ORDER BY date_depense DESC"
      );
      setDepenses(result as unknown as Depense[]);
    } catch (error) {
      console.error("Erreur lors du chargement des dépenses :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDepenses();
  }, []);

  const supprimer = async (id: number, designation: string) => {
    if (!window.confirm(`Supprimer la dépense "${designation}" ?`)) return;
    const db = await getDb();
    await db.execute("DELETE FROM depenses WHERE id = ?", [id]);
    await chargerDepenses();
    setSuccessMessage(`Dépense "${designation}" supprimée avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setRecherche('');
    chargerDepenses();
    setCurrentPage(1);
    setSuccessMessage('Liste actualisée');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const depensesFiltres = depenses.filter(d =>
    (d.designation?.toLowerCase() || "").includes(recherche.toLowerCase()) ||
    (d.categorie?.toLowerCase() || "").includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(depensesFiltres.length / itemsPerPage);
  const paginatedData = depensesFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalDepenses = depensesFiltres.reduce((sum, d) => sum + d.montant, 0);
  const depensesParCategorie = depensesFiltres.reduce((acc, d) => {
    acc[d.categorie] = (acc[d.categorie] || 0) + d.montant;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategorie = Object.entries(depensesParCategorie).sort((a, b) => b[1] - a[1])[0];

  if (vueForm) {
    return (
      <FormulaireDepense
        depense={depenseEdition}
        onSuccess={() => {
          setVueForm(false);
          setDepenseEdition(null);
          chargerDepenses();
          setSuccessMessage(depenseEdition ? 'Dépense modifiée avec succès' : 'Dépense ajoutée avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
        onCancel={() => {
          setVueForm(false);
          setDepenseEdition(null);
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
            <IconReceipt size={40} stroke={1.5} />
            <Text>Chargement des dépenses...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
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
                  <IconReceipt size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Gestion des dépenses</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gestion des dépenses de l'atelier
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {depensesFiltres.length} dépense{depensesFiltres.length > 1 ? 's' : ''}
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
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff5f5' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total dépenses</Text>
                <ThemeIcon size="lg" radius="md" color="red" variant="light">
                  <IconMoneybag size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="red">{totalDepenses.toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="red" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Montant total engagé</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Nombre de dépenses</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconReceipt size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{depensesFiltres.length}</Text>
              <Progress value={100} size="sm" radius="xl" color="blue" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Transactions enregistrées</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Catégories</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconCategory size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{Object.keys(depensesParCategorie).length}</Text>
              <Progress value={100} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Types de dépenses</Text>
            </Paper>

            {topCategorie && (
              <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Catégorie principale</Text>
                  <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                    <IconChartPie size={18} />
                  </ThemeIcon>
                </Group>
                <Text fw={700} size="xl" c="cyan">{topCategorie[0]}</Text>
                <Text size="xs" c="dimmed" mt={4}>{topCategorie[1].toLocaleString()} FCFA</Text>
              </Paper>
            )}
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher par catégorie ou désignation..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 320 }}
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
                  onClick={() => { setDepenseEdition(null); setVueForm(true); }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouvelle dépense
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des dépenses amélioré */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {depensesFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconReceipt size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucune dépense trouvée</Text>
                <Button variant="light" onClick={() => { setDepenseEdition(null); setVueForm(true); }}>
                  Ajouter une dépense
                </Button>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Catégorie</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 130 }}>Montant</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Responsable</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center', width: 100 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((d) => (
                      <Table.Tr key={d.id}>
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            <IconCalendar size={12} color="#1b365d" />
                            <Text size="sm">{new Date(d.date_depense).toLocaleDateString('fr-FR')}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="light" size="md">
                            {d.categorie}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {d.designation}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge color="red" variant="light" size="md">
                            {d.montant.toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconUser size={12} color="#1b365d" />
                            <Text size="sm">{d.responsable}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <Tooltip label="Modifier">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="orange"
                                onClick={() => { setDepenseEdition(d); setVueForm(true); }}
                              >
                                <IconEdit size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Supprimer">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => supprimer(d.id, d.designation)}
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
            title="📋 Gestion des dépenses"
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
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouvelle dépense" pour ajouter une dépense</Text>
                  <Text size="sm">2️⃣ La recherche filtre par catégorie ou désignation</Text>
                  <Text size="sm">3️⃣ Cliquez sur l'icône ✏️ pour modifier une dépense</Text>
                  <Text size="sm">4️⃣ Cliquez sur l'icône 🗑️ pour supprimer une dépense</Text>
                  <Text size="sm">5️⃣ Le total des dépenses est affiché en haut avec les statistiques</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Conseils :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCategory size={16} color="#e65100" />
                    <Text size="sm">Catégorisez vos dépenses pour mieux les analyser</Text>
                  </Group>
                  <Group gap="xs">
                    <IconUser size={16} color="#e65100" />
                    <Text size="sm">Indiquez toujours le responsable pour le suivi</Text>
                  </Group>
                  <Group gap="xs">
                    <IconTrendingDown size={16} color="#e65100" />
                    <Text size="sm">Surveillez les dépenses récurrentes</Text>
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

export default ListeDepenses;