import React, { useState } from 'react';
import { Group, Button, Card, Title, Text, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { IconDownload, IconUpload, IconCheck, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { getDb } from '../database/db';

interface ExportImportConfigurationProps {
  onComplete?: () => void;
}

const ExportImportConfiguration: React.FC<ExportImportConfigurationProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Exporter la configuration des mesures
  const exportConfigMesures = async () => {
    setLoading(true);
    setExportResult(null);
    
    try {
      const db = await getDb();
      const mesures = await db.select<{ nom: string; unite: string; categorie: string }[]>(
        "SELECT nom, unite, categorie FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage"
      );
      
      const config = {
        version: "1.0",
        date: new Date().toISOString(),
        application: "Gestion Couture",
        mesures: mesures.map(m => ({
          nom: m.nom,
          unite: m.unite || 'cm',
          categorie: m.categorie || 'Général'
        }))
      };
      
      const jsonString = JSON.stringify(config, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuration_mesures_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportResult({ 
        success: true, 
        message: `${mesures.length} types de mesures exportés avec succès` 
      });
    } catch (error) {
      console.error("Erreur export:", error);
      setExportResult({ 
        success: false, 
        message: "Erreur lors de l'export de la configuration" 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setExportResult(null), 3000);
    }
  };
  
  // Importer la configuration des mesures
  const importConfigMesures = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setImportResult(null);
    
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      if (!config.mesures || !Array.isArray(config.mesures)) {
        throw new Error("Format de fichier invalide");
      }
      
      const db = await getDb();
      let count = 0;
      
      for (const mesure of config.mesures) {
        if (mesure.nom) {
          await db.execute(`
            INSERT OR IGNORE INTO types_mesures (nom, unite, categorie, est_active, ordre_affichage)
            VALUES (?, ?, ?, 1, (SELECT COALESCE(MAX(ordre_affichage), 0) + 1 FROM types_mesures))
          `, [mesure.nom, mesure.unite || 'cm', mesure.categorie || 'Général']);
          count++;
        }
      }
      
      setImportResult({ 
        success: true, 
        message: `${count} types de mesures importés avec succès` 
      });
      
      if (onComplete) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (error) {
      console.error("Erreur import:", error);
      setImportResult({ 
        success: false, 
        message: "Erreur lors de l'import du fichier. Vérifiez le format." 
      });
    } finally {
      setLoading(false);
      setTimeout(() => setImportResult(null), 3000);
      // Reset l'input file
      e.target.value = '';
    }
  };
  
  return (
    <Card withBorder radius="lg" p="xl" shadow="sm">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        <Group>
          <IconInfoCircle size={24} color="#1b365d" />
          <Title order={3} size="h4">📦 Export / Import configuration</Title>
        </Group>
        
        <Text size="sm" c="dimmed">
          Exportez ou importez la configuration des types de mesures pour la partager entre plusieurs ordinateurs.
        </Text>
        
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text fw={600} size="sm">À propos</Text>
          <Text size="xs">
            Cette fonctionnalité permet de sauvegarder et restaurer la configuration des mesures.
            Utilisez-la pour synchroniser les paramètres entre plusieurs postes de travail.
          </Text>
        </Alert>
        
        <Group justify="space-between" grow>
          <Button
            onClick={exportConfigMesures}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            leftSection={<IconDownload size={18} />}
            disabled={loading}
          >
            Exporter la configuration
          </Button>
          
          <Button
            component="label"
            variant="gradient"
            gradient={{ from: 'green', to: 'teal' }}
            leftSection={<IconUpload size={18} />}
            disabled={loading}
          >
            Importer une configuration
            <input 
              type="file" 
              accept=".json" 
              onChange={importConfigMesures} 
              hidden 
            />
          </Button>
        </Group>
        
        {exportResult && (
          <Alert 
            icon={exportResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            color={exportResult.success ? "green" : "red"} 
            variant="light"
          >
            {exportResult.message}
          </Alert>
        )}
        
        {importResult && (
          <Alert 
            icon={importResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            color={importResult.success ? "green" : "red"} 
            variant="light"
          >
            {importResult.message}
          </Alert>
        )}
        
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
          <Text fw={600} size="sm">💡 Astuce pour multi-postes</Text>
          <Text size="xs">
            1. Configurez d'abord les types de mesures sur un ordinateur<br />
            2. Exportez la configuration (fichier .json)<br />
            3. Transférez le fichier vers les autres ordinateurs<br />
            4. Importez-le pour avoir la même configuration partout
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
};

export default ExportImportConfiguration;