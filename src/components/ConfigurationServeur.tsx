import React, { useEffect, useState } from 'react';
import {
  Stack, Card, Title, Text, Group, Button, Alert,
  TextInput, Box, Container, Avatar, ThemeIcon, Badge,
  Modal, LoadingOverlay,
} from '@mantine/core';
import {
  IconServer, IconCheck, IconPlugConnected,
  IconDeviceDesktop, IconWorld, IconArrowLeft,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const ConfigurationServeur: React.FC = () => {
  const [serverUrl, setServerUrl] = useState('http://192.168.2.1:3001');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [, setDetectedIp] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('api_url');
    if (savedUrl) {
      setServerUrl(savedUrl);
      testerConnexionSilencieuse(savedUrl);
    }
    // Mode web : par défaut, l'API est en même origine (aucune URL à forcer).
    detecterIpLocale();
  }, []);

  const detecterIpLocale = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setDetectedIp(data.ip);
    } catch (error) {
      console.log('IP non détectée');
    }
  };

  const testerConnexionSilencieuse = async (url: string) => {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) setConnected(true);
      }
    } catch (error) {
      console.log('Serveur non accessible');
    }
  };

  const testerConnexion = async () => {
    setTesting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${serverUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConnected(true);
          notifications.show({ title: '✅ Connecté !', message: `Serveur accessible`, color: 'green' });
        }
      } else {
        setConnected(false);
        notifications.show({ title: '❌ Erreur', message: 'Serveur inaccessible', color: 'red' });
      }
    } catch (error: any) {
      setConnected(false);
      notifications.show({ title: '❌ Échec', message: error.name === 'AbortError' ? 'Délai dépassé' : 'Serveur introuvable', color: 'red' });
    } finally {
      setTesting(false);
    }
  };

  const enregistrerConfiguration = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${serverUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        localStorage.setItem('api_url', serverUrl);
        setConnected(true);
        notifications.show({ title: '✅ Enregistré !', message: 'Redirection...', color: 'green' });
        setTimeout(() => { window.location.href = '/'; }, 1000);
      } else {
        throw new Error('Inaccessible');
      }
    } catch (error) {
      notifications.show({ title: '❌ Erreur', message: 'Impossible de contacter le serveur', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const utiliserLocalhost = () => {
    setServerUrl('http://localhost:3001');
    testerConnexionSilencieuse('http://localhost:3001');
  };

  const utiliserIpServeur = () => {
    setServerUrl('http://192.168.2.1:3001');
    testerConnexionSilencieuse('http://192.168.2.1:3001');
  };

  return (
    <Box p="md">
      <Container size="sm">
        <Stack gap="lg">

          {/* HEADER */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group>
              <Avatar size={50} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <IconServer size={26} color="white" />
              </Avatar>
              <Box>
                <Title order={3} c="white">Configuration serveur</Title>
                <Text c="gray.3" size="sm">Connexion à l'API Express</Text>
              </Box>
            </Group>
          </Card>

          {/* STATUT */}
          <Card withBorder radius="lg" p="md" bg={connected ? 'green.0' : 'gray.0'}>
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color={connected ? 'green' : 'gray'} variant="light">
                  {connected ? <IconCheck size={20} /> : <IconDeviceDesktop size={20} />}
                </ThemeIcon>
                <Box>
                  <Text fw={600}>{connected ? '✅ Connecté' : '⚪ Non connecté'}</Text>
                  <Text size="xs" c="dimmed">{serverUrl}</Text>
                </Box>
              </Group>
              <Badge color={connected ? 'green' : 'gray'} variant="filled">
                {connected ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </Group>
          </Card>

          {/* FORMULAIRE SIMPLIFIÉ */}
          <Card withBorder radius="lg" p="xl">
            <LoadingOverlay visible={loading} />
            <Stack gap="md">
              <Title order={4}>Adresse du backend Express</Title>

              <TextInput
                size="lg"
                radius="md"
                placeholder="http://192.168.2.1:3001"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.currentTarget.value)}
                leftSection={<IconWorld size={18} />}
              />

              {/* BOUTONS RAPIDES */}
              <Group grow>
                <Button variant="light" size="sm" onClick={utiliserLocalhost} leftSection={<IconDeviceDesktop size={14} />}>
                  Ce PC (localhost)
                </Button>
                <Button variant="light" size="sm" onClick={utiliserIpServeur} leftSection={<IconServer size={14} />}>
                  Serveur (192.168.2.1)
                </Button>
              </Group>

              <Alert color="blue" variant="light" radius="md">
                <Text size="xs">
                  <strong>Ce PC est le serveur :</strong> utilisez <strong>localhost</strong><br />
                  <strong>Autre PC client :</strong> utilisez l'IP <strong>192.168.2.1</strong>
                </Text>
              </Alert>

              {/* ACTIONS */}
              <Group grow>
                <Button
                  leftSection={<IconPlugConnected size={16} />}
                  onClick={testerConnexion}
                  variant="outline"
                  color="teal"
                  loading={testing}
                  radius="md"
                >
                  Tester
                </Button>
                <Button
                  onClick={enregistrerConfiguration}
                  loading={loading}
                  leftSection={<IconCheck size={18} />}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Enregistrer
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* RETOUR */}
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => window.history.back()}
          >
            Retour
          </Button>

          {/* MODAL AIDE */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Aide" size="sm" centered radius="md">
            <Stack gap="sm">
              <Text size="sm"><strong>Serveur = Ce PC :</strong> http://localhost:3001</Text>
              <Text size="sm"><strong>Client = Autre PC :</strong> http://192.168.2.1:3001</Text>
              <Text size="xs" c="dimmed">Le backend Express doit être démarré sur le serveur.</Text>
            </Stack>
          </Modal>

        </Stack>
      </Container>
    </Box>
  );
};

export default ConfigurationServeur;