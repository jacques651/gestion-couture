// src/components/ventes/VentesManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Stack, Card, Title, Text, Group, Button, TextInput,
  Box, Modal, Avatar, Tooltip, ActionIcon,
  Container, Table, ScrollArea, Badge, Pagination, LoadingOverlay, Alert,
  SimpleGrid, Paper, ThemeIcon
} from '@mantine/core';
import {
  IconShoppingBag, IconTrash, IconSearch, IconRefresh,
  IconFileInvoice, IconReceipt, IconEye, IconEdit, IconX,
  IconPlus, IconAlertCircle, IconCash, IconTrendingUp, IconTrendingDown, IconChartPie
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { Vente } from '../../types/ventes';
import { getVentes, getVenteDetails, annulerVente, deleteVente } from "../../services/ventes";
import FormulaireVente from './FormulaireVente';
import ModalFacture from '../factures/ModalFacture';
import ModalRecu from '../paiements/ModalRecu';
import DetailsVenteModal from './DetailsVenteModal';
import EditVenteModal from './EditVenteModal';
import { useStock } from '../../hooks/useStock';

const VentesManager: React.FC = () => {
  const { updateStock } = useStock();
  const [loading, setLoading] = useState(false);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editVenteData, setEditVenteData] = useState<any>(null);
  const [showFacture, setShowFacture] = useState(false);
  const [factureData, setFactureData] = useState<any>(null);
  const [showRecu, setShowRecu] = useState(false);
  const [venteIdForRecu, setVenteIdForRecu] = useState<number | null>(null);
  const [deleteVenteModalOpen, setDeleteVenteModalOpen] = useState(false);
  const [deleteVenteId, setDeleteVenteId] = useState<number | null>(null);
  const [deleteVenteCode, setDeleteVenteCode] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [codeVente, setCodeVente] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const itemsPerPage = 10;

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    totalMontant: 0,
    totalRegle: 0,
    enAttente: 0,
    payees: 0,
    annulees: 0,
    partielles: 0
  });

  // Fonction pour restaurer le stock
  const restoreStock = async (details: any[]) => {
    for (const detail of details) {
      if (detail.article_id) {
        try {
          await updateStock(detail.article_id, detail.quantite, 'add');
        } catch (err) {
          console.warn(`⚠️ Erreur restauration stock article ${detail.article_id}:`, err);
        }
      }
    }
  };

  const loadVentes = async () => {
    try {
      setLoading(true);
      const data = await getVentes();
      
      // 🔥 Correction: Filtrer les ventes selon l'option showDeleted
      // Utiliser 'est_supprime' qui est dans l'interface Vente
      const filteredData = showDeleted ? data : data.filter((v: Vente) => v.est_supprime === 0);
      setVentes(filteredData);
      
      // Calculer les statistiques sur les ventes actives uniquement
      const activeVentes = data.filter((v: Vente) => v.est_supprime === 0);
      const total = activeVentes.length;
      let totalMontant = 0;
      let totalRegle = 0;
      let enAttente = 0;
      let payees = 0;
      let annulees = 0;
      let partielles = 0;

      activeVentes.forEach((v: Vente) => {
        totalMontant += Number(v.montant_total || 0);
        totalRegle += Number(v.montant_regle || 0);
        
        if (v.statut === 'PAYEE') payees++;
        else if (v.statut === 'ANNULEE') annulees++;
        else if (v.statut === 'PARTIEL') partielles++;
        else enAttente++;
      });

      setStats({
        total,
        totalMontant,
        totalRegle,
        enAttente,
        payees,
        annulees,
        partielles
      });
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const { apiPost } = await import('../../services/api');
      const data = await apiPost("/ventes/generate-code", {});
      setCodeVente(data.code);
    } catch (error) {
      console.error("Erreur génération code:", error);
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setCodeVente(`VENTE-${year}-${random}`);
    }
  };

  useEffect(() => {
    loadVentes();
  }, [showDeleted]);

  const handleViewDetails = async (vente: Vente) => {
    try {
      setLoading(true);
      const detailsData = await getVenteDetails(vente.id);
      setSelectedVente(vente);
      setSelectedDetails(detailsData || []);
      setDetailsModalOpen(true);
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditVente = async (vente: Vente) => {
    try {
      setLoading(true);
      const { getVente, getRendezVous } = await import('../../services/ventes');
      const data = await getVente(vente.id);
      const detailsData = await getVenteDetails(vente.id);
      
      let rendezvousData = null;
      try {
        const rendezvousList = await getRendezVous();
        const rdv = rendezvousList.find((r: any) => r.vente_id === vente.id);
        if (rdv) {
          rendezvousData = {
            date_rendezvous: rdv.date_rendezvous,
            heure_rendezvous: rdv.heure_rendezvous || '',
            type_rendezvous: rdv.type_rendezvous || 'essayage',
            statut: rdv.statut,
            client_id: rdv.client_id
          };
        }
      } catch (err) {
        console.warn('Erreur chargement rendez-vous:', err);
      }

      setEditVenteData({
        ...data,
        id: vente.id,
        client_nom: data.client_nom || vente.client_nom,
        client_id: data.client_id || vente.client_id,
        lignes: detailsData || [],
        rendezvous: rendezvousData
      });
      setEditModalOpen(true);
    } catch (err: any) {
      console.error(err);
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowFacture = (vente: Vente) => {
    if (vente.type_vente !== 'commande') {
      notifications.show({ 
        title: 'Info', 
        message: 'Seules les commandes sur mesure ont une facture', 
        color: 'blue' 
      });
      return;
    }
    setFactureData(vente);
    setShowFacture(true);
  };

  const handleShowRecu = (vente: Vente) => {
    setVenteIdForRecu(vente.id);
    setShowRecu(true);
  };

  const handleAnnulerVente = async (venteId: number, codeVente: string) => {
    if (!globalThis.confirm(`Annuler la vente "${codeVente}" ?`)) return;
    try {
      setLoading(true);
      const details = await getVenteDetails(venteId);
      await restoreStock(details);
      await annulerVente(venteId);
      
      notifications.show({ 
        title: 'Succès', 
        message: `Vente ${codeVente} annulée et stock restauré`, 
        color: 'green' 
      });
      await loadVentes();
    } catch (err: any) {
      console.error(err);
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVente = async () => {
    if (!deleteVenteId) return;
    try {
      setLoading(true);
      const details = await getVenteDetails(deleteVenteId);
      await restoreStock(details);
      await deleteVente(deleteVenteId);
      
      notifications.show({ 
        title: 'Succès', 
        message: `Vente ${deleteVenteCode} supprimée et stock restauré`, 
        color: 'green' 
      });
      setDeleteVenteModalOpen(false);
      setDeleteVenteId(null);
      setDeleteVenteCode('');
      await loadVentes();
    } catch (err: any) {
      notifications.show({ title: 'Erreur', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'PAYEE': return <Badge color="green" size="md">✅ Payée</Badge>;
      case 'PARTIEL': return <Badge color="orange" size="md">🔄 Partiel</Badge>;
      case 'ANNULEE': return <Badge color="red" size="md">❌ Annulée</Badge>;
      default: return <Badge color="blue" size="md">⏳ En cours</Badge>;
    }
  };

  // 🔥 Correction: Filtrer les ventes avec le type correct
  const filteredVentes = ventes.filter((v: Vente) =>
    (v.code_vente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.client_nom || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedVentes = filteredVentes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredVentes.length / itemsPerPage);

  if (showForm) {
    return (
      <FormulaireVente
        codeVente={codeVente}
        onBack={() => setShowForm(false)}
        onSuccess={() => {
          setShowForm(false);
          loadVentes();
        }}
        generateCode={generateCode}
      />
    );
  }

  if (showFacture && factureData) {
    return (
      <ModalFacture
        vente={factureData}
        onClose={() => setShowFacture(false)}
        onRefresh={loadVentes}
      />
    );
  }

  if (showRecu && venteIdForRecu) {
    return (
      <ModalRecu
        commande={{ id: venteIdForRecu }}
        onClose={() => { setShowRecu(false); setVenteIdForRecu(null); }}
      />
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="lg" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconShoppingBag size={24} color="white" />
                </Avatar>
                <Box>
                  <Title order={2} c="white">Gestion des Ventes</Title>
                  <Text c="gray.3" size="sm">
                    {stats.total} vente{stats.total > 1 ? 's' : ''} au total
                  </Text>
                </Box>
              </Group>
              <Group>
                <Button 
                  leftSection={<IconPlus size={16} />} 
                  onClick={() => { setShowForm(true); generateCode(); }} 
                  variant="white" 
                  color="dark"
                >
                  Nouvelle vente
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Statistiques */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Paper withBorder radius="lg" p="md" shadow="sm">
              <Group gap="xs">
                <ThemeIcon color="blue" variant="light" radius="md">
                  <IconCash size={20} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Total encaissé</Text>
                  <Text fw={700} size="lg">{formatPrice(stats.totalRegle)}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper withBorder radius="lg" p="md" shadow="sm">
              <Group gap="xs">
                <ThemeIcon color="green" variant="light" radius="md">
                  <IconTrendingUp size={20} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Ventes payées</Text>
                  <Text fw={700} size="lg">{stats.payees}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper withBorder radius="lg" p="md" shadow="sm">
              <Group gap="xs">
                <ThemeIcon color="orange" variant="light" radius="md">
                  <IconTrendingDown size={20} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">En attente</Text>
                  <Text fw={700} size="lg">{stats.enAttente + stats.partielles}</Text>
                </Box>
              </Group>
            </Paper>

            <Paper withBorder radius="lg" p="md" shadow="sm">
              <Group gap="xs">
                <ThemeIcon color="red" variant="light" radius="md">
                  <IconChartPie size={20} />
                </ThemeIcon>
                <Box>
                  <Text size="xs" c="dimmed">Annulées</Text>
                  <Text fw={700} size="lg">{stats.annulees}</Text>
                </Box>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* Contenu principal */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <Stack gap="md">
              {/* Barre de recherche et filtres */}
              <Group>
                <TextInput 
                  placeholder="Rechercher par code ou client..." 
                  leftSection={<IconSearch size={16} />} 
                  value={searchTerm} 
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                  style={{ flex: 1 }} 
                  radius="md"
                />
                <Tooltip label="Actualiser">
                  <ActionIcon 
                    variant="light" 
                    onClick={async () => { setRefreshing(true); await loadVentes(); setRefreshing(false); }} 
                    size="lg"
                    loading={refreshing}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={showDeleted ? "Voir les ventes actives" : "Voir les ventes supprimées"}>
                  <Button 
                    variant={showDeleted ? 'filled' : 'outline'} 
                    color="gray" 
                    size="xs"
                    onClick={() => setShowDeleted(!showDeleted)}
                  >
                    {showDeleted ? '📋 Actives' : '🗑️ Supprimées'}
                  </Button>
                </Tooltip>
              </Group>

              <LoadingOverlay visible={loading} />

              {/* Tableau des ventes */}
              {filteredVentes.length === 0 ? (
                <Alert 
                  icon={<IconAlertCircle size={16} />} 
                  color="blue" 
                  variant="light" 
                  radius="md"
                  title={showDeleted ? "Aucune vente supprimée" : "Aucune vente trouvée"}
                >
                  {searchTerm ? 'Aucun résultat pour votre recherche' : 
                   showDeleted ? 'Aucune vente n\'a été supprimée' : 
                   'Commencez par créer une nouvelle vente'}
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table striped highlightOnHover withColumnBorders>
                      <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                        <Table.Tr>
                          <Table.Th style={{ color: 'white', fontSize: 12 }}>Code</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12 }}>Type</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12 }}>Date</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12 }}>Client</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12, textAlign: 'right' }}>Total</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12, textAlign: 'right' }}>Réglé</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12 }}>Statut</Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: 12, textAlign: 'center', minWidth: 200 }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedVentes.map((vente: Vente) => {
                          const isDeleted = vente.est_supprime === 1;
                          return (
                            <Table.Tr key={vente.id} style={{ opacity: isDeleted ? 0.6 : 1 }}>
                              <Table.Td>
                                <Badge variant="light" color={isDeleted ? "gray" : "blue"} size="md">
                                  {vente.code_vente}
                                  {isDeleted && " 🗑️"}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Badge 
                                  size="sm" 
                                  variant="light" 
                                  color={vente.type_vente === 'commande' ? 'violet' : vente.type_vente === 'pret_a_porter' ? 'cyan' : 'teal'}
                                >
                                  {vente.type_vente === 'commande' ? '📝 Sur mesure' : 
                                   vente.type_vente === 'pret_a_porter' ? '👕 Prêt-à-porter' : '📦 Matière'}
                                </Badge>
                              </Table.Td>
                              <Table.Td>{new Date(vente.date_vente).toLocaleDateString('fr-FR')}</Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={500}>{vente.client_nom || '-'}</Text>
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>
                                <Text fw={600}>{formatPrice(vente.montant_total)}</Text>
                              </Table.Td>
                              <Table.Td style={{ textAlign: 'right' }}>
                                <Text c="green">{formatPrice(vente.montant_regle)}</Text>
                              </Table.Td>
                              <Table.Td>{getStatusBadge(vente.statut)}</Table.Td>
                              <Table.Td>
                                <Group gap={4} justify="center" wrap="nowrap">
                                  <Tooltip label="Détails">
                                    <ActionIcon 
                                      variant="light" 
                                      color="blue" 
                                      size="sm" 
                                      onClick={() => handleViewDetails(vente)}
                                    >
                                      <IconEye size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                  {!isDeleted && (
                                    <>
                                      <Tooltip label="Modifier">
                                        <ActionIcon 
                                          variant="light" 
                                          color="yellow" 
                                          size="sm" 
                                          onClick={() => handleEditVente(vente)}
                                          disabled={vente.statut === 'ANNULEE'}
                                        >
                                          <IconEdit size={14} />
                                        </ActionIcon>
                                      </Tooltip>
                                      {vente.type_vente === 'commande' && (
                                        <Tooltip label="Facture">
                                          <ActionIcon 
                                            variant="light" 
                                            color="teal" 
                                            size="sm" 
                                            onClick={() => handleShowFacture(vente)}
                                          >
                                            <IconFileInvoice size={14} />
                                          </ActionIcon>
                                        </Tooltip>
                                      )}
                                      {vente.montant_regle > 0 && (
                                        <Tooltip label="Reçu">
                                          <ActionIcon 
                                            variant="light" 
                                            color="grape" 
                                            size="sm" 
                                            onClick={() => handleShowRecu(vente)}
                                          >
                                            <IconReceipt size={14} />
                                          </ActionIcon>
                                        </Tooltip>
                                      )}
                                      {vente.statut !== 'ANNULEE' && vente.statut !== 'PAYEE' && (
                                        <Tooltip label="Annuler">
                                          <ActionIcon 
                                            variant="light" 
                                            color="orange" 
                                            size="sm" 
                                            onClick={() => handleAnnulerVente(vente.id, vente.code_vente)}
                                          >
                                            <IconX size={14} />
                                          </ActionIcon>
                                        </Tooltip>
                                      )}
                                      <Tooltip label="Supprimer">
                                        <ActionIcon 
                                          variant="light" 
                                          color="red" 
                                          size="sm" 
                                          onClick={() => { 
                                            setDeleteVenteId(vente.id); 
                                            setDeleteVenteCode(vente.code_vente); 
                                            setDeleteVenteModalOpen(true); 
                                          }}
                                        >
                                          <IconTrash size={14} />
                                        </ActionIcon>
                                      </Tooltip>
                                    </>
                                  )}
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>

                  {totalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination 
                        total={totalPages} 
                        value={currentPage} 
                        onChange={setCurrentPage} 
                        color="#1b365d" 
                      />
                    </Group>
                  )}
                </>
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>

      {/* Modals */}
      <DetailsVenteModal
        opened={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        vente={selectedVente}
        details={selectedDetails}
        onShowFacture={handleShowFacture}
        onShowRecu={handleShowRecu}
        formatPrice={formatPrice}
      />

      <EditVenteModal
        opened={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditVenteData(null); }}
        venteData={editVenteData}
        onSave={() => {
          setEditModalOpen(false);
          setEditVenteData(null);
          loadVentes();
        }}
        loading={loading}
      />

      {/* Modal confirmation suppression */}
      <Modal 
        opened={deleteVenteModalOpen} 
        onClose={() => { setDeleteVenteModalOpen(false); setDeleteVenteId(null); setDeleteVenteCode(''); }} 
        title="Confirmation de suppression" 
        size="sm" 
        centered
        radius="md"
        styles={{
          header: { backgroundColor: '#e03131' },
          title: { color: 'white', fontWeight: 600 }
        }}
      >
        <Stack gap="md">
          <Alert color="red" variant="light" radius="md">
            <Stack gap={4}>
              <Text size="sm" fw={600}>Supprimer la vente "{deleteVenteCode}" ?</Text>
              <Text size="xs">Cette action est irréversible. Le stock sera restauré.</Text>
            </Stack>
          </Alert>
          <Group justify="flex-end" gap="sm">
            <Button 
              variant="light" 
              onClick={() => { setDeleteVenteModalOpen(false); setDeleteVenteId(null); setDeleteVenteCode(''); }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button 
              color="red" 
              onClick={handleDeleteVente} 
              loading={loading} 
              leftSection={<IconTrash size={16} />}
            >
              Supprimer définitivement
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default VentesManager;