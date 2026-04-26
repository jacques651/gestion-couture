// src/components/stock/MouvementsStock.tsx
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
  IconBox,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconCalendar,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface MouvementStock {
  id: number;
  type_mouvement: 'entree' | 'sortie';
  matiere_id: number | null;
  tenue_id: number | null;
  designation: string;
  quantite: number;
  cout_unitaire: number;
  date_mouvement: string;
  motif: string;
}

const MouvementsStock: React.FC = () => {
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const chargerMouvements = async () => {
    setLoading(true);
    const db = await getDb();
    try {
      const result = await db.select<MouvementStock[]>(`
        SELECT 
          m.*,
          COALESCE(mat.designation, tenue.designation) as designation
        FROM mouvements_stock m
        LEFT JOIN matieres mat ON m.matiere_id = mat.id
        LEFT JOIN gammes_tenues tenue ON m.tenue_id = tenue.id
        ORDER BY m.date_mouvement DESC
      `);
      setMouvements(result || []);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerMouvements();
  }, []);

  const handleReset = () => {
    setRecherche('');
    chargerMouvements();
    setCurrentPage(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getTypeBadge = (type: string) => {
    if (type === 'entree') {
      return <Badge color="green" variant="light" leftSection={<IconArrowUp size={12} />}>Entrée</Badge>;
    }
    return <Badge color="orange" variant="light" leftSection={<IconArrowDown size={12} />}>Sortie</Badge>;
  };

  const mouvementsFiltres = mouvements.filter(m =>
    m.designation?.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(mouvementsFiltres.length / itemsPerPage);
  const paginatedData = mouvementsFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalEntrees = mouvementsFiltres.filter(m => m.type_mouvement === 'entree').reduce((sum, m) => sum + m.quantite, 0);
  const totalSorties = mouvementsFiltres.filter(m => m.type_mouvement === 'sortie').reduce((sum, m) => sum + m.quantite, 0);

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des mouvements...</Text>
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
                <IconBox size={24} color="white" />
                <Title order={2} c="white">Mouvements de stock</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Historique des entrées et sorties de stock
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
          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total entrées</Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconArrowUp size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">{totalEntrees} unités</Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="orange.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total sorties</Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconArrowDown size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">{totalSorties} unités</Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par produit..."
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
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {mouvementsFiltres.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucun mouvement de stock trouvé
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white', width: 90 }}>Type</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Produit</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Quantité</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Motif</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((m) => (
                    <Table.Tr key={m.id}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar size={12} />
                          <Text size="sm">{formatDate(m.date_mouvement)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{getTypeBadge(m.type_mouvement)}</Table.Td>
                      <Table.Td fw={500}>{m.designation || '-'}</Table.Td>
                      <Table.Td ta="right">
                        <Badge color={m.type_mouvement === 'entree' ? 'green' : 'orange'} variant="light" size="sm">
                          {m.quantite}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{m.motif || '-'}</Text>
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
            header: { backgroundColor: '#1b365d', padding: '16px 20px' },
            title: { color: 'white', fontWeight: 600 },
            body: { padding: '20px' },
          }}
        >
          <Stack gap="md">
            <Text size="sm">1. Les mouvements de stock sont automatiquement enregistrés</Text>
            <Text size="sm">2. Une entrée correspond à un achat de matière première</Text>
            <Text size="sm">3. Une sortie correspond à une vente ou une utilisation</Text>
            <Text size="sm">4. La recherche filtre par produit</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">Version 2.0.0 - Architecture simplifiée</Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default MouvementsStock;