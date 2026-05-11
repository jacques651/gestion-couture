import React, {
  useEffect,
  useState
} from 'react';

import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Alert,
  Divider,
  TextInput,
  Box,
  Container,
  Avatar,
  ThemeIcon,
  Paper,
  Badge,
  Modal,
  LoadingOverlay,
} from '@mantine/core';

import {
  IconServer,
  IconCheck,
  IconInfoCircle,
  IconPlugConnected,
  IconDeviceDesktop,
  IconWorld,
} from '@tabler/icons-react';

import {
  notifications
} from '@mantine/notifications';

interface HealthResponse {
  success: boolean;
}

const ConfigurationServeur:
React.FC = () => {

  /**
   * =========================
   * STATES
   * =========================
   */
  const [
    serverUrl,
    setServerUrl
  ] = useState(
    'http://localhost:3001'
  );

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    testing,
    setTesting
  ] = useState(false);

  const [
    connected,
    setConnected
  ] = useState(false);

  const [
    infoModalOpen,
    setInfoModalOpen
  ] = useState(false);

  /**
   * =========================
   * LOAD CONFIG
   * =========================
   */
  useEffect(() => {

    const savedUrl =

      localStorage.getItem(
        'api_url'
      );

    if (savedUrl) {

      setServerUrl(
        savedUrl
      );
    }

  }, []);

  /**
   * =========================
   * TEST SERVER
   * =========================
   */
  const testerConnexion =
  async () => {

    if (!serverUrl) {

      notifications.show({

        title:
          'Erreur',

        message:
          'Veuillez saisir une URL serveur',

        color:
          'red'
      });

      return;
    }

    setTesting(true);

    try {

      const response =
        await fetch(
          `${serverUrl}/health`
        );

      if (!response.ok) {

        throw new Error(
          'Serveur inaccessible'
        );
      }

      const data:
        HealthResponse =
          await response.json();

      if (data.success) {

        setConnected(true);

        notifications.show({

          title:
            'Connexion réussie',

          message:
            'Le serveur est accessible',

          color:
            'green'
        });

      } else {

        setConnected(false);

        notifications.show({

          title:
            'Erreur',

          message:
            'Réponse serveur invalide',

          color:
            'red'
        });
      }

    } catch (error) {

      console.error(error);

      setConnected(false);

      notifications.show({

        title:
          'Connexion échouée',

        message:
          'Impossible de joindre le serveur',

        color:
          'red'
      });

    } finally {

      setTesting(false);
    }
  };

  /**
   * =========================
   * SAVE CONFIG
   * =========================
   */
  const enregistrerConfiguration =
  async () => {

    if (!serverUrl) {

      notifications.show({

        title:
          'Erreur',

        message:
          'Veuillez saisir une URL serveur',

        color:
          'red'
      });

      return;
    }

    setLoading(true);

    try {

      localStorage.setItem(

        'api_url',

        serverUrl
      );

      notifications.show({

        title:
          'Succès',

        message:
          'Configuration enregistrée',

        color:
          'green'
      });

    } catch (error) {

      console.error(error);

      notifications.show({

        title:
          'Erreur',

        message:
          'Erreur enregistrement',

        color:
          'red'
      });

    } finally {

      setLoading(false);
    }
  };

  return (

    <Box p="md">

      <Container size="full">

        <Stack gap="lg">

          {/* HEADER */}
          <Card
            withBorder
            radius="lg"
            p="xl"
            style={{
              background:
                'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)'
            }}
          >

            <Group justify="space-between">

              <Group gap="md">

                <Avatar
                  size={60}
                  radius="md"
                  style={{
                    backgroundColor:
                      'rgba(255,255,255,0.2)'
                  }}
                >

                  <IconServer
                    size={30}
                    color="white"
                  />

                </Avatar>

                <Box>

                  <Title
                    order={2}
                    c="white"
                  >

                    Configuration serveur

                  </Title>

                  <Text
                    c="gray.3"
                    size="sm"
                  >

                    Connexion PostgreSQL via API Express

                  </Text>

                </Box>

              </Group>

              <Button
                variant="light"
                color="white"
                leftSection={
                  <IconInfoCircle size={18} />
                }
                onClick={() =>
                  setInfoModalOpen(true)
                }
                radius="md"
              >

                Aide

              </Button>

            </Group>

          </Card>

          {/* STATUS */}
          <Paper
            p="md"
            radius="lg"
            withBorder
            bg={
              connected
                ? 'green.0'
                : 'gray.0'
            }
          >

            <Group justify="space-between">

              <Group gap="sm">

                <ThemeIcon
                  size="lg"
                  radius="md"
                  color={
                    connected
                      ? 'green'
                      : 'gray'
                  }
                  variant="light"
                >

                  {
                    connected

                      ? (
                        <IconCheck size={20} />
                      )

                      : (
                        <IconDeviceDesktop size={20} />
                      )
                  }

                </ThemeIcon>

                <Box>

                  <Text fw={600}>

                    {

                      connected

                        ? 'Serveur connecté'

                        : 'Serveur non connecté'
                    }

                  </Text>

                  <Text
                    size="xs"
                    c="dimmed"
                  >

                    {serverUrl}

                  </Text>

                </Box>

              </Group>

              <Badge
                color={
                  connected
                    ? 'green'
                    : 'gray'
                }
                variant="filled"
                size="lg"
              >

                {

                  connected

                    ? '🟢 CONNECTÉ'

                    : '⚪ HORS LIGNE'
                }

              </Badge>

            </Group>

          </Paper>

          {/* CONFIG */}
          <Card
            withBorder
            radius="lg"
            p="xl"
          >

            <LoadingOverlay
              visible={loading}
            />

            <Stack gap="md">

              <Title order={4}>

                Paramètres serveur

              </Title>

              <Divider />

              <TextInput
                label="URL du serveur API"
                description="Adresse du backend Express"
                placeholder="http://192.168.1.2:3001"
                value={serverUrl}
                onChange={(e) =>
                  setServerUrl(
                    e.currentTarget.value
                  )
                }
                leftSection={
                  <IconWorld size={16} />
                }
                radius="md"
                size="md"
              />

              <Alert
                icon={
                  <IconInfoCircle size={16} />
                }
                color="blue"
                variant="light"
                radius="md"
              >

                <Text
                  size="sm"
                  fw={600}
                >

                  Exemples :

                </Text>

                <Text size="xs">

                  • Local :
                  http://localhost:3001

                  <br />

                  • Réseau :
                  http://192.168.1.2:3001

                </Text>

              </Alert>

              <Group>

                <Button
                  leftSection={
                    <IconPlugConnected size={16} />
                  }
                  onClick={
                    testerConnexion
                  }
                  variant="outline"
                  color="teal"
                  loading={testing}
                  radius="md"
                >

                  Tester connexion

                </Button>

                <Button
                  onClick={
                    enregistrerConfiguration
                  }
                  loading={loading}
                  leftSection={
                    <IconCheck size={18} />
                  }
                  variant="gradient"
                  gradient={{
                    from: '#1b365d',
                    to: '#2a4a7a'
                  }}
                  radius="md"
                >

                  Enregistrer

                </Button>

              </Group>

            </Stack>

          </Card>

          {/* GUIDE */}
          <Card
            withBorder
            radius="lg"
            p="xl"
          >

            <Title
              order={4}
              mb="md"
            >

              📋 Configuration multi-postes

            </Title>

            <Divider mb="md" />

            <Stack gap="sm">

              <Group gap="xs">

                <Badge
                  color="blue"
                  circle
                >

                  1

                </Badge>

                <Text size="sm">

                  Installer PostgreSQL sur le poste serveur

                </Text>

              </Group>

              <Group gap="xs">

                <Badge
                  color="blue"
                  circle
                >

                  2

                </Badge>

                <Text size="sm">

                  Démarrer le backend Express

                </Text>

              </Group>

              <Group gap="xs">

                <Badge
                  color="blue"
                  circle
                >

                  3

                </Badge>

                <Text size="sm">

                  Récupérer l'adresse IP du serveur

                </Text>

              </Group>

              <Group gap="xs">

                <Badge
                  color="blue"
                  circle
                >

                  4

                </Badge>

                <Text size="sm">

                  Configurer :
                  http://IP:3001

                </Text>

              </Group>

              <Group gap="xs">

                <Badge
                  color="blue"
                  circle
                >

                  5

                </Badge>

                <Text size="sm">

                  Tester puis enregistrer

                </Text>

              </Group>

            </Stack>

          </Card>

          {/* MODAL */}
          <Modal
            opened={infoModalOpen}
            onClose={() =>
              setInfoModalOpen(false)
            }
            title="📋 Aide"
            size="md"
            centered
            radius="md"
          >

            <Stack gap="md">

              <Text size="sm">

                Cette configuration permet
                de connecter plusieurs postes
                au même serveur PostgreSQL.

              </Text>

              <Text size="sm">

                Chaque poste communique
                avec le backend Express
                via HTTP.

              </Text>

              <Text size="sm">

                Exemple :

                <br />

                http://192.168.1.2:3001

              </Text>

              <Divider />

              <Text
                size="xs"
                c="dimmed"
                ta="center"
              >

                Gestion Couture
                PostgreSQL Edition

              </Text>

            </Stack>

          </Modal>

        </Stack>

      </Container>

    </Box>
  );
};

export default ConfigurationServeur;