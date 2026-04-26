import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Switch,
  Alert,
  Divider,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconNetwork,
  IconDatabase,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
  IconDeviceLaptop,
  IconInfoCircle,
} from '@tabler/icons-react';
import { configurerBaseReseau, utiliserBaseLocale, testerConnexionReseau } from '../database/db';

const ConfigurationReseau: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [useNetwork, setUseNetwork] = useState(false);
  const [networkPath, setNetworkPath] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [currentMode, setCurrentMode] = useState<'local' | 'reseau'>('local');

  useEffect(() => {
    // Charger la configuration actuelle
    const savedUseNetwork = localStorage.getItem('use_network_db') === 'true';
    const savedPath = localStorage.getItem('network_db_path') || '';
    setUseNetwork(savedUseNetwork);
    setNetworkPath(savedPath);
    setCurrentMode(savedUseNetwork ? 'reseau' : 'local');
  }, []);

  const handleTestConnection = async () => {
    if (!networkPath) {
      setTestResult({ success: false, message: 'Veuillez saisir un chemin réseau' });
      return;
    }
    
    setLoading(true);
    try {
      const result = await testerConnexionReseau(networkPath);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ success: false, message: 'Erreur de connexion' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (useNetwork) {
        await configurerBaseReseau(networkPath);
        setCurrentMode('reseau');
        setTestResult({ success: true, message: 'Configuration réseau activée avec succès' });
      } else {
        await utiliserBaseLocale();
        setCurrentMode('local');
        setTestResult({ success: true, message: 'Mode local activé' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: 'Erreur lors de la configuration' });
    } finally {
      setLoading(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  return (
    <Card withBorder radius="lg" p="xl" shadow="sm">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        <Group>
          <IconNetwork size={24} color="#1b365d" />
          <Title order={3} size="h4">🌐 Configuration réseau</Title>
        </Group>
        
        <Text size="sm" c="dimmed">
          Configurez l'application pour utiliser une base de données partagée sur le réseau.
          Cela permet à plusieurs ordinateurs de travailler sur les mêmes données.
        </Text>
        
        <Alert icon={<IconDatabase size={16} />} color="blue" variant="light">
          <Text fw={600} size="sm">Mode actuel :</Text>
          <Text size="sm">
            {currentMode === 'local' 
              ? '📁 Base de données locale (poste unique)' 
              : '🌐 Base de données partagée (mode réseau)'}
          </Text>
        </Alert>
        
        <Divider />
        
        <Switch
          label="Utiliser une base de données partagée sur le réseau"
          description="Activez cette option si vous avez plusieurs ordinateurs"
          checked={useNetwork}
          onChange={(e) => setUseNetwork(e.currentTarget.checked)}
          size="md"
        />
        
        {useNetwork && (
          <Stack gap="md" pl="md">
            <TextInput
              label="Chemin de la base de données réseau"
              placeholder="Ex: \\\\ORDINATEUR_PRINCIPAL\\Partage\\gestion-couture.db"
              value={networkPath}
              onChange={(e) => setNetworkPath(e.target.value)}
              description="Le chemin d'accès au fichier .db partagé sur le réseau"
              leftSection={<IconDeviceLaptop size={16} />}
              required
            />
            
            <Group>
              <Button 
                variant="light" 
                onClick={handleTestConnection} 
                loading={loading}
                leftSection={<IconRefresh size={16} />}
              >
                Tester la connexion
              </Button>
            </Group>
            
            {testResult && (
              <Alert 
                icon={testResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
                color={testResult.success ? "green" : "red"} 
                variant="light"
              >
                {testResult.message}
              </Alert>
            )}
            
            <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
              <Text fw={600} size="sm">📌 Instructions pour le partage réseau</Text>
              <Text size="xs" mt={4}>
                1. Sur l'ordinateur principal, partagez le dossier contenant la base de données<br />
                2. Notez le chemin réseau (ex: \\\\NOM_ORDINATEUR\\Partage)<br />
                3. Assurez-vous que tous les ordinateurs ont accès au dossier partagé<br />
                4. Copiez le fichier gestion-couture.db dans ce dossier partagé
              </Text>
            </Alert>
          </Stack>
        )}
        
        <Divider />
        
        <Group justify="flex-end">
          <Button 
            onClick={handleSave} 
            variant="gradient" 
            gradient={{ from: '#1b365d', to: '#2a4a7a' }}
            leftSection={<IconDatabase size={16} />}
          >
            Appliquer la configuration
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default ConfigurationReseau;