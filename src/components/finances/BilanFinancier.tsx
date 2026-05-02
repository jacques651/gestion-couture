// BilanFinancier adapté avec Mantine
import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  SimpleGrid,
  Alert,
  ThemeIcon,
  Box,
  Modal,
  Divider,
  Container,
  Avatar,
  Center,
  Paper,
  Progress,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconShoppingBag,
  IconCash,
  IconReceipt,
  IconMoneybag,
  IconChartBar,
  IconAlertCircle,
  IconCheck,
  IconFileText,
  IconInfoCircle,
  IconWallet,
  IconPercentage,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { getDb } from '../../database/db';

interface BilanProps {
  setPage?: (page: string) => void;
}

const formatCurrency = (v?: number) => `${(v || 0).toLocaleString('fr-FR')} FCFA`;

const BilanFinancier: React.FC<BilanProps> = ({ setPage }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  
  const [stats, setStats] = useState({
    chiffreAffaires: 0,
    encaissements: 0,
    depenses: 0,
    salaires: 0,
    resteARecouvrer: 0,
    beneficeComptable: 0,
    beneficeTresorerie: 0,
  });

  useEffect(() => {
    loadBilan();
  }, []);

  const loadBilan = async () => {
    try {
      setLoading(true);
      const db = await getDb();

      // Chiffre d'affaires (total ventes)
      const ca = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_total), 0) as total FROM ventes`);
      const chiffreAffaires = ca[0]?.total || 0;

      // Encaissements (montant réglé)
      const enc = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_regle), 0) as total FROM ventes`);
      const encaissements = enc[0]?.total || 0;

      // Dépenses
      const dep = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant), 0) as total FROM depenses`);
      const depenses = dep[0]?.total || 0;

      // Salaires (payés, non annulés)
      const sal = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_net), 0) as total FROM salaires WHERE annule = 0`);
      const salaires = sal[0]?.total || 0;

      // Reste à recouvrer
      const reste = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(montant_total - montant_regle), 0) as total FROM ventes WHERE statut != 'PAYEE'`);
      const resteARecouvrer = reste[0]?.total || 0;

      // Bénéfices
      const totalDepenses = depenses + salaires;
      const beneficeComptable = chiffreAffaires - totalDepenses;
      const beneficeTresorerie = encaissements - totalDepenses;

      setStats({
        chiffreAffaires,
        encaissements,
        depenses,
        salaires,
        resteARecouvrer,
        beneficeComptable,
        beneficeTresorerie,
      });
    } catch (err) {
      console.error('Erreur chargement bilan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNav = (page: string) => {
    const routeMap: Record<string, string> = {
      ventes: '/ventes',
      depenses: '/depenses',
      salaires: '/salaires',
      journal: '/journal',
      bilan: '/bilan',
    };
    const route = routeMap[page] || '/';
    if (setPage) {
      setPage(page);
    } else {
      navigate(route);
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <LoadingOverlay visible={true} />
        <Text>Chargement du bilan...</Text>
      </Center>
    );
  }

  const tauxPaiement = stats.chiffreAffaires > 0 ? (stats.encaissements / stats.chiffreAffaires) * 100 : 0;
  const marge = stats.chiffreAffaires > 0 ? (stats.beneficeComptable / stats.chiffreAffaires) * 100 : 0;
  const beneficeColor = stats.beneficeComptable >= 0 ? 'green' : 'red';
  const tresorerieColor = stats.beneficeTresorerie >= 0 ? 'green' : 'red';

  const cards = [
    { label: "Chiffre d'affaires", value: stats.chiffreAffaires, desc: "Total des ventes", color: "blue", icon: <IconChartBar size={22} />, bg: "#e8f4fd" },
    { label: "Encaissements", value: stats.encaissements, desc: "Paiements reçus", color: "green", icon: <IconCash size={22} />, bg: "#ebfbee" },
    { label: "Dépenses", value: stats.depenses, desc: "Charges générales", color: "red", icon: <IconReceipt size={22} />, bg: "#fff5f5" },
    { label: "Salaires", value: stats.salaires, desc: "Rémunérations", color: "orange", icon: <IconMoneybag size={22} />, bg: "#fff3e0" },
  ];

  const beneficeCards = [
    { label: "Bénéfice comptable", value: stats.beneficeComptable, desc: "CA - charges", color: beneficeColor, icon: stats.beneficeComptable >= 0 ? <IconArrowUpRight size={22} /> : <IconArrowDownRight size={22} />, bg: stats.beneficeComptable >= 0 ? "#ebfbee" : "#fff5f5" },
    { label: "Bénéfice trésorerie", value: stats.beneficeTresorerie, desc: "Encaissé - charges", color: tresorerieColor, icon: <IconWallet size={22} />, bg: stats.beneficeTresorerie >= 0 ? "#ebfbee" : "#fff5f5" },
    { label: "Reste à recouvrer", value: stats.resteARecouvrer, desc: "Non encaissé", color: "yellow", icon: <IconAlertCircle size={22} />, bg: "#fff9e6" },
    { label: "Taux de paiement", value: Math.round(tauxPaiement), desc: "Encaissements / CA", color: "indigo", icon: <IconPercentage size={22} />, suffix: "%", bg: "#f3f0ff" },
  ];

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(19, 65, 134, 0.2)' }}>
                  <IconChartBar size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Bilan financier</Title>
                  <Text c="gray.3" size="sm">Analyse des performances financières</Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Alerte recouvrement */}
          {stats.resteARecouvrer > 0 ? (
            <Alert icon={<IconAlertCircle size={20} />} color="yellow" variant="light" radius="md">
              <Group justify="space-between">
                <Text fw={600}>⚠️ {formatCurrency(stats.resteARecouvrer)} à recouvrer</Text>
                <Button size="xs" variant="light" onClick={() => handleNav('ventes')}>Voir les ventes</Button>
              </Group>
            </Alert>
          ) : (
            <Alert icon={<IconCheck size={20} />} color="green" variant="light" radius="md">
              <Text fw={600}>✅ Tous les paiements sont à jour</Text>
            </Alert>
          )}

          {/* Accès rapides */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group>
              <Button variant="light" leftSection={<IconShoppingBag size={16} />} onClick={() => handleNav('ventes')}>Ventes</Button>
              <Button variant="light" leftSection={<IconReceipt size={16} />} onClick={() => handleNav('depenses')}>Dépenses</Button>
              <Button variant="light" leftSection={<IconMoneybag size={16} />} onClick={() => handleNav('salaires')}>Salaires</Button>
              <Button variant="light" leftSection={<IconFileText size={16} />} onClick={() => handleNav('journal')}>Journal</Button>
            </Group>
          </Card>

          {/* KPI principaux */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {cards.map((card, i) => (
              <Paper key={i} p="md" radius="lg" withBorder bg={card.bg}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{card.label}</Text>
                  <ThemeIcon color={card.color} variant="light" size="lg" radius="md">{card.icon}</ThemeIcon>
                </Group>
                <Text fw={800} size="xl" c={card.color}>{formatCurrency(card.value)}</Text>
                <Text size="xs" c="dimmed" mt={4}>{card.desc}</Text>
              </Paper>
            ))}
          </SimpleGrid>

          {/* Bénéfices */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {beneficeCards.map((card, i) => (
              <Paper key={i} p="md" radius="lg" withBorder bg={card.bg}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{card.label}</Text>
                  <ThemeIcon color={card.color} variant="light" size="lg" radius="md">{card.icon}</ThemeIcon>
                </Group>
                <Text fw={800} size="xl" c={card.color}>
                  {card.value.toLocaleString()} {card.suffix || 'FCFA'}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>{card.desc}</Text>
                {card.suffix === '%' && <Progress value={card.value} size="xs" radius="xl" color={card.color} mt="sm" />}
              </Paper>
            ))}
          </SimpleGrid>

          {/* Synthèse */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Title order={4} mb="md">📋 Synthèse</Title>
            <Divider mb="md" />
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm">📈 Performance</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  CA : <strong>{formatCurrency(stats.chiffreAffaires)}</strong><br />
                  Taux de paiement : <strong>{Math.round(tauxPaiement)}%</strong><br />
                  Reste à recouvrer : <strong>{formatCurrency(stats.resteARecouvrer)}</strong>
                </Text>
              </Paper>
              <Paper p="md" radius="md" withBorder bg="green.0">
                <Text fw={600} size="sm">💰 Rentabilité</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Bénéfice net : <strong>{formatCurrency(stats.beneficeComptable)}</strong><br />
                  Marge : <strong>{Math.round(marge)}%</strong><br />
                  Trésorerie nette : <strong>{formatCurrency(stats.beneficeTresorerie)}</strong>
                </Text>
              </Paper>
            </SimpleGrid>
          </Card>

          {/* Modal Instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm"><strong>Chiffre d'affaires</strong> = total des ventes</Text>
              <Text size="sm"><strong>Encaissements</strong> = paiements déjà reçus</Text>
              <Text size="sm"><strong>Bénéfice comptable</strong> = CA - (dépenses + salaires)</Text>
              <Text size="sm"><strong>Bénéfice trésorerie</strong> = encaissements - (dépenses + salaires)</Text>
              <Text size="sm"><strong>Taux de paiement</strong> = encaissements / CA</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default BilanFinancier;