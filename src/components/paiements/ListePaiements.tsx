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
  Container,
  Avatar,
  Paper,
  Center,
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
  IconInfoCircle,
  IconWallet,
  IconChartBar,
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
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconCreditCard size={40} stroke={1.5} />
            <Text>Chargement des paiements...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconCreditCard size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Historique des paiements</Title>
                  <Text c="gray.3" size="sm">Gestion et suivi des encaissements clients</Text>
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

          {/* Statistiques KPI modernisées */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total encaissé</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconWallet size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalPaye.toLocaleString()} FCFA</Text>
              <Text size="xs" c="dimmed" mt={4}>Tous modes de paiement confondus</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Transactions</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconCreditCard size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{filteredData.length}</Text>
              <Text size="xs" c="dimmed" mt={4}>Nombre total de paiements</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Commandes concernées</Text>
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <IconChartBar size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">{totalCommandes}</Text>
              <Text size="xs" c="dimmed" mt={4}>Commandes avec au moins un paiement</Text>
            </Paper>
          </SimpleGrid>

          {/* Erreur */}
          {error && (
            <Alert icon={<IconX size={16} />} color="red" variant="filled" radius="md">
              {error}
            </Alert>
          )}

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm">
            <Group justify="space-between">
              <TextInput
                placeholder="Rechercher client ou commande..."
                leftSection={<IconSearch size={16} />}
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setCurrentPage(1);
                }}
                size="md"
                radius="md"
                style={{ flex: 1, maxWidth: 350 }}
              />
              <Group>
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setShowForm(true)}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouveau paiement
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des paiements */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {filteredData.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconCreditCard size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun paiement trouvé</Text>
                <Button variant="light" onClick={() => setShowForm(true)}>Enregistrer un premier paiement</Button>
              </Stack>
            ) : (
              <>
                <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th style={{ cursor: 'pointer', color: 'white', width: 110 }} onClick={() => handleSort('date')}>
                          <Group gap={4}>Date {sortBy === 'date' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                        </Table.Th>
                        <Table.Th style={{ cursor: 'pointer', color: 'white' }} onClick={() => handleSort('client')}>
                          <Group gap={4}>Client {sortBy === 'client' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                        </Table.Th>
                        <Table.Th style={{ cursor: 'pointer', color: 'white' }} onClick={() => handleSort('commande')}>
                          <Group gap={4}>Commande {sortBy === 'commande' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                        </Table.Th>
                        <Table.Th style={{ cursor: 'pointer', color: 'white', width: 120, textAlign: 'right' }} onClick={() => handleSort('montant')}>
                          <Group gap={4} justify="flex-end">Montant {sortBy === 'montant' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                        </Table.Th>
                        <Table.Th style={{ color: 'white', width: 120 }}>Mode</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Observation</Table.Th>
                        <Table.Th style={{ color: 'white', width: 120, textAlign: 'center' }}>Actions</Table.Th>
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
                          <Table.Td><Text size="sm" lineClamp={1}>{p.commande_designation}</Text></Table.Td>
                          <Table.Td ta="right"><Badge color="green" variant="light" size="sm">{p.montant.toLocaleString()} FCFA</Badge></Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              {getModeIcon(p.mode)}
                              <Text size="sm">{getModeLabel(p.mode)}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td><Text size="sm" c="dimmed" lineClamp={1}>{p.observation || '—'}</Text></Table.Td>
                          <Table.Td>
                            {editingId === p.id ? (
                              <Group gap={4} justify="center">
                                <NumberInput value={editData.montant} onChange={(val) => setEditData({ ...editData, montant: Number(val) })} size="xs" style={{ width: 90 }} min={0} placeholder="Montant" radius="md" />
                                <Select value={editData.mode} onChange={(val) => setEditData({ ...editData, mode: val || 'cash' })} data={modesPaiement} size="xs" style={{ width: 100 }} radius="md" />
                                <ActionIcon size="sm" color="green" onClick={() => saveEdit(p.id)}><IconCheck size={14} /></ActionIcon>
                                <ActionIcon size="sm" color="red" onClick={cancelEdit}><IconX size={14} /></ActionIcon>
                              </Group>
                            ) : (
                              <Group gap={6} justify="center">
                                <Tooltip label="Modifier"><ActionIcon size="sm" variant="subtle" color="orange" onClick={() => startEdit(p)}><IconEdit size={16} /></ActionIcon></Tooltip>
                                <Tooltip label="Reçu"><ActionIcon size="sm" variant="subtle" color="blue" onClick={() => openRecu(p)}><IconPrinter size={16} /></ActionIcon></Tooltip>
                                <Tooltip label="Supprimer"><ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(p.id)}><IconTrash size={16} /></ActionIcon></Tooltip>
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
                    <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" size="sm" radius="md" />
                  </Group>
                )}
              </>
            )}
          </Card>

          {/* Modal Instructions */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Instructions"
            size="md"
            centered
            radius="md"
            styles={{
              header: { backgroundColor: '#1b365d', padding: '16px 20px' },
              title: { color: 'white', fontWeight: 600 },
              body: { padding: '24px' },
            }}
          >
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm" mb="md">📌 Fonctionnalités :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouveau paiement" pour enregistrer un encaissement</Text>
                  <Text size="sm">2️⃣ La recherche filtre par client ou par commande</Text>
                  <Text size="sm">3️⃣ Cliquez sur l'icône 📄 pour générer un reçu</Text>
                  <Text size="sm">4️⃣ Les paiements peuvent être modifiés ou supprimés si nécessaire</Text>
                  <Text size="sm">5️⃣ Cliquez sur les en-têtes pour trier le tableau</Text>
                </Stack>
              </Paper>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ListePaiements;