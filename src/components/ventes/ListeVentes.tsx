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
  Select,
} from '@mantine/core';
import {
  IconShoppingBag,
  IconPlus,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconCalendar,
  IconPackage,
  IconShirt,
  IconCash,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireVente from './FormulaireVente';

interface Vente {
  id: number;
  type: 'tenue' | 'tissu';
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  date_vente: string;
  observation: string;
}

const ListeVentes: React.FC = () => {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [typeFiltre, setTypeFiltre] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vueForm, setVueForm] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const chargerVentes = async () => {
    setLoading(true);
    const db = await getDb();
    const result = await db.select<Vente>(
      "SELECT * FROM ventes ORDER BY date_vente DESC"
    );
    setVentes(Array.isArray(result) ? result as Vente[] : []);
    setLoading(false);
  };

  useEffect(() => {
    chargerVentes();
  }, []);

  const supprimerVente = async (id: number) => {
    if (!window.confirm("Supprimer cette vente ?")) return;
    const db = await getDb();
    await db.execute("DELETE FROM ventes WHERE id = ?", [id]);
    chargerVentes();
  };

  const handleReset = () => {
    setRecherche('');
    setTypeFiltre(null);
    chargerVentes();
    setCurrentPage(1);
  };

  const ventesFiltrees = ventes.filter(v => {
    const matchRecherche = v.designation.toLowerCase().includes(recherche.toLowerCase());
    const matchType = typeFiltre === null || typeFiltre === 'tous' || v.type === typeFiltre;
    return matchRecherche && matchType;
  });

  const totalPages = Math.ceil(ventesFiltrees.length / itemsPerPage);
  const paginatedData = ventesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalVentes = ventesFiltrees.reduce((sum, v) => sum + v.total, 0);
  const totalTenues = ventesFiltrees.filter(v => v.type === 'tenue').reduce((sum, v) => sum + v.total, 0);
  const totalTissus = ventesFiltrees.filter(v => v.type === 'tissu').reduce((sum, v) => sum + v.total, 0);

  const typeOptions = [
    { value: 'tous', label: 'Tous' },
    { value: 'tenue', label: '👕 Tenues' },
    { value: 'tissu', label: '📦 Tissus' },
  ];

  if (vueForm) {
    return (
      <FormulaireVente
        onSuccess={() => {
          setVueForm(false);
          chargerVentes();
        }}
        onCancel={() => setVueForm(false)}
      />
    );
  }

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des ventes...</Text>
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
                <IconShoppingBag size={24} color="white" />
                <Title order={2} c="white">Ventes</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des ventes de tenues et tissus
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
                <IconShoppingBag size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" p="md" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Chiffre d'affaires
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconCash size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalVentes.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="purple.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Tenues vendues
              </Text>
              <ThemeIcon size={30} radius="md" color="purple" variant="light">
                <IconShirt size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="purple">
              {totalTenues.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Tissus vendus
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconPackage size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalTissus.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group>
              <TextInput
                placeholder="Rechercher par désignation..."
                leftSection={<IconSearch size={16} />}
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setCurrentPage(1);
                }}
                size="sm"
                style={{ width: 250 }}
              />
              <Select
                placeholder="Filtrer par type"
                data={typeOptions}
                value={typeFiltre}
                onChange={setTypeFiltre}
                size="sm"
                style={{ width: 130 }}
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
                onClick={() => setVueForm(true)}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvelle vente
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {ventesFiltrees.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune vente trouvée
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white', width: 100 }}>Type</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 80 }}>Qté</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Prix unit.</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Total</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 80 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((v) => (
                    <Table.Tr key={v.id}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar size={12} />
                          <Text size="sm">{new Date(v.date_vente).toLocaleDateString('fr-FR')}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={v.type === 'tenue' ? 'purple' : 'green'}
                          variant="light"
                          size="sm"
                          leftSection={v.type === 'tenue' ? <IconShirt size={12} /> : <IconPackage size={12} />}
                        >
                          {v.type === 'tenue' ? 'Tenue' : 'Tissu'}
                        </Badge>
                      </Table.Td>
                      <Table.Td fw={500}>{v.designation}</Table.Td>
                      <Table.Td ta="right">{v.quantite}</Table.Td>
                      <Table.Td ta="right">{v.prix_unitaire.toLocaleString()} FCFA</Table.Td>
                      <Table.Td ta="right" fw={600} c="blue">
                        {v.total.toLocaleString()} FCFA
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => supprimerVente(v.id)}
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle vente" pour enregistrer une vente</Text>
            <Text size="sm">2. La recherche filtre par désignation</Text>
            <Text size="sm">3. Le filtre par type permet de voir les tenues ou les tissus</Text>
            <Text size="sm">4. Les ventes sont automatiquement comptabilisées dans le chiffre d'affaires</Text>
            <Text size="sm">5. Cliquez sur 🗑️ pour supprimer une vente</Text>
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

export default ListeVentes;