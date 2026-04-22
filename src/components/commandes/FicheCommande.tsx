import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Divider,
  SimpleGrid,
  Badge,
  Table,
  Paper,
  Grid,
  ThemeIcon,
  LoadingOverlay,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPrinter,
  IconUser,
  IconCalendar,
  IconShoppingBag,
  IconCash,
  IconReceipt,
  IconCheck,
  IconX,
  IconClock,
} from '@tabler/icons-react';
import { getRecuData } from '../../database/db';

interface FicheProps {
  commandeId: number;
  onBack: () => void;
}

const FicheCommande: React.FC<FicheProps> = ({ commandeId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getRecuData(commandeId);
        setData(res);
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [commandeId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement de la commande...</Text>
      </Card>
    );
  }

  if (!data?.commande) {
    return (
      <Card withBorder radius="md" p="lg">
        <Alert icon={<IconX size={16} />} color="red" title="Erreur">
          Commande introuvable
        </Alert>
      </Card>
    );
  }

  const { commande, paiements = [] } = data;

  // Calcul des totaux
  const total = Number(commande.total) || 0;
  const totalPaye = paiements.reduce((sum: number, p: any) => sum + (Number(p.montant) || 0), 0);
  const reste = total - totalPaye;

  // Helper date
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('fr-FR') : 'Non définie';

  const getStatutPaiement = () => {
    if (reste <= 0) {
      return { label: 'Payé', color: 'green', icon: <IconCheck size={14} /> };
    }
    if (totalPaye > 0) {
      return { label: 'Partiel', color: 'orange', icon: <IconClock size={14} /> };
    }
    return { label: 'Impayé', color: 'red', icon: <IconX size={14} /> };
  };

  const statut = getStatutPaiement();

  return (
    <Stack p="md" gap="lg">
      {/* HEADER */}
      <Card withBorder radius="md" p="lg" bg="adminBlue.8">
        <Group justify="space-between">
          <Stack gap={2}>
            <Group gap="xs" align="center">
              <IconReceipt size={24} color="white" />
              <Title order={2} c="white">Commande N° {commande.id}</Title>
              <Badge size="lg" color={statut.color} variant="light" leftSection={statut.icon}>
                {statut.label}
              </Badge>
            </Group>
            <Text size="sm" c="gray.3">
              Éditée le {new Date().toLocaleDateString('fr-FR')}
            </Text>
          </Stack>
          <Group>
            <Button
              variant="light"
              color="white"
              leftSection={<IconArrowLeft size={16} />}
              onClick={onBack}
              className="print:hidden"
            >
              Retour
            </Button>
            <Button
              variant="light"
              color="teal"
              leftSection={<IconPrinter size={16} />}
              onClick={handlePrint}
              className="print:hidden"
            >
              Imprimer
            </Button>
          </Group>
        </Group>
      </Card>

      {/* INFOS CLIENT ET RENDEZ-VOUS */}
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={24} radius="xl" color="blue" variant="light">
              <IconUser size={14} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Client
            </Text>
          </Group>
          <Text size="lg" fw={700}>
            {commande.nom_prenom || '—'}
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={24} radius="xl" color="red" variant="light">
              <IconCalendar size={14} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Rendez-vous
            </Text>
          </Group>
          <Text size="lg" fw={700} c="red">
            {formatDate(commande.rendez_vous)}
          </Text>
        </Card>
      </SimpleGrid>

      {/* DÉTAILS DE LA PRESTATION */}
      <Card withBorder radius="md" p="lg">
        <Group gap="xs" mb="md">
          <ThemeIcon size={24} radius="xl" color="indigo" variant="light">
            <IconShoppingBag size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Prestation
          </Text>
        </Group>
        <Divider mb="md" />
        
        <Stack gap="md">
          <Text size="lg" fw={500} fs="italic" c="gray.7">
            "{commande.designation || '—'}"
          </Text>
          
          <Divider />
          
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <Paper p="sm" radius="md" bg="gray.0" ta="center">
              <Text size="xs" c="dimmed">Quantité</Text>
              <Text fw={700} size="xl">{commande.nombre ?? 0}</Text>
            </Paper>
            <Paper p="sm" radius="md" bg="gray.0" ta="center">
              <Text size="xs" c="dimmed">Prix unitaire</Text>
              <Text fw={700} size="xl">{(Number(commande.prix_unitaire) || 0).toLocaleString()} CFA</Text>
            </Paper>
            <Paper p="sm" radius="md" bg="blue.0" ta="center">
              <Text size="xs" c="dimmed">Total</Text>
              <Text fw={700} size="xl" c="blue">{total.toLocaleString()} CFA</Text>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Card>

      {/* HISTORIQUE DES PAIEMENTS */}
      <Card withBorder radius="md" p="lg">
        <Group gap="xs" mb="md">
          <ThemeIcon size={24} radius="xl" color="green" variant="light">
            <IconCash size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Historique des paiements
          </Text>
        </Group>
        <Divider mb="md" />

        {paiements.length === 0 ? (
          <Paper p="xl" radius="md" bg="gray.0" ta="center">
            <IconCash size={32} color="gray" strokeWidth={1} />
            <Text ta="center" c="dimmed" mt="sm">
              Aucun paiement enregistré
            </Text>
          </Paper>
        ) : (
          <Stack gap="sm">
            {paiements.map((p: any, i: number) => (
              <Paper key={i} withBorder p="md" radius="md">
                <Group justify="space-between" wrap="nowrap">
                  <div>
                    <Group gap="xs" mb={4}>
                      <Badge color="blue" variant="light" size="sm">
                        {formatDate(p.date_paiement)}
                      </Badge>
                      {p.mode && (
                        <Text size="xs" c="dimmed">
                          Mode: {p.mode}
                        </Text>
                      )}
                    </Group>
                    {p.observation && (
                      <Text size="xs" c="dimmed" fs="italic">
                        {p.observation}
                      </Text>
                    )}
                  </div>
                  <Text fw={700} size="lg" c="green">
                    +{(Number(p.montant) || 0).toLocaleString()} CFA
                  </Text>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Card>

      {/* RÉCAPITULATIF FINANCIER */}
      <Card withBorder radius="md" p="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Paper p="md" radius="md" bg="green.0" ta="center">
            <Text size="xs" c="dimmed">Déjà réglé</Text>
            <Text fw={700} size="xl" c="green">{totalPaye.toLocaleString()} CFA</Text>
          </Paper>
          <Paper p="md" radius="md" bg={reste > 0 ? "red.0" : "green.0"} ta="center">
            <Text size="xs" c="dimmed">Reste à payer</Text>
            <Text fw={700} size="xl" c={reste > 0 ? "red" : "green"}>
              {reste.toLocaleString()} CFA
            </Text>
          </Paper>
        </SimpleGrid>
      </Card>

      {/* STYLES D'IMPRESSION */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </Stack>
  );
};

export default FicheCommande;