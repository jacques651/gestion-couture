// src/components/matieres/ListeMatieres.tsx
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
import { notifications } from '@mantine/notifications';

interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  categorie_nom: string;  // Nom de la catégorie (via jointure)
  categorie_id: number | null;  // ID de la catégorie
  unite: string;
  prix_achat: number;
  stock_actuel: number;
  seuil_alerte: number;
  reference_fournisseur?: string;
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
      // Requête avec jointure pour récupérer le nom de la catégorie
      const result = await db.select<any[]>(`
        SELECT 
          m.id,
          m.code_matiere,
          m.designation,
          m.categorie_id,
          c.nom_categorie as categorie_nom,
          m.unite,
          m.prix_achat,
          m.stock_actuel,
          m.seuil_alerte,
          m.reference_fournisseur,
          m.est_supprime
        FROM matieres m
        LEFT JOIN categories_matieres c ON m.categorie_id = c.id
        WHERE m.est_supprime = 0 
        ORDER BY m.designation
      `);
      setMatieres(result);
    } catch (err: any) {
      console.error(err);
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors du chargement des matières',
        color: 'red',
      });
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

  const categories = [...new Set(matieres.map(m => m.categorie_nom).filter(Boolean))] as string[];

  const matieresFiltrees = matieres.filter(m => {
    const matchRecherche = m.designation.toLowerCase().includes(recherche.toLowerCase()) ||
      (m.code_matiere && m.code_matiere.toLowerCase().includes(recherche.toLowerCase()));
    const matchCategorie = !filtreCategorie || m.categorie_nom === filtreCategorie;
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

  const handleDelete = async (id: number, designation: string) => {
    if (confirm(`Supprimer la matière "${designation}" ?`)) {
      const db = await getDb();
      try {
        await db.execute(`UPDATE matieres SET est_supprime = 1 WHERE id = ?`, [id]);
        notifications.show({
          title: 'Succès',
          message: 'Matière supprimée',
          color: 'green',
        });
        chargerMatieres();
      } catch (error) {
        notifications.show({
          title: 'Erreur',
          message: 'Erreur lors de la suppression',
          color: 'red',
        });
      }
    }
  };

  const StockCell = ({ stock, seuil, unite }: { stock: number; seuil: number; unite: string }) => {
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
                <Title order={2} c="white">Matières premières</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des matières premières (tissus, fournitures, etc.)
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
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total matières</Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconPackage size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">{matieres.length}</Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="orange.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Catégories</Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconCategory size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">{categories.length}</Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Alertes stock</Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconAlertTriangle size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {matieres.filter(m => m.stock_actuel <= m.seuil_alerte).length}
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group>
              <TextInput
                placeholder="Rechercher par code ou désignation..."
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
                    <Table.Th style={{ color: 'white' }}>Code</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Catégorie</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Unité</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Prix achat</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Stock</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((m) => (
                    <Table.Tr key={m.id}>
                      <Table.Td>
                        <Badge variant="light" color="gray" size="sm">
                          {m.code_matiere}
                        </Badge>
                      </Table.Td>
                      <Table.Td fw={500}>{m.designation}</Table.Td>
                      <Table.Td>
                        {m.categorie_nom ? (
                          <Badge color="blue" variant="light" size="sm">
                            {m.categorie_nom}
                          </Badge>
                        ) : (
                          <Text size="sm" c="dimmed">—</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="cyan" variant="light" size="sm">
                          {m.unite}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {m.prix_achat?.toLocaleString()} FCFA
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <StockCell 
                          stock={m.stock_actuel} 
                          seuil={m.seuil_alerte} 
                          unite={m.unite} 
                        />
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
                              onClick={() => handleDelete(m.id, m.designation)}
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
            <Text size="sm">2. La recherche filtre par code ou désignation</Text>
            <Text size="sm">3. Le filtre par catégorie permet d'affiner l'affichage</Text>
            <Text size="sm">4. Le stock est mis à jour automatiquement lors des achats/ventes</Text>
            <Text size="sm">5. Une alerte s'affiche quand le stock est inférieur au seuil</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 2.0.0 - Architecture simplifiée
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default ListeMatieres;