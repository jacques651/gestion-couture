import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
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
  TextInput,
} from '@mantine/core';
import {
  IconTruck,
  IconPlus,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconCalendar,
  IconBox,
  IconCash,
  IconArrowDown,
  IconShoppingBag,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireSortieStock from './FormulaireSortieStock';

// ======================
// DB MODEL
// ======================
interface SortieStockDB {
  id: number;
  matiere_id: number;
  commande_id: number | null;
  date_sortie: string | null;
  quantite: number;
  cout_unitaire: number;
  observation: string;
}

// ======================
// VIEW MODEL
// ======================
interface SortieStockView extends SortieStockDB {
  matiere_nom: string;
  matiere_unite: string;
  commande_designation: string | null;
  total: number;
}

const ListeSortiesStock: React.FC = () => {
  const [sorties, setSorties] = useState<SortieStockView[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const chargerDonnees = async () => {
    setLoading(true);
    const db = await getDb();

    try {
      const data = await db.select<SortieStockView[]>(`
        SELECT 
          s.id,
          s.matiere_id,
          s.commande_id,
          s.date_sortie,
          s.quantite,
          s.cout_unitaire,
          s.observation,
          m.designation AS matiere_nom,
          m.unite AS matiere_unite,
          c.designation AS commande_designation,
          (s.quantite * s.cout_unitaire) AS total
        FROM sorties_stock s
        JOIN matieres m ON s.matiere_id = m.id
        LEFT JOIN commandes c ON s.commande_id = c.id
        WHERE m.est_supprime = 0
        ORDER BY s.date_sortie DESC
      `);

      setSorties(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const supprimerSortie = async (id: number) => {
    if (!confirm('Supprimer cette sortie ?')) return;
    const db = await getDb();
    try {
      await db.execute('DELETE FROM sorties_stock WHERE id = ?', [id]);
      chargerDonnees();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const handleReset = () => {
    setRecherche('');
    chargerDonnees();
    setCurrentPage(1);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const sortiesFiltrees = sorties.filter(s =>
    s.matiere_nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (s.commande_designation && s.commande_designation.toLowerCase().includes(recherche.toLowerCase()))
  );

  const totalPages = Math.ceil(sortiesFiltrees.length / itemsPerPage);
  const paginatedData = sortiesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalQuantite = sortiesFiltrees.reduce((sum, s) => sum + s.quantite, 0);
  const totalValeur = sortiesFiltrees.reduce((sum, s) => sum + s.total, 0);

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des sorties de stock...</Text>
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
                <IconTruck size={24} color="white" />
                <Title order={2} c="white">Sorties de stock</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des sorties de matières premières
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
                <IconBox size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Card withBorder radius="md" p="md" bg="orange.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Quantité totale sortie
              </Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconArrowDown size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">
              {totalQuantite.toLocaleString()} unités
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Valeur totale sortie
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconCash size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {totalValeur.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par matière ou commande..."
              leftSection={<IconSearch size={16} />}
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setCurrentPage(1);
              }}
              size="sm"
              style={{ width: 300 }}
            />
            <Group>
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={handleReset} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowForm(true)}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvelle sortie
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {sortiesFiltrees.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune sortie de stock trouvée
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Matière</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Commande liée</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Quantité</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar size={12} />
                          <Text size="sm">{formatDate(s.date_sortie)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td fw={500}>{s.matiere_nom}</Table.Td>
                      <Table.Td>
                        {s.commande_designation ? (
                          <Group gap={4}>
                            <IconShoppingBag size={12} />
                            <Text size="sm">{s.commande_designation}</Text>
                          </Group>
                        ) : (
                          <Text size="sm" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td ta="right">
                        <Badge color="orange" variant="light" size="sm">
                          {s.quantite} {s.matiere_unite}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right" fw={600} c="red">
                        {s.total.toLocaleString()} FCFA
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => supprimerSortie(s.id)}
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle sortie" pour enregistrer une utilisation de matière</Text>
            <Text size="sm">2. La recherche filtre par matière ou par commande associée</Text>
            <Text size="sm">3. Les sorties sont automatiquement déduites du stock global</Text>
            <Text size="sm">4. Cliquez sur 🗑️ pour supprimer une sortie (cela ajustera le stock)</Text>
            <Text size="sm">5. Le coût moyen est recalculé automatiquement</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>

        {/* FORMULAIRE D'AJOUT */}
        {showForm && (
          <FormulaireSortieStock
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              chargerDonnees();
            }}
          />
        )}
      </Stack>
    </Box>
  );
};

export default ListeSortiesStock;