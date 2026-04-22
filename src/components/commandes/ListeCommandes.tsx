import React, { useState, useEffect, useRef } from 'react';
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
  SimpleGrid,
  LoadingOverlay,
  SegmentedControl,
  Tooltip,
  ThemeIcon,
  Box,
  ScrollArea,
  Modal,
  Divider,
} from '@mantine/core';
import {
  IconPlus,
  IconEye,
  IconFileText,
  IconSearch,
  IconShoppingBag,
  IconCheck,
  IconClock,
  IconX,
  IconReceipt,
  IconInfoCircle,
} from '@tabler/icons-react';
import { selectSafe } from '../../database/db';
import FormulaireCommande from './FormulaireCommande';
import FicheCommande from './FicheCommande';
import ModalFacture from '../factures/ModalFacture';

interface Commande {
  id: number;
  client_id: string;
  client_nom: string;
  designation: string;
  nombre: number;
  prix_unitaire: number;
  total: number;
  date_commande: string;
  rendez_vous: string | null;
  etat: string;
  observation: string | null;
  paye: number;
  reste: number;
}

const ListeCommandes: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [recherche, setRecherche] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCommandeId, setSelectedCommandeId] = useState<number | null>(null);
  const [factureData, setFactureData] = useState<any>(null);
  const [filtreStatut, setFiltreStatut] = useState<'TOUS' | 'PAYE' | 'PARTIEL' | 'NON_PAYE'>('TOUS');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'client' | 'designation' | 'total' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const loaded = useRef(false);

  const fetchCommandes = async () => {
    setLoading(true);
    const commandesData = await selectSafe<any>(`
      SELECT c.*, cl.nom_prenom as client_nom
      FROM commandes c
      JOIN clients cl ON c.client_id = cl.telephone_id
      WHERE c.est_supprime = 0
      ORDER BY c.date_commande DESC
    `);

    if (!commandesData.length) {
      setCommandes([]);
      setLoading(false);
      return;
    }

    const ids = commandesData.map(c => c.id);

    const paiements = await selectSafe<any>(`
      SELECT commande_id, SUM(montant) as total_paye
      FROM paiements_commandes
      WHERE commande_id IN (${ids.map(() => '?').join(',')})
      GROUP BY commande_id
    `, ids);

    const payeParCommande = new Map<number, number>();
    paiements.forEach(p => payeParCommande.set(p.commande_id, p.total_paye));

    const commandesAvecPaiements: Commande[] = commandesData.map(c => {
      const paye = payeParCommande.get(c.id) || 0;
      const total = Number(c.total) || 0;
      const reste = total - paye;

      return {
        id: c.id,
        client_id: c.client_id,
        client_nom: c.client_nom,
        designation: c.designation,
        nombre: c.nombre,
        prix_unitaire: c.prix_unitaire,
        total: total,
        date_commande: c.date_commande,
        rendez_vous: c.rendez_vous,
        etat: c.etat,
        observation: c.observation,
        paye: paye,
        reste: reste
      };
    });

    setCommandes(commandesAvecPaiements);
    setLoading(false);
  };

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    fetchCommandes();
  }, []);

  if (showForm) {
    return (
      <FormulaireCommande
        onBack={() => setShowForm(false)}
        onSuccess={() => {
          fetchCommandes();
          setShowForm(false);
        }}
      />
    );
  }

  if (selectedCommandeId) {
    return (
      <FicheCommande
        commandeId={selectedCommandeId}
        onBack={() => setSelectedCommandeId(null)}
      />
    );
  }

  // Filtrer les commandes
  const commandesFiltrees = commandes.filter((c) => {
    const match =
      c.client_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.designation?.toLowerCase().includes(recherche.toLowerCase());

    if (!match) return false;

    if (filtreStatut === 'PAYE') return c.reste <= 0;
    if (filtreStatut === 'PARTIEL') return c.paye > 0 && c.reste > 0;
    if (filtreStatut === 'NON_PAYE') return c.paye === 0;

    return true;
  });

  // Trier les commandes
  const commandesTriees = [...commandesFiltrees].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'client') {
      comparison = a.client_nom.localeCompare(b.client_nom);
    } else if (sortBy === 'designation') {
      comparison = a.designation.localeCompare(b.designation);
    } else if (sortBy === 'total') {
      comparison = a.total - b.total;
    } else if (sortBy === 'date') {
      comparison = new Date(a.date_commande).getTime() - new Date(b.date_commande).getTime();
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const total = commandesFiltrees.reduce((s, c) => s + c.total, 0);
  const totalPaye = commandesFiltrees.reduce((s, c) => s + c.paye, 0);
  const totalReste = total - totalPaye;

  const getStatutBadge = (cmd: Commande) => {
    if (cmd.reste <= 0) {
      return { label: 'Payé', color: 'green', icon: <IconCheck size={12} /> };
    }
    if (cmd.paye > 0) {
      return { label: 'Partiel', color: 'orange', icon: <IconClock size={12} /> };
    }
    return { label: 'Impayé', color: 'red', icon: <IconX size={12} /> };
  };

  const handleSort = (column: 'client' | 'designation' | 'total' | 'date') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const ouvrirFacture = (cmd: Commande) => {
    setFactureData({
      id: cmd.id,
      client: {
        nom_prenom: cmd.client_nom,
        telephone_id: cmd.client_id
      },
      lignes: [
        {
          designation: cmd.designation,
          quantite: cmd.nombre,
          prix_unitaire: cmd.prix_unitaire
        }
      ],
      numero: `FAC-${cmd.id}-${Date.now()}`,
      avance: cmd.paye,
      reste: cmd.reste,
      total_general: cmd.total,
    });
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des commandes...</Text>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER */}
        {/* HEADER */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <IconShoppingBag size={24} color="white" />
                <Title order={2} c="white">Commandes</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion et suivi des commandes clients
              </Text>
            </Stack>
            <Group>
              {/* BOUTON INFO AVEC TITRE */}
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
                radius="md"
              >
                Instructions
              </Button>
              <ThemeIcon size={48} radius="md" color="white" variant="light">
                <IconReceipt size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATISTIQUES KPI */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total des commandes
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconShoppingBag size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {total.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total payé
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconCheck size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalPaye.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Reste à payer
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconX size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {totalReste.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par client ou produit..."
              leftSection={<IconSearch size={16} />}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              size="sm"
              style={{ width: 300 }}
            />
            <SegmentedControl
              value={filtreStatut}
              onChange={(value) => setFiltreStatut(value as typeof filtreStatut)}
              data={[
                { label: 'Toutes', value: 'TOUS' },
                { label: 'Payées', value: 'PAYE' },
                { label: 'Partielles', value: 'PARTIEL' },
                { label: 'Impayées', value: 'NON_PAYE' },
              ]}
              color="blue"
              size="sm"
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowForm(true)}
              variant="gradient"
              gradient={{ from: 'cyan', to: 'blue' }}
            >
              Nouvelle commande
            </Button>
          </Group>
        </Card>

        {/* TABLEAU DES COMMANDES */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {commandesTriees.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune commande trouvée
            </Text>
          ) : (
            <ScrollArea style={{ maxHeight: 600 }}>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
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
                      onClick={() => handleSort('designation')}
                    >
                      <Group gap={4}>
                        Désignation
                        {sortBy === 'designation' && (
                          <Text size="xs" c="yellow">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </Text>
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ textAlign: 'center', color: 'white' }}>Qté</Table.Th>
                    <Table.Th
                      style={{ cursor: 'pointer', textAlign: 'right', color: 'white' }}
                      onClick={() => handleSort('total')}
                    >
                      <Group gap={4} justify="flex-end">
                        Total
                        {sortBy === 'total' && (
                          <Text size="xs" c="yellow">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </Text>
                        )}
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ textAlign: 'center', color: 'white' }}>Statut</Table.Th>
                    <Table.Th style={{ textAlign: 'center', color: 'white' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {commandesTriees.map((cmd) => {
                    const statut = getStatutBadge(cmd);
                    return (
                      <Table.Tr key={cmd.id}>
                        <Table.Td fw={500}>{cmd.client_nom}</Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={1}>
                            {cmd.designation}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="center">{cmd.nombre}</Table.Td>
                        <Table.Td ta="right" fw={600}>
                          {cmd.total.toLocaleString()} FCFA
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge color={statut.color} variant="light" leftSection={statut.icon} size="sm">
                            {statut.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={6} justify="center">
                            <Tooltip label="Voir le détail">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="blue"
                                onClick={() => setSelectedCommandeId(cmd.id)}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Générer la facture">
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="teal"
                                onClick={() => ouvrirFacture(cmd)}
                              >
                                <IconFileText size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle commande" pour créer une commande</Text>
            <Text size="sm">2. La recherche filtre par client ou par produit</Text>
            <Text size="sm">3. Cliquez sur les en-têtes pour trier le tableau</Text>
            <Text size="sm">4. Le filtre par statut permet de voir les commandes payées, partielles ou impayées</Text>
            <Text size="sm">5. Cliquez sur l'icône 👁️ pour voir le détail d'une commande</Text>
            <Text size="sm">6. Cliquez sur l'icône 📄 pour générer la facture</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>

        {/* MODAL FACTURE */}
        {factureData && (
          <ModalFacture
            commande={factureData}
            onClose={() => setFactureData(null)}
          />
        )}
      </Stack>
    </Box>
  );
};

export default ListeCommandes;