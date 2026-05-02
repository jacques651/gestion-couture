// src/components/ImportClientsExcel.tsx
import React, { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
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
  Container,
  Avatar,
  ThemeIcon,
  Box,
} from '@mantine/core';
import {
  IconFileExcel,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconDownload,
  IconUpload,
  IconUsers,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { getDb } from '../database/db';  

const CHAMPS_DISPONIBLES = [
  { value: 'telephone_id', label: '📞 Téléphone (ID client)', required: true },
  { value: 'nom_prenom', label: '👤 Nom complet', required: true },
  { value: 'adresse', label: '📍 Adresse', required: false },
  { value: 'email', label: '✉️ Email', required: false },
  { value: 'observations', label: '📝 Observations', required: false },
];

const ImportClientsExcel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [colonnesExcel, setColonnesExcel] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);
  const [typesMesuresExistants, setTypesMesuresExistants] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    try {
      const db = await getDb();
      const mesures = await db.select<{ nom: string }[]>("SELECT nom FROM types_mesures WHERE est_active = 1");
      const nomsMesures = mesures.map((m: { nom: any; }) => m.nom);
      setTypesMesuresExistants(nomsMesures);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("Le fichier est vide. Vérifiez son contenu.");
        setLoading(false);
        return;
      }

      const cols = Object.keys(jsonData[0] || {});
      setColonnesExcel(cols);
      setExcelData(jsonData);

      const autoMapping: Record<string, string> = {};
      cols.forEach(col => {
        const lowerCol = col.toLowerCase().trim();
        if (lowerCol.includes('tel') || lowerCol.includes('phone')) autoMapping[col] = 'telephone_id';
        else if (lowerCol.includes('nom') || lowerCol.includes('prenom')) autoMapping[col] = 'nom_prenom';
        else if (lowerCol.includes('adresse')) autoMapping[col] = 'adresse';
        else if (lowerCol.includes('email') || lowerCol.includes('mail')) autoMapping[col] = 'email';
        else if (lowerCol.includes('observ') || lowerCol.includes('note')) autoMapping[col] = 'observations';
        else {
          const match = nomsMesures.find((m: string) => normalize(m) === normalize(col));
          if (match) autoMapping[col] = `mesure_${match}`;
        }
      });
      setMapping(autoMapping);

      setActiveStep(1);
    } catch (error) {
      console.error("Erreur lecture fichier:", error);
      alert("Erreur lors de la lecture du fichier Excel. Vérifiez le format.");
    } finally {
      setLoading(false);
    }
  };

const downloadTemplate = async () => {
  try {
    const db = await getDb();
    const mesures = await db.select<{ nom: string }[]>("SELECT nom FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage");
    const colonnesMesures = mesures.map(m => m.nom);

    const template: any = {
      telephone_id: '75118161',
      nom_prenom: 'Jacques KORGO',
      adresse: 'Ouagadougou',
      email: 'jacqueskorgo5@gmail.com',
      observations: 'Client fidèle',
    };
    colonnesMesures.forEach(nom => { template[nom] = ''; });

    const ws = XLSX.utils.json_to_sheet([template]);
    ws['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
      ...colonnesMesures.map(() => ({ wch: 15 }))
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    
    // Générer le buffer Excel
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Demander où sauvegarder
    const filePath = await save({
      title: 'Enregistrer le modèle',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      defaultPath: 'template_clients_couture.xlsx'
    });
    
    if (filePath) {
      await writeFile(filePath, new Uint8Array(excelBuffer));
      alert('✅ Modèle téléchargé avec succès !');
    }
  } catch (error) {
    console.error("Erreur téléchargement:", error);
  }
};

  const handleImport = async () => {
    const telMap = Object.entries(mapping).find(([_, v]) => v === 'telephone_id');
    const nomMap = Object.entries(mapping).find(([_, v]) => v === 'nom_prenom');
    
    if (!telMap || !nomMap) {
      alert("Vous devez mapper les champs Téléphone et Nom complet (obligatoires)");
      return;
    }

    setLoading(true);
    setProgress(0);

    const db = await getDb();
    const mesures = await db.select<{ id: number; nom: string }[]>("SELECT id, nom FROM types_mesures WHERE est_active = 1");
    
    let successCount = 0;
    let errorCount = 0;
    const messages: string[] = [];

    for (let i = 0; i < excelData.length; i++) {
      try {
        const row = excelData[i];
        const clientData: any = {};
        const mesuresData: any = {};
        
        for (const [excelCol, champApp] of Object.entries(mapping)) {
          if (!champApp || row[excelCol] === undefined || row[excelCol] === null) continue;
          
          if (champApp.startsWith('mesure_')) {
            const mesureNom = champApp.replace('mesure_', '');
            const valeur = parseFloat(String(row[excelCol]).replace(',', '.'));
            if (!isNaN(valeur) && valeur > 0) mesuresData[mesureNom] = valeur;
          } else {
            clientData[champApp] = String(row[excelCol]).trim();
          }
        }

        if (!clientData.telephone_id || !clientData.nom_prenom) {
          errorCount++;
          messages.push(`Ligne ${i + 2}: Téléphone ou Nom vide`);
          continue;
        }

        await db.execute(`
          INSERT OR REPLACE INTO clients (telephone_id, nom_prenom, adresse, email, observations, est_supprime)
          VALUES (?, ?, ?, ?, ?, 0)
        `, [clientData.telephone_id, clientData.nom_prenom, clientData.adresse || '', clientData.email || '', clientData.observations || '']);

        for (const [mesureNom, valeur] of Object.entries(mesuresData)) {
          const typeMesure = mesures.find((m: { nom: string; }) => m.nom === mesureNom);
          if (typeMesure && typeof valeur === 'number') {
            await db.execute(`
              INSERT OR REPLACE INTO mesures_clients (client_id, type_mesure_id, valeur, date_mesure)
              VALUES (?, ?, ?, datetime('now'))
            `, [clientData.telephone_id, typeMesure.id, valeur]);
          }
        }

        successCount++;
        setProgress(((i + 1) / excelData.length) * 100);
      } catch (err: any) {
        errorCount++;
        messages.push(`Ligne ${i + 2}: ${err.message || 'Erreur'}`);
      }
    }

    setImportResult({ success: successCount, errors: errorCount, messages });
    setActiveStep(3);
    setLoading(false);
  };

  const renderMappingStep = () => (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <Text fw={600}>Association des colonnes</Text>
        <Text size="sm">Associez chaque colonne de votre fichier Excel au champ correspondant.</Text>
      </Alert>

      <Paper p="md" withBorder bg="gray.0">
        <Group justify="space-between">
          <Group gap="xs">
            <IconFileExcel size={20} color="green" />
            <Text size="sm" fw={500}>Fichier : {fileName}</Text>
            <Badge color="blue" variant="light">{excelData.length} lignes</Badge>
          </Group>
          <Button variant="subtle" size="xs" onClick={() => setActiveStep(0)}>Changer</Button>
        </Group>
      </Paper>

      <div style={{ overflowX: 'auto' }}>
        <Table striped>
          <Table.Thead style={{ backgroundColor: '#1b365d' }}>
            <Table.Tr>
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
                    placeholder="Ignorer cette colonne"
                    data={[
                      { group: 'Champs client', items: CHAMPS_DISPONIBLES },
                      { group: 'Mesures', items: typesMesuresExistants.map(m => ({ value: `mesure_${m}`, label: `📏 ${m}` }))}
                    ]}
                    value={mapping[col] || null}
                    onChange={(value) => setMapping({ ...mapping, [col]: value || '' })}
                    size="xs"
                    clearable
                    searchable
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" lineClamp={1}>{excelData[0]?.[col]?.toString() || '-'}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={() => setActiveStep(0)}>Annuler</Button>
        <Button onClick={() => setActiveStep(2)} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>Continuer</Button>
      </Group>
    </Stack>
  );

  const renderPreviewStep = () => (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
        <Text fw={600}>Aperçu des {Math.min(5, excelData.length)} premières lignes</Text>
      </Alert>

      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#1b365d' }}>
            <Table.Tr>
              {Object.entries(mapping).filter(([_, c]) => c).map(([col], idx) => (
                <Table.Th key={idx} style={{ color: 'white' }}>{col}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {excelData.slice(0, 5).map((row, idx) => (
              <Table.Tr key={idx}>
                {Object.entries(mapping).filter(([_, c]) => c).map(([col], i) => (
                  <Table.Td key={i}>{String(row[col] || '-')}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <Paper p="md" withBorder bg="gray.0">
        <Group justify="space-between">
          <Text size="sm">Total : <strong>{excelData.length}</strong> lignes</Text>
          <Badge color="blue">Téléphone requis</Badge>
        </Group>
      </Paper>

      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={() => setActiveStep(1)}>Retour</Button>
        <Button onClick={handleImport} loading={loading} variant="gradient" gradient={{ from: 'green', to: 'teal' }}>
          Importer {excelData.length} clients
        </Button>
      </Group>
    </Stack>
  );

  const renderResultStep = () => (
    <Stack align="center" gap="md" py="xl">
      <ThemeIcon size={80} radius="xl" color={importResult && importResult.errors === 0 ? 'green' : 'orange'} variant="light">
        {importResult && importResult.errors === 0 ? <IconCheck size={40} /> : <IconAlertCircle size={40} />}
      </ThemeIcon>
      <Title order={3}>Import terminé</Title>
      <Paper p="md" withBorder bg="gray.0" w="100%" ta="center">
        <Text size="lg" c="green">✅ {importResult?.success || 0} clients importés</Text>
        {importResult && importResult.errors > 0 && (
          <Text c="red" size="md" mt="sm">❌ {importResult.errors} erreurs</Text>
        )}
      </Paper>
      {importResult && importResult.messages.length > 0 && (
        <Paper p="sm" withBorder w="100%">
          {importResult.messages.slice(0, 5).map((msg, i) => (
            <Text key={i} size="xs" c="red">{msg}</Text>
          ))}
          {importResult.messages.length > 5 && (
            <Text size="xs" c="dimmed">...et {importResult.messages.length - 5} autres</Text>
          )}
        </Paper>
      )}
      <Group>
        <Button onClick={() => { setActiveStep(0); setImportResult(null); }} variant="light">Nouvel import</Button>
      </Group>
    </Stack>
  );

  return (
    <Container size="full" p="md">
      <Stack gap="lg">
        {/* Header */}
        <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
          <Group justify="space-between">
            <Group gap="md">
              <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <IconUsers size={30} color="black" />
              </Avatar>
              <Box>
                <Title order={1} c="white" size="h2">Import clients Excel</Title>
                <Text c="gray.3" size="sm">Importez vos clients et mesures depuis un fichier Excel</Text>
              </Box>
            </Group>
          </Group>
        </Card>

        <Card withBorder radius="lg" p="xl" shadow="sm">
          <LoadingOverlay visible={loading} />

          <Stepper active={activeStep} mb="xl">
            <Stepper.Step label="Fichier" description="Sélectionnez le fichier" />
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

              <Button variant="subtle" onClick={downloadTemplate} leftSection={<IconDownload size={16} />}>
                Télécharger le modèle Excel
              </Button>

              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="md">
                <Text fw={600}>Format attendu</Text>
                <Text size="xs">• Première ligne = en-têtes • Colonne téléphone obligatoire • Colonne nom obligatoire</Text>
              </Alert>
            </Stack>
          )}

          {activeStep === 1 && renderMappingStep()}
          {activeStep === 2 && renderPreviewStep()}
          {activeStep === 3 && renderResultStep()}

          {progress > 0 && progress < 100 && (
            <Stack gap="xs" mt="md">
              <Group justify="space-between">
                <Text size="sm">Import en cours...</Text>
                <Text size="sm" fw={500}>{Math.round(progress)}%</Text>
              </Group>
              <Progress value={progress} size="md" radius="xl" color="blue" striped animated />
            </Stack>
          )}
        </Card>
      </Stack>
    </Container>
  );
};

export default ImportClientsExcel;