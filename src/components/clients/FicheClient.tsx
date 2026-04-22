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
  Paper,
  Badge,
  Box,
  Grid,
  ThemeIcon,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconScissors,
  IconPhone,
  IconUser,
  IconCalendar,
  IconMapPin,
  IconArrowLeft,
  IconRuler,
  IconNotes,
  IconBuildingStore,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface FicheClientProps {
  client: any;
  mesures: any[];
  onBack: () => void;
}

const FicheClient: React.FC<FicheClientProps> = ({ client, mesures, onBack }) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerInfosAtelier = async () => {
      try {
        const db = await getDb();
        const res = await db.select<any[]>("SELECT * FROM configuration_atelier WHERE id = 1");
        if (res.length > 0) setConfig(res[0]);
      } catch (err) {
        console.error("Erreur config atelier:", err);
      } finally {
        setLoading(false);
      }
    };
    chargerInfosAtelier();
  }, []);

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement de la fiche client...</Text>
      </Card>
    );
  }

  return (
    <Stack p="md" gap="lg">
      {/* HEADER */}
      <Card withBorder radius="md" p="lg" bg="adminBlue.8">
        <Group justify="space-between">
          <Stack gap={2}>
            <Title order={2} c="white">Fiche client</Title>
            <Text size="sm" c="gray.3">
              {client?.nom_prenom || "Client"}
            </Text>
          </Stack>
          <Button
            variant="light"
            color="white"
            leftSection={<IconArrowLeft size={18} />}
            onClick={onBack}
          >
            Retour à la liste
          </Button>
        </Group>
      </Card>

      {/* EN-TÊTE ATELIER */}
      <Card withBorder radius="md" p="lg">
        <Group align="flex-start" wrap="nowrap" gap="md">
          <ThemeIcon size={50} radius="md" color="blue" variant="light">
            <IconScissors size={28} />
          </ThemeIcon>
          <Box style={{ flex: 1 }}>
            <Title order={3} mb={4}>
              {config?.nom_atelier || "Mon Atelier"}
            </Title>
            <Stack gap={4}>
              <Group gap="md">
                <Group gap={4}>
                  <IconMapPin size={14} />
                  <Text size="xs" c="dimmed">
                    {config?.adresse || "Adresse non définie"}
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconPhone size={14} />
                  <Text size="xs" c="dimmed">
                    {config?.telephone || "Contact non défini"}
                  </Text>
                </Group>
              </Group>
            </Stack>
          </Box>
          <Badge size="lg" variant="light" color="blue" leftSection={<IconCalendar size={14} />}>
            {new Date().toLocaleDateString('fr-FR')}
          </Badge>
        </Group>
      </Card>

      {/* INFOS CLIENT */}
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
            {client?.nom_prenom || "Non défini"}
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={24} radius="xl" color="blue" variant="light">
              <IconPhone size={14} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Contact
            </Text>
          </Group>
          <Text size="lg" fw={700}>
            {client?.telephone_id || "Non défini"}
          </Text>
        </Card>
      </SimpleGrid>

      {/* MESURES */}
      <Card withBorder radius="md" p="lg">
        <Group gap="xs" mb="md">
          <ThemeIcon size={24} radius="xl" color="blue" variant="light">
            <IconRuler size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Relevé des mesures
          </Text>
        </Group>

        <Divider mb="md" />

        {mesures && mesures.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {mesures.map((m, idx) => (
              <Paper key={idx} withBorder p="sm" radius="md" bg="gray.0">
                <Text size="xs" c="dimmed" tt="uppercase" fw={500} mb={4}>
                  {m.nom}
                </Text>
                <Text size="xl" fw={700} c="blue">
                  {m.valeur}{' '}
                  <Text component="span" size="xs" c="dimmed" fw={400}>
                    ({m.unite || 'cm'})
                  </Text>
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Text ta="center" c="dimmed" py="xl">
            Aucune mesure enregistrée pour ce client.
          </Text>
        )}
      </Card>

      {/* OBSERVATIONS */}
      <Card withBorder radius="md" p="lg">
        <Group gap="xs" mb="md">
          <ThemeIcon size={24} radius="xl" color="blue" variant="light">
            <IconNotes size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Notes de l'atelier
          </Text>
        </Group>
        <Divider mb="md" />
        <Text size="sm" c="dimmed" fs="italic">
          {client?.observations || client?.recommandations || "Aucune observation particulière."}
        </Text>
      </Card>

      {/* MESSAGE FINAL */}
      <Card withBorder radius="md" p="lg" bg="gray.0">
        <Text ta="center" size="sm" c="dimmed" fs="italic">
          {config?.message_facture || "Merci de votre fidélité !"}
        </Text>
      </Card>
    </Stack>
  );
};

export default FicheClient;