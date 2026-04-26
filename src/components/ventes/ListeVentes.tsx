// src/components/ventes/ListeVentes.tsx
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
  Container,
  Avatar,
  Center,
  Paper,
  Progress,
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
  IconEye,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulaireVente from './FormulaireVente';
import { notifications } from '@mantine/notifications';

interface Vente {
  id: number;
  code_vente: string;
  type_vente: 'sur_mesure' | 'pret_a_porter' | 'matiere';
  date_vente: string;
  client_id: string | null;
  client_nom: string | null;
  client_telephone?: string;
  mode_paiement: string;
  montant_total: number;
  montant_regle: number;
  montant_restant: number;
  statut: 'EN_ATTENTE' | 'PARTIEL' | 'PAYEE';
  observation: string | null;
  created_at: string;
  designation?: string;
  taille?: string;
  quantite?: number;
  prix_unitaire?: number;
  date_livraison?: string;
}

interface VenteDetail {
  id: number;
  code_vente: string;
  type_vente: string;
  date_vente: string;
  client_id: string | null;
  client_nom: string | null;
  mode_paiement: string;
  montant_total: number;
  montant_regle: number;
  statut: string;
  observation: string | null;
  created_at: string;
  detail_id: number;
  matiere_id: number | null;
  tenue_variante_id: number | null;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  taille_libelle: string | null;
}

const ListeVentes: React.FC = () => {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [typeFiltre, setTypeFiltre] = useState<string | null>(null);
  const [statutFiltre, setStatutFiltre] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vueForm, setVueForm] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [detailsVente, setDetailsVente] = useState<VenteDetail | null>(null);
  const itemsPerPage = 10;

const chargerVentes = async () => {
  setLoading(true);
  const db = await getDb();
  try {
    const result = await db.select<any[]>(`
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
        v.observation,
        v.created_at,
        GROUP_CONCAT(vd.designation) as produits,
        GROUP_CONCAT(vd.taille_libelle) as tailles,
        SUM(vd.quantite) as quantite_totale
      FROM ventes v
      LEFT JOIN vente_details vd ON v.id = vd.vente_id
      GROUP BY v.id
      ORDER BY v.date_vente DESC
    `);
    
    const formattedVentes = result.map(v => ({
      ...v,
      designation: v.produits ? v.produits.split(',')[0] : '-',
      taille: v.tailles ? v.tailles.split(',')[0] : null,
      quantite: v.quantite_totale || 1,
    }));
    
    setVentes(formattedVentes);
  } catch (error) {
    console.error(error);
    notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
  } finally {
    setLoading(false);
  }
};

  const chargerDetailsVente = async (venteId: number) => {
    const db = await getDb();
    try {
      const details = await db.select<VenteDetail[]>(`
        SELECT 
          v.*,
          vd.id as detail_id,
          vd.matiere_id,
          vd.tenue_variante_id,
          vd.designation,
          vd.quantite,
          vd.prix_unitaire,
          vd.total,
          vd.taille_libelle
        FROM ventes v
        LEFT JOIN vente_details vd ON v.id = vd.vente_id
        WHERE v.id = ?
      `, [venteId]);
      
      if (details && details.length > 0) {
        setDetailsVente(details[0]);
      } else {
        setDetailsVente(null);
      }
    } catch (error) {
      console.error(error);
      setDetailsVente(null);
    }
  };

  useEffect(() => {
    chargerVentes();
  }, []);

  const supprimerVente = async (id: number, code_vente: string) => {
    if (!window.confirm(`Supprimer la vente "${code_vente}" ?`)) return;
    const db = await getDb();
    try {
      await db.execute("DELETE FROM ventes WHERE id = ?", [id]);
      await chargerVentes();
      notifications.show({
        title: 'Succès',
        message: `Vente "${code_vente}" supprimée`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de la suppression',
        color: 'red',
      });
    }
  };

  const handleReset = () => {
    setRecherche('');
    setTypeFiltre(null);
    setStatutFiltre(null);
    chargerVentes();
    setCurrentPage(1);
  };

  const voirDetails = async (vente: Vente) => {
    setSelectedVente(vente);
    await chargerDetailsVente(vente.id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sur_mesure': return <IconShirt size={12} />;
      case 'pret_a_porter': return <IconShoppingBag size={12} />;
      default: return <IconPackage size={12} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sur_mesure': return 'purple';
      case 'pret_a_porter': return 'teal';
      default: return 'green';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sur_mesure': return 'Sur mesure';
      case 'pret_a_porter': return 'Prêt-à-porter';
      default: return 'Matière';
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'PAYEE': return 'green';
      case 'PARTIEL': return 'orange';
      default: return 'red';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'PAYEE': return 'Payée';
      case 'PARTIEL': return 'Paiement partiel';
      default: return 'En attente';
    }
  };

  const ventesFiltrees = ventes.filter(v => {
    const matchRecherche = v.code_vente?.toLowerCase().includes(recherche.toLowerCase()) ||
      v.client_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      v.designation?.toLowerCase().includes(recherche.toLowerCase());
    const matchType = typeFiltre === null || typeFiltre === 'tous' || v.type_vente === typeFiltre;
    const matchStatut = statutFiltre === null || statutFiltre === 'tous' || v.statut === statutFiltre;
    return matchRecherche && matchType && matchStatut;
  });

  const totalPages = Math.ceil(ventesFiltrees.length / itemsPerPage);
  const paginatedData = ventesFiltrees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalVentes = ventesFiltrees.reduce((sum, v) => sum + (v.montant_total || 0), 0);
  const totalRegle = ventesFiltrees.reduce((sum, v) => sum + (v.montant_regle || 0), 0);

  const statsParType = {
    sur_mesure: ventesFiltrees.filter(v => v.type_vente === 'sur_mesure').reduce((sum, v) => sum + (v.montant_total || 0), 0),
    pret_a_porter: ventesFiltrees.filter(v => v.type_vente === 'pret_a_porter').reduce((sum, v) => sum + (v.montant_total || 0), 0),
    matiere: ventesFiltrees.filter(v => v.type_vente === 'matiere').reduce((sum, v) => sum + (v.montant_total || 0), 0),
  };

  const typeOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'sur_mesure', label: '👗 Sur mesure' },
    { value: 'pret_a_porter', label: '👕 Prêt-à-porter' },
    { value: 'matiere', label: '📦 Matières' },
  ];

  const statutOptions = [
    { value: 'tous', label: '📊 Tous statuts' },
    { value: 'PAYEE', label: '✅ Payée' },
    { value: 'PARTIEL', label: '⚠️ Paiement partiel' },
    { value: 'EN_ATTENTE', label: '⏳ En attente' },
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
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconShoppingBag size={40} stroke={1.5} />
            <Text>Chargement des ventes...</Text>
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
                  <IconShoppingBag size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Ventes</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gestion des ventes (sur mesure, prêt-à-porter, matières)
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {ventesFiltrees.length} vente{ventesFiltrees.length > 1 ? 's' : ''}
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

          {/* KPIs */}
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Chiffre d'affaires</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconCash size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{totalVentes.toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="blue" mt={8} />
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Encaissements</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconCash size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalRegle.toLocaleString()} FCFA</Text>
              <Progress value={totalVentes > 0 ? (totalRegle / totalVentes) * 100 : 0} size="sm" radius="xl" color="green" mt={8} />
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Sur mesure</Text>
                <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                  <IconShirt size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="purple">{statsParType.sur_mesure.toLocaleString()} FCFA</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Prêt-à-porter</Text>
                <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                  <IconShoppingBag size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="teal">{statsParType.pret_a_porter.toLocaleString()} FCFA</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher par code, client ou produit..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 280 }}
                />
                <Select
                  placeholder="Type"
                  data={typeOptions}
                  value={typeFiltre}
                  onChange={setTypeFiltre}
                  size="md"
                  radius="md"
                  style={{ width: 150 }}
                  clearable
                />
                <Select
                  placeholder="Statut"
                  data={statutOptions}
                  value={statutFiltre}
                  onChange={setStatutFiltre}
                  size="md"
                  radius="md"
                  style={{ width: 150 }}
                  clearable
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setVueForm(true)}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouvelle vente
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des ventes */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {ventesFiltrees.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconShoppingBag size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucune vente trouvée</Text>
                <Button variant="light" onClick={() => setVueForm(true)}>
                  Ajouter une vente
                </Button>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', width: 100 }}>Code</Table.Th>
                      <Table.Th style={{ color: 'white', width: 90 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white', width: 100 }}>Type</Table.Th>
                      <Table.Th style={{ color: 'white', width: 180 }}>Client</Table.Th>
                      <Table.Th style={{ color: 'white', width: 200 }}>Produit</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 100 }}>Total</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 100 }}>Réglé</Table.Th>
                      <Table.Th style={{ color: 'white', width: 100 }}>Statut</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center', width: 80 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((v, index) => (
                      <Table.Tr key={`vente-${v.id}-${index}`}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{v.code_vente}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} wrap="nowrap">
                            <IconCalendar size={12} color="#1b365d" />
                            <Text size="sm">{new Date(v.date_vente).toLocaleDateString('fr-FR')}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getTypeColor(v.type_vente)} variant="light" size="md" leftSection={getTypeIcon(v.type_vente)}>
                            {getTypeLabel(v.type_vente)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>{v.client_nom || 'Client anonyme'}</Text>
                          {v.client_telephone && (
                            <Text size="xs" c="dimmed">{v.client_telephone}</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>{v.designation || '-'}</Text>
                          {v.taille && <Text size="xs" c="dimmed">Taille: {v.taille}</Text>}
                          {v.quantite && <Text size="xs" c="dimmed">Qté: {v.quantite}</Text>}
                        </Table.Td>
                        <Table.Td ta="right">
                          <Badge color="blue" variant="light" size="md">
                            {(v.montant_total || 0).toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm">{(v.montant_regle || 0).toLocaleString()} FCFA</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatutColor(v.statut)} variant="light" size="sm">
                            {getStatutLabel(v.statut)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group justify="center" gap={4}>
                            <Tooltip label="Voir détails">
                              <ActionIcon size="md" variant="subtle" color="blue" onClick={() => voirDetails(v)}>
                                <IconEye size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Supprimer">
                              <ActionIcon size="md" variant="subtle" color="red" onClick={() => supprimerVente(v.id, v.code_vente)}>
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" size="md" radius="md" />
                  </Group>
                )}
              </>
            )}
          </Card>

          {/* Modal Détails */}
          <Modal opened={!!selectedVente} onClose={() => { setSelectedVente(null); setDetailsVente(null); }} title={`Détails - ${selectedVente?.code_vente}`} size="lg" radius="lg">
            {selectedVente && (
              <Stack gap="md">
                <SimpleGrid cols={2} spacing="md">
                  <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" c="dimmed">Code</Text>
                    <Text fw={600}>{selectedVente.code_vente}</Text>
                  </Paper>
                  <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" c="dimmed">Date</Text>
                    <Text>{new Date(selectedVente.date_vente).toLocaleString()}</Text>
                  </Paper>
                  <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" c="dimmed">Type</Text>
                    <Text>{getTypeLabel(selectedVente.type_vente)}</Text>
                  </Paper>
                  <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" c="dimmed">Client</Text>
                    <Text>{selectedVente.client_nom || 'Anonyme'}</Text>
                  </Paper>
                  <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" c="dimmed">Mode paiement</Text>
                    <Text>{selectedVente.mode_paiement}</Text>
                  </Paper>
                  {selectedVente.date_livraison && (
                    <Paper p="sm" radius="md" withBorder>
                      <Text size="xs" c="dimmed">Livraison</Text>
                      <Text>{new Date(selectedVente.date_livraison).toLocaleDateString()}</Text>
                    </Paper>
                  )}
                </SimpleGrid>

                {detailsVente && (
                  <>
                    <Divider label="Détails du produit" labelPosition="center" />
                    <Paper p="sm" radius="md" withBorder>
                      <Text size="sm" fw={500}>{detailsVente.designation}</Text>
                      {detailsVente.taille_libelle && <Text size="xs" c="dimmed">Taille: {detailsVente.taille_libelle}</Text>}
                      <Group justify="space-between" mt="xs">
                        <Text size="sm">Quantité: {detailsVente.quantite}</Text>
                        <Text size="sm">Prix unitaire: {(detailsVente.prix_unitaire || 0).toLocaleString()} FCFA</Text>
                        <Text fw={600}>Total: {(detailsVente.total || 0).toLocaleString()} FCFA</Text>
                      </Group>
                    </Paper>
                  </>
                )}

                <Divider />
                <Group justify="space-between">
                  <Text fw={700}>Total :</Text>
                  <Text fw={700} size="lg" c="blue">{(selectedVente.montant_total || 0).toLocaleString()} FCFA</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Réglé :</Text>
                  <Text fw={600} c="green">{(selectedVente.montant_regle || 0).toLocaleString()} FCFA</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Reste :</Text>
                  <Text fw={600} c="orange">{(selectedVente.montant_restant || 0).toLocaleString()} FCFA</Text>
                </Group>

                {selectedVente.observation && (
                  <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" c="dimmed">Observation</Text>
                    <Text>{selectedVente.observation}</Text>
                  </Paper>
                )}
              </Stack>
            )}
          </Modal>

          {/* Modal Instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="lg">
            <Stack gap="md">
              <Text size="sm">1. Bouton "Nouvelle vente" pour enregistrer une vente</Text>
              <Text size="sm">2. Recherche par code, client ou produit</Text>
              <Text size="sm">3. Filtres par type (sur mesure, prêt-à-porter, matière)</Text>
              <Text size="sm">4. Filtres par statut (payée, partiel, en attente)</Text>
              <Text size="sm">5. Cliquez sur l'icône 👁️ pour voir les détails</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 2.0.0</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ListeVentes;