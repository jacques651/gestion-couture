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
  IconPackage,
  IconPlus,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconCalendar,
  IconBox,
  IconCash,
  IconArrowUp,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireEntreeStock from './FormulaireEntreeStock';

// ======================
// DB MODEL
// ======================
interface EntreeStockDB {
  id: number;
  matiere_id: number;
  date_entree: string | null;
  quantite: number;
  cout_unitaire: number;
  observation: string;
}

// ======================
// VIEW MODEL
// ======================
interface EntreeStockView extends EntreeStockDB {
  matiere_nom: string;
  matiere_unite: string;
  total: number;
}

const ListeEntreesStock: React.FC = () => {
  const [entrees, setEntrees] = useState<EntreeStockView[]>([]);
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
      const data = await db.select<EntreeStockView[]>(`
        SELECT 
          e.id,
          e.matiere_id,
          e.date_entree,
          e.quantite,
          e.cout_unitaire,
          e.observation,
          m.designation AS matiere_nom,
          m.unite AS matiere_unite,
          (e.quantite * e.cout_unitaire) AS total
        FROM entrees_stock e
        JOIN matieres m ON e.matiere_id = m.id
        WHERE m.est_supprime = 0
        ORDER BY e.date_entree DESC
      `);

      setEntrees(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const supprimerEntree = async (id: number) => {
    if (!confirm('Supprimer cette entrée ?')) return;
    const db = await getDb();
    try {
      await db.execute('DELETE FROM entrees_stock WHERE id = ?', [id]);
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

  const entreesFiltrees = entrees.filter(e =>
    e.matiere_nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(entreesFiltrees.length / itemsPerPage);
  const paginatedData = entreesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalQuantite = entreesFiltrees.reduce((sum, e) => sum + e.quantite, 0);
  const totalValeur = entreesFiltrees.reduce((sum, e) => sum + e.total, 0);

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des entrées de stock...</Text>
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
                <IconPackage size={24} color="white" />
                <Title order={2} c="white">Entrées de stock</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des entrées de matières premières
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
          <Card withBorder radius="md" p="md" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Quantité totale entrée
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconArrowUp size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalQuantite.toLocaleString()} unités
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Valeur totale
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconCash size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalValeur.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par matière..."
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
                Nouvelle entrée
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {entreesFiltrees.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune entrée de stock trouvée
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Matière</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Quantité</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Coût unitaire</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((e) => (
                    <Table.Tr key={e.id}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar size={12} />
                          <Text size="sm">{formatDate(e.date_entree)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td fw={500}>{e.matiere_nom}</Table.Td>
                      <Table.Td ta="right">
                        <Badge color="blue" variant="light" size="sm">
                          {e.quantite} {e.matiere_unite}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        {e.cout_unitaire.toLocaleString()} FCFA
                      </Table.Td>
                      <Table.Td ta="right" fw={600} c="green">
                        {e.total.toLocaleString()} FCFA
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => supprimerEntree(e.id)}
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle entrée" pour ajouter un approvisionnement</Text>
            <Text size="sm">2. La recherche filtre par matière première</Text>
            <Text size="sm">3. Les entrées sont automatiquement ajoutées au stock global</Text>
            <Text size="sm">4. Cliquez sur 🗑️ pour supprimer une entrée (cela ajustera le stock)</Text>
            <Text size="sm">5. Le coût moyen est recalculé automatiquement</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>

        {/* FORMULAIRE D'AJOUT */}
        {showForm && (
          <FormulaireEntreeStock
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

export default ListeEntreesStock;