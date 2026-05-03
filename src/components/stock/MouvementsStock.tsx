// src/components/stock/MouvementsStock.tsx (VERSION LECTURE SEULE)
import React, { useEffect, useState } from 'react';
import {
  Stack, Card, Title, Text, Group, Table, Badge, LoadingOverlay,
  Box, Pagination, Tooltip, Modal, Divider, ThemeIcon, SimpleGrid,
  TextInput, Avatar, Container, Center,
  Button,
  ActionIcon,
} from '@mantine/core';
import {
  IconBox, IconSearch, IconRefresh, IconInfoCircle, IconCalendar,
  IconArrowUp, IconArrowDown,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface MouvementStock {
  id: number;
  type_mouvement: 'entree' | 'sortie';
  code_mouvement: string;
  designation: string;
  quantite: number;
  cout_unitaire: number;
  date_mouvement: string;
  motif: string | null;
  observation: string | null;
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
        SELECT e.id, 'entree' as type_mouvement, e.code_entree as code_mouvement,
          COALESCE(mat.designation, art.code_article) as designation,
          e.quantite, e.cout_unitaire, e.date_entree as date_mouvement,
          NULL as motif, e.observation
        FROM entrees_stock e
        LEFT JOIN matieres mat ON e.matiere_id = mat.id
        LEFT JOIN articles art ON e.article_id = art.id
        UNION ALL
        SELECT s.id, 'sortie' as type_mouvement, s.code_sortie as code_mouvement,
          COALESCE(mat2.designation, art2.code_article) as designation,
          s.quantite, s.cout_unitaire, s.date_sortie as date_mouvement,
          s.motif, s.observation
        FROM sorties_stock s
        LEFT JOIN matieres mat2 ON s.matiere_id = mat2.id
        LEFT JOIN articles art2 ON s.article_id = art2.id
        ORDER BY date_mouvement DESC
      `);
      setMouvements(result || []);
    } catch (error) {
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally { setLoading(false); }
  };

  useEffect(() => { chargerMouvements(); }, []);

  const handleReset = () => { setRecherche(''); chargerMouvements(); setCurrentPage(1); };
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR');
  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);

  const getTypeBadge = (type: string) => {
    if (type === 'entree') return <Badge color="green" variant="light" leftSection={<IconArrowUp size={12} />}>Entrée</Badge>;
    return <Badge color="orange" variant="light" leftSection={<IconArrowDown size={12} />}>Sortie</Badge>;
  };

  const mouvementsFiltres = mouvements.filter(m =>
    m.designation?.toLowerCase().includes(recherche.toLowerCase()) ||
    m.code_mouvement?.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(mouvementsFiltres.length / itemsPerPage);
  const paginatedData = mouvementsFiltres.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalEntrees = mouvementsFiltres.filter(m => m.type_mouvement === 'entree').reduce((sum, m) => sum + m.quantite, 0);
  const totalSorties = mouvementsFiltres.filter(m => m.type_mouvement === 'sortie').reduce((sum, m) => sum + m.quantite, 0);

  if (loading) {
    return <Center style={{ height: '50vh' }}><LoadingOverlay visible /><Text>Chargement...</Text></Center>;
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}><IconBox size={30} color="white" /></Avatar>
                <Box><Title order={2} c="white">Mouvements de stock</Title><Text c="gray.3" size="sm">Historique des entrées et sorties</Text></Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">Instructions</Button>
            </Group>
          </Card>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Card withBorder radius="md" p="md" bg="green.0">
              <Group justify="space-between" mb="xs"><Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total entrées</Text><ThemeIcon size={30} radius="md" color="green" variant="light"><IconArrowUp size={18} /></ThemeIcon></Group>
              <Text fw={700} size="xl" c="green">{totalEntrees} unités</Text>
            </Card>
            <Card withBorder radius="md" p="md" bg="orange.0">
              <Group justify="space-between" mb="xs"><Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total sorties</Text><ThemeIcon size={30} radius="md" color="orange" variant="light"><IconArrowDown size={18} /></ThemeIcon></Group>
              <Text fw={700} size="xl" c="orange">{totalSorties} unités</Text>
            </Card>
          </SimpleGrid>

          <Card withBorder radius="md" p="md">
            <Group>
              <TextInput placeholder="Rechercher..." leftSection={<IconSearch size={16} />} value={recherche} onChange={(e) => { setRecherche(e.target.value); setCurrentPage(1); }} style={{ flex: 1 }} radius="md" />
              <Tooltip label="Actualiser"><ActionIcon variant="light" onClick={handleReset} size="lg" radius="md"><IconRefresh size={18} /></ActionIcon></Tooltip>
            </Group>
          </Card>

          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            {mouvementsFiltres.length === 0 ? (
              <Text ta="center" c="dimmed" py={60}>Aucun mouvement trouvé</Text>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white', width: 120 }}>Code</Table.Th>
                      <Table.Th style={{ color: 'white', width: 90 }}>Type</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Produit</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 100 }}>Quantité</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Coût unitaire</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Motif</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((m) => (
                      <Table.Tr key={`${m.type_mouvement}-${m.id}`}>
                        <Table.Td><Group gap={4}><IconCalendar size={12} /><Text size="sm">{formatDate(m.date_mouvement)}</Text></Group></Table.Td>
                        <Table.Td><Text size="xs" ff="monospace">{m.code_mouvement}</Text></Table.Td>
                        <Table.Td>{getTypeBadge(m.type_mouvement)}</Table.Td>
                        <Table.Td fw={500}>{m.designation || '-'}</Table.Td>
                        <Table.Td ta="right"><Badge color={m.type_mouvement === 'entree' ? 'green' : 'orange'} variant="light" size="sm">{m.quantite}</Badge></Table.Td>
                        <Table.Td ta="right"><Text size="sm">{m.cout_unitaire ? formatPrice(m.cout_unitaire) : '-'}</Text></Table.Td>
                        <Table.Td><Text size="sm" c="dimmed">{m.motif || m.observation || '-'}</Text></Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {totalPages > 1 && <Group justify="center" p="md"><Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="blue" size="sm" /></Group>}
              </>
            )}
          </Card>

          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">📥 <strong>Entrée</strong> : achat ou approvisionnement</Text>
              <Text size="sm">📤 <strong>Sortie</strong> : utilisation ou vente</Text>
              <Text size="sm">🔍 Utilisez la recherche pour filtrer</Text>
              <Text size="sm">📊 Consultez les totaux en haut</Text>
              <Divider /><Text size="xs" c="dimmed" ta="center">Version 2.0.0</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default MouvementsStock;