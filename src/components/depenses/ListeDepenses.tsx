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

  const supprimer = async (id: number) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    const db = await getDb();
    await db.execute("DELETE FROM depenses WHERE id = ?", [id]);
    chargerDepenses();
  };

  const handleReset = () => {
    setRecherche('');
    chargerDepenses();
    setCurrentPage(1);
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

  // Calcul du total des dépenses
  const totalDepenses = depensesFiltres.reduce((sum, d) => sum + d.montant, 0);

  if (vueForm) {
    return (
      <FormulaireDepense
        depense={depenseEdition}
        onSuccess={() => {
          setVueForm(false);
          setDepenseEdition(null);
          chargerDepenses();
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
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des dépenses...</Text>
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
                <IconReceipt size={24} color="white" />
                <Title order={2} c="white">Dépenses</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des dépenses de l'atelier
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
                <IconReceipt size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Total des dépenses
            </Text>
            <ThemeIcon size={30} radius="md" color="red" variant="light">
              <IconMoneybag size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" c="red">
            {totalDepenses.toLocaleString()} FCFA
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            {depensesFiltres.length} dépense(s) enregistrée(s)
          </Text>
        </Card>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par catégorie ou désignation..."
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
                onClick={() => { setDepenseEdition(null); setVueForm(true); }}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvelle dépense
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU DES DÉPENSES */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {depensesFiltres.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune dépense trouvée
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Catégorie</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Montant</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Responsable</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((d) => (
                    <Table.Tr key={d.id}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar size={12} />
                          <Text size="sm">{new Date(d.date_depense).toLocaleDateString('fr-FR')}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light" size="sm">
                          {d.categorie}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={1}>
                          {d.designation}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Badge color="red" variant="light" size="sm">
                          {d.montant.toLocaleString()} FCFA
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconUser size={12} />
                          <Text size="sm">{d.responsable}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="orange"
                              onClick={() => { setDepenseEdition(d); setVueForm(true); }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => supprimer(d.id)}
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle dépense" pour ajouter une dépense</Text>
            <Text size="sm">2. La recherche filtre par catégorie ou désignation</Text>
            <Text size="sm">3. Cliquez sur l'icône ✏️ pour modifier une dépense</Text>
            <Text size="sm">4. Cliquez sur l'icône 🗑️ pour supprimer une dépense</Text>
            <Text size="sm">5. Le total des dépenses est affiché en haut</Text>
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

export default ListeDepenses;