import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Button,
  Stepper,
  LoadingOverlay,
  Group,
  Container,
  Avatar,
  Box,
  Table,
  Badge,
  ScrollArea,
  Tooltip,
  Progress,
  RingProgress,
  ThemeIcon,
} from '@mantine/core';
import { 
  IconDownload, 
  IconUpload, 
  IconCheck, 
  IconFileExcel,
  IconFileImport,
  IconArrowBack,
  IconDatabase,
  IconAlertTriangle,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { apiGet, apiPost } from '../services/api';
import { notifications } from '@mantine/notifications';
import { journaliserAction } from '../services/journal';
import { getUtilisateurConnecte } from '../services/session';

// ==================== INTERFACES ====================
interface TypeMesure {
  id: number;
  nom: string;
  unite?: string;
}

interface ClientApercu {
  telephone_id: string;
  nom_prenom: string;
  profil: string;
  adresse: string;
  email: string;
  observations: string;
  mesures: Array<{
    nom: string;
    valeur: string;
    unite?: string;
  }>;
  valide: boolean;
  erreurs: string[];
}

// ==================== COMPOSANT ====================
const ImportClientsExcel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typesMesures, setTypesMesures] = useState<TypeMesure[]>([]);
  const [fileName, setFileName] = useState('');
  const [apercu, setApercu] = useState<ClientApercu[]>([]);
  const [resultat, setResultat] = useState<{ success: number; errors: number; details: any[] } | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importCurrent, setImportCurrent] = useState(0);

  // Charger les types de mesures
  useEffect(() => {
    const loadTypesMesures = async () => {
      try {
        const mesures = await apiGet("/types-mesures");
        setTypesMesures(mesures || []);
      } catch (error) {
        console.error('Erreur chargement types mesures:', error);
        notifications.show({
          title: 'Erreur',
          message: 'Impossible de charger les types de mesures.',
          color: 'red'
        });
      }
    };
    loadTypesMesures();
  }, []);

  // ==================== TÉLÉCHARGER TEMPLATE ====================
  const downloadTemplate = () => {
    try {
      if (typesMesures.length === 0) {
        notifications.show({
          title: 'Erreur',
          message: 'Aucun type de mesure configuré.',
          color: 'red'
        });
        return;
      }

      const headers = [
        'telephone_id*',
        'nom_prenom*',
        'profil',
        'adresse',
        'email',
        'observations',
        ...typesMesures.map(m => `${m.nom}${m.unite ? ` (${m.unite})` : ''}`)
      ];

      const exemple1 = [
        '75118161', 'Jacques KORGO', 'principal', 'Ouagadougou',
        'jacques@email.com', 'Client fidèle', ...typesMesures.map(() => 90)
      ];
      const exemple2 = [
        '70123456', 'Marie DUPONT', 'principal', 'Bobo-Dioulasso',
        'marie@email.com', 'Nouvelle cliente', ...typesMesures.map(() => 85)
      ];

      const data: (string | number)[][] = [headers, exemple1, exemple2];
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = headers.map(h => ({ wch: Math.min(h.length + 5, 30) }));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_clients_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.show({ title: '✅ Template généré', message: 'Template téléchargé avec vos types de mesures', color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Erreur', message: 'Impossible de générer le template', color: 'red' });
    }
  };

  // ==================== EXTRAIRE NOM MESURE ====================
  const extraireNomMesure = (nomColonne: string): string => {
    return nomColonne.trim().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
  };

  // ==================== ANALYSER FICHIER ====================
  const analyserFichier = (data: any[]) => {
    console.log("📊 Début analyse -", data.length, "lignes");

    if (data.length === 0) {
      notifications.show({ title: 'Erreur', message: 'Aucune donnée', color: 'red' });
      return;
    }

    const colonnesExcel = Object.keys(data[0]);
    console.log("📊 Colonnes:", colonnesExcel);

    // Mapping EXACT des colonnes
    const mappingMesures: Record<string, string> = {};
    const colonnesStandard = ['telephone_id', 'telephone_id*', 'nom_prenom', 'nom_prenom*', 'profil', 'adresse', 'email', 'observations', '__empty'];

    for (const col of colonnesExcel) {
      if (colonnesStandard.includes(col.toLowerCase().trim())) continue;
      
      const nomNettoye = extraireNomMesure(col);
      
      for (const type of typesMesures) {
        if (type.nom.toUpperCase().trim() === nomNettoye.toUpperCase().trim()) {
          mappingMesures[col] = type.nom;
          console.log(`✅ "${col}" -> ${type.nom}`);
          break;
        }
      }
    }

    console.log("📊 Mapping:", Object.keys(mappingMesures).length, "colonnes mappées");

    const apercuData: ClientApercu[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const erreurs: string[] = [];

      const telephone_id = (row['telephone_id'] || row['telephone_id*'] || '').toString().trim();
      const nom_prenom = (row['nom_prenom'] || row['nom_prenom*'] || '').toString().trim();
      const profil = (row['profil'] || 'principal').toString().trim().toLowerCase();
      const adresse = (row['adresse'] || '').toString().trim();
      const email = (row['email'] || '').toString().trim();
      const observations = (row['observations'] || '').toString().trim();

      // Vérifier ligne vide
      const ligneVide = Object.values(row).every(v => v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === ''));
      if (ligneVide) continue;

      // Validation minimale
      if (!telephone_id) erreurs.push('Téléphone manquant');
      if (!nom_prenom) erreurs.push('Nom manquant');

      // Extraire les mesures - TOUT est gardé comme texte
      const mesures: Array<{ nom: string; valeur: string; unite?: string }> = [];
      
      for (const [colExcel, nomMesure] of Object.entries(mappingMesures)) {
        const valeurRaw = row[colExcel];
        if (valeurRaw !== undefined && valeurRaw !== null && valeurRaw !== '') {
          const typeMesure = typesMesures.find(t => t.nom === nomMesure);
          mesures.push({
            nom: nomMesure,
            valeur: String(valeurRaw).trim(),
            unite: typeMesure?.unite
          });
        }
      }

      apercuData.push({
        telephone_id, nom_prenom, profil, adresse, email, observations,
        mesures,
        valide: erreurs.length === 0,
        erreurs
      });
    }

    console.log(`📊 ${apercuData.length} clients analysés, ${apercuData.filter(c => c.valide).length} valides`);
    setApercu(apercuData);
    setActiveStep(2);
  };

  // ==================== UPLOAD FICHIER ====================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        notifications.show({ title: 'Erreur', message: 'Fichier vide', color: 'red' });
        return;
      }

      analyserFichier(jsonData);
      notifications.show({ title: '✅ Fichier chargé', message: `${jsonData.length} lignes trouvées`, color: 'green' });
    } catch (error) {
      notifications.show({ title: 'Erreur', message: 'Erreur lecture fichier', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // ==================== IMPORTER ====================
  const handleImport = async () => {
    setLoading(true);
    const clientsValides = apercu.filter(c => c.valide);
    setImportTotal(clientsValides.length);
    setImportCurrent(0);
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;
    const details: any[] = [];
    const session = getUtilisateurConnecte();

    for (let i = 0; i < clientsValides.length; i++) {
      try {
        const client = clientsValides[i];

        // 1. Créer ou récupérer le client
        const response = await apiPost("/clients", {
          telephone_id: client.telephone_id,
          nom_prenom: client.nom_prenom,
          profil: client.profil || 'principal',
          adresse: client.adresse || '',
          email: client.email || '',
          observations: client.observations || ''
        });

        // Récupérer l'ID
        let clientId = response?.client?.id || response?.id;
        
        if (!clientId) {
          // Rechercher le client
          const clients = await apiGet("/clients");
          const found = clients.find((c: any) => 
            String(c.telephone_id).trim() === String(client.telephone_id).trim()
          );
          clientId = found?.id;
        }

        if (!clientId) {
          throw new Error(`ID client introuvable pour ${client.telephone_id}`);
        }

        // 2. Sauvegarder les mesures
        if (client.mesures.length > 0) {
          const mesuresToSave = client.mesures.map(m => {
            const typeMesure = typesMesures.find(tm => tm.nom === m.nom);
            return {
              type_mesure_id: typeMesure?.id,
              valeur: m.valeur
            };
          }).filter(m => m.type_mesure_id && m.valeur);

          if (mesuresToSave.length > 0) {
            await apiPost(`/clients/${clientId}/mesures-by-id`, { mesures: mesuresToSave });
          }
        }

        successCount++;
        details.push({
          telephone: client.telephone_id,
          nom: client.nom_prenom,
          statut: 'Importé',
          mesuresCount: client.mesures.length
        });

      } catch (err: any) {
        errorCount++;
        details.push({
          telephone: clientsValides[i].telephone_id,
          nom: clientsValides[i].nom_prenom,
          statut: 'Erreur',
          erreur: err.message
        });
      }

      setImportCurrent(i + 1);
      setImportProgress(Math.round(((i + 1) / clientsValides.length) * 100));
    }

    setResultat({ success: successCount, errors: errorCount, details });
    setActiveStep(3);

    notifications.show({
      title: errorCount === 0 ? '✅ Import réussi' : '⚠️ Import partiel',
      message: `${successCount} réussis, ${errorCount} erreurs`,
      color: errorCount === 0 ? 'green' : 'orange'
    });

    await journaliserAction({
      utilisateur: session?.nom || 'Utilisateur',
      action: 'IMPORT',
      table: 'clients',
      idEnregistrement: fileName,
      details: `${successCount}/${clientsValides.length} clients importés`
    });

    setLoading(false);
  };

  const resetImport = () => {
    setActiveStep(0);
    setFileName('');
    setApercu([]);
    setResultat(null);
    setImportProgress(0);
  };

  // ==================== RENDU ====================
  const clientsValidesCount = apercu.filter(c => c.valide).length;
  const clientsInvalidesCount = apercu.filter(c => !c.valide).length;

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        {/* En-tête */}
        <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
          <Group>
            <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <IconFileExcel size={30} color="white" />
            </Avatar>
            <Box flex={1}>
              <Title order={2} c="white">Import Clients avec Mesures</Title>
              <Text c="gray.3" size="sm">Importez vos clients et leurs mesures en masse via Excel</Text>
            </Box>
            {typesMesures.length > 0 && (
              <Badge size="lg" variant="white" color="blue">{typesMesures.length} types de mesures</Badge>
            )}
          </Group>
        </Card>

        {/* Stepper */}
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={loading} />

          <Stepper active={activeStep} mb="xl" allowNextStepsSelect={false}>
            <Stepper.Step label="Template" description="Télécharger le modèle" />
            <Stepper.Step label="Fichier" description="Charger votre Excel" />
            <Stepper.Step label="Vérifier" description="Valider les données" />
            <Stepper.Step label="Importer" description="Résultat" />
          </Stepper>

          {/* Étape 0 : Template */}
          {activeStep === 0 && (
            <Stack align="center" py="xl" gap="md">
              <IconDownload size={48} stroke={1.5} color="#1b365d" />
              <Title order={3}>Téléchargez le template</Title>
              <Text c="dimmed" ta="center" maw={400}>
                Le template contient toutes les colonnes nécessaires avec vos types de mesures configurés.
              </Text>
              <Button size="lg" onClick={downloadTemplate} leftSection={<IconDownload size={20} />} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>
                Télécharger le template Excel
              </Button>
              <Button variant="light" onClick={() => setActiveStep(1)} rightSection={<IconCheck size={18} />}>
                J'ai déjà mon fichier
              </Button>
            </Stack>
          )}

          {/* Étape 1 : Upload */}
          {activeStep === 1 && (
            <Stack align="center" py="xl" gap="md">
              <IconUpload size={48} stroke={1.5} color="#1b365d" />
              <Title order={3}>Sélectionnez votre fichier</Title>
              <Button component="label" size="lg" leftSection={<IconFileImport size={20} />} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>
                Parcourir...
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} hidden />
              </Button>
              {fileName && <Badge size="lg" color="green">{fileName}</Badge>}
              <Button variant="subtle" onClick={() => setActiveStep(0)} leftSection={<IconArrowBack size={16} />}>
                Retour au template
              </Button>
            </Stack>
          )}

          {/* Étape 2 : Vérification */}
          {activeStep === 2 && (
            <Stack gap="md">
              <Group justify="space-between">
                <Box>
                  <Title order={4}>{apercu.length} clients trouvés</Title>
                  <Text size="sm">✅ {clientsValidesCount} valides | ⚠️ {clientsInvalidesCount} avec erreurs</Text>
                </Box>
                <Group>
                  <Button variant="light" onClick={() => setActiveStep(1)}>← Retour</Button>
                  <Button color="green" onClick={handleImport} disabled={clientsValidesCount === 0} leftSection={<IconDatabase size={18} />}>
                    Importer {clientsValidesCount} clients
                  </Button>
                </Group>
              </Group>

              {/* Barre de progression */}
              {loading && (
                <Card withBorder p="md" bg="gray.0">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>Importation en cours...</Text>
                    <Text size="sm" fw={500}>{importCurrent} / {importTotal}</Text>
                  </Group>
                  <Progress value={importProgress} animated color="blue" size="lg" radius="xl" />
                </Card>
              )}

              <ScrollArea h={400}>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Téléphone</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Mesures</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Statut</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {apercu.slice(0, 20).map((client, idx) => (
                      <Table.Tr key={idx} bg={!client.valide ? '#fff5f5' : undefined}>
                        <Table.Td>{client.telephone_id}</Table.Td>
                        <Table.Td fw={500}>{client.nom_prenom}</Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {client.mesures.slice(0, 3).map((m, i) => (
                              <Badge key={i} size="sm" variant="light">{m.nom}: {m.valeur}</Badge>
                            ))}
                            {client.mesures.length > 3 && <Badge size="sm" variant="light">+{client.mesures.length - 3}</Badge>}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {client.valide ? (
                            <Badge color="green">Valide</Badge>
                          ) : (
                            <Tooltip label={client.erreurs.join(', ')}>
                              <Badge color="red">Erreurs</Badge>
                            </Tooltip>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          )}

          {/* Étape 3 : Résultat */}
          {activeStep === 3 && resultat && (
            <Stack gap="md" py="xl" align="center">
              {resultat.errors === 0 ? (
                <ThemeIcon size={80} radius="xl" color="green">
                  <IconCheck size={40} />
                </ThemeIcon>
              ) : (
                <ThemeIcon size={80} radius="xl" color="orange">
                  <IconAlertTriangle size={40} />
                </ThemeIcon>
              )}
              
              <Title order={3}>
                {resultat.errors === 0 ? 'Import réussi !' : 'Import partiel'}
              </Title>
              
              <RingProgress
                sections={[
                  { value: (resultat.success / (resultat.success + resultat.errors)) * 100, color: 'green' },
                  { value: (resultat.errors / (resultat.success + resultat.errors)) * 100, color: 'red' },
                ]}
                label={
                  <Text ta="center" size="sm" fw={700}>
                    {Math.round((resultat.success / (resultat.success + resultat.errors)) * 100)}%
                  </Text>
                }
                size={150}
                thickness={12}
              />

              <Group>
                <Badge size="lg" color="green">{resultat.success} succès</Badge>
                <Badge size="lg" color="red">{resultat.errors} erreurs</Badge>
              </Group>

              <Button onClick={resetImport} variant="light" size="md">
                Nouvel import
              </Button>
            </Stack>
          )}
        </Card>
      </Stack>
    </Container>
  );
};

export default ImportClientsExcel;