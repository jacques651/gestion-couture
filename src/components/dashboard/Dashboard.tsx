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
  Container,
  Avatar,
  Center,
  Paper,
  Progress,
  RingProgress,
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
  IconDashboard,
  IconCash,
  IconAlertCircle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconCreditCard,
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

const formatCurrency = (v?: number) => `${(v || 0).toLocaleString('fr-FR')} FCFA`;

const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const { stats, journal, loading } = useFinance();
  const [stock, setStock] = useState<any[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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

  const tauxRecouvrement = stats.chiffreAffaires > 0
    ? (stats.encaissements / stats.chiffreAffaires) * 100
    : 0;
  const beneficeReel = stats.beneficeTresorerie - stockTotal;
  const stockRupture = stock.filter(m => m.stock <= 0).length;
  const stockAlerte = stock.filter(m => m.stock > 0 && m.stock <= 5).length;

  const quickLinks = [
    { label: 'Clients', action: () => setPage('clients'), icon: <IconUsers size={20} />, color: 'blue', description: 'Gestion des clients', bg: '#e8f4fd' },
    { label: 'Commandes', action: () => setPage('commandes'), icon: <IconShoppingBag size={20} />, color: 'violet', description: 'Gestion des commandes', bg: '#f3e5f5' },
    { label: 'Paiements', action: () => setPage('paiements'), icon: <IconCreditCard size={20} />, color: 'green', description: 'Enregistrer les paiements', bg: '#e8f5e9' },
    { label: 'Factures', action: () => setPage('factures'), icon: <IconFileInvoice size={20} />, color: 'orange', description: 'Gestion des factures', bg: '#fff3e0' },
    { label: 'Stock', action: () => setPage('stock_global'), icon: <IconPackage size={20} />, color: 'teal', description: 'Gestion du stock', bg: '#e0f7fa' },
    { label: 'Ventes', action: () => setPage('ventes'), icon: <IconBuildingStore size={20} />, color: 'pink', description: 'Historique des ventes', bg: '#fce4ec' },
    { label: 'Dépenses', action: () => setPage('depenses'), icon: <IconReceipt size={20} />, color: 'red', description: 'Gestion des dépenses', bg: '#ffebee' },
    { label: 'Salaires', action: () => setPage('salaires'), icon: <IconCurrencyFrank size={20} />, color: 'indigo', description: 'Gestion des salaires', bg: '#e8eaf6' },
  ];

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconDashboard size={40} stroke={1.5} />
            <Text>Chargement du tableau de bord...</Text>
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
                  <IconChartBar size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Tableau de bord</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Vue d'ensemble de l'activité de gestion couture
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {new Date().toLocaleDateString('fr-FR')}
                    </Badge>
                    <Badge size="sm" variant="white" color="green">
                      Synthèse en temps réel
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

          {/* KPI Cards modernisées */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Chiffre d'affaires</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconTrendingUp size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="xl" c="blue">{formatCurrency(stats.chiffreAffaires)}</Text>
              <Progress value={100} size="sm" radius="xl" color="blue" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Objectif atteint</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f5e9' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Encaissements</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconCash size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="xl" c="green">{formatCurrency(stats.encaissements)}</Text>
              <Progress value={Math.min((stats.encaissements / (stats.chiffreAffaires || 1)) * 100, 100)} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>{Math.round(tauxRecouvrement)}% du CA</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ffebee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Dépenses</Text>
                <ThemeIcon size="lg" radius="md" color="red" variant="light">
                  <IconReceipt size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="xl" c="red">{formatCurrency(stats.depenses)}</Text>
              <Progress value={Math.min((stats.depenses / (stats.encaissements || 1)) * 100, 100)} size="sm" radius="xl" color="red" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Taux de dépenses</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e0f7fa' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Valeur du stock</Text>
                <ThemeIcon size="lg" radius="md" color="teal" variant="light">
                  <IconPackage size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={800} size="xl" c="teal">{formatCurrency(stockTotal)}</Text>
              <Progress value={100} size="sm" radius="xl" color="teal" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>En inventaire</Text>
            </Paper>
          </SimpleGrid>

          {/* Liens rapides améliorés */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Group mb="md">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconDashboard size={16} />
              </ThemeIcon>
              <Title order={3} size="h4">🔗 Accès rapides</Title>
            </Group>
            <Divider mb="md" />
            <Grid >
              {quickLinks.map((link, index) => (
                <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <Paper
                    withBorder
                    radius="lg"
                    p="sm"
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      backgroundColor: link.bg,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={link.action}
                  >
                    <Group gap="md" wrap="nowrap">
                      <ThemeIcon color={link.color} variant="light" size={45} radius="md">
                        {link.icon}
                      </ThemeIcon>
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text fw={600} size="sm">{link.label}</Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>{link.description}</Text>
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Card>

          {/* Statistiques financières et alertes stock */}
          <Grid >
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="lg" shadow="sm" p="xl" h="100%">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <IconMoneybag size={16} />
                  </ThemeIcon>
                  <Title order={3} size="h4">💰 Situation financière</Title>
                  <Badge color={stats.resteARecouvrer > 0 ? "yellow" : "green"} variant="filled" ml="auto">
                    {stats.resteARecouvrer > 0 ? "⚠️ Attention" : "✅ Saine"}
                  </Badge>
                </Group>
                <Divider mb="md" />
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconTrendingUp size={16} color="green" />
                      <Text size="sm">Bénéfice trésorerie</Text>
                    </Group>
                    <Text fw={700} size="lg" c={stats.beneficeTresorerie >= 0 ? "green" : "red"}>
                      {formatCurrency(stats.beneficeTresorerie)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconPackage size={16} color="teal" />
                      <Text size="sm">Bénéfice réel</Text>
                    </Group>
                    <Text fw={700} size="lg" c={beneficeReel >= 0 ? "green" : "red"}>
                      {formatCurrency(beneficeReel)}
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconAlertCircle size={16} color="orange" />
                      <Text size="sm">Reste à recouvrer</Text>
                    </Group>
                    <Text fw={700} size="lg" c="orange">{formatCurrency(stats.resteARecouvrer)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCreditCard size={16} color="blue" />
                      <Text size="sm">Taux de recouvrement</Text>
                    </Group>
                    <Text fw={700} size="lg" c="blue">{tauxRecouvrement.toFixed(1)}%</Text>
                  </Group>
                  <RingProgress
                    size={100}
                    thickness={8}
                    sections={[{ value: tauxRecouvrement, color: tauxRecouvrement > 70 ? 'green' : 'orange' }]}
                    label={
                      <Text ta="center" fw={700} size="sm">{Math.round(tauxRecouvrement)}%</Text>
                    }
                    mx="auto"
                  />
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="lg" shadow="sm" p="xl" h="100%">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="red" variant="light">
                    <IconAlertCircle size={16} />
                  </ThemeIcon>
                  <Title order={3} size="h4">⚠️ Alertes stock</Title>
                  <Badge color={stockRupture > 0 ? "red" : "green"} variant="filled" ml="auto">
                    {stockRupture > 0 ? `🔴 ${stockRupture} rupture(s)` : "✅ Stock OK"}
                  </Badge>
                </Group>
                <Divider mb="md" />
                <ScrollArea h={280}>
                  <Stack gap="xs">
                    {stock.filter(m => m.stock <= 5).length === 0 ? (
                      <Group gap="xs" justify="center" py={40}>
                        <IconCheck size={24} color="green" />
                        <Text size="sm" c="green" fw={500}>Tous les stocks sont suffisants</Text>
                      </Group>
                    ) : (
                      stock
                        .filter(m => m.stock <= 5)
                        .slice(0, 8)
                        .map((m, i) => (
                          <Paper key={i} p="sm" radius="md" withBorder>
                            <Group justify="space-between">
                              <Text size="sm" fw={500}>{m.designation}</Text>
                              <Badge color={m.stock <= 0 ? "red" : "orange"} variant="light" size="lg">
                                Stock: {Math.floor(m.stock)}
                              </Badge>
                            </Group>
                            {m.stock <= 0 && (
                              <Text size="xs" c="red" mt={4}>⚠️ Rupture de stock imminente</Text>
                            )}
                          </Paper>
                        ))
                    )}
                  </Stack>
                </ScrollArea>
                {stockAlerte > 0 && (
                  <Button
                    variant="light"
                    color="blue"
                    fullWidth
                    mt="md"
                    onClick={() => setPage('stock_global')}
                  >
                    Voir le stock détaillé
                  </Button>
                )}
              </Card>
            </Grid.Col>
          </Grid>

          {/* Dernières transactions */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Group mb="md">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconReceipt size={16} />
              </ThemeIcon>
              <Title order={3} size="h4">📋 Dernières transactions</Title>
              <Badge color="blue" variant="light" ml="auto">10 dernières</Badge>
            </Group>
            <Divider mb="md" />
            <ScrollArea h={300}>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Description</Table.Th>
                    <Table.Th style={{ color: 'white', width: 100 }}>Type</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 130 }}>Montant</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {journal.slice(-10).reverse().map((j, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconDashboard size={12} color="#1b365d" />
                          <Text size="sm">{new Date(j.date).toLocaleDateString('fr-FR')}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td><Text size="sm" lineClamp={1}>{j.description}</Text></Table.Td>
                      <Table.Td>
                        <Badge color={j.entree > 0 ? "green" : "red"} variant="light" size="sm">
                          {j.entree > 0 ? "📥 Entrée" : "📤 Sortie"}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right" fw={700} c={j.entree > 0 ? "green" : "red"}>
                        {formatCurrency(j.entree > 0 ? j.entree : j.sortie)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Tableau de bord"
            size="md"
            centered
            radius="lg"
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
                padding: '24px',
              },
            }}
          >
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm" mb="md">📌 Fonctionnalités :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Utilisez les accès rapides pour naviguer dans l'application</Text>
                  <Text size="sm">2️⃣ Les KPI en haut donnent une vue d'ensemble rapide</Text>
                  <Text size="sm">3️⃣ Surveillez les alertes stock pour éviter les ruptures</Text>
                  <Text size="sm">4️⃣ Le tableau des transactions montre les derniers mouvements</Text>
                  <Text size="sm">5️⃣ Consultez régulièrement la situation financière</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Indicateurs clés :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconArrowUpRight size={16} color="#e65100" />
                    <Text size="sm">Le taux de recouvrement mesure l'efficacité des encaissements</Text>
                  </Group>
                  <Group gap="xs">
                    <IconArrowDownRight size={16} color="#e65100" />
                    <Text size="sm">Le bénéfice réel tient compte de la valeur du stock</Text>
                  </Group>
                </Stack>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 1.0.0 - Gestion Couture
              </Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default Dashboard;