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
  IconRulerMeasure,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconCheck,
  IconDimensions,
} from '@tabler/icons-react';
import {
  apiGet,
  apiDelete} from '../../services/api';
import FormulaireTypeMesure from './FormulaireTypeMesure';
import { journaliserAction } from '../../services/journal';

interface TypeMesure {
  id: number;
  nom: string;
  unite: string;
  est_active: number;
}

const ConfigurationMesures: React.FC = () => {
  const [types, setTypes] = useState<TypeMesure[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [typeEdition, setTypeEdition] = useState<TypeMesure | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  const chargerTypes = async () => {
    try {
      setLoading(true);
      const result = await apiGet("/types-mesures");
      setTypes(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("❌ Erreur chargement types:", error);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const supprimerType = async (id: number, nom: string) => {
    if (!globalThis.confirm(`Supprimer le type de mesure "${nom}" ?`)) return;
    
    try {
      await apiDelete(`/types-mesures/${id}`);
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'DELETE',
        table: 'types_mesures',
        idEnregistrement: id,
        details: `Suppression type mesure : ${nom}`
      });
      await chargerTypes();
      setSuccessMessage(`Type "${nom}" supprimé avec succès`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      setSuccessMessage(`Erreur lors de la suppression`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleReset = async () => {
    setRecherche('');
    await chargerTypes();
    setCurrentPage(1);
  };

  useEffect(() => {
    chargerTypes();
  }, []);

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
          setSuccessMessage(typeEdition ? 'Type modifié avec succès' : 'Type créé avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
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
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconRulerMeasure size={40} stroke={1.5} />
            <Text>Chargement des types de mesures...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
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

          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconRulerMeasure size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Configuration des mesures</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gérez les types de mesures pour les clients
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {typesFiltres.length} type{typesFiltres.length > 1 ? 's' : ''} de mesure
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

          <Card withBorder radius="lg" shadow="sm" p="sm">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher un type de mesure..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="sm"
                  radius="md"
                  style={{ width: 260 }}
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="md" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setTypeEdition(null);
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                  size="sm"
                >
                  Nouveau type
                </Button>
              </Group>
            </Group>
          </Card>

          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {typesFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconRulerMeasure size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun type de mesure trouvé</Text>
                <Button variant="light" onClick={() => { setTypeEdition(null); setVueForm(true); }}>
                  Ajouter un type
                </Button>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', padding: '8px 12px' }}>Nom</Table.Th>
                      <Table.Th style={{ color: 'white', padding: '8px 12px' }}>Unité</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white', padding: '8px 12px', width: 100 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td fw={500} style={{ padding: '6px 12px' }}>
                          <Group gap="xs" wrap="nowrap">
                            <Avatar size={24} radius="xl" color="violet">
                              <IconDimensions size={12} />
                            </Avatar>
                            <Text size="sm">{t.nom}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ padding: '6px 12px' }}>
                          <Badge color="gray" variant="light" size="sm">
                            {t.unite || 'cm'}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ padding: '6px 12px' }}>
                          <Group gap={4} justify="center" wrap="nowrap">
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
                                onClick={() => supprimerType(t.id, t.nom)}
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
                  <Group justify="center" p="sm">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      color="#1b365d"
                      size="sm"
                      radius="md"
                    />
                  </Group>
                )}
              </>
            )}
          </Card>

          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Configuration des mesures"
            size="md"
            centered
            radius="lg"
          >
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm" mb="md">📌 Fonctionnalités :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouveau type" pour ajouter un type de mesure</Text>
                  <Text size="sm">2️⃣ La recherche filtre par nom de mesure</Text>
                  <Text size="sm">3️⃣ Cliquez sur ✏️ pour modifier un type existant</Text>
                  <Text size="sm">4️⃣ Cliquez sur 🗑️ pour supprimer un type</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Exemples de mesures :</Text>
                <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                  <Group gap="xs"><Badge color="blue" size="sm">Epaule</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Dos</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Poitrine</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Taille</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Bassin</Badge><Text size="xs">cm</Text></Group>
                  <Group gap="xs"><Badge color="blue" size="sm">Longueur manche</Badge><Text size="xs">cm</Text></Group>
                </SimpleGrid>
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

export default ConfigurationMesures;