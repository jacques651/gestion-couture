import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  SimpleGrid,
  ThemeIcon,
  Table,
  Badge,
  ScrollArea,
  LoadingOverlay,
  Divider,
  Grid,
  Button,
  Modal,
  Box,
} from '@mantine/core';
import {
  IconUsers,
  IconShoppingBag,
  IconReceipt,
  IconMoneybag,
  IconChartBar,
  IconTrendingUp,
  IconBuildingStore,
  IconPackage,
  IconFileInvoice,
  IconCheck,
  IconCurrencyFrank,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useFinance } from '../../hooks/useFinance';
import { getDb } from '../../database/db';

type PageKey =
  | 'dashboard'
  | 'clients'
  | 'commandes'
  | 'paiements'
  | 'depenses'
  | 'salaires'
  | 'journal_caisse'
  | 'stock_global'
  | 'matieres'
  | 'ventes'
  | 'factures';

interface DashboardProps {
  setPage: (page: PageKey) => void;
}

// ================= HELPERS =================
const formatCurrency = (v?: number) => `${(v || 0).toLocaleString('fr-FR')} FCFA`;

// ================= COMPONENT =================
const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const { stats, journal, loading } = useFinance();
  const [stock, setStock] = useState<any[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // ================= LOAD STOCK =================
  useEffect(() => {
    const loadStock = async () => {
      const db = await getDb();

      const res = await db.select<any[]>(`
        SELECT 
          m.designation,
          COALESCE(SUM(e.quantite),0) - COALESCE(SUM(s.quantite),0) as stock,
          CASE 
            WHEN SUM(e.quantite) > 0 
            THEN SUM(e.quantite * e.cout_unitaire) / SUM(e.quantite)
            ELSE 0
          END as cout_moyen
        FROM matieres m
        LEFT JOIN entrees_stock e ON e.matiere_id = m.id
        LEFT JOIN sorties_stock s ON s.matiere_id = m.id
        WHERE m.est_supprime = 0
        GROUP BY m.id
      `);

      setStock(res || []);
      const total = (res || []).reduce(
        (sum, m) => sum + (m.stock * m.cout_moyen),
        0
      );
      setStockTotal(total);
    };

    loadStock();
  }, []);

  // ================= KPI =================
  const tauxRecouvrement = stats.chiffreAffaires > 0
    ? (stats.encaissements / stats.chiffreAffaires) * 100
    : 0;

  const beneficeReel = stats.beneficeTresorerie - stockTotal;

  // Liens rapides vers toutes les sections
  const quickLinks = [
    { label: 'Clients', action: () => setPage('clients'), icon: <IconUsers size={20} />, color: 'adminBlue', description: 'Gestion des clients' },
    { label: 'Commandes', action: () => setPage('commandes'), icon: <IconShoppingBag size={20} />, color: 'adminBlue', description: 'Gestion des commandes' },
    { label: 'Paiements', action: () => setPage('paiements'), icon: <IconMoneybag size={20} />, color: 'adminBlue', description: 'Enregistrer les paiements' },
    { label: 'Factures', action: () => setPage('factures'), icon: <IconFileInvoice size={20} />, color: 'adminBlue', description: 'Gestion des factures' },
    { label: 'Stock', action: () => setPage('stock_global'), icon: <IconPackage size={20} />, color: 'adminBlue', description: 'Gestion du stock' },
    { label: 'Ventes', action: () => setPage('ventes'), icon: <IconBuildingStore size={20} />, color: 'adminBlue', description: 'Historique des ventes' },
    { label: 'Dépenses', action: () => setPage('depenses'), icon: <IconReceipt size={20} />, color: 'adminBlue', description: 'Gestion des dépenses' },
    { label: 'Salaires', action: () => setPage('salaires'), icon: <IconCurrencyFrank size={20} />, color: 'adminBlue', description: 'Gestion des salaires' },
  ];

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement du tableau de bord...</Text>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER AVEC BOUTON INSTRUCTIONS */}
        <Card withBorder radius="md" p="lg" style={{ backgroundColor: '#1b365d' }}>
          <Group justify="space-between">
            <Stack gap={2}>
              <Group gap="xs">
                <IconChartBar size={24} color="white" />
                <Title order={2} c="white">Tableau de bord de gestion couture</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Vue d'ensemble de l'activité de gestion couture
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
                <IconChartBar size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* LIENS RAPIDES */}
        <Card withBorder radius="md" p="lg">
          <Title order={4} mb="md">🔗 Accès rapides</Title>
          <Divider mb="md" />
          <Grid gap="md">
            {quickLinks.map((link, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  withBorder
                  radius="md"
                  p="sm"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={link.action}
                >
                  <Group gap="md" wrap="nowrap">
                    <ThemeIcon color={link.color} variant="light" size={40} radius="md">
                      {link.icon}
                    </ThemeIcon>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text fw={600} size="sm">{link.label}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>{link.description}</Text>
                    </Stack>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Card>

        {/* KPI CARDS */}
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Card withBorder radius="md" p="sm">
            <Group justify="space-between">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Chiffre d'affaires</Text>
                <Text fw={700} size="xl">{formatCurrency(stats.chiffreAffaires)}</Text>
              </Stack>
              <ThemeIcon color="adminBlue" variant="light" size={38} radius="md">
                <IconTrendingUp size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group justify="space-between">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Encaissements</Text>
                <Text fw={700} size="xl" c="green">{formatCurrency(stats.encaissements)}</Text>
              </Stack>
              <ThemeIcon color="green" variant="light" size={38} radius="md">
                <IconMoneybag size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group justify="space-between">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Dépenses</Text>
                <Text fw={700} size="xl" c="red">{formatCurrency(stats.depenses)}</Text>
              </Stack>
              <ThemeIcon color="red" variant="light" size={38} radius="md">
                <IconReceipt size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder radius="md" p="sm">
            <Group justify="space-between">
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Valeur du stock</Text>
                <Text fw={700} size="xl">{formatCurrency(stockTotal)}</Text>
              </Stack>
              <ThemeIcon color="adminBlue" variant="light" size={38} radius="md">
                <IconPackage size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        {/* STATISTIQUES FINANCIÈRES */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Text fw={600}>💰 Situation financière</Text>
              <Badge color={stats.resteARecouvrer > 0 ? "yellow" : "green"} variant="light">
                {stats.resteARecouvrer > 0 ? "Attention" : "Saine"}
              </Badge>
            </Group>
            <Divider mb="md" />
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Bénéfice trésorerie</Text>
                <Text fw={700} c={stats.beneficeTresorerie >= 0 ? "green" : "red"}>
                  {formatCurrency(stats.beneficeTresorerie)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Bénéfice réel</Text>
                <Text fw={700} c={beneficeReel >= 0 ? "green" : "red"}>
                  {formatCurrency(beneficeReel)}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Reste à recouvrer</Text>
                <Text fw={700} c="orange">{formatCurrency(stats.resteARecouvrer)}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Taux de recouvrement</Text>
                <Text fw={700}>{tauxRecouvrement.toFixed(2)}%</Text>
              </Group>
            </Stack>
          </Card>

          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Text fw={600}>⚠️ Alertes stock</Text>
              <Badge color={stock.some(m => m.stock <= 0) ? "red" : "green"} variant="light">
                {stock.some(m => m.stock <= 0) ? "Ruptures détectées" : "Stock OK"}
              </Badge>
            </Group>
            <Divider mb="md" />
            <ScrollArea h={200}>
              <Stack gap="xs">
                {stock.filter(m => m.stock <= 5).length === 0 ? (
                  <Group gap="xs">
                    <IconCheck size={16} color="green" />
                    <Text size="sm">Tous les stocks sont suffisants</Text>
                  </Group>
                ) : (
                  stock
                    .filter(m => m.stock <= 5)
                    .slice(0, 5)
                    .map((m, i) => (
                      <Group key={i} justify="space-between">
                        <Text size="sm">{m.designation}</Text>
                        <Badge color={m.stock <= 0 ? "red" : "orange"} variant="light">
                          Stock: {m.stock}
                        </Badge>
                      </Group>
                    ))
                )}
              </Stack>
            </ScrollArea>
          </Card>
        </SimpleGrid>

        {/* DERNIÈRES TRANSACTIONS */}
        <Card withBorder radius="md" p="lg">
          <Group justify="space-between" mb="md">
            <Text fw={600}>📋 Dernières transactions</Text>
            <Badge color="adminBlue" variant="light">10 dernières</Badge>
          </Group>
          <Divider mb="md" />
          <ScrollArea h={250}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th ta="right">Montant</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {journal.slice(-10).reverse().map((j, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{new Date(j.date).toLocaleDateString('fr-FR')}</Table.Td>
                    <Table.Td>{j.description}</Table.Td>
                    <Table.Td>
                      <Badge color={j.entree > 0 ? "green" : "red"} variant="light" size="sm">
                        {j.entree > 0 ? "Entrée" : "Sortie"}
                      </Badge>
                    </Table.Td>
                    <Table.Td ta="right" fw={500}>
                      {formatCurrency(j.entree > 0 ? j.entree : j.sortie)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
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
            <Text size="sm">1. Utilisez les accès rapides pour naviguer dans l'application</Text>
            <Text size="sm">2. Les KPI en haut donnent une vue d'ensemble rapide</Text>
            <Text size="sm">3. Surveillez les alertes stock pour éviter les ruptures</Text>
            <Text size="sm">4. Le tableau des transactions montre les derniers mouvements</Text>
            <Text size="sm">5. Consultez régulièrement la situation financière</Text>
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

export default Dashboard;