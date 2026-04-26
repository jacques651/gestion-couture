import { useEffect, useState } from 'react';
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
  LoadingOverlay,
  Select,
  Box,
  Pagination,
  Tooltip,
  Modal,
  Divider,
  ThemeIcon,
  Center,
  Container,
  Avatar,
} from '@mantine/core';
import {
  IconFileText,
  IconReceipt,
  IconSearch,
  IconCalendar,
  IconUser,
  IconShoppingBag,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import ModalFacture from './ModalFacture';
import ModalRecu from '../paiements/ModalRecu';

interface Commande {
  id: number;
  client_id: string;
  client_nom: string;
  designation: string;
  total: number;
  date_commande: string;
  a_des_paiements: number;
  total_paye: number;
}

const FacturesRecus: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [facture, setFacture] = useState<any>(null);
  const [recu, setRecu] = useState<Commande | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const charger = async () => {
    setLoading(true);
    const db = await getDb();
    const res = await db.select<Commande[]>(`
      SELECT 
        c.id,
        c.client_id,
        c.designation,
        c.total,
        c.date_commande,
        cl.nom_prenom as client_nom,
        COALESCE(SUM(p.montant), 0) as total_paye,
        EXISTS(SELECT 1 FROM paiements_commandes p2 WHERE p2.commande_id = c.id) as a_des_paiements
      FROM commandes c
      JOIN clients cl ON c.client_id = cl.telephone_id
      LEFT JOIN paiements_commandes p ON p.commande_id = c.id
      GROUP BY c.id
      ORDER BY c.date_commande DESC
    `);
    setCommandes(res);
    setLoading(false);
  };

  useEffect(() => { charger(); }, []);

  const getStatut = (c: Commande) => {
    const reste = c.total - (c.total_paye || 0);
    if (reste <= 0) return { label: 'Payé', color: 'green', variant: 'filled' };
    if (c.total_paye > 0) return { label: 'Partiel', color: 'orange', variant: 'light' };
    return { label: 'Non payé', color: 'red', variant: 'light' };
  };

  const commandesFiltrees = commandes.filter(c => {
    const matchSearch = c.client_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.designation.toLowerCase().includes(searchTerm.toLowerCase());
    const reste = c.total - (c.total_paye || 0);
    if (filterStatus === 'paye') return reste <= 0;
    if (filterStatus === 'partiel') return reste > 0 && c.total_paye > 0;
    if (filterStatus === 'non_paye') return c.total_paye === 0;
    return matchSearch;
  });

  const totalPages = Math.ceil(commandesFiltrees.length / itemsPerPage);
  const paginatedData = commandesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ouvrirFacture = (c: Commande) => {
    const reste = c.total - (c.total_paye || 0);
    setFacture({
      client: { nom_prenom: c.client_nom, telephone_id: c.client_id },
      lignes: [{ designation: c.designation, quantite: 1, prix_unitaire: c.total }],
      total_general: c.total,
      avance: c.total_paye || 0,
      reste
    });
  };

  const statusOptions = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'paye', label: 'Payé' },
    { value: 'partiel', label: 'Partiel' },
    { value: 'non_paye', label: 'Non payé' },
  ];

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconFileText size={40} stroke={1.5} />
            <Text>Chargement des factures...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconFileText size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Factures & Reçus</Title>
                  <Text c="gray.3" size="sm">Gestion des factures et reçus de paiement</Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm">
            <Group justify="space-between">
              <TextInput
                placeholder="Rechercher client ou produit..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                size="md"
                radius="md"
                style={{ flex: 1, maxWidth: 350 }}
              />
              <Select
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val || 'all');
                  setCurrentPage(1);
                }}
                data={statusOptions}
                size="md"
                radius="md"
                style={{ width: 150 }}
              />
            </Group>
          </Card>

          {/* Tableau */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {commandesFiltrees.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconFileText size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucune facture trouvée</Text>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Client</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                      <Table.Th style={{ color: 'white', width: 100 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white', width: 120, textAlign: 'right' }}>Total</Table.Th>
                      <Table.Th style={{ color: 'white', width: 120, textAlign: 'right' }}>Payé</Table.Th>
                      <Table.Th style={{ color: 'white', width: 120, textAlign: 'right' }}>Reste</Table.Th>
                      <Table.Th style={{ color: 'white', width: 100, textAlign: 'center' }}>Statut</Table.Th>
                      <Table.Th style={{ color: 'white', width: 180, textAlign: 'center' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((c) => {
                      const reste = c.total - (c.total_paye || 0);
                      const statut = getStatut(c);
                      return (
                        <Table.Tr key={c.id}>
                          <Table.Td fw={500}>
                            <Group gap={4}>
                              <IconUser size={14} color="#1b365d" />
                              {c.client_nom}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <IconShoppingBag size={14} color="#1b365d" />
                              <Text size="sm" lineClamp={1}>
                                {c.designation}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <IconCalendar size={14} color="#1b365d" />
                              <Text size="sm">{new Date(c.date_commande).toLocaleDateString('fr-FR')}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td ta="right" fw={600}>
                            {c.total.toLocaleString()} FCFA
                          </Table.Td>
                          <Table.Td ta="right" c="green" fw={600}>
                            {c.total_paye.toLocaleString()} FCFA
                          </Table.Td>
                          <Table.Td ta="right" c="red" fw={600}>
                            {reste.toLocaleString()} FCFA
                          </Table.Td>
                          <Table.Td ta="center">
                            <Badge color={statut.color} variant={statut.variant as any} size="sm">
                              {statut.label}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center" wrap="nowrap">
                              <Tooltip label="Générer la facture">
                                <Button
                                  variant="subtle"
                                  color="blue"
                                  size="compact-sm"
                                  onClick={() => ouvrirFacture(c)}
                                  style={{ minWidth: 80 }}
                                >
                                  <IconFileText size={14} style={{ marginRight: 4 }} />
                                  Facture
                                </Button>
                              </Tooltip>
                              <Tooltip label={!c.a_des_paiements ? "Aucun paiement enregistré" : "Voir le reçu"}>
                                <Button
                                  variant="subtle"
                                  color="green"
                                  size="compact-sm"
                                  onClick={() => setRecu(c)}
                                  disabled={!c.a_des_paiements}
                                  style={{ minWidth: 70 }}
                                >
                                  <IconReceipt size={14} style={{ marginRight: 4 }} />
                                  Reçu
                                </Button>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>

                {totalPages > 1 && (
                  <Group justify="center" p="md">
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
              <Text size="sm">1️⃣ Utilisez la recherche pour filtrer par client ou produit</Text>
              <Text size="sm">2️⃣ Le filtre par statut permet de voir les commandes payées, partielles ou impayées</Text>
              <Text size="sm">3️⃣ Cliquez sur "Facture" pour générer une facture détaillée</Text>
              <Text size="sm">4️⃣ Cliquez sur "Reçu" pour voir le reçu de paiement (disponible uniquement si des paiements ont été effectués)</Text>
              <Text size="sm">5️⃣ Les montants sont affichés en FCFA</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>

      {/* Modals */}
      {facture && <ModalFacture commande={facture} onClose={() => setFacture(null)} />}
      {recu && <ModalRecu commande={recu} onClose={() => setRecu(null)} />}
    </Box>
  );
};

export default FacturesRecus;