// src/components/parametres/JournalModifications.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Container, Stack, Card, Title, Text, Group, Button,
  TextInput, Select, Badge, ActionIcon, Tooltip, Divider,
  ScrollArea, Table, Pagination, Avatar, Center, LoadingOverlay,
  Modal, SimpleGrid, Paper, ThemeIcon, Alert, Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHistory, IconSearch, IconRefresh, IconInfoCircle,
  IconEye, IconFileExcel, IconUser, IconClock,
  IconPlus, IconEdit, IconTrash, IconTrashX, IconFilter,
  IconCalendarStats, IconDatabase,
} from '@tabler/icons-react';
import {
  apiGet,
  apiDelete
} from '../../services/api';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';

interface JournalEntry {
  id: number;
  utilisateur: string;
  action: string;
  table_concernee: string;
  id_enregistrement: string;
  details: string;
  date_modification: string;
}

const JournalModifications: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearModalOpen, { open: openClearModal, close: closeClearModal }] = useDisclosure(false);
  const itemsPerPage = 20;

  const loadJournal = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/journal");
      setEntries(data || []);
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJournal(); }, []);

  const handleClearJournal = async () => {
    try {
      await apiDelete("/journal");
      notifications.show({ title: 'Succès', message: 'Journal vidé avec succès', color: 'green' });
      closeClearModal();
      loadJournal();
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterAction(null);
    setFilterTable(null);
    setCurrentPage(1);
  };

  const filtered = entries.filter(e => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s || (e.details || '').toLowerCase().includes(s) || 
                       (e.table_concernee || '').toLowerCase().includes(s) || 
                       (e.utilisateur || '').toLowerCase().includes(s);
    const matchAction = !filterAction || e.action === filterAction;
    const matchTable = !filterTable || e.table_concernee === filterTable;
    return matchSearch && matchAction && matchTable;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: entries.length,
    creates: entries.filter(e => e.action === 'CREATE').length,
    updates: entries.filter(e => e.action === 'UPDATE').length,
    deletes: entries.filter(e => e.action === 'DELETE').length,
    today: entries.filter(e => {
      const today = new Date().toDateString();
      return new Date(e.date_modification).toDateString() === today;
    }).length,
  };

  const uniqueTables = [...new Set(entries.map(e => e.table_concernee))].sort();

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge color="green" variant="filled" size="md" leftSection={<IconPlus size={12} />}>Création</Badge>;
      case 'UPDATE':
        return <Badge color="orange" variant="filled" size="md" leftSection={<IconEdit size={12} />}>Modification</Badge>;
      case 'DELETE':
        return <Badge color="red" variant="filled" size="md" leftSection={<IconTrash size={12} />}>Suppression</Badge>;
      case 'IMPORT':
        return <Badge color="cyan" variant="filled" size="md">Import</Badge>;
      case 'EXPORT':
        return <Badge color="lime" variant="filled" size="md">Export</Badge>;
      case 'PRINT':
        return <Badge color="grape" variant="filled" size="md">Impression</Badge>;
      case 'LOGIN':
        return <Badge color="teal" variant="filled" size="md">Connexion</Badge>;
      case 'LOGOUT':
        return <Badge color="gray" variant="filled" size="md">Déconnexion</Badge>;
      default:
        return <Badge color="dark" variant="light" size="md">{action}</Badge>;
    }
  };

  const getTableLabel = (table: string) => {
    const labels: Record<string, string> = {
      'articles': '📦 Articles',
      'matieres': '🧵 Matières',
      'ventes': '💰 Ventes',
      'vente_details': '📋 Détails vente',
      'clients': '👥 Clients',
      'employes': '👷 Employés',
      'salaires': '💵 Salaires',
      'emprunts': '🏦 Emprunts',
      'depenses': '💸 Dépenses',
      'tailles': '📏 Tailles',
      'couleurs': '🎨 Couleurs',
      'textures': '🧶 Textures',
      'types_mesures': '📐 Types mesures',
      'types_prestations': '🔧 Prestations',
      'modeles_tenues': '👔 Modèles',
      'categories_matieres': '📁 Catégories',
      'utilisateurs': '👤 Utilisateurs',
      'mesures_clients': '📏 Mesures clients',
      'prestations_realisees': '✅ Prestations faites',
      'paiements_ventes': '💳 Paiements',
      'rendezvous_commandes': '📅 Rendez-vous',
    };
    return labels[table] || table;
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('fr-FR', { 
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  const exportExcel = async () => {
    setExporting(true);
    try {
      const data = filtered.map(e => ({
        Date: formatDate(e.date_modification),
        Utilisateur: e.utilisateur,
        Action: e.action,
        Table: e.table_concernee,
        ID: e.id_enregistrement,
        Détails: e.details
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Journal des modifications');
      XLSX.writeFile(wb, `journal_modifications_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      notifications.show({ title: 'Export réussi', message: 'Fichier Excel téléchargé', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Erreur', message: 'Échec de l\'export', color: 'red' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconHistory size={40} stroke={1.5} />
            <Text>Chargement du journal...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full" p={0}>
        <Stack gap="lg">
          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconHistory size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Journal des modifications</Title>
                  <Text c="gray.3" size="sm">Traçabilité complète de toutes les actions utilisateurs</Text>
                  <Group gap="xs" mt={4}>
                    <Badge size="sm" variant="white" color="blue">
                      {entries.length} entrées enregistrées
                    </Badge>
                    <Badge size="sm" variant="white" color="green">
                      {stats.today} aujourd'hui
                    </Badge>
                  </Group>
                </Box>
              </Group>
              <Group>
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" color="white" onClick={loadJournal} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                  Instructions
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Cartes statistiques modernes */}
          <SimpleGrid cols={{ base: 2, md: 5 }} spacing="md">
            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e3f2fd', textAlign: 'center' }}>
              <ThemeIcon size="lg" radius="xl" color="blue" variant="light" mx="auto" mb="sm">
                <IconHistory size={20} />
              </ThemeIcon>
              <Text fw={700} size="xl" c="blue">{stats.total}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f5e9', textAlign: 'center' }}>
              <ThemeIcon size="lg" radius="xl" color="green" variant="light" mx="auto" mb="sm">
                <IconPlus size={20} />
              </ThemeIcon>
              <Text fw={700} size="xl" c="green">{stats.creates}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Créations</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff3e0', textAlign: 'center' }}>
              <ThemeIcon size="lg" radius="xl" color="orange" variant="light" mx="auto" mb="sm">
                <IconEdit size={20} />
              </ThemeIcon>
              <Text fw={700} size="xl" c="orange">{stats.updates}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Modifications</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ffebee', textAlign: 'center' }}>
              <ThemeIcon size="lg" radius="xl" color="red" variant="light" mx="auto" mb="sm">
                <IconTrash size={20} />
              </ThemeIcon>
              <Text fw={700} size="xl" c="red">{stats.deletes}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Suppressions</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#f3e5f5', textAlign: 'center' }}>
              <ThemeIcon size="lg" radius="xl" color="violet" variant="light" mx="auto" mb="sm">
                <IconCalendarStats size={20} />
              </ThemeIcon>
              <Text fw={700} size="xl" c="violet">{stats.today}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Aujourd'hui</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre de recherche et filtres */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Group grow style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Rechercher par utilisateur, table, détails..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    radius="md"
                    size="md"
                  />
                </Group>
                <Group gap="xs">
                  <Tooltip label="Réinitialiser filtres">
                    <ActionIcon variant="light" color="gray" onClick={resetFilters} size="lg" radius="md">
                      <IconFilter size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Exporter Excel">
                    <ActionIcon variant="light" color="green" onClick={exportExcel} size="lg" radius="md" loading={exporting}>
                      <IconFileExcel size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
              
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Filtrer par action"
                    value={filterAction}
                    onChange={(v) => { setFilterAction(v); setCurrentPage(1); }}
                    clearable
                    data={[
                      { value: 'CREATE', label: '➕ Création' },
                      { value: 'UPDATE', label: '✏️ Modification' },
                      { value: 'DELETE', label: '🗑️ Suppression' },
                      { value: 'IMPORT', label: '📥 Import' },
                      { value: 'EXPORT', label: '📤 Export' },
                      { value: 'PRINT', label: '🖨️ Impression' },
                      { value: 'LOGIN', label: '🔐 Connexion' },
                      { value: 'LOGOUT', label: '🚪 Déconnexion' }
                    ]}
                    radius="md"
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Filtrer par table"
                    value={filterTable}
                    onChange={(v) => { setFilterTable(v); setCurrentPage(1); }}
                    clearable
                    data={uniqueTables.map(t => ({ value: t, label: getTableLabel(t) }))}
                    radius="md"
                    size="sm"
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>

          {/* Tableau des entrées */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconDatabase size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucune entrée trouvée</Text>
                <Button variant="light" onClick={resetFilters} size="xs">
                  Réinitialiser les filtres
                </Button>
              </Stack>
            ) : (
              <>
                <ScrollArea h={550} offsetScrollbars>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 1 }}>
                      <Table.Tr>
                        <Table.Th style={{ color: 'white', width: 150 }}>Date & heure</Table.Th>
                        <Table.Th style={{ color: 'white', width: 120 }}>Action</Table.Th>
                        <Table.Th style={{ color: 'white', width: 160 }}>Table</Table.Th>
                        <Table.Th style={{ color: 'white', width: 120 }}>Utilisateur</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Détails</Table.Th>
                        <Table.Th style={{ color: 'white', width: 50, textAlign: 'center' }}></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginated.map(entry => (
                        <Table.Tr key={entry.id}>
                          <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            <Group gap={4} wrap="nowrap">
                              <IconClock size={14} />
                              <Text size="sm">{formatDate(entry.date_modification)}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>{getActionBadge(entry.action)}</Table.Td>
                          <Table.Td>
                            <Tooltip label={entry.table_concernee}>
                              <Badge size="md" variant="light" color="blue">
                                {getTableLabel(entry.table_concernee)}
                              </Badge>
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <IconUser size={14} />
                              <Text size="sm">{entry.utilisateur || 'Système'}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" lineClamp={2} style={{ maxWidth: 300 }}>
                              {entry.details || '-'}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <Tooltip label="Voir détails">
                              <ActionIcon variant="subtle" color="blue" onClick={() => { setSelectedEntry(entry); setViewModalOpen(true); }}>
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
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
                      color="#1b365d" 
                      size="md" 
                      radius="md"
                    />
                  </Group>
                )}
              </>
            )}
          </Card>

          {/* Actions en bas */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between">
              <Group gap="xs">
                <IconDatabase size={18} color="#999" />
                <Text size="xs" c="dimmed">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filtered.length)} sur {filtered.length} entrées
                </Text>
              </Group>
              <Button 
                variant="light" 
                color="red" 
                leftSection={<IconTrashX size={16} />} 
                onClick={openClearModal}
                disabled={entries.length === 0}
              >
                Vider le journal
              </Button>
            </Group>
          </Card>
        </Stack>
      </Container>

      {/* Modal détails */}
      <Modal opened={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Détails de l'action" size="lg" centered radius="md" padding="xl">
        {selectedEntry && (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Paper p="md" withBorder bg="gray.0">
                <Text size="xs" c="dimmed" mb={4}>📅 Date & heure</Text>
                <Text fw={600}>{formatDate(selectedEntry.date_modification)}</Text>
              </Paper>
              <Paper p="md" withBorder bg="gray.0">
                <Text size="xs" c="dimmed" mb={4}>👤 Utilisateur</Text>
                <Text fw={600}>{selectedEntry.utilisateur || 'Système'}</Text>
              </Paper>
              <Paper p="md" withBorder bg="gray.0">
                <Text size="xs" c="dimmed" mb={4}>⚡ Action</Text>
                {getActionBadge(selectedEntry.action)}
              </Paper>
              <Paper p="md" withBorder bg="gray.0">
                <Text size="xs" c="dimmed" mb={4}>🗂️ Table concernée</Text>
                <Badge size="md" variant="light" color="blue">{getTableLabel(selectedEntry.table_concernee)}</Badge>
              </Paper>
              {selectedEntry.id_enregistrement && (
                <Paper p="md" withBorder bg="gray.0">
                  <Text size="xs" c="dimmed" mb={4}>🔑 ID enregistrement</Text>
                  <Badge size="md" variant="light" color="gray">{selectedEntry.id_enregistrement}</Badge>
                </Paper>
              )}
            </SimpleGrid>
            
            <Paper p="md" withBorder>
              <Text size="xs" c="dimmed" mb={4}>📝 Détails complets</Text>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{selectedEntry.details || 'Aucun détail'}</Text>
            </Paper>
            
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setViewModalOpen(false)}>Fermer</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal vider journal */}
      <Modal opened={clearModalOpen} onClose={closeClearModal} title="⚠️ Vider le journal" size="sm" centered radius="md" padding="xl">
        <Stack gap="md">
          <Alert color="red" variant="light" icon={<IconTrashX size={18} />}>
            <Text size="sm" fw={500}>Vider définitivement tout le journal ?</Text>
            <Text size="xs" mt={4}>Cette action est irréversible. Pensez à exporter avant de vider.</Text>
          </Alert>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeClearModal}>Annuler</Button>
            <Button color="red" onClick={handleClearJournal} leftSection={<IconTrashX size={16} />}>Vider le journal</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal instructions */}
      <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md" padding="xl">
        <Stack gap="md">
          <Paper p="md" withBorder bg="blue.0">
            <Text fw={600} size="sm" mb="xs">📌 Fonctionnalités</Text>
            <Stack gap="xs">
              <Text size="sm">1️⃣ Visualisez toutes les actions utilisateurs</Text>
              <Text size="sm">2️⃣ Utilisez les filtres pour rechercher par action, table ou utilisateur</Text>
              <Text size="sm">3️⃣ Exportez le journal au format Excel pour archivage</Text>
              <Text size="sm">4️⃣ Consultez les détails complets en cliquant sur l'icône 👁️</Text>
              <Text size="sm">5️⃣ Le journal est automatiquement alimenté par les triggers PostgreSQL</Text>
            </Stack>
          </Paper>

          <Paper p="md" withBorder bg="yellow.0">
            <Text fw={600} size="sm" mb="xs">🎯 Actions enregistrées</Text>
            <SimpleGrid cols={2} spacing="xs">
              <Group gap="xs"><Badge color="green">CREATE</Badge><Text size="xs">Création</Text></Group>
              <Group gap="xs"><Badge color="orange">UPDATE</Badge><Text size="xs">Modification</Text></Group>
              <Group gap="xs"><Badge color="red">DELETE</Badge><Text size="xs">Suppression</Text></Group>
              <Group gap="xs"><Badge color="teal">LOGIN</Badge><Text size="xs">Connexion</Text></Group>
              <Group gap="xs"><Badge color="cyan">IMPORT</Badge><Text size="xs">Import</Text></Group>
              <Group gap="xs"><Badge color="lime">EXPORT</Badge><Text size="xs">Export</Text></Group>
            </SimpleGrid>
          </Paper>

          <Divider />
          <Text size="xs" c="dimmed" ta="center">Version 2.0.0 - Gestion Couture</Text>
        </Stack>
      </Modal>
    </Box>
  );
};

export default JournalModifications;