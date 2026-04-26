// src/components/support/ExportSupport.tsx
import React, { useState } from 'react';
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
  IconFile,
} from '@tabler/icons-react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { notifications } from '@mantine/notifications';

const ExportSupport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const exporterPourSupport = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setProgress(10);
      
      // 📁 Choix du fichier destination
      const cheminDestination = await save({
        title: "Exporter la base pour le support technique",
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }],
        defaultPath: `SAV_Gestion_Couture_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.db`
      });

      if (!cheminDestination) {
        setLoading(false);
        setProgress(0);
        notifications.show({
          title: 'Annulé',
          message: 'Export annulé par l\'utilisateur',
          color: 'yellow',
        });
        return;
      }

      setProgress(30);

      // 📂 Demander à l'utilisateur où se trouve sa base
      const cheminSource = await open({
        title: "Sélectionnez votre base de données (gestion-couture.db)",
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }],
        multiple: false
      });

      if (!cheminSource) {
        setLoading(false);
        setProgress(0);
        notifications.show({
          title: 'Annulé',
          message: 'Vous devez sélectionner la base de données source',
          color: 'yellow',
        });
        return;
      }

      setProgress(60);
      
      // 📖 Lire le fichier source
      const data = await readFile(cheminSource);
      
      setProgress(80);
      
      // 💾 Écrire vers le fichier choisi
      await writeFile(cheminDestination, data);

      setProgress(100);
      
      setExported(true);
      
      notifications.show({
        title: 'Succès',
        message: 'Base de données exportée avec succès',
        color: 'green',
      });
      
      setTimeout(() => {
        setExported(false);
        setProgress(0);
      }, 3000);
      
    } catch (err: any) {
      console.error("Erreur détaillée:", err);
      setErrorMessage(err?.message || "Une erreur inattendue s'est produite");
      notifications.show({
        title: 'Erreur',
        message: err?.message || 'Erreur lors de l\'export',
        color: 'red',
      });
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: IconShieldLock,
      title: "Données sécurisées",
      description: "Vos données sont protégées et confidentielles",
      color: "green",
    },
    {
      icon: IconCloudUpload,
      title: "Export rapide",
      description: "Export optimisé pour une taille réduite",
      color: "blue",
    },
    {
      icon: IconMailForward,
      title: "Support dédié",
      description: "Assistance personnalisée sous 24h",
      color: "orange",
    },
  ];

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        {/* Header */}
        <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <IconDatabase size={30} color="white" />
              </Avatar>
              <Box>
                <Title order={1} c="white" size="h2">Export pour support technique</Title>
                <Text c="gray.3" size="sm" mt={4}>
                  Exportez votre base de données pour assistance technique
                </Text>
                <Group gap="xs" mt={8}>
                  <Badge size="sm" variant="white" color="blue">Sécurisé</Badge>
                  <Badge size="sm" variant="white" color="blue">Confidentiel</Badge>
                  <Badge size="sm" variant="white" color="blue">Rapide</Badge>
                </Group>
              </Box>
            </Group>
            <ThemeIcon size={60} radius="md" variant="white" style={{ opacity: 0.9 }}>
              <IconFile size={35} color="#1b365d" />
            </ThemeIcon>
          </Group>
        </Card>

        {/* Message de succès */}
        {exported && (
          <Alert 
            icon={<IconCheck size={20} />} 
            color="green" 
            variant="filled"
            radius="md"
            withCloseButton
            onClose={() => setExported(false)}
          >
            <Text fw={600}>✅ Export réussi !</Text>
            <Text size="sm">Le fichier a été exporté avec succès. Envoyez-le à l'équipe support.</Text>
          </Alert>
        )}

        {/* Message d'erreur */}
        {errorMessage && (
          <Alert 
            icon={<IconAlertCircle size={20} />} 
            color="red" 
            variant="filled"
            radius="md"
            withCloseButton
            onClose={() => setErrorMessage(null)}
          >
            <Text fw={600}>❌ Erreur lors de l'export</Text>
            <Text size="sm">{errorMessage}</Text>
          </Alert>
        )}

        {/* Fonctionnalités */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
          {features.map((feature, index) => (
            <Card key={index} withBorder radius="lg" p="md" shadow="sm">
              <Group justify="center" mb="md">
                <ThemeIcon size="xl" radius="md" color={feature.color} variant="light">
                  <feature.icon size={24} />
                </ThemeIcon>
              </Group>
              <Text ta="center" fw={600} size="sm">{feature.title}</Text>
              <Text ta="center" size="xs" c="dimmed" mt={4}>{feature.description}</Text>
            </Card>
          ))}
        </SimpleGrid>

        {/* Info importante */}
        <Alert 
          icon={<IconInfoCircle size={18} />} 
          color="blue" 
          variant="light"
          radius="lg"
        >
          <Text fw={600} size="sm">Informations importantes</Text>
          <Text size="xs" mt={5}>
            • L'export contient toutes vos données (clients, commandes, etc.)<br />
            • Le fichier est confidentiel et ne sera utilisé que pour le support<br />
            • Envoyez le fichier exporté à <strong>jacqueskorgo5@gmail.com</strong>
          </Text>
        </Alert>

        {/* Export button */}
        <Card withBorder radius="lg" p="xl" shadow="md">
          <Stack gap="lg">
            <Group>
              <ThemeIcon size={60} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <IconDatabase size={30} />
              </ThemeIcon>
              <Stack gap={2}>
                <Title order={3} size="h4">Export de la base de données</Title>
                <Text size="xs" c="dimmed">
                  Exportez l'intégralité de votre base de données SQLite
                </Text>
              </Stack>
            </Group>

            <Divider />

            {/* Barre de progression */}
            {loading && progress > 0 && (
              <Box>
                <Group justify="space-between" mb={5}>
                  <Text size="xs" fw={500}>Export en cours...</Text>
                  <Text size="xs" fw={500}>{progress}%</Text>
                </Group>
                <Progress value={progress} size="md" radius="xl" color="blue" striped animated />
              </Box>
            )}

            <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light" radius="md">
              <Text fw={600} size="sm">Avant d'exporter, assurez-vous que :</Text>
              <Text size="xs" mt={5}>
                • Toutes les données sont correctement sauvegardées<br />
                • Vous disposez d'au moins 50 Mo d'espace disque<br />
                • L'application est à jour
              </Text>
            </Alert>

            <Button
              onClick={exporterPourSupport}
              loading={loading}
              size="lg"
              variant="gradient"
              gradient={{ from: '#1b365d', to: '#2a4a7a' }}
              leftSection={<IconDownload size={20} />}
              fullWidth
              radius="md"
              disabled={loading}
            >
              {loading ? "Export en cours..." : "Exporter la base de données"}
            </Button>

            <Paper p="md" radius="md" bg="gray.0" ta="center">
              <Text size="xs" c="dimmed">
                Une fois exporté, envoyez le fichier à l'adresse : 
              </Text>
              <Group justify="center" mt={8}>
                <Code fw={600}>jacqueskorgo5@gmail.com</Code>
                <Button
                  component="a"
                  href="mailto:jacqueskorgo5@gmail.com?subject=Support%20Gestion%20Couture%20-%20Export%20Base%20de%20donn%C3%A9es"
                  size="xs"
                  variant="subtle"
                  color="blue"
                  rightSection={<IconExternalLink size={12} />}
                >
                  Envoyer par email
                </Button>
              </Group>
            </Paper>
          </Stack>
        </Card>

        {/* FAQ */}
        <Card withBorder radius="lg" p="xl" shadow="sm">
          <Title order={4} mb="md" size="h5">📋 Questions fréquentes</Title>
          <Stack gap="md">
            <Paper p="sm" radius="md" withBorder>
              <Text fw={600} size="sm">🔒 Mes données sont-elles sécurisées ?</Text>
              <Text size="xs" c="dimmed" mt={4}>
                Oui, votre fichier est exporté localement et seul vous avez le contrôle. Nous ne stockons aucune donnée.
              </Text>
            </Paper>
            <Paper p="sm" radius="md" withBorder>
              <Text fw={600} size="sm">⏱️ Combien de temps prend l'export ?</Text>
              <Text size="xs" c="dimmed" mt={4}>
                L'export est généralement instantané, la durée dépend de la taille de votre base de données.
              </Text>
            </Paper>
            <Paper p="sm" radius="md" withBorder>
              <Text fw={600} size="sm">📧 Que faire après l'export ?</Text>
              <Text size="xs" c="dimmed" mt={4}>
                Envoyez le fichier généré à notre adresse support, nous analyserons votre situation dans les meilleurs délais.
              </Text>
            </Paper>
          </Stack>
        </Card>

        {/* Footer */}
        <Card withBorder radius="lg" p="md" ta="center" bg="gray.0">
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} KO-SOFT Couture - Tous droits réservés
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Support technique inclus avec votre licence - Assistance sous 24h ouvrées
          </Text>
        </Card>
      </Stack>
    </Container>
  );
};

export default ExportSupport;