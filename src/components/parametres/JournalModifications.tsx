// src/components/parametres/JournalModifications.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Container, Stack, Card, Title, Text, Group, Button,
  TextInput, Select, Badge, ActionIcon, Tooltip, Divider,
  ScrollArea, Table, Pagination, Avatar, Center, LoadingOverlay,
  Modal, SimpleGrid, Paper, ThemeIcon,
  Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconHistory, IconSearch, IconRefresh, IconInfoCircle,
  IconEye, IconFileExcel, IconUser, IconClock,
  IconPlus, IconEdit, IconTrash, IconTrashX, IconFilter,
} from '@tabler/icons-react';
import {

  apiGet,
  apiDelete

} from '../../services/api';
import { notifications } from '@mantine/notifications';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

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

      const data =
        await apiGet(
          "/journal"
        );

      setEntries(
        data || []
      );

    } catch (err: any) {

      notifications.show({

        title:
          'Erreur',

        message:
          err.message,

        color:
          'red'
      });

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => { loadJournal(); }, []);

  // Vider le journal
  const handleClearJournal = async () => {
    try {
      await apiDelete(
        "/journal"
      );
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
    const matchSearch = !s || (e.details || '').toLowerCase().includes(s) || (e.table_concernee || '').toLowerCase().includes(s) || (e.utilisateur || '').toLowerCase().includes(s);
    const matchAction = !filterAction || e.action === filterAction;
    const matchTable = !filterTable || e.table_concernee === filterTable;
    return matchSearch && matchAction && matchTable;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: entries.length,

    creates:
      entries.filter(
        e => e.action === 'CREATE'
      ).length,

    updates:
      entries.filter(
        e => e.action === 'UPDATE'
      ).length,

    deletes:
      entries.filter(
        e => e.action === 'DELETE'
      ).length,

    exports:
      entries.filter(
        e => e.action === 'EXPORT'
      ).length,

    imports:
      entries.filter(
        e => e.action === 'IMPORT'
      ).length,

    prints:
      entries.filter(
        e => e.action === 'PRINT'
      ).length,

    logins:
      entries.filter(
        e => e.action === 'LOGIN'
      ).length,

    logouts:
      entries.filter(
        e => e.action === 'LOGOUT'
      ).length,
  };

  const uniqueTables = [...new Set(entries.map(e => e.table_concernee))].sort();

  const getActionBadge = (
    action: string
  ) => {

    switch (action) {

      case 'CREATE':
        return (
          <Badge
            color="green"
            variant="light"
            size="sm"
            leftSection={<IconPlus size={12} />}
          >
            Création
          </Badge>
        );

      case 'UPDATE':
        return (
          <Badge
            color="orange"
            variant="light"
            size="sm"
            leftSection={<IconEdit size={12} />}
          >
            Modification
          </Badge>
        );

      case 'DELETE':
        return (
          <Badge
            color="red"
            variant="light"
            size="sm"
            leftSection={<IconTrash size={12} />}
          >
            Suppression
          </Badge>
        );

      case 'IMPORT':
        return (
          <Badge
            color="cyan"
            variant="light"
            size="sm"
          >
            Import
          </Badge>
        );

      case 'EXPORT':
        return (
          <Badge
            color="lime"
            variant="light"
            size="sm"
          >
            Export
          </Badge>
        );

      case 'PRINT':
        return (
          <Badge
            color="grape"
            variant="light"
            size="sm"
          >
            Impression
          </Badge>
        );

      case 'LOGIN':
        return (
          <Badge
            color="teal"
            variant="light"
            size="sm"
          >
            Connexion
          </Badge>
        );

      case 'LOGOUT':
        return (
          <Badge
            color="gray"
            variant="light"
            size="sm"
          >
            Déconnexion
          </Badge>
        );

      default:
        return (
          <Badge
            color="dark"
            variant="light"
            size="sm"
          >
            {action}
          </Badge>
        );
    }
  };

  const getTableLabel = (table: string) => {
    const labels: Record<string, string> = {
      'articles': '📦 Articles', 'matieres': '🧵 Matières', 'ventes': '💰 Ventes',
      'vente_details': '📋 Détails vente', 'clients': '👥 Clients', 'employes': '👷 Employés',
      'salaires': '💵 Salaires', 'emprunts': '🏦 Emprunts', 'depenses': '💸 Dépenses',
      'tailles': '📏 Tailles', 'couleurs': '🎨 Couleurs', 'textures': '🧶 Textures',
      'types_mesures': '📐 Types mesures', 'types_prestations': '🔧 Prestations',
      'modeles_tenues': '👔 Modèles', 'categories_matieres': '📁 Catégories',
      'utilisateurs': '👤 Utilisateurs', 'mesures_clients': '📏 Mesures clients',
      'prestations_realisees': '✅ Prestations faites', 'entrees_stock': '📥 Entrées stock',
      'sorties_stock': '📤 Sorties stock',
    };
    return labels[table] || table;
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const exportExcel = async () => {
    setExporting(true);
    try {
      const data = filtered.map(e => ({
        'Date': formatDate(e.date_modification),
        'Utilisateur': e.utilisateur,
        'Action': e.action,
        'Table': e.table_concernee,
        'ID': e.id_enregistrement,
        'Détails': e.details
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Journal');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const path = await save({ filters: [{ name: 'Excel', extensions: ['xlsx'] }], defaultPath: `journal_${new Date().toISOString().split('T')[0]}.xlsx` });
      if (path) { await writeFile(path, new Uint8Array(buf)); notifications.show({ title: 'Export réussi', message: '', color: 'green' }); }
    } catch (e) { notifications.show({ title: 'Erreur', message: 'Échec export', color: 'red' }); }
    finally { setExporting(false); }
  };

  if (loading) {
    return <Center style={{ height: '50vh' }}><LoadingOverlay visible /><Text>Chargement...</Text></Center>;
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><IconHistory size={28} color="white" /></Avatar>
                <Box>
                  <Title order={2} c="white">Journal des Modifications</Title>
                  <Text c="gray.3" size="xs">Suivez toutes les actions effectuées</Text>
                </Box>
              </Group>
              <Group>
                <Button variant="light" color="white" size="xs" leftSection={<IconTrashX size={14} />} onClick={openClearModal} radius="md">Vider le journal</Button>
                <Button variant="light" color="white" size="xs" leftSection={<IconInfoCircle size={14} />} onClick={() => setInfoModalOpen(true)} radius="md">Infos</Button>
              </Group>
            </Group>
          </Card>

          {/* Stats */}
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            {[
              { label: 'Total', value: stats.total, color: 'blue', icon: <IconHistory size={18} /> },
              { label: 'Créations', value: stats.creates, color: 'green', icon: <IconPlus size={18} /> },
              { label: 'Modifications', value: stats.updates, color: 'orange', icon: <IconEdit size={18} /> },
              { label: 'Suppressions', value: stats.deletes, color: 'red', icon: <IconTrash size={18} /> },
            ].map((s, i) => (
              <Paper key={i} p="sm" radius="md" withBorder ta="center">
                <ThemeIcon color={s.color} variant="light" size="md" radius="md" mx="auto" mb={4}>{s.icon}</ThemeIcon>
                <Text fw={700} size="lg" c={s.color}>{s.value}</Text>
                <Text size="xs" c="dimmed">{s.label}</Text>
              </Paper>
            ))}
          </SimpleGrid>

          {/* Filtres */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group>
              <TextInput placeholder="Rechercher..." leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ flex: 1 }} radius="md" size="sm" />
              <Select placeholder="Action" data={[
                {
                  value: 'CREATE',
                  label: 'Création'
                },
                {
                  value: 'UPDATE',
                  label: 'Modification'
                },
                {
                  value: 'DELETE',
                  label: 'Suppression'
                },
                {
                  value: 'IMPORT',
                  label: 'Import'
                },
                {
                  value: 'EXPORT',
                  label: 'Export'
                },
                {
                  value: 'PRINT',
                  label: 'Impression'
                },
                {
                  value: 'LOGIN',
                  label: 'Connexion'
                },
                {
                  value: 'LOGOUT',
                  label: 'Déconnexion'
                }
              ]} value={filterAction} onChange={(v) => { setFilterAction(v); setCurrentPage(1); }} clearable radius="md" size="sm" style={{ width: 140 }} />
              <Select placeholder="Table" data={uniqueTables.map(t => ({ value: t, label: getTableLabel(t) }))} value={filterTable} onChange={(v) => { setFilterTable(v); setCurrentPage(1); }} clearable radius="md" size="sm" style={{ width: 160 }} />
              <Tooltip label="Réinitialiser filtres"><ActionIcon variant="light" color="gray" onClick={resetFilters} size="lg" radius="md"><IconFilter size={18} /></ActionIcon></Tooltip>
              <Tooltip label="Actualiser"><ActionIcon variant="light" color="blue" onClick={loadJournal} size="lg" radius="md"><IconRefresh size={18} /></ActionIcon></Tooltip>
              <Tooltip label="Exporter Excel"><ActionIcon variant="light" color="green" onClick={exportExcel} size="lg" radius="md" loading={exporting}><IconFileExcel size={18} /></ActionIcon></Tooltip>
            </Group>
          </Card>

          {/* Tableau */}
          <Card withBorder radius="lg" p={0} style={{ overflow: 'hidden' }}>
            <ScrollArea h={500}>
              <Table striped highlightOnHover style={{ fontSize: '12px' }}>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 140, padding: '10px 8px' }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white', width: 110, padding: '10px 8px' }}>Action</Table.Th>
                    <Table.Th style={{ color: 'white', width: 140, padding: '10px 8px' }}>Table</Table.Th>
                    <Table.Th style={{ color: 'white', width: 90, padding: '10px 8px' }}>Utilisateur</Table.Th>
                    <Table.Th style={{ color: 'white', padding: '10px 8px' }}>Détails</Table.Th>
                    <Table.Th style={{ color: 'white', width: 50, textAlign: 'center', padding: '10px 8px' }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginated.length === 0 ? (
                    <Table.Tr><Table.Td colSpan={6} ta="center" py={40}><Text c="dimmed">Aucune entrée trouvée</Text></Table.Td></Table.Tr>
                  ) : paginated.map(entry => (
                    <Table.Tr key={entry.id}>
                      <Table.Td style={{ padding: '8px' }}><Group gap={4}><IconClock size={12} /><Text size="xs">{formatDate(entry.date_modification)}</Text></Group></Table.Td>
                      <Table.Td style={{ padding: '8px' }}>{getActionBadge(entry.action)}</Table.Td>
                      <Table.Td style={{ padding: '8px' }}><Badge variant="light" size="xs">{getTableLabel(entry.table_concernee)}</Badge></Table.Td>
                      <Table.Td style={{ padding: '8px' }}><Group gap={4}><IconUser size={12} /><Text size="xs">{entry.utilisateur || 'Admin'}</Text></Group></Table.Td>
                      <Table.Td style={{ padding: '8px' }}><Text size="xs" lineClamp={2}>{entry.details || '-'}</Text></Table.Td>
                      <Table.Td style={{ padding: '8px' }} ta="center">
                        <Tooltip label="Voir détails"><ActionIcon variant="subtle" color="blue" size="sm" onClick={() => { setSelectedEntry(entry); setViewModalOpen(true); }}><IconEye size={14} /></ActionIcon></Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            {totalPages > 1 && <Group justify="center" p="md"><Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" size="sm" /></Group>}
          </Card>

          {/* Modal Voir détails */}
          <Modal opened={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Détails de l'action" size="md" centered radius="md">
            {selectedEntry && (
              <Stack gap="md">
                <Paper p="sm" withBorder bg="gray.0">
                  <SimpleGrid cols={2} spacing="sm">
                    <Box><Text size="xs" c="dimmed">Date</Text><Text size="sm" fw={500}>{formatDate(selectedEntry.date_modification)}</Text></Box>
                    <Box><Text size="xs" c="dimmed">Utilisateur</Text><Text size="sm" fw={500}>{selectedEntry.utilisateur || 'Admin'}</Text></Box>
                    <Box><Text size="xs" c="dimmed">Action</Text><Box mt={2}>{getActionBadge(selectedEntry.action)}</Box></Box>
                    <Box><Text size="xs" c="dimmed">Table</Text><Badge variant="light" size="sm" mt={2}>{getTableLabel(selectedEntry.table_concernee)}</Badge></Box>
                  </SimpleGrid>
                </Paper>
                <Box><Text size="xs" c="dimmed">Détails</Text><Paper p="sm" withBorder bg="gray.0" mt={4}><Text size="sm">{selectedEntry.details || 'Aucun détail'}</Text></Paper></Box>
                <Group justify="flex-end"><Button variant="light" size="xs" onClick={() => setViewModalOpen(false)}>Fermer</Button></Group>
              </Stack>
            )}
          </Modal>

          {/* Modal Vider le journal */}
          <Modal opened={clearModalOpen} onClose={closeClearModal} title="Vider le journal" size="sm" centered radius="md">
            <Stack gap="md">
              <Alert color="red" variant="light">
                <Text size="sm" fw={500}>Vider définitivement tout le journal ?</Text>
                <Text size="xs" mt={4}>Cette action est irréversible. Pensez à exporter avant.</Text>
              </Alert>
              <Group justify="flex-end" gap="sm">
                <Button variant="light" size="xs" onClick={closeClearModal}>Annuler</Button>
                <Button color="red" size="xs" onClick={handleClearJournal} leftSection={<IconTrashX size={14} />}>Vider</Button>
              </Group>
            </Stack>
          </Modal>

          {/* Modal Infos */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Informations" size="md" centered radius="md">
            <Stack gap="md">
              <Paper p="md" withBorder bg="blue.0">
                <Text size="sm" fw={600} mb="xs">📌 Suivi automatique</Text>
                <Text size="xs">• Chaque création, modification ou suppression est enregistrée</Text>
                <Text size="xs">• Le journal couvre toutes les tables de l'application</Text>
                <Text size="xs">• Exportez en Excel pour archive avant de vider</Text>
              </Paper>
              <Divider /><Text size="xs" c="dimmed" ta="center">Version 1.0.0</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default JournalModifications;