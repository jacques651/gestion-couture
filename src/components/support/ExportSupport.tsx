// src/components/support/ExportSupport.tsx

import React, {
  useState
} from 'react';

import {
  Stack,
  Card,
  Title,
  Text,
  Button,
  Group,
  ThemeIcon,
  Alert,
  Divider,
  Code,
  Container,
  Box,
  Avatar,
  Badge,
  Paper,
  SimpleGrid,
  Progress,
} from '@mantine/core';

import {
  IconDownload,
  IconAlertCircle,
  IconCheck,
  IconDatabase,
  IconInfoCircle,
  IconShieldLock,
  IconCloudUpload,
  IconMailForward,
  IconExternalLink,
  IconFileZip,
  IconServer,
} from '@tabler/icons-react';

import {
  notifications
} from '@mantine/notifications';

const API_URL =

  localStorage.getItem(
    'api_url'
  )

  ||

  'http://localhost:3001';

const ExportSupport:
React.FC = () => {

  /**
   * =========================
   * STATES
   * =========================
   */
  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    exported,
    setExported
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string | null>(
    null
  );

  const [
    progress,
    setProgress
  ] = useState(0);

  /**
   * =========================
   * EXPORT SUPPORT
   * =========================
   */
  const exporterPourSupport =
  async () => {

    try {

      setLoading(true);

      setErrorMessage(null);

      setProgress(20);

      /**
       * TEST SERVER
       */
      const health =
        await fetch(
          `${API_URL}/health`
        );

      if (!health.ok) {

        throw new Error(
          'Serveur inaccessible'
        );
      }

      setProgress(50);

      /**
       * DOWNLOAD
       */
      window.open(

        `${API_URL}/support/export`,

        '_blank'
      );

      setProgress(100);

      setExported(true);

      notifications.show({

        title:
          'Export démarré',

        message:
          'Téléchargement du support lancé',

        color:
          'green',
      });

      setTimeout(() => {

        setExported(false);

        setProgress(0);

      }, 3000);

    } catch (err: any) {

      console.error(err);

      setErrorMessage(

        err?.message
        ||
        'Erreur export support'
      );

      notifications.show({

        title:
          'Erreur',

        message:

          err?.message
          ||
          'Erreur export support',

        color:
          'red',
      });

      setProgress(0);

    } finally {

      setLoading(false);
    }
  };

  /**
   * =========================
   * FEATURES
   * =========================
   */
  const features = [

    {

      icon:
        IconShieldLock,

      title:
        "Données sécurisées",

      description:

        "Export PostgreSQL sécurisé et compressé",

      color:
        "green",
    },

    {

      icon:
        IconCloudUpload,

      title:
        "Export professionnel",

      description:

        "Backup serveur complet avec diagnostics",

      color:
        "blue",
    },

    {

      icon:
        IconMailForward,

      title:
        "Support rapide",

      description:

        "Analyse technique et assistance prioritaire",

      color:
        "orange",
    },
  ];

  return (

    <Container
      size="xl"
      p="md"
    >

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

          <Group
            justify="space-between"
            align="center"
          >

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
                  order={1}
                  c="white"
                  size="h2"
                >

                  Export support PostgreSQL

                </Title>

                <Text
                  c="gray.3"
                  size="sm"
                  mt={4}
                >

                  Génération d'un export serveur
                  complet pour assistance technique

                </Text>

                <Group
                  gap="xs"
                  mt={8}
                >

                  <Badge
                    size="sm"
                    variant="white"
                    color="blue"
                  >

                    PostgreSQL

                  </Badge>

                  <Badge
                    size="sm"
                    variant="white"
                    color="blue"
                  >

                    ZIP

                  </Badge>

                  <Badge
                    size="sm"
                    variant="white"
                    color="blue"
                  >

                    Diagnostics

                  </Badge>

                </Group>

              </Box>

            </Group>

            <ThemeIcon
              size={60}
              radius="md"
              variant="white"
              style={{
                opacity: 0.9
              }}
            >

              <IconFileZip
                size={35}
                color="#1b365d"
              />

            </ThemeIcon>

          </Group>

        </Card>

        {/* SUCCESS */}
        {exported && (

          <Alert
            icon={
              <IconCheck size={20} />
            }
            color="green"
            variant="filled"
            radius="md"
            withCloseButton
            onClose={() =>
              setExported(false)
            }
          >

            <Text fw={600}>

              ✅ Export généré

            </Text>

            <Text size="sm">

              Le téléchargement du package support
              a été lancé avec succès.

            </Text>

          </Alert>
        )}

        {/* ERROR */}
        {errorMessage && (

          <Alert
            icon={
              <IconAlertCircle size={20} />
            }
            color="red"
            variant="filled"
            radius="md"
            withCloseButton
            onClose={() =>
              setErrorMessage(null)
            }
          >

            <Text fw={600}>

              ❌ Erreur export

            </Text>

            <Text size="sm">

              {errorMessage}

            </Text>

          </Alert>
        )}

        {/* FEATURES */}
        <SimpleGrid
          cols={{
            base: 1,
            md: 3
          }}
          spacing="md"
        >

          {features.map(

            (feature, index) => (

              <Card
                key={index}
                withBorder
                radius="lg"
                p="md"
                shadow="sm"
              >

                <Group
                  justify="center"
                  mb="md"
                >

                  <ThemeIcon
                    size="xl"
                    radius="md"
                    color={feature.color}
                    variant="light"
                  >

                    <feature.icon
                      size={24}
                    />

                  </ThemeIcon>

                </Group>

                <Text
                  ta="center"
                  fw={600}
                  size="sm"
                >

                  {feature.title}

                </Text>

                <Text
                  ta="center"
                  size="xs"
                  c="dimmed"
                  mt={4}
                >

                  {feature.description}

                </Text>

              </Card>
            )
          )}

        </SimpleGrid>

        {/* INFO */}
        <Alert
          icon={
            <IconInfoCircle size={18} />
          }
          color="blue"
          variant="light"
          radius="lg"
        >

          <Text
            fw={600}
            size="sm"
          >

            Contenu de l'export

          </Text>

          <Text
            size="xs"
            mt={5}
          >

            • Sauvegarde PostgreSQL

            <br />

            • Journal système

            <br />

            • Configuration serveur

            <br />

            • Diagnostics application

            <br />

            • Informations techniques

          </Text>

        </Alert>

        {/* EXPORT */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="md"
        >

          <Stack gap="lg">

            <Group>

              <ThemeIcon
                size={60}
                radius="md"
                variant="gradient"
                gradient={{
                  from: 'blue',
                  to: 'cyan'
                }}
              >

                <IconDatabase
                  size={30}
                />

              </ThemeIcon>

              <Stack gap={2}>

                <Title
                  order={3}
                  size="h4"
                >

                  Génération export support

                </Title>

                <Text
                  size="xs"
                  c="dimmed"
                >

                  Création automatique d'un package ZIP
                  PostgreSQL complet

                </Text>

              </Stack>

            </Group>

            <Divider />

            {/* PROGRESS */}
            {loading && progress > 0 && (

              <Box>

                <Group
                  justify="space-between"
                  mb={5}
                >

                  <Text
                    size="xs"
                    fw={500}
                  >

                    Génération export...

                  </Text>

                  <Text
                    size="xs"
                    fw={500}
                  >

                    {progress}%

                  </Text>

                </Group>

                <Progress
                  value={progress}
                  size="md"
                  radius="xl"
                  color="blue"
                  striped
                  animated
                />

              </Box>
            )}

            {/* WARNING */}
            <Alert
              icon={
                <IconAlertCircle size={16} />
              }
              color="yellow"
              variant="light"
              radius="md"
            >

              <Text
                fw={600}
                size="sm"
              >

                Recommandations

              </Text>

              <Text
                size="xs"
                mt={5}
              >

                • Vérifiez que le serveur est actif

                <br />

                • Ne fermez pas l'application pendant l'export

                <br />

                • L'export peut prendre plusieurs secondes

              </Text>

            </Alert>

            {/* BUTTON */}
            <Button

              onClick={
                exporterPourSupport
              }

              loading={loading}

              size="lg"

              variant="gradient"

              gradient={{
                from: '#1b365d',
                to: '#2a4a7a'
              }}

              leftSection={
                <IconDownload size={20} />
              }

              fullWidth

              radius="md"

              disabled={loading}
            >

              {

                loading

                  ? "Export en cours..."

                  : "Générer export support"
              }

            </Button>

            {/* SUPPORT */}
            <Paper
              p="md"
              radius="md"
              bg="gray.0"
              ta="center"
            >

              <Text
                size="xs"
                c="dimmed"
              >

                Une fois le téléchargement terminé,
                envoyez le fichier ZIP à :

              </Text>

              <Group
                justify="center"
                mt={8}
              >

                <Code fw={600}>

                  jacqueskorgo5@gmail.com

                </Code>

                <Button
                  component="a"
                  href="mailto:jacqueskorgo5@gmail.com"
                  size="xs"
                  variant="subtle"
                  color="blue"
                  rightSection={
                    <IconExternalLink size={12} />
                  }
                >

                  Envoyer email

                </Button>

              </Group>

            </Paper>

          </Stack>

        </Card>

        {/* FAQ */}
        <Card
          withBorder
          radius="lg"
          p="xl"
          shadow="sm"
        >

          <Title
            order={4}
            mb="md"
            size="h5"
          >

            📋 Questions fréquentes

          </Title>

          <Stack gap="md">

            <Paper
              p="sm"
              radius="md"
              withBorder
            >

              <Text
                fw={600}
                size="sm"
              >

                🔒 Les données sont-elles sécurisées ?

              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={4}
              >

                Oui.
                Le package est généré directement
                par le serveur PostgreSQL.

              </Text>

            </Paper>

            <Paper
              p="sm"
              radius="md"
              withBorder
            >

              <Text
                fw={600}
                size="sm"
              >

                ⏱️ Combien de temps prend l'export ?

              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={4}
              >

                Généralement quelques secondes,
                selon la taille de la base.

              </Text>

            </Paper>

            <Paper
              p="sm"
              radius="md"
              withBorder
            >

              <Text
                fw={600}
                size="sm"
              >

                📧 Que faire après ?

              </Text>

              <Text
                size="xs"
                c="dimmed"
                mt={4}
              >

                Envoyez simplement le fichier ZIP
                au support technique.

              </Text>

            </Paper>

          </Stack>

        </Card>

        {/* FOOTER */}
        <Card
          withBorder
          radius="lg"
          p="md"
          ta="center"
          bg="gray.0"
        >

          <Text
            size="xs"
            c="dimmed"
          >

            © {new Date().getFullYear()}
            KO-SOFT Couture

          </Text>

          <Text
            size="xs"
            c="dimmed"
            mt={4}
          >

            PostgreSQL Support Edition

          </Text>

        </Card>

      </Stack>

    </Container>
  );
};

export default ExportSupport;