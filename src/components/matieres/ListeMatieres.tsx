import React, { useEffect, useState, useCallback } from 'react';
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
  Select,
} from '@mantine/core';
import {
  IconPackage,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconAlertTriangle,
  IconCategory,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireMatiere from './FormulaireMatiere';

interface Matiere {
  id: number;
  designation: string;
  categorie: string;
  unite: string;
  seuil_alerte: number;
  est_supprime: number;
}

const ListeMatieres: React.FC = () => {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vueForm, setVueForm] = useState(false);
  const [matiereEdition, setMatiereEdition] = useState<Matiere | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const chargerMatieres = useCallback(async () => {
    setLoading(true);
    const db = await getDb();
    try {
      const result = await db.select<Matiere[]>(
        "SELECT * FROM matieres WHERE est_supprime = 0 ORDER BY designation"
      );
      setMatieres(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    chargerMatieres();
  }, [chargerMatieres]);

  const handleReset = () => {
    setRecherche('');
    setFiltreCategorie(null);
    chargerMatieres();
    setCurrentPage(1);
  };

  const getStockMatiere = async (matiereId: number): Promise<number> => {
    const db = await getDb();
    const entrees = await db.select<{ total: number }[]>(
      "SELECT COALESCE(SUM(quantite), 0) as total FROM entrees_stock WHERE matiere_id = ?",
      [matiereId]
    );
    const sorties = await db.select<{ total: number }[]>(
      "SELECT COALESCE(SUM(quantite), 0) as total FROM sorties_stock WHERE matiere_id = ?",
      [matiereId]
    );
    return (entrees[0]?.total || 0) - (sorties[0]?.total || 0);
  };

  const categories = [...new Set(matieres.map(m => m.categorie).filter(Boolean))] as string[];

  const matieresFiltrees = matieres.filter(m => {
    const matchRecherche = m.designation.toLowerCase().includes(recherche.toLowerCase()) ||
      (m.categorie && m.categorie.toLowerCase().includes(recherche.toLowerCase()));
    const matchCategorie = !filtreCategorie || m.categorie === filtreCategorie;
    return matchRecherche && matchCategorie;
  });

  const totalPages = Math.ceil(matieresFiltrees.length / itemsPerPage);
  const paginatedData = matieresFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categoryOptions = [
    { value: '', label: 'Toutes catégories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  // StockCell component
  const StockCell = ({ matiereId, seuil, unite }: { matiereId: number; seuil: number; unite: string }) => {
    const [stock, setStock] = useState<number | null>(null);
    useEffect(() => {
      getStockMatiere(matiereId).then(setStock);
    }, [matiereId]);
    if (stock === null) return <Text size="sm" c="dimmed">...</Text>;
    const enAlerte = stock <= seuil;
    return (
      <Group gap={4}>
        <Badge color={enAlerte ? 'red' : 'green'} variant="light" size="sm">
          {stock} {unite}
        </Badge>
        {enAlerte && <IconAlertTriangle size={14} color="red" />}
      </Group>
    );
  };

  if (vueForm) {
    return (
      <FormulaireMatiere
        matiere={matiereEdition || undefined}
        onSuccess={() => {
          setVueForm(false);
          setMatiereEdition(null);
          chargerMatieres();
        }}
        onCancel={() => {
          setVueForm(false);
          setMatiereEdition(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des matières...</Text>
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
                <Title order={2} c="white">Matières / Catalogue</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des matières premières
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
                <IconPackage size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total matières
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconPackage size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {matieres.length}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="orange.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Catégories
              </Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconCategory size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">
              {categories.length}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Stock bas
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconAlertTriangle size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {matieres.filter(m => m.seuil_alerte > 0).length}
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group>
              <TextInput
                placeholder="Rechercher par désignation ou catégorie..."
                leftSection={<IconSearch size={16} />}
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setCurrentPage(1);
                }}
                size="sm"
                style={{ width: 300 }}
              />
              <Select
                placeholder="Filtrer par catégorie"
                data={categoryOptions}
                value={filtreCategorie}
                onChange={setFiltreCategorie}
                size="sm"
                style={{ width: 180 }}
                clearable
              />
            </Group>
            <Group>
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={handleReset} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setMatiereEdition(null);
                  setVueForm(true);
                }}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvelle matière
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {matieresFiltrees.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune matière trouvée
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Catégorie</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Unité</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Stock</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Seuil alerte</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((m) => (
                    <Table.Tr key={m.id}>
                      <Table.Td fw={500}>{m.designation}</Table.Td>
                      <Table.Td>
                        {m.categorie ? (
                          <Badge color="gray" variant="light" size="sm">
                            {m.categorie}
                          </Badge>
                        ) : (
                          <Text size="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light" size="sm">
                          {m.unite}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <StockCell matiereId={m.id} seuil={m.seuil_alerte} unite={m.unite} />
                      </Table.Td>
                      <Table.Td>
                        <Badge color="orange" variant="light" size="sm">
                          {m.seuil_alerte} {m.unite}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="orange"
                              onClick={() => {
                                setMatiereEdition(m);
                                setVueForm(true);
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => {
                                if (confirm('Supprimer cette matière ?')) {
                                  const db = getDb();
                                  db.then(async (dbInstance) => {
                                    await dbInstance.execute("UPDATE matieres SET est_supprime = 1 WHERE id = ?", [m.id]);
                                    chargerMatieres();
                                  });
                                }
                              }}
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle matière" pour ajouter une matière</Text>
            <Text size="sm">2. La recherche filtre par désignation ou catégorie</Text>
            <Text size="sm">3. Le filtre par catégorie permet d'affiner l'affichage</Text>
            <Text size="sm">4. Le stock est calculé automatiquement (entrées - sorties)</Text>
            <Text size="sm">5. Une alerte s'affiche quand le stock est inférieur au seuil</Text>
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

export default ListeMatieres;