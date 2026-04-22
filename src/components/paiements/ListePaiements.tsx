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
  Alert,
  NumberInput,
  Select,
  Pagination,
  Tooltip,
  Box,
  ThemeIcon,
  SimpleGrid,
  ScrollArea,
  Modal,
  Divider,
} from '@mantine/core';
import {
  IconCreditCard,
  IconCalendar,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconPlus,
  IconPrinter,
  IconCheck,
  IconX,
  IconCash,
  IconTransfer,
  IconDeviceMobile,
  IconReceipt,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulairePaiement from './FormulairePaiement';
import ModalRecu from "../paiements/ModalRecu";

interface Paiement {
  id: number;
  commande_id: number;
  date_paiement: string;
  montant: number;
  mode: string;
  observation: string;
  client_nom: string;
  commande_designation: string;
  client_telephone?: string;
  total_commande?: number;
  date_commande?: string;
}

const ListePaiements: React.FC = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ montant: 0, mode: 'cash', observation: '' });
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showRecu, setShowRecu] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'client' | 'commande' | 'montant'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const modesPaiement = [
    { value: 'cash', label: 'Espèces', icon: <IconCash size={14} /> },
    { value: 'mobile', label: 'Mobile Money', icon: <IconDeviceMobile size={14} /> },
    { value: 'virement', label: 'Virement', icon: <IconTransfer size={14} /> }
  ];

  const getModeLabel = (mode: string) => modesPaiement.find(m => m.value === mode)?.label || mode;
  const getModeIcon = (mode: string) => modesPaiement.find(m => m.value === mode)?.icon;

  const chargerPaiements = async () => {
    setLoading(true);
    setError('');
    const db = await getDb();
    try {
      const res = await db.select<Paiement[]>(`
        SELECT 
          p.id,
          p.commande_id,
          p.montant,
          p.date_paiement,
          p.mode,
          p.observation,
          cl.nom_prenom as client_nom,
          cl.telephone_id as client_telephone,
          c.designation as commande_designation,
          c.total as total_commande,
          c.date_commande
        FROM paiements_commandes p
        JOIN commandes c ON p.commande_id = c.id
        JOIN clients cl ON c.client_id = cl.telephone_id
        ORDER BY p.date_paiement DESC
      `);
      setPaiements(res);
    } catch (err) {
      setError('Erreur lors du chargement des paiements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setRecherche('');
    setSortBy('date');
    setSortOrder('desc');
    cancelEdit();
    await chargerPaiements();
    setCurrentPage(1);
  };

  useEffect(() => { chargerPaiements(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    setError('');
    const db = await getDb();
    try {
      await db.execute('DELETE FROM paiements_commandes WHERE id = ?', [id]);
      chargerPaiements();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const startEdit = (p: Paiement) => {
    setEditingId(p.id);
    setEditData({
      montant: p.montant,
      mode: p.mode || 'cash',
      observation: p.observation || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ montant: 0, mode: 'cash', observation: '' });
  };

  const saveEdit = async (id: number) => {
    if (editData.montant <= 0) {
      setError('Montant invalide');
      return;
    }
    if (!editData.mode) {
      setError('Veuillez sélectionner un mode de paiement');
      return;
    }
    setError('');
    const db = await getDb();
    try {
      await db.execute(
        `UPDATE paiements_commandes SET montant = ?, mode = ?, observation = ? WHERE id = ?`,
        [editData.montant, editData.mode, editData.observation, id]
      );
      cancelEdit();
      chargerPaiements();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
      console.error(err);
    }
  };

  const openRecu = (p: Paiement) => {
    setSelectedCommande({
      id: p.commande_id,
      client_nom: p.client_nom,
      client_telephone: p.client_telephone || '',
      designation: p.commande_designation,
      total: p.total_commande || 0,
      date_commande: p.date_commande || new Date().toISOString()
    });
    setShowRecu(true);
  };

  const handleSort = (column: 'date' | 'client' | 'commande' | 'montant') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Filtrer et trier les données
  const filteredData = paiements.filter(p =>
    p.client_nom.toLowerCase().includes(recherche.toLowerCase()) ||
    p.commande_designation.toLowerCase().includes(recherche.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'date') {
      comparison = new Date(a.date_paiement).getTime() - new Date(b.date_paiement).getTime();
    } else if (sortBy === 'client') {
      comparison = a.client_nom.localeCompare(b.client_nom);
    } else if (sortBy === 'commande') {
      comparison = a.commande_designation.localeCompare(b.commande_designation);
    } else if (sortBy === 'montant') {
      comparison = a.montant - b.montant;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFormSuccess = () => {
    setShowForm(false);
    chargerPaiements();
  };

  // Calcul des totaux pour les KPI
  const totalPaye = filteredData.reduce((sum, p) => sum + p.montant, 0);
  const totalCommandes = [...new Set(filteredData.map(p => p.commande_id))].length;

  if (showForm) {
    return <FormulairePaiement onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />;
  }

  if (showRecu && selectedCommande) {
    return <ModalRecu commande={selectedCommande} onClose={() => setShowRecu(false)} />;
  }

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des paiements...</Text>
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
                <IconCreditCard size={24} color="white" />
                <Title order={2} c="white">Historique des paiements</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion et suivi des encaissements
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
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total encaissé
              </Text>
              <ThemeIcon color="green" variant="light" size={30} radius="md">
                <IconCash size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalPaye.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Nombre de paiements
              </Text>
              <ThemeIcon color="blue" variant="light" size={30} radius="md">
                <IconCreditCard size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {filteredData.length}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Commandes concernées
              </Text>
              <ThemeIcon color="orange" variant="light" size={30} radius="md">
                <IconReceipt size={20} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">
              {totalCommandes}
            </Text>
          </Card>
        </SimpleGrid>

        {/* ERREUR */}
        {error && (
          <Alert icon={<IconX size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher client ou commande..."
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
                gradient={{ from: 'cyan', to: 'blue' }}
              >
                Nouveau paiement
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {filteredData.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucun paiement trouvé
            </Text>
          ) : (
            <>
              <ScrollArea style={{ maxHeight: 600 }}>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th 
                        style={{ cursor: 'pointer', color: 'white', width: 110 }}
                        onClick={() => handleSort('date')}
                      >
                        <Group gap={4}>
                          Date
                          {sortBy === 'date' && (
                            <Text size="xs" c="yellow">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </Text>
                          )}
                        </Group>
                      </Table.Th>
                      <Table.Th 
                        style={{ cursor: 'pointer', color: 'white' }}
                        onClick={() => handleSort('client')}
                      >
                        <Group gap={4}>
                          Client
                          {sortBy === 'client' && (
                            <Text size="xs" c="yellow">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </Text>
                          )}
                        </Group>
                      </Table.Th>
                      <Table.Th 
                        style={{ cursor: 'pointer', color: 'white' }}
                        onClick={() => handleSort('commande')}
                      >
                        <Group gap={4}>
                          Commande
                          {sortBy === 'commande' && (
                            <Text size="xs" c="yellow">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </Text>
                          )}
                        </Group>
                      </Table.Th>
                      <Table.Th 
                        style={{ cursor: 'pointer', color: 'white', width: 120, textAlign: 'right' }}
                        onClick={() => handleSort('montant')}
                      >
                        <Group gap={4} justify="flex-end">
                          Montant
                          {sortBy === 'montant' && (
                            <Text size="xs" c="yellow">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </Text>
                          )}
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ color: 'white', width: 100 }}>Mode</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Observation</Table.Th>
                      <Table.Th style={{ color: 'white', width: 100, textAlign: 'center' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            <IconCalendar size={12} />
                            <Text size="sm">{new Date(p.date_paiement).toLocaleDateString('fr-FR')}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td fw={500}>{p.client_nom}</Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {p.commande_designation}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge color="green" variant="light" size="sm">
                            {p.montant.toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {getModeIcon(p.mode)}
                            <Text size="sm">{getModeLabel(p.mode)}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {p.observation || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {editingId === p.id ? (
                            <Group gap={4} justify="center">
                              <NumberInput
                                value={editData.montant}
                                onChange={(val) => setEditData({ ...editData, montant: Number(val) })}
                                size="xs"
                                style={{ width: 90 }}
                                min={0}
                                placeholder="Montant"
                              />
                              <Select
                                value={editData.mode}
                                onChange={(val) => setEditData({ ...editData, mode: val || 'cash' })}
                                data={modesPaiement}
                                size="xs"
                                style={{ width: 100 }}
                              />
                              <ActionIcon size="sm" color="green" onClick={() => saveEdit(p.id)}>
                                <IconCheck size={14} />
                              </ActionIcon>
                              <ActionIcon size="sm" color="red" onClick={cancelEdit}>
                                <IconX size={14} />
                              </ActionIcon>
                            </Group>
                          ) : (
                            <Group gap={6} justify="center">
                              <Tooltip label="Modifier">
                                <ActionIcon size="sm" variant="subtle" color="orange" onClick={() => startEdit(p)}>
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Reçu">
                                <ActionIcon size="sm" variant="subtle" color="blue" onClick={() => openRecu(p)}>
                                  <IconPrinter size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Supprimer">
                                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(p.id)}>
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

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
            <Text size="sm">1. Utilisez le bouton "Nouveau paiement" pour enregistrer un encaissement</Text>
            <Text size="sm">2. La recherche filtre par client ou par commande</Text>
            <Text size="sm">3. Cliquez sur l'icône 📄 pour générer un reçu</Text>
            <Text size="sm">4. Les paiements peuvent être modifiés ou supprimés si nécessaire</Text>
            <Text size="sm">5. Cliquez sur les en-têtes pour trier le tableau</Text>
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

export default ListePaiements;