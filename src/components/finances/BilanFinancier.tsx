// BilanFinancier adapté avec Mantine
import React, { useState } from 'react';
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
  RingProgress,
  Badge,
} from '@mantine/core';
import {
  IconShoppingBag,
  IconCash,
  IconReceipt,
  IconMoneybag,
  IconChartBar,
  IconTrendingUp,
  IconAlertCircle,
  IconCheck,
  IconFileText,
  IconInfoCircle,
  IconBuildingStore,
  IconWallet,
  IconPercentage,
  IconArrowUpRight,
  IconArrowDownRight,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../../hooks/useFinance';

interface BilanProps {
  setPage?: (page: string) => void;
}

const BilanFinancier: React.FC<BilanProps> = ({ setPage }) => {
  const { stats, loading } = useFinance();
  const navigate = useNavigate();
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const handleNav = (page: string) => {
  const routeMap: Record<string, string> = {
    ventes: '/ventes',
    depenses: '/depenses',
    salaires: '/salaires',
    journal: '/journal',
    bilan: '/bilan'
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
        <Card withBorder radius="lg" p="xl">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <ThemeIcon size="xl" radius="xl" color="blue" variant="light" mx="auto">
              <IconChartBar size={30} />
            </ThemeIcon>
            <Text c="dimmed" mt="md">Analyse des données financières en cours...</Text>
          </div>
        </Card>
      </Center>
    );
  }

  const tauxPaiement = stats.chiffreAffaires > 0
    ? (stats.encaissements / stats.chiffreAffaires) * 100
    : 0;

  const beneficeColor = stats.beneficeComptable >= 0 ? 'green' : 'red';
  const tresorerieColor = stats.beneficeTresorerie >= 0 ? 'green' : 'red';

  const cards = [
    {
      label: "Chiffre d'affaires",
      value: stats.chiffreAffaires,
      description: "Commandes + ventes",
      color: "blue",
      icon: <IconChartBar size={22} />,
      bg: "#e8f4fd",
    },
    {
      label: "Encaissements",
      value: stats.encaissements,
      description: "Paiements + ventes",
      color: "green",
      icon: <IconCash size={22} />,
      bg: "#ebfbee",
    },
    {
      label: "Dépenses",
      value: stats.depenses,
      description: "Charges hors salaires",
      color: "red",
      icon: <IconReceipt size={22} />,
      bg: "#fff5f5",
    },
    {
      label: "Salaires",
      value: stats.salaires,
      description: "Rémunérations nettes",
      color: "orange",
      icon: <IconMoneybag size={22} />,
      bg: "#fff3e0",
    },
  ];

  const beneficeCards = [
    {
      label: "Bénéfice comptable",
      value: stats.beneficeComptable,
      description: "CA - dépenses globales",
      color: beneficeColor,
      icon: stats.beneficeComptable >= 0 ? <IconArrowUpRight size={22} /> : <IconArrowDownRight size={22} />,
      bg: stats.beneficeComptable >= 0 ? "#ebfbee" : "#fff5f5",
    },
    {
      label: "Bénéfice trésorerie",
      value: stats.beneficeTresorerie,
      description: "Encaissements - dépenses",
      color: tresorerieColor,
      icon: <IconWallet size={22} />,
      bg: stats.beneficeTresorerie >= 0 ? "#ebfbee" : "#fff5f5",
    },
    {
      label: "Reste à recouvrer",
      value: stats.resteARecouvrer,
      description: "Montant non encaissé",
      color: "yellow",
      icon: <IconAlertCircle size={22} />,
      bg: "#fff9e6",
    },
    {
      label: "Taux de recouvrement",
      value: tauxPaiement,
      description: "Encaissement / CA",
      color: "indigo",
      icon: <IconPercentage size={22} />,
      suffix: "%",
      bg: "#f3f0ff",
    },
  ];

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
                  <Title order={1} c="white" size="h2">Bilan financier</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Analyse globale des performances financières de l'atelier
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {new Date().toLocaleDateString('fr-FR')}
                    </Badge>
                    <Badge size="sm" variant="white" color="green">
                      Synthèse mensuelle
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

          {/* Alerte stylisée */}
          {stats.resteARecouvrer > 0 ? (
            <Alert
              icon={<IconAlertCircle size={20} />}
              color="yellow"
              variant="light"
              radius="md"
              withCloseButton
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={600}>⚠️ Attention - Paiements en attente</Text>
                  <Text size="sm">{stats.resteARecouvrer.toLocaleString()} FCFA à recouvrer</Text>
                </div>
                <Button size="xs" variant="light" onClick={() => handleNav('paiements')}>
                  Voir les paiements
                </Button>
              </Group>
            </Alert>
          ) : (
            <Alert
              icon={<IconCheck size={20} />}
              color="green"
              variant="filled"
              radius="md"
            >
              <Group justify="space-between" align="center">
                <div>
                  <Text fw={600}>✅ Situation financière saine</Text>
                  <Text size="sm">Tous les paiements sont à jour</Text>
                </div>
                <RingProgress
                  size={60}
                  thickness={5}
                  sections={[{ value: 100, color: 'green' }]}
                  label={<IconCheck size={20} color="green" />}
                />
              </Group>
            </Alert>
          )}

          {/* Navigation rapide améliorée */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Group mb="md">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconBuildingStore size={16} />
              </ThemeIcon>
              <Title order={4} size="h5">🔗 Accès rapide aux modules</Title>
            </Group>
            <Divider mb="md" />
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
              <Button
                variant="gradient"
                gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                leftSection={<IconShoppingBag size={18} />}
                onClick={() => handleNav('ventes')}
                fullWidth
                radius="md"
              >
                Ventes
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'green', to: 'teal' }}
                leftSection={<IconCash size={18} />}
                onClick={() => handleNav('depenses')}
                fullWidth
                radius="md"
              >
                Dépenses
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'orange', to: 'yellow' }}
                leftSection={<IconMoneybag size={18} />}
                onClick={() => handleNav('salaires')}
                fullWidth
                radius="md"
              >
                Salaires
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'gray', to: 'dark' }}
                leftSection={<IconFileText size={18} />}
                onClick={() => handleNav('journal')}
                fullWidth
                radius="md"
              >
                Journal
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'purple', to: 'violet' }}
                leftSection={<IconChartBar size={18} />}
                onClick={() => handleNav('bilan')}
                fullWidth
                radius="md"
              >
                Bilan
              </Button>
            </SimpleGrid>
          </Card>

          {/* Cartes KPI principales */}
          <Title order={3} size="h4" mb="xs">📊 Indicateurs principaux</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {cards.map((card, index) => (
              <Paper
                key={index}
                p="md"
                radius="lg"
                withBorder
                style={{ backgroundColor: card.bg }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {card.label}
                  </Text>
                  <ThemeIcon color={card.color} variant="light" size="lg" radius="md">
                    {card.icon}
                  </ThemeIcon>
                </Group>
                <Text fw={800} size="xxl" c={card.color} style={{ fontSize: 32 }}>
                  {card.value.toLocaleString()} FCFA
                </Text>
                <Text size="xs" c="dimmed" mt="sm">
                  {card.description}
                </Text>
                <Progress
                  value={Math.min((card.value / (stats.chiffreAffaires || 1)) * 100, 100)}
                  size="xs"
                  radius="xl"
                  color={card.color}
                  mt="sm"
                />
              </Paper>
            ))}
          </SimpleGrid>

          {/* Cartes bénéfices et recouvrement */}
          <Title order={3} size="h4" mb="xs">📈 Analyse des bénéfices</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {beneficeCards.map((card, index) => (
              <Paper
                key={index}
                p="md"
                radius="lg"
                withBorder
                style={{ backgroundColor: card.bg }}
              >
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {card.label}
                  </Text>
                  <ThemeIcon color={card.color} variant="light" size="lg" radius="md">
                    {card.icon}
                  </ThemeIcon>
                </Group>
                <Text
                  fw={800}
                  size="xxl"
                  c={card.color}
                  style={{ fontSize: 32 }}
                >
                  {card.value.toLocaleString()} {card.suffix || 'FCFA'}
                </Text>
                <Text size="xs" c="dimmed" mt="sm">
                  {card.description}
                </Text>
                {card.suffix === '%' && (
                  <Progress
                    value={card.value}
                    size="xs"
                    radius="xl"
                    color={card.color}
                    mt="sm"
                  />
                )}
              </Paper>
            ))}
          </SimpleGrid>

          {/* Résumé financier */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Group mb="md">
              <ThemeIcon size="md" radius="md" color="violet" variant="light">
                <IconTrendingUp size={16} />
              </ThemeIcon>
              <Title order={4} size="h5">📋 Synthèse financière</Title>
            </Group>
            <Divider mb="md" />
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm">📈 Performance commerciale</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Chiffre d'affaires : <strong>{stats.chiffreAffaires.toLocaleString()} FCFA</strong><br />
                  Taux de recouvrement : <strong>{Math.round(tauxPaiement)}%</strong><br />
                  Reste à recouvrer : <strong>{stats.resteARecouvrer.toLocaleString()} FCFA</strong>
                </Text>
              </Paper>
              <Paper p="md" radius="md" withBorder bg="green.0">
                <Text fw={600} size="sm">💰 Rentabilité</Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Bénéfice net : <strong>{stats.beneficeComptable.toLocaleString()} FCFA</strong><br />
                  Marge brute : <strong>{stats.chiffreAffaires > 0 ? Math.round((stats.beneficeComptable / stats.chiffreAffaires) * 100) : 0}%</strong><br />
                  Trésorerie nette : <strong>{stats.beneficeTresorerie.toLocaleString()} FCFA</strong>
                </Text>
              </Paper>
            </SimpleGrid>
          </Card>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Bilan financier - Instructions"
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
                <Text fw={600} size="sm" mb="md">📌 Définitions :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Le chiffre d'affaires représente le total des commandes et ventes</Text>
                  <Text size="sm">2️⃣ Les encaissements incluent tous les paiements reçus</Text>
                  <Text size="sm">3️⃣ Le bénéfice comptable = CA - (dépenses + salaires)</Text>
                  <Text size="sm">4️⃣ Le bénéfice trésorerie = encaissements - (dépenses + salaires)</Text>
                  <Text size="sm">5️⃣ Le taux de recouvrement mesure l'efficacité des encaissements</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Conseils :</Text>
                <Stack gap="xs">
                  <Text size="sm">• Un bénéfice positif indique une activité rentable</Text>
                  <Text size="sm">• Un faible taux de recouvrement peut signaler des retards de paiement</Text>
                  <Text size="sm">• Comparez les bénéfices comptable et trésorerie pour analyser les délais</Text>
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

export default BilanFinancier;