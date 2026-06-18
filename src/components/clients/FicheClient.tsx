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
  ThemeIcon,
  LoadingOverlay,
  Center,
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
  IconMail,
  IconUserCircle,
} from '@tabler/icons-react';
import { apiGet } from '../../services/api';

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
        const res = await apiGet("/atelier");
        if (res && res.length > 0) {
          setConfig(res[0]);
        }
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
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl" style={{ minWidth: 300 }}>
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconUserCircle size={40} stroke={1.5} />
            <Text>Chargement de la fiche client...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  const profilLabel =
    client?.profil === 'principal' ? 'Principal' :
    client?.profil === 'enfant' ? 'Enfant' :
    client?.profil === 'conjoint' ? 'Conjoint(e)' :
    client?.profil === 'parent' ? 'Parent' :
    client?.profil === 'autre' ? 'Autre' : 'Non défini';

  const profilColor =
    client?.profil === 'principal' ? 'blue' :
    client?.profil === 'enfant' ? 'pink' :
    client?.profil === 'conjoint' ? 'violet' :
    client?.profil === 'parent' ? 'orange' : 'gray';

  return (
    <Stack p="md" gap="lg">
      {/* HEADER */}
      <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <ThemeIcon size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <IconUser size={28} color="white" />
            </ThemeIcon>
            <Box>
              <Title order={2} c="white">Fiche client</Title>
              <Text size="sm" c="gray.3">
                {client?.nom_prenom || "Client sans nom"}
              </Text>
            </Box>
          </Group>
          <Button
            variant="light"
            color="white"
            leftSection={<IconArrowLeft size={18} />}
            onClick={onBack}
            radius="md"
          >
            Retour à la liste
          </Button>
        </Group>
      </Card>

      {/* EN-TÊTE ATELIER */}
      <Card withBorder radius="lg" p="lg" shadow="sm">
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
                  <IconMapPin size={14} color="gray" />
                  <Text size="xs" c="dimmed">
                    {config?.adresse || "Adresse non définie"}
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconPhone size={14} color="gray" />
                  <Text size="xs" c="dimmed">
                    {config?.telephone || "Contact non défini"}
                  </Text>
                </Group>
              </Group>
            </Stack>
          </Box>
          <Badge size="lg" variant="light" color="blue" leftSection={<IconCalendar size={14} />}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Badge>
        </Group>
      </Card>

      {/* INFOS CLIENT */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* Nom complet */}
        <Card withBorder radius="lg" p="md" shadow="sm">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={28} radius="xl" color="blue" variant="light">
              <IconUser size={16} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Client
            </Text>
          </Group>
          <Text size="lg" fw={700}>
            {client?.nom_prenom || "Non défini"}
          </Text>
          {client?.profil && (
            <Badge size="sm" color={profilColor} variant="light" mt="xs">
              {profilLabel}
            </Badge>
          )}
        </Card>

        {/* Téléphone */}
        <Card withBorder radius="lg" p="md" shadow="sm">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={28} radius="xl" color="green" variant="light">
              <IconPhone size={16} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Téléphone
            </Text>
          </Group>
          <Text size="lg" fw={700}>
            {client?.telephone_id || "Non défini"}
          </Text>
        </Card>

        {/* Adresse */}
        <Card withBorder radius="lg" p="md" shadow="sm">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={28} radius="xl" color="orange" variant="light">
              <IconMapPin size={16} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Adresse
            </Text>
          </Group>
          <Text size="md" fw={500}>
            {client?.adresse || "Non définie"}
          </Text>
        </Card>

        {/* Email */}
        <Card withBorder radius="lg" p="md" shadow="sm">
          <Group gap="xs" mb="xs">
            <ThemeIcon size={28} radius="xl" color="violet" variant="light">
              <IconMail size={16} />
            </ThemeIcon>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Email
            </Text>
          </Group>
          <Text size="md" fw={500}>
            {client?.email || "Non défini"}
          </Text>
        </Card>
      </SimpleGrid>

      {/* MESURES */}
      <Card withBorder radius="lg" p="lg" shadow="sm">
        <Group gap="xs" mb="md">
          <ThemeIcon size={28} radius="xl" color="blue" variant="light">
            <IconRuler size={16} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Relevé des mesures
          </Text>
          {mesures && mesures.length > 0 && (
            <Badge size="sm" variant="light" color="blue">
              {mesures.length} mesure{mesures.length > 1 ? 's' : ''}
            </Badge>
          )}
        </Group>

        <Divider mb="md" />

        {mesures && mesures.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
            {mesures.map((m, idx) => (
              <Paper key={idx} withBorder p="sm" radius="md" bg="gray.0">
                <Text size="xs" c="dimmed" tt="uppercase" fw={500} mb={4}>
                  {m.nom}
                </Text>
                <Group gap={4} align="baseline">
                  <Text size="xl" fw={700} c="blue">
                    {m.valeur}
                  </Text>
                  <Text size="xs" c="dimmed" fw={400}>
                    {m.unite || 'cm'}
                  </Text>
                </Group>
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
      <Card withBorder radius="lg" p="lg" shadow="sm">
        <Group gap="xs" mb="md">
          <ThemeIcon size={28} radius="xl" color="blue" variant="light">
            <IconNotes size={16} />
          </ThemeIcon>
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Notes de l'atelier
          </Text>
        </Group>
        <Divider mb="md" />
        <Text size="sm" c="dimmed" fs="italic">
          {client?.observations || "Aucune observation particulière."}
        </Text>
      </Card>

      {/* MESSAGE FINAL */}
      <Card withBorder radius="lg" p="lg" bg="gray.0" shadow="sm">
        <Text ta="center" size="sm" c="dimmed" fs="italic">
          {config?.message_facture || "Merci de votre fidélité !"}
        </Text>
      </Card>
    </Stack>
  );
};

export default FicheClient;