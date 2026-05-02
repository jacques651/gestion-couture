import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Switch,
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
} from '@mantine/core';
import {
  IconNetwork,
  IconCheck,
  IconFolder,
  IconInfoCircle,
  IconDeviceDesktop,
  IconServer,
  IconPlugConnected,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  configurerBaseReseau,
  utiliserBaseLocale,
  testerConnexionReseau,
} from '../database/db';
import { open } from '@tauri-apps/plugin-dialog';

const ConfigurationReseau: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [useNetwork, setUseNetwork] = useState(false);
  const [networkPath, setNetworkPath] = useState('');
  const [testing, setTesting] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  useEffect(() => {
    const savedUseNetwork = localStorage.getItem('use_network_db') === 'true';
    const savedPath = localStorage.getItem('network_db_path') || '';
    setUseNetwork(savedUseNetwork);
    setNetworkPath(savedPath);
  }, []);

  const handleSelectFile = async () => {
    const path = await open({
      filters: [{ name: 'Base de données SQLite', extensions: ['db'] }]
    });
    if (path) {
      setNetworkPath(path as string);
      notifications.show({ title: 'Fichier sélectionné', message: path as string, color: 'blue' });
    }
  };

  const handleTestConnection = async () => {
    if (!networkPath) {
      notifications.show({ title: 'Erreur', message: 'Veuillez d\'abord entrer un chemin', color: 'red' });
      return;
    }
    setTesting(true);
    try {
      const test = await testerConnexionReseau(networkPath);
      notifications.show({
        title: test.success ? 'Connexion réussie' : 'Échec',
        message: test.message,
        color: test.success ? 'green' : 'red',
      });
    } catch (e) {
      notifications.show({ title: 'Erreur', message: 'Erreur lors du test', color: 'red' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (useNetwork) {
        if (!networkPath) {
          notifications.show({ title: 'Erreur', message: 'Veuillez entrer un chemin réseau', color: 'red' });
          return;
        }
        const test = await testerConnexionReseau(networkPath);
        if (!test.success) {
          notifications.show({ title: 'Échec connexion', message: test.message, color: 'red' });
          return;
        }
        await configurerBaseReseau(networkPath);
        localStorage.setItem('use_network_db', 'true');
        localStorage.setItem('network_db_path', networkPath);
        notifications.show({ title: 'Succès', message: 'Mode réseau activé', color: 'green' });
      } else {
        await utiliserBaseLocale();
        localStorage.setItem('use_network_db', 'false');
        notifications.show({ title: 'Succès', message: 'Mode local activé', color: 'green' });
      }
    } catch (e: any) {
      notifications.show({ title: 'Erreur', message: e.message || 'Erreur configuration', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconNetwork size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Configuration réseau</Title>
                  <Text c="gray.3" size="sm">Partagez la base de données sur plusieurs ordinateurs</Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Aide
              </Button>
            </Group>
          </Card>

          {/* Statut actuel */}
          <Paper p="md" radius="lg" withBorder bg={useNetwork ? 'green.0' : 'blue.0'}>
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color={useNetwork ? 'green' : 'blue'} variant="light">
                  {useNetwork ? <IconServer size={20} /> : <IconDeviceDesktop size={20} />}
                </ThemeIcon>
                <Box>
                  <Text fw={600}>Mode {useNetwork ? 'Réseau' : 'Local'}</Text>
                  <Text size="xs" c="dimmed">
                    {useNetwork ? `Base partagée : ${networkPath}` : 'Base de données locale'}
                  </Text>
                </Box>
              </Group>
              <Badge color={useNetwork ? 'green' : 'blue'} variant="filled" size="lg">
                {useNetwork ? '🌐 Réseau' : '💻 Local'}
              </Badge>
            </Group>
          </Paper>

          {/* Configuration */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Stack gap="md">
              <Title order={4}>Paramètres de connexion</Title>
              <Divider />

              <Switch
                label="Activer le mode réseau"
                description="Utilisez une base de données partagée sur le réseau local"
                checked={useNetwork}
                onChange={(e) => setUseNetwork(e.currentTarget.checked)}
                size="md"
              />

              {useNetwork && (
                <Stack gap="md">
                  <TextInput
                    label="Chemin réseau de la base"
                    description="Chemin UNC vers le fichier .db partagé"
                    placeholder="\\\\PC-NOM\\Partage\\gestion-couture.db"
                    value={networkPath}
                    onChange={(e) => setNetworkPath(e.target.value)}
                    leftSection={<IconNetwork size={16} />}
                    radius="md"
                    size="md"
                  />

                  <Group>
                    <Button
                      leftSection={<IconFolder size={16} />}
                      onClick={handleSelectFile}
                      variant="light"
                      radius="md"
                    >
                      Parcourir
                    </Button>
                    <Button
                      leftSection={<IconPlugConnected size={16} />}
                      onClick={handleTestConnection}
                      variant="outline"
                      color="teal"
                      loading={testing}
                      radius="md"
                    >
                      Tester la connexion
                    </Button>
                  </Group>

                  <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light" radius="md">
                    <Text size="sm" fw={600}>Prérequis :</Text>
                    <Text size="xs">
                      • Le dossier contenant la base doit être partagé sur le réseau<br />
                      • Les autres ordinateurs doivent avoir accès en lecture/écriture<br />
                      • Exemple : \\PC-ATELIER\Couture\gestion-couture.db
                    </Text>
                  </Alert>
                </Stack>
              )}
            </Stack>
          </Card>

          {/* Instructions */}
          <Card withBorder radius="lg" shadow="sm" p="xl">
            <Title order={4} mb="md">📋 Procédure multi-postes</Title>
            <Divider mb="md" />
            <Stack gap="sm">
              <Group gap="xs">
                <Badge color="blue" size="lg" circle>1</Badge>
                <Text size="sm">Sur le poste principal, partagez le dossier contenant la base</Text>
              </Group>
              <Group gap="xs">
                <Badge color="blue" size="lg" circle>2</Badge>
                <Text size="sm">Notez le chemin réseau (ex: \\PC-NOM\Partage\gestion-couture.db)</Text>
              </Group>
              <Group gap="xs">
                <Badge color="blue" size="lg" circle>3</Badge>
                <Text size="sm">Sur chaque poste secondaire, activez le mode réseau</Text>
              </Group>
              <Group gap="xs">
                <Badge color="blue" size="lg" circle>4</Badge>
                <Text size="sm">Entrez le chemin réseau et testez la connexion</Text>
              </Group>
              <Group gap="xs">
                <Badge color="blue" size="lg" circle>5</Badge>
                <Text size="sm">Appliquez et redémarrez l'application</Text>
              </Group>
            </Stack>
          </Card>

          {/* Bouton appliquer */}
          <Group justify="flex-end">
            <Button
              onClick={handleSave}
              loading={loading}
              size="lg"
              radius="md"
              leftSection={<IconCheck size={20} />}
              variant="gradient"
              gradient={{ from: '#1b365d', to: '#2a4a7a' }}
            >
              Appliquer la configuration
            </Button>
          </Group>

          {/* Modal Aide */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Aide configuration réseau" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm"><strong>Mode local :</strong> chaque poste utilise sa propre base</Text>
              <Text size="sm"><strong>Mode réseau :</strong> tous les postes partagent la même base</Text>
              <Text size="sm">⚠️ Une seule base doit être utilisée à la fois par tous les postes</Text>
              <Text size="sm">⚠️ Évitez d'utiliser la base locale ET réseau simultanément</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default ConfigurationReseau;