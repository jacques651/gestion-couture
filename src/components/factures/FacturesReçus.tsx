// components/factures/FacturesRecus.tsx
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
  Modal,
  Divider,
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
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import ModalFacture from './ModalFacture';
import ModalRecu from '../paiements/ModalRecu';

interface Vente {
  id: number;
  code_vente: string;
  type_vente: 'commande' | 'pret_a_porter' | 'matiere';
  date_vente: string;
  client_id: string | null;
  client_nom: string | null;
  mode_paiement: string | null;
  montant_total: number;
  montant_regle: number;
  montant_restant: number;
  statut: string;
  observation: string | null;
}

const FacturesRecus: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [showFacture, setShowFacture] = useState(false);
  const [showRecu, setShowRecu] = useState(false);
  const [factureData, setFactureData] = useState<any>(null);
  const [recuVenteId, setRecuVenteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const charger = async () => {
    setLoading(true);
    try {
      const db = await getDb();
      const res = await db.select<Vente[]>(`
        SELECT 
          v.id,
          v.code_vente,
          v.type_vente,
          v.date_vente,
          v.client_id,
          v.client_nom,
          v.mode_paiement,
          v.montant_total,
          v.montant_regle,
          (v.montant_total - v.montant_regle) as montant_restant,
          v.statut,
          v.observation
        FROM ventes v
        ORDER BY v.date_vente DESC
      `);
      setVentes(res || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const getStatut = (vente: Vente) => {
    if (vente.statut === 'PAYEE' || vente.montant_restant <= 0) 
      return { label: 'Payé', color: 'green' };
    if (vente.montant_regle > 0) 
      return { label: 'Partiel', color: 'orange' };
    return { label: 'Non payé', color: 'red' };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commande': return { label: '📝 Sur mesure', color: 'violet' };
      case 'pret_a_porter': return { label: '👕 Prêt-à-porter', color: 'cyan' };
      case 'matiere': return { label: '📦 Matière', color: 'teal' };
      default: return { label: type, color: 'gray' };
    }
  };

  const ouvrirFacture = (vente: Vente) => {
    if (vente.type_vente !== 'commande') return;
    
    setFactureData({
      client: {
        nom_prenom: vente.client_nom || 'Client non renseigné',
        telephone_id: vente.client_id || '',
      },
      lignes: [],
      total_general: vente.montant_total || 0,
      avance: vente.montant_regle || 0,
      reste: vente.montant_restant || 0,
      numero: vente.code_vente || 'N/A',
      date_commande: vente.date_vente || new Date().toISOString(),
      id: vente.id,
      statut: vente.statut,
    });
    setShowFacture(true);
  };

  const ouvrirRecu = (vente: Vente) => {
    if (vente.montant_regle <= 0) return;
    setRecuVenteId(vente.id);
    setShowRecu(true);
  };

  const handleCloseFacture = () => {
    setShowFacture(false);
    setFactureData(null);
    charger();
  };

  const handleCloseRecu = () => {
    setShowRecu(false);
    setRecuVenteId(null);
    charger();
  };

  const ventesFiltrees = ventes.filter(vente => {
    const matchSearch = (vente.client_nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (vente.code_vente?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (filterType !== 'all' && vente.type_vente !== filterType) return false;
    if (filterStatus === 'paye') return vente.montant_restant <= 0;
    if (filterStatus === 'partiel') return vente.montant_regle > 0 && vente.montant_restant > 0;
    if (filterStatus === 'non_paye') return vente.montant_regle <= 0;
    return true;
  });

  const totalPages = Math.ceil(ventesFiltrees.length / itemsPerPage);
  const paginatedData = ventesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const typeOptions = [
    { value: 'all', label: 'Tous types' },
    { value: 'commande', label: '📝 Sur mesure' },
    { value: 'pret_a_porter', label: '👕 Prêt-à-porter' },
    { value: 'matiere', label: '📦 Matière' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'paye', label: '✅ Payé' },
    { value: 'partiel', label: '⚠️ Partiel' },
    { value: 'non_paye', label: '❌ Non payé' },
  ];

  if (showFacture && factureData) {
    return (
      <ModalFacture
        vente={factureData}
        onClose={handleCloseFacture}
        onConfirmPaiement={async () => {
          handleCloseFacture();
        }}
        onRefresh={() => charger()}
      />
    );
  }

  if (showRecu && recuVenteId) {
    return (
      <ModalRecu
        commande={{ id: recuVenteId }}
        onClose={handleCloseRecu}
      />
    );
  }

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <LoadingOverlay visible={true} />
        <Text>Chargement...</Text>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconFileText size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Factures & Reçus</Title>
                  <Text c="gray.3" size="sm">Consultez et imprimez les factures et reçus</Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Filtres */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group grow>
              <TextInput
                placeholder="Rechercher par client ou code..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                radius="md"
              />
              <Select
                value={filterType}
                onChange={(val) => { setFilterType(val || 'all'); setCurrentPage(1); }}
                data={typeOptions}
                radius="md"
              />
              <Select
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val || 'all'); setCurrentPage(1); }}
                data={statusOptions}
                radius="md"
              />
            </Group>
          </Card>

          {/* Tableau */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {ventesFiltrees.length === 0 ? (
              <Center py={60}>
                <Text c="dimmed">Aucune vente trouvée</Text>
              </Center>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Code</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Type</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Client</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Payé</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Reste</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center' }}>Statut</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center' }}>Documents</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((vente) => {
                      const statut = getStatut(vente);
                      const type = getTypeLabel(vente.type_vente);
                      const isCommande = vente.type_vente === 'commande';
                      const aDesPaiements = vente.montant_regle > 0;

                      return (
                        <Table.Tr key={vente.id}>
                          <Table.Td>
                            <Badge variant="light" color="blue" size="sm">{vente.code_vente}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="sm" variant="light" color={type.color}>{type.label}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}><IconUser size={14} />{vente.client_nom || '-'}</Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}><IconCalendar size={14} />{new Date(vente.date_vente).toLocaleDateString('fr-FR')}</Group>
                          </Table.Td>
                          <Table.Td ta="right" fw={600}>{vente.montant_total.toLocaleString()} FCFA</Table.Td>
                          <Table.Td ta="right" c="green">{vente.montant_regle.toLocaleString()} FCFA</Table.Td>
                          <Table.Td ta="right" c="red">{vente.montant_restant.toLocaleString()} FCFA</Table.Td>
                          <Table.Td ta="center">
                            <Badge color={statut.color} size="sm">{statut.label}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              {isCommande && (
                                <Button variant="light" color="blue" size="compact-sm" onClick={() => ouvrirFacture(vente)}>
                                  <IconFileText size={14} /> Facture
                                </Button>
                              )}
                              <Button 
                                variant="light" 
                                color="green" 
                                size="compact-sm" 
                                onClick={() => ouvrirRecu(vente)}
                                disabled={!aDesPaiements}
                              >
                                <IconReceipt size={14} /> Reçu
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" />
                  </Group>
                )}
              </>
            )}
          </Card>

          {/* Modal Instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Guide" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">📄 <strong>Factures</strong> : uniquement pour les commandes sur mesure</Text>
              <Text size="sm">🧾 <strong>Reçus</strong> : pour toutes les ventes avec paiement</Text>
              <Text size="sm">🔍 Filtrez par type ou statut de paiement</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 3.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default FacturesRecus;