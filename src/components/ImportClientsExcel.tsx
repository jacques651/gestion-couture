import React, { useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Button,
  Stepper,
  Table,
  Alert,
  Select,
  LoadingOverlay,
  Group,
  Progress,
  Paper,
  Badge,
} from '@mantine/core';
import {
  IconFileExcel,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconDownload,
  IconUpload,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { getDb } from '../database/db';

const CHAMPS_DISPONIBLES = [
  { value: 'telephone_id', label: '📞 Téléphone (ID client)', required: true },
  { value: 'nom_prenom', label: '👤 Nom complet', required: true },
  { value: 'adresse', label: '📍 Adresse', required: false },
  { value: 'email', label: '✉️ Email', required: false },
  { value: 'observations', label: '⭐ observations', required: false },
];

const ImportClientsExcel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [colonnesExcel, setColonnesExcel] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const [typesMesuresExistants, setTypesMesuresExistants] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  // Étape 1: Sélectionner le fichier Excel
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Extraire les noms des colonnes
      const cols = Object.keys(jsonData[0] || {});
      setColonnesExcel(cols);
      setExcelData(jsonData);
      
      // Charger les types de mesures existants
      const db = await getDb();
      const mesures = await db.select<{ nom: string }[]>(
        "SELECT nom FROM types_mesures WHERE est_active = 1"
      );
      setTypesMesuresExistants(mesures.map((m: { nom: string }) => m.nom));
      
      setActiveStep(1);
    } catch (error) {
      console.error("Erreur lecture fichier:", error);
      alert("Erreur lors de la lecture du fichier Excel. Vérifiez le format.");
    } finally {
      setLoading(false);
    }
  };

  // Télécharger le modèle Excel
  const downloadTemplate = () => {
    const template = [
      {
        'telephone_id': '70000001',
        'nom_prenom': 'Jean Dupont',
        'adresse': 'Ouagadougou',
        'email': 'jean@example.com',
        'observations': 'Client fidèle',
        'tour_poitrine': 95,
        'tour_taille': 80,
        'tour_hanches': 100,
        'longueur_manche': 60,
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_clients_couture.xlsx');
  };

  // Étape 2: Configurer le mapping des colonnes
  const renderMappingStep = () => (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <Text fw={600}>Association des colonnes</Text>
        <Text size="sm">Associez chaque colonne de votre fichier Excel au champ correspondant dans l'application.</Text>
      </Alert>
      
      <Paper p="md" withBorder bg="gray.0">
        <Group justify="space-between">
          <Group gap="xs">
            <IconFileExcel size={20} color="green" />
            <Text size="sm" fw={500}>Fichier : {fileName}</Text>
            <Badge color="blue" variant="light">{excelData.length} lignes</Badge>
          </Group>
          <Button variant="subtle" size="xs" onClick={() => setActiveStep(0)}>
            Changer de fichier
          </Button>
        </Group>
      </Paper>
      
      <div style={{ overflowX: 'auto' }}>
        <Table striped>
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: '#1b365d' }}>
              <Table.Th style={{ color: 'white' }}>Colonne Excel</Table.Th>
              <Table.Th style={{ color: 'white' }}>Champ application</Table.Th>
              <Table.Th style={{ color: 'white' }}>Exemple</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {colonnesExcel.map((col, idx) => (
              <Table.Tr key={idx}>
                <Table.Td fw={500}>{col}</Table.Td>
                <Table.Td>
                  <Select
                    placeholder="Sélectionner un champ"
                    data={[
                      ...CHAMPS_DISPONIBLES,
                      ...typesMesuresExistants.map(m => ({ 
                        value: `mesure_${m}`, 
                        label: `📏 Mesure: ${m}` 
                      }))
                    ]}
                    value={mapping[col] || null}
                    onChange={(value) => setMapping({ ...mapping, [col]: value || '' })}
                    size="xs"
                    clearable
                    searchable
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {excelData[0]?.[col]?.toString().substring(0, 30) || '-'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      
      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={() => setActiveStep(0)}>
          Annuler
        </Button>
        <Button onClick={() => setActiveStep(2)} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>
          Continuer
        </Button>
      </Group>
    </Stack>
  );

  // Étape 3: Aperçu et import
  const handleImport = async () => {
    setLoading(true);
    setProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    const db = await getDb();
    
    for (let i = 0; i < excelData.length; i++) {
      try {
        const row = excelData[i];
        
        // Extraire les infos client
        const clientData: any = {};
        const mesuresData: any = {};
        
        for (const [excelCol, champApp] of Object.entries(mapping)) {
          if (!champApp) continue;
          
          if (champApp.startsWith('mesure_')) {
            const mesureNom = champApp.replace('mesure_', '');
            const valeur = row[excelCol];
            if (valeur && !isNaN(parseFloat(valeur))) {
              mesuresData[mesureNom] = parseFloat(valeur);
            }
          } else {
            clientData[champApp] = row[excelCol];
          }
        }
        
        // Vérifier les champs obligatoires
        if (!clientData.telephone_id || !clientData.nom_prenom) {
          errorCount++;
          errors.push(`Ligne ${i + 2}: Téléphone ou Nom manquant`);
          continue;
        }
        
        // Insérer ou mettre à jour le client
        await db.execute(`
          INSERT OR REPLACE INTO clients 
          (telephone_id, nom_prenom, adresse, email, observations, est_supprime)
          VALUES (?, ?, ?, ?, ?, 0)
        `, [
          clientData.telephone_id.toString(),
          clientData.nom_prenom.toString(),
          clientData.adresse?.toString() || '',
          clientData.email?.toString() || '',
          clientData.observations?.toString() || ''
        ]);
        
        // Insérer les mesures
        for (const [mesureNom, valeur] of Object.entries(mesuresData)) {
          if (valeur && typeof valeur === 'number') {
            const typeMesure = await db.select<{ id: number }[]>(
              "SELECT id FROM types_mesures WHERE nom = ? AND est_active = 1",
              [mesureNom]
            );
            
            if (typeMesure.length > 0) {
              await db.execute(`
                INSERT OR REPLACE INTO mesures_clients (client_id, type_mesure_id, valeur, date_mesure)
                VALUES (?, ?, ?, datetime('now'))
              `, [clientData.telephone_id.toString(), typeMesure[0].id, valeur]);
            }
          }
        }
        
        successCount++;
        setProgress(((i + 1) / excelData.length) * 100);
      } catch (err) {
        errorCount++;
        errors.push(`Ligne ${i + 2}: Erreur inattendue`);
        console.error(err);
      }
    }
    
    setImportResult({ success: successCount, errors: errorCount });
    if (errors.length > 0 && errors.length <= 5) {
      console.warn("Erreurs détaillées:", errors);
    }
    setActiveStep(3);
    setLoading(false);
  };

  const renderPreviewStep = () => (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
        <Text fw={600}>Aperçu des données à importer</Text>
        <Text size="sm">Voici un aperçu des {Math.min(5, excelData.length)} premières lignes avec le mapping choisi.</Text>
      </Alert>
      
      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: '#1b365d' }}>
              {Object.entries(mapping).filter(([_, champ]) => champ).map(([col], idx) => (
                <Table.Th key={idx} style={{ color: 'white' }}>{col} → {mapping[col]}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {excelData.slice(0, 5).map((row, idx) => (
              <Table.Tr key={idx}>
                {Object.entries(mapping).filter(([_, champ]) => champ).map(([col], i) => (
                  <Table.Td key={i}>{row[col]?.toString() || '-'}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      
      <Paper p="md" withBorder bg="gray.0">
        <Group justify="space-between">
          <Text size="sm">📊 Total des lignes à importer : <strong>{excelData.length}</strong></Text>
          <Badge color="blue" variant="light">Téléphone requis</Badge>
        </Group>
      </Paper>
      
      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={() => setActiveStep(1)}>
          Retour
        </Button>
        <Button onClick={handleImport} loading={loading} variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
          Importer {excelData.length} clients
        </Button>
      </Group>
    </Stack>
  );

  const renderResultStep = () => (
    <Stack align="center" gap="md" py="xl">
      {importResult && importResult.errors === 0 ? (
        <IconCheck size={60} color="green" />
      ) : (
        <IconAlertCircle size={60} color="orange" />
      )}
      <Title order={3}>Import terminé</Title>
      <Paper p="md" withBorder bg="gray.0" w="100%" ta="center">
        <Text size="lg">✅ {importResult?.success || 0} clients importés avec succès</Text>
        {importResult && importResult.errors > 0 && (
          <Text c="red" size="md" mt="sm">❌ {importResult.errors} erreurs - Vérifiez les données</Text>
        )}
      </Paper>
      <Group>
        <Button onClick={() => window.location.reload()} variant="light">
          Nouvel import
        </Button>
        <Button onClick={() => window.location.href = '/clients'} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>
          Voir les clients
        </Button>
      </Group>
    </Stack>
  );

  return (
    <Card withBorder radius="lg" p="xl" shadow="sm">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="lg">
        <Group>
          <IconFileExcel size={32} color="green" />
          <Title order={2} size="h3">📥 Import clients depuis Excel</Title>
        </Group>
        
        <Text size="sm" c="dimmed">
          Importez rapidement vos clients et leurs mesures depuis un fichier Excel.
          Le fichier doit contenir au moins une colonne pour le téléphone et le nom.
        </Text>
        
        <Stepper active={activeStep} mb="xl">
          <Stepper.Step label="Fichier" description="Sélectionnez Excel" />
          <Stepper.Step label="Mapping" description="Associez les colonnes" />
          <Stepper.Step label="Aperçu" description="Vérifiez les données" />
          <Stepper.Step label="Terminé" description="Résultat" />
        </Stepper>
        
        {activeStep === 0 && (
          <Stack align="center" gap="md" py="xl">
            <Button
              component="label"
              variant="gradient"
              gradient={{ from: '#1b365d', to: '#2a4a7a' }}
              size="lg"
              leftSection={<IconUpload size={20} />}
            >
              Sélectionner un fichier Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} hidden />
            </Button>
            
            <Button
              variant="subtle"
              onClick={downloadTemplate}
              leftSection={<IconDownload size={16} />}
            >
              Télécharger le modèle Excel
            </Button>
            
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="md">
              <Text fw={600}>Format attendu</Text>
              <Text size="xs" mt={4}>
                • La première ligne doit contenir les en-têtes des colonnes<br />
                • Une colonne "telephone_id" (identifiant unique) est obligatoire<br />
                • Une colonne "nom_prenom" est obligatoire<br />
                • Les colonnes de mesures doivent correspondre aux types déjà créés
              </Text>
            </Alert>
          </Stack>
        )}
        
        {activeStep === 1 && renderMappingStep()}
        {activeStep === 2 && renderPreviewStep()}
        {activeStep === 3 && renderResultStep()}
        
        {progress > 0 && progress < 100 && (
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm">Import en cours...</Text>
              <Text size="sm" fw={500}>{Math.round(progress)}%</Text>
            </Group>
            <Progress value={progress} size="md" radius="xl" color="blue" striped animated />
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default ImportClientsExcel;