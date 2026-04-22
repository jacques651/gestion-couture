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

  const supprimerType = async (id: number) => {
    if (!window.confirm('Supprimer ce type de mesure ?')) return;
    const db = await getDb();
    await db.execute("UPDATE types_mesures SET est_active = 0 WHERE id = ?", [id]);
    chargerTypes();
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
    chargerTypes();
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

  if (vueForm) {
    return (
      <FormulaireTypeMesure
        type={typeEdition || undefined}
        onSuccess={() => {
          setVueForm(false);
          setTypeEdition(null);
          chargerTypes();
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
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des types de mesures...</Text>
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
                <IconRulerMeasure size={24} color="white" />
                <Title order={2} c="white">Types de mesures</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Configuration des types de mesures pour les clients
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
                <IconRulerMeasure size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Types de mesures actifs
            </Text>
            <ThemeIcon size={30} radius="md" color="blue" variant="light">
              <IconRulerMeasure size={18} />
            </ThemeIcon>
          </Group>
          <Text fw={700} size="xl" c="blue">
            {typesFiltres.length}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            types configurés
          </Text>
        </Card>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher un type de mesure..."
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
                onClick={() => setVueForm(true)}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouveau type
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {typesFiltres.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucun type de mesure trouvé
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Unité</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 100 }}>Ordre</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center', width: 150 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td fw={500}>{t.nom}</Table.Td>
                      <Table.Td>
                        <Badge color="gray" variant="light" size="sm">
                          {t.unite || 'cm'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Badge color="blue" variant="light" size="sm">
                          {t.ordre_affichage}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Monter">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={() => changerOrdre(t.id, t.ordre_affichage, 'haut')}
                            >
                              <IconArrowUp size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Descendre">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="blue"
                              onClick={() => changerOrdre(t.id, t.ordre_affichage, 'bas')}
                            >
                              <IconArrowDown size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Modifier">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="orange"
                              onClick={() => {
                                setTypeEdition(t);
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
                              onClick={() => supprimerType(t.id)}
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
            <Text size="sm">1. Utilisez le bouton "Nouveau type" pour ajouter un type de mesure</Text>
            <Text size="sm">2. Les flèches ↑ ↓ permettent de réorganiser l'ordre d'affichage</Text>
            <Text size="sm">3. La recherche filtre par nom de mesure</Text>
            <Text size="sm">4. Cliquez sur ✏️ pour modifier un type existant</Text>
            <Text size="sm">5. Cliquez sur 🗑️ pour supprimer un type (désactivation)</Text>
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

export default ConfigurationMesures;