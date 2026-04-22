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
    // Convertir le nom de la page en route
    const routeMap: Record<string, string> = {
      commandes: '/commandes',
      paiements: '/paiements',
      depenses: '/depenses',
      salaires: '/salaires',
      journal_caisse: '/journal',
    };
    
    const route = routeMap[page] || '/';
    
    // Utiliser setPage si fourni, sinon navigate
    if (setPage) {
      setPage(page);
    } else {
      navigate(route);
    }
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text c="dimmed" fs="italic">Analyse des données financières en cours...</Text>
        </div>
      </Card>
    );
  }

  // Calculs
  const tauxPaiement = stats.chiffreAffaires > 0
    ? (stats.encaissements / stats.chiffreAffaires) * 100
    : 0;

  const cards = [
    {
      label: "Chiffre d'affaires",
      value: stats.chiffreAffaires,
      description: "Commandes + ventes.",
      color: "blue",
      icon: <IconChartBar size={20} />,
    },
    {
      label: "Encaissements",
      value: stats.encaissements,
      description: "Paiements + ventes.",
      color: "green",
      icon: <IconCash size={20} />,
    },
    {
      label: "Dépenses",
      value: stats.depenses,
      description: "Charges hors salaires.",
      color: "red",
      icon: <IconReceipt size={20} />,
    },
    {
      label: "Salaires",
      value: stats.salaires,
      description: "Rémunérations nettes.",
      color: "orange",
      icon: <IconMoneybag size={20} />,
    },
    {
      label: "Bénéfice comptable",
      value: stats.beneficeComptable,
      description: "CA - dépenses globales.",
      color: stats.beneficeComptable >= 0 ? "emerald" : "red",
      icon: <IconTrendingUp size={20} />,
    },
    {
      label: "Bénéfice trésorerie",
      value: stats.beneficeTresorerie,
      description: "Encaissements - dépenses.",
      color: stats.beneficeTresorerie >= 0 ? "green" : "red",
      icon: <IconTrendingUp size={20} />,
    },
    {
      label: "Reste à recouvrer",
      value: stats.resteARecouvrer,
      description: "Montant non encaissé.",
      color: "yellow",
      icon: <IconAlertCircle size={20} />,
    },
    {
      label: "Taux de recouvrement",
      value: tauxPaiement,
      description: "Encaissement / CA.",
      color: "indigo",
      icon: <IconChartBar size={20} />,
      suffix: "%",
    },
  ];

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER AVEC BOUTON INSTRUCTIONS */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <IconChartBar size={24} color="white" />
                <Title order={2} c="white">Bilan financier</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Analyse globale des performances financières
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
                <IconMoneybag size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* ALERTE */}
        {stats.resteARecouvrer > 0 ? (
          <Alert
            icon={<IconAlertCircle size={20} />}
            color="yellow"
            variant="light"
            title="Attention"
          >
            <Group justify="space-between" align="center">
              <Text>{stats.resteARecouvrer.toLocaleString()} FCFA à recouvrer</Text>
              <Button size="xs" variant="light" onClick={() => handleNav('paiements')}>
                Voir les paiements
              </Button>
            </Group>
          </Alert>
        ) : (
          <Alert
            icon={<IconCheck size={20} />}
            color="green"
            variant="light"
            title="Situation saine"
          >
            Tous les paiements sont à jour
          </Alert>
        )}

        {/* NAVIGATION RAPIDE */}
        <Card withBorder radius="md" p="md">
          <Title order={5} mb="md">🔗 Accès rapide</Title>
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm">
            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              leftSection={<IconShoppingBag size={16} />}
              onClick={() => handleNav('commandes')}
              fullWidth
            >
              Commandes
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              leftSection={<IconCash size={16} />}
              onClick={() => handleNav('paiements')}
              fullWidth
            >
              Paiements
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'red', to: 'pink' }}
              leftSection={<IconReceipt size={16} />}
              onClick={() => handleNav('depenses')}
              fullWidth
            >
              Dépenses
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'orange', to: 'yellow' }}
              leftSection={<IconMoneybag size={16} />}
              onClick={() => handleNav('salaires')}
              fullWidth
            >
              Salaires
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'gray', to: 'dark' }}
              leftSection={<IconFileText size={16} />}
              onClick={() => handleNav('journal_caisse')}
              fullWidth
            >
              Journal
            </Button>
          </SimpleGrid>
        </Card>

        {/* CARDS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {cards.map((card, index) => (
            <Card
              key={index}
              withBorder
              radius="md"
              p="md"
              shadow="sm"
              style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  {card.label}
                </Text>
                <ThemeIcon color={card.color} variant="light" size={30} radius="md">
                  {card.icon}
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c={card.color}>
                {card.value.toLocaleString()} {card.suffix || 'FCFA'}
              </Text>
              <Text size="xs" c="dimmed" mt="xs">
                {card.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

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
            <Text size="sm">1. Le chiffre d'affaires représente le total des commandes et ventes</Text>
            <Text size="sm">2. Les encaissements incluent tous les paiements reçus</Text>
            <Text size="sm">3. Le bénéfice comptable = CA - (dépenses + salaires)</Text>
            <Text size="sm">4. Le bénéfice trésorerie = encaissements - (dépenses + salaires)</Text>
            <Text size="sm">5. Le taux de recouvrement mesure l'efficacité des encaissements</Text>
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

export default BilanFinancier;