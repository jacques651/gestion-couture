import React, { useState, useEffect } from 'react';
import { Stack, Card, Title, Text, Button, Alert, Group, Code } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

const DiagnosticReseau: React.FC = () => {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const getServerUrl = () => {
    return localStorage.getItem('api_url') || 'http://localhost:3001';
  };

  const testerConnexion = async () => {
    setLoading(true);
    const serverUrl = getServerUrl();
    
    const resultats: any = {};
    
    // Test 1 : Le serveur est-il accessible ?
    try {
      const start = Date.now();
      const response = await fetch(`${serverUrl}/health`);
      const end = Date.now();
      
      resultats.serveur = {
        ok: response.ok,
        status: response.status,
        temps: `${end - start}ms`
      };
      
      if (response.ok) {
        const data = await response.json();
        resultats.serveur.data = data;
      }
    } catch (err: any) {
      resultats.serveur = { ok: false, error: err.message };
    }
    
    setStatus(resultats);
    setLoading(false);
  };
  
  useEffect(() => {
    testerConnexion();
  }, []);
  
  return (
    <Card withBorder radius="lg" p="xl">
      <Title order={4} mb="md">🔍 Diagnostic réseau</Title>
      
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>Serveur configuré :</Text>
          <Code>{getServerUrl()}</Code>
          <Button size="xs" onClick={testerConnexion} loading={loading} leftSection={<IconRefresh size={14} />}>
            Tester
          </Button>
        </Group>
        
        <Alert 
          color={status.serveur?.ok ? 'green' : 'red'}
          title={status.serveur?.ok ? '✅ Serveur accessible' : '❌ Serveur inaccessible'}
        >
          {status.serveur?.ok ? (
            <Text size="sm">
              Connexion réussie en {status.serveur.temps}
            </Text>
          ) : (
            <Stack gap="xs">
              <Text size="sm">Impossible de joindre le serveur.</Text>
              <Text size="sm" fw={500}>Solutions :</Text>
              <Text size="sm">1. Vérifiez que le serveur est allumé</Text>
              <Text size="sm">2. Vérifiez que le backend est lancé</Text>
              <Text size="sm">3. Vérifiez l'adresse IP dans Configuration serveur</Text>
            </Stack>
          )}
        </Alert>
        
        <Group justify="center">
          <Button 
            variant="light" 
            onClick={() => window.location.href = '/configuration-serveur'}
          >
            ⚙️ Modifier la configuration
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default DiagnosticReseau;