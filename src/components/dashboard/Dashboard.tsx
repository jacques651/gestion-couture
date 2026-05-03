import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Card, Title, Text, Group, SimpleGrid, ThemeIcon, Table, Badge,
  ScrollArea, LoadingOverlay, Divider, Grid, Button, Modal, Box,
  Container, Avatar, Center, Paper, RingProgress,
} from '@mantine/core';
import {
  IconUsers, IconShoppingBag, IconReceipt, IconChartBar, IconTrendingUp,
  IconBuildingStore, IconPackage, IconFileInvoice, IconCheck,
  IconCurrencyFrank, IconInfoCircle, IconCash, IconAlertCircle, 
  IconShirt, IconLock,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../contexts/AuthContext';


type PageKey =
  | 'dashboard' | 'clients' | 'ventes' | 'depenses' | 'salaires'
  | 'journal_caisse' | 'stock_global' | 'matieres' | 'articles' | 'modeles'
  | 'factures-recus' | 'mouvements_stock';

interface DashboardProps {
  setPage?: (page: PageKey) => void;
}

const formatCurrency = (v?: number) => `${(v || 0).toLocaleString('fr-FR')} FCFA`;

const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const { canRead, user } = useAuth();  // canWrite retiré car non utilisé
  const [loading, setLoading] = useState(true);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    chiffreAffaires: 0, encaissements: 0, depenses: 0,
    resteARecouvrer: 0, beneficeTresorerie: 0,
  });
  const [stockAlertes, setStockAlertes] = useState<any[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [journal, setJournal] = useState<any[]>([]);

  // Vérification d'accès
  const hasAccess = canRead('dashboard');
  const canViewVentes = canRead('ventes');
  const canViewClients = canRead('clients');
  const canViewArticles = canRead('articles');
  const canViewMatieres = canRead('matieres');
  const canViewDepenses = canRead('depenses');
  const canViewSalaires = canRead('salaires');

  useEffect(() => {
    if (hasAccess) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [hasAccess]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const db = await getDb();

      const ca = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_total), 0) as total FROM ventes`);
      const chiffreAffaires = ca[0]?.total || 0;

      const enc = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_regle), 0) as total FROM ventes`);
      const encaissements = enc[0]?.total || 0;

      const dep = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant), 0) as total FROM depenses`);
      const depenses = dep[0]?.total || 0;

      const reste = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_total - montant_regle), 0) as total FROM ventes WHERE statut != 'PAYEE'`);
      const resteARecouvrer = reste[0]?.total || 0;

      setStats({ chiffreAffaires, encaissements, depenses, resteARecouvrer, beneficeTresorerie: encaissements - depenses });

      const matieresAlertes = await db.select<any[]>(`SELECT m.designation, m.stock_actuel as stock, m.seuil_alerte, m.unite, 'matiere' as type FROM matieres m WHERE m.est_supprime = 0 AND m.stock_actuel <= m.seuil_alerte ORDER BY m.stock_actuel ASC`);
      const articlesAlertes = await db.select<any[]>(`SELECT a.code_article as designation, a.quantite_stock as stock, a.seuil_alerte, '' as unite, 'article' as type FROM articles a WHERE a.est_actif = 1 AND a.quantite_stock <= a.seuil_alerte ORDER BY a.quantite_stock ASC`);
      setStockAlertes([...matieresAlertes, ...articlesAlertes].sort((a, b) => a.stock - b.stock));

      const sm = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(stock_actuel * prix_achat), 0) as total FROM matieres WHERE est_supprime = 0`);
      const sa = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(quantite_stock * COALESCE(prix_achat, prix_vente)), 0) as total FROM articles WHERE est_actif = 1`);
      setStockTotal((sm[0]?.total || 0) + (sa[0]?.total || 0));

      const j = await db.select<any[]>(`SELECT date_vente as date, code_vente as description, montant_total as entree, 0 as sortie FROM ventes UNION ALL SELECT date_depense as date, designation as description, 0 as entree, montant as sortie FROM depenses ORDER BY date DESC LIMIT 10`);
      setJournal(j || []);
    } catch (err) {
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally { setLoading(false); }
  };

  const handleNavigate = (page: PageKey, requiredPermission: string) => {
    if (canRead(requiredPermission)) {
      if (setPage) {
        setPage(page);
      } else {
        navigate(`/${page}`);
      }
    } else {
      notifications.show({
        title: 'Accès refusé',
        message: `Vous n'avez pas la permission de lire ${requiredPermission}`,
        color: 'red'
      });
    }
  };

  // Si pas d'accès, afficher message d'erreur
  if (!hasAccess) {
    return (
      <Center style={{ height: '70vh' }}>
        <Stack align="center" gap="md">
          <ThemeIcon size={80} radius="xl" color="red" variant="light">
            <IconLock size={40} />
          </ThemeIcon>
          <Title order={2} ta="center">Accès non autorisé</Title>
          <Text c="dimmed" ta="center" maw={400}>
            Vous n'avez pas les permissions nécessaires pour accéder au tableau de bord.
            Veuillez contacter un administrateur.
          </Text>
          <Button 
            variant="light" 
            onClick={() => window.history.back()}
            leftSection={<IconCheck size={16} />}
          >
            Retour
          </Button>
        </Stack>
      </Center>
    );
  }

  const tauxRecouvrement = stats.chiffreAffaires > 0 ? (stats.encaissements / stats.chiffreAffaires) * 100 : 0;
  const beneficeReel = stats.beneficeTresorerie - stockTotal;

  const quickLinks = [
    { 
      label: 'Ventes', 
      action: () => handleNavigate('ventes', 'ventes'), 
      icon: <IconBuildingStore size={20} />, 
      color: 'pink', 
      description: 'Gestion des ventes', 
      bg: '#fce4ec',
      permission: canViewVentes
    },
    { 
      label: 'Clients', 
      action: () => handleNavigate('clients', 'clients'), 
      icon: <IconUsers size={20} />, 
      color: 'blue', 
      description: 'Gestion des clients', 
      bg: '#e8f4fd',
      permission: canViewClients
    },
    { 
      label: 'Articles', 
      action: () => handleNavigate('articles', 'articles'), 
      icon: <IconShoppingBag size={20} />, 
      color: 'violet', 
      description: 'Inventaire des tenues', 
      bg: '#f3e5f5',
      permission: canViewArticles
    },
    { 
      label: 'Matières', 
      action: () => handleNavigate('matieres', 'matieres'), 
      icon: <IconPackage size={20} />, 
      color: 'teal', 
      description: 'Matières premières', 
      bg: '#e0f7fa',
      permission: canViewMatieres
    },
    { 
      label: 'Dépenses', 
      action: () => handleNavigate('depenses', 'depenses'), 
      icon: <IconReceipt size={20} />, 
      color: 'red', 
      description: 'Gestion des dépenses', 
      bg: '#ffebee',
      permission: canViewDepenses
    },
    { 
      label: 'Salaires', 
      action: () => handleNavigate('salaires', 'salaires'), 
      icon: <IconCurrencyFrank size={20} />, 
      color: 'indigo', 
      description: 'Gestion des salaires', 
      bg: '#e8eaf6',
      permission: canViewSalaires
    },
    { 
      label: 'Factures & Reçus', 
      action: () => handleNavigate('factures-recus', 'ventes'), 
      icon: <IconFileInvoice size={20} />, 
      color: 'orange', 
      description: 'Documents', 
      bg: '#fff3e0',
      permission: canViewVentes
    },
    { 
      label: 'Modèles', 
      action: () => handleNavigate('modeles', 'articles'), 
      icon: <IconShirt size={20} />, 
      color: 'green', 
      description: 'Modèles de tenues', 
      bg: '#e8f5e9',
      permission: canViewArticles
    },
  ];

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <LoadingOverlay visible />
        <Text>Chargement...</Text>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconChartBar size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Tableau de bord</Title>
                  <Text c="gray.3" size="sm">
                    Vue d'ensemble de l'activité
                    {user && <span> - Bienvenue {user.nom}</span>}
                  </Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Instructions
              </Button>
            </Group>
          </Card>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {[
              { label: "Chiffre d'affaires", value: stats.chiffreAffaires, color: 'blue', icon: <IconTrendingUp size={18} />, bg: '#e8f4fd' },
              { label: 'Encaissements', value: stats.encaissements, color: 'green', icon: <IconCash size={18} />, bg: '#e8f5e9', extra: `${Math.round(tauxRecouvrement)}% du CA` },
              { label: 'Dépenses', value: stats.depenses, color: 'red', icon: <IconReceipt size={18} />, bg: '#ffebee' },
              { label: 'Valeur du stock', value: stockTotal, color: 'teal', icon: <IconPackage size={18} />, bg: '#e0f7fa' },
            ].map((c, i) => (
              <Paper key={i} p="md" radius="lg" withBorder bg={c.bg}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{c.label}</Text>
                  <ThemeIcon size="lg" radius="md" color={c.color} variant="light">{c.icon}</ThemeIcon>
                </Group>
                <Text fw={800} size="xl" c={c.color}>{formatCurrency(c.value)}</Text>
                {c.extra && <Text size="xs" c="dimmed">{c.extra}</Text>}
              </Paper>
            ))}
          </SimpleGrid>

          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Title order={3} size="h4" mb="md">🔗 Accès rapides</Title>
            <Divider mb="md" />
            <Grid>
              {quickLinks.map((link, i) => (
                <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
                  <Paper 
                    withBorder 
                    radius="lg" 
                    p="sm" 
                    bg={link.bg} 
                    style={{ 
                      cursor: link.permission ? 'pointer' : 'not-allowed',
                      opacity: link.permission ? 1 : 0.5,
                    }} 
                    onClick={() => link.permission && link.action()}
                  >
                    <Group gap="md" wrap="nowrap">
                      <ThemeIcon color={link.color} variant="light" size={40} radius="md">
                        {link.icon}
                      </ThemeIcon>
                      <Stack gap={2}>
                        <Text fw={600} size="sm">{link.label}</Text>
                        <Text size="xs" c="dimmed">{link.description}</Text>
                        {!link.permission && (
                          <Badge size="xs" color="red" variant="light">Accès limité</Badge>
                        )}
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Card>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder radius="lg" shadow="sm" p="xl" h="100%">
                <Title order={3} size="h4" mb="md">💰 Situation financière</Title>
                <Divider mb="md" />
                <Stack gap="md">
                  {[
                    { label: 'Bénéfice trésorerie', value: stats.beneficeTresorerie, color: stats.beneficeTresorerie >= 0 ? 'green' : 'red' },
                    { label: 'Bénéfice réel (après stock)', value: beneficeReel, color: beneficeReel >= 0 ? 'green' : 'red' },
                    { label: 'Reste à recouvrer', value: stats.resteARecouvrer, color: 'orange' },
                  ].map((l, i) => (
                    <Group key={i} justify="space-between">
                      <Text size="sm">{l.label}</Text>
                      <Text fw={700} c={l.color}>{formatCurrency(l.value)}</Text>
                    </Group>
                  ))}
                  <RingProgress 
                    size={100} 
                    thickness={8} 
                    sections={[{ value: Math.min(tauxRecouvrement, 100), color: tauxRecouvrement > 70 ? 'green' : 'orange' }]} 
                    label={<Text ta="center" fw={700} size="sm">{Math.round(tauxRecouvrement)}%</Text>} 
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
                  <Badge color={stockAlertes.length > 0 ? 'red' : 'green'} variant="filled" ml="auto">
                    {stockAlertes.length > 0 ? `🔴 ${stockAlertes.length}` : '✅ OK'}
                  </Badge>
                </Group>
                <Divider mb="md" />
                <ScrollArea h={300}>
                  {stockAlertes.length === 0 ? (
                    <Center py={40}>
                      <IconCheck size={24} color="green" />
                      <Text size="sm" c="green" ml="xs">Stocks suffisants</Text>
                    </Center>
                  ) : (
                    stockAlertes.slice(0, 10).map((item, i) => (
                      <Paper key={i} p="md" radius="md" withBorder mb="sm" style={{ borderLeft: `4px solid ${item.stock <= 0 ? '#e03131' : '#f08c00'}`, cursor: 'pointer' }}>
                        <Group justify="space-between" mb={6}>
                          <Group gap={8}>
                            <Badge size="sm" variant="filled" color={item.type === 'matiere' ? 'blue' : 'violet'}>
                              {item.type === 'matiere' ? '🧵' : '👕'}
                            </Badge>
                            <Text size="sm" fw={600}>{item.designation}</Text>
                          </Group>
                          <Badge color={item.stock <= 0 ? 'red' : 'orange'} variant="filled" size="sm">
                            {item.stock <= 0 ? '🔴 Rupture' : '⚠️ Alerte'}
                          </Badge>
                        </Group>
                        <Group justify="space-between" mb={4}>
                          <Text size="xs">
                            Stock: <Text component="span" fw={700} c={item.stock <= 0 ? 'red' : 'orange'}>{item.stock}</Text>
                          </Text>
                          <Text size="xs">Seuil: {item.seuil_alerte}</Text>
                        </Group>
                        <Box style={{ width: '100%', height: 6, backgroundColor: '#e9ecef', borderRadius: 3 }}>
                          <Box style={{ width: `${Math.min((item.stock / (item.seuil_alerte || 1)) * 100, 100)}%`, height: '100%', backgroundColor: item.stock <= 0 ? '#e03131' : '#f08c00', borderRadius: 3 }} />
                        </Box>
                        <Button 
                          variant="subtle" 
                          size="compact-xs" 
                          color={item.type === 'matiere' ? 'blue' : 'violet'} 
                          onClick={() => handleNavigate(item.type === 'matiere' ? 'matieres' : 'articles', item.type === 'matiere' ? 'matieres' : 'articles')} 
                          rightSection={<IconShoppingBag size={12} />} 
                          mt={4}
                        >
                          Voir {item.type === 'matiere' ? 'la matière' : "l'article"}
                        </Button>
                      </Paper>
                    ))
                  )}
                </ScrollArea>
              </Card>
            </Grid.Col>
          </Grid>

          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Title order={3} size="h4" mb="md">📋 Dernières transactions</Title>
            <Divider mb="md" />
            <ScrollArea h={300}>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Description</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Entrée</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Sortie</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {journal.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4} ta="center">Aucune transaction</Table.Td>
                    </Table.Tr>
                  ) : (
                    journal.map((j, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{new Date(j.date).toLocaleDateString('fr-FR')}</Table.Td>
                        <Table.Td>{j.description}</Table.Td>
                        <Table.Td ta="right" c="green">{j.entree > 0 ? formatCurrency(j.entree) : '-'}</Table.Td>
                        <Table.Td ta="right" c="red">{j.sortie > 0 ? formatCurrency(j.sortie) : '-'}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>

          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">1️⃣ CA = total des ventes</Text>
              <Text size="sm">2️⃣ Encaissements = montants réglés</Text>
              <Text size="sm">3️⃣ Bénéfice = encaissements - dépenses</Text>
              <Text size="sm">4️⃣ Les alertes couvrent matières ET tenues</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default Dashboard;