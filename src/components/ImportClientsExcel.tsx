// src/components/ImportClientsExcel.tsx
import React, { useState, useEffect } from 'react';
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
import { notifications } from '@mantine/notifications';

const CHAMPS_DISPONIBLES = [
  { value: 'telephone_id', label: '📞 Téléphone (ID client)', required: true },
  { value: 'nom_prenom', label: '👤 Nom complet', required: true },
  { value: 'profil', label: '👥 Profil (principal/enfant/conjoint)', required: false },
  { value: 'adresse', label: '📍 Adresse', required: false },
  { value: 'email', label: '✉️ Email', required: false },
  { value: 'observations', label: '📝 Observations', required: false },
];

const PROFILS_DISPONIBLES = [
  { value: 'principal', label: 'Principal' },
  { value: 'enfant', label: 'Enfant' },
  { value: 'conjoint', label: 'Conjoint' },
  { value: 'parent', label: 'Parent' },
  { value: 'autre', label: 'Autre' },
];

const ImportClientsExcel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [colonnesExcel, setColonnesExcel] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; messages: string[] } | null>(null);
  const [typesMesuresExistants, setTypesMesuresExistants] = useState<{ id: number; nom: string }[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [defaultProfil, setDefaultProfil] = useState<string>('principal');

  // Charger les types de mesures existants
  useEffect(() => {
    const loadMesures = async () => {
      try {
        const db = await getDb();
        const mesures = await db.select<{ id: number; nom: string }[]>(
          "SELECT id, nom FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage"
        );
        setTypesMesuresExistants(mesures);
        console.log("📏 Mesures chargées:", mesures);
      } catch (error) {
        console.error("Erreur chargement mesures:", error);
      }
    };
    loadMesures();
  }, []);

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // ✅ FORCER la lecture en mode tableau brut (header: 1)
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });

      console.log("📊 Lignes brutes (mode header:1):", rawRows.length);

      if (rawRows.length < 2) {
        alert("Le fichier n'a pas assez de lignes");
        setLoading(false);
        return;
      }

      // Première ligne = en-têtes
      const headers = rawRows[0].map((cell: any) => {
        let header = String(cell || '').trim();
        // Nettoyer l'en-tête
        header = header.replace(/[^\w\s\u00C0-\u00FF-]/gi, '').trim();
        return header;
      });

      console.log("📊 En-têtes:", headers);

      // Convertir les lignes en objets
      const jsonData: any[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        const obj: any = {};
        let hasData = false;

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          if (!header || header === '') continue;

          let value = row[j];
          if (value !== undefined && value !== null && value !== '') {
            hasData = true;
            obj[header] = String(value).trim();
          }
        }

        if (hasData) {
          jsonData.push(obj);
        }
      }

      console.log("📊 Données converties:", jsonData.length);
      console.log("📊 Première ligne:", jsonData[0]);

      if (jsonData.length === 0) {
        alert("Aucune donnée trouvée");
        setLoading(false);
        return;
      }

      // Nettoyer et valider les données
      let lastValidTelephone = '';
      const cleanData: any[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        // Extraire le téléphone
        let telephone = row['telephone_id'] || row['telephone'] || row['Telephone'] || row['Téléphone'] || '';
        telephone = String(telephone).replace(/[^0-9]/g, '');

        // Corriger le téléphone (ajouter 75 si nécessaire)
        if (telephone.length === 8 && !telephone.startsWith('75')) {
          telephone = '75' + telephone;
        }

        if (telephone && telephone !== '') {
          lastValidTelephone = telephone;
        } else if (lastValidTelephone) {
          telephone = lastValidTelephone;
        }

        // Extraire le nom
        let nom = row['nom_prenom'] || row['nom'] || row['Nom'] || '';
        nom = String(nom).trim();

        // Ignorer les lignes sans nom
        if (!nom || nom === '') continue;

        // Extraire le profil
        let profil = row['profil'] || row['Profil'] || '';
        profil = String(profil).toLowerCase().trim();
        if (!profil || profil === '') profil = 'enfant';

        // Extraire adresse et email
        let adresse = row['adresse'] || row['Adresse'] || '';
        let email = row['email'] || row['Email'] || '';
        let observations = row['observations'] || row['Observations'] || '';

        // Créer la ligne propre
        const cleanRow: any = {
          telephone_id: telephone,
          nom_prenom: nom,
          profil: profil,
          adresse: String(adresse).trim(),
          email: String(email).trim(),
          observations: String(observations).trim(),
        };

        // Ajouter les mesures (toutes les autres colonnes)
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase();
          // Ignorer les colonnes déjà traitées
          if (lowerKey.includes('tel') || lowerKey.includes('nom') ||
            lowerKey.includes('profil') || lowerKey.includes('adresse') ||
            lowerKey.includes('email') || lowerKey.includes('observ')) {
            return;
          }

          let value = row[key];
          if (value && value !== '') {
            // Nettoyer la valeur (virgule en point)
            const numValue = String(value).replace(',', '.').replace(/[^0-9.-]/g, '');
            const floatValue = parseFloat(numValue);
            if (!isNaN(floatValue) && floatValue > 0) {
              cleanRow[key] = floatValue;
            }
          }
        });

        cleanData.push(cleanRow);
      }

      console.log("📊 Données finales nettoyées:", cleanData.length);

      if (cleanData.length === 0) {
        alert("Aucune ligne valide après nettoyage");
        setLoading(false);
        return;
      }

      // Récupérer toutes les colonnes
      const allCols = new Set<string>();
      cleanData.forEach(row => {
        Object.keys(row).forEach(col => allCols.add(col));
      });
      const cols = Array.from(allCols);

      setColonnesExcel(cols);
      setExcelData(cleanData);

      // Auto-mapping (reste identique)
      const autoMapping: Record<string, string> = {};
      cols.forEach(col => {
        const normalizedCol = normalize(col);

        if (normalizedCol.includes('tel') || normalizedCol.includes('phone')) {
          autoMapping[col] = 'telephone_id';
        } else if (normalizedCol === 'nom' || normalizedCol === 'nom_prenom' ||
          (normalizedCol.includes('nom') && (normalizedCol.includes('prenom') || normalizedCol.includes('complet')))) {
          autoMapping[col] = 'nom_prenom';
        } else if (normalizedCol.includes('profil')) {
          autoMapping[col] = 'profil';
        } else if (normalizedCol.includes('adresse')) {
          autoMapping[col] = 'adresse';
        } else if (normalizedCol.includes('email') || normalizedCol.includes('mail')) {
          autoMapping[col] = 'email';
        } else if (normalizedCol.includes('observ') || normalizedCol.includes('note')) {
          autoMapping[col] = 'observations';
        } else {
          const mesureMatch = typesMesuresExistants.find(m => normalize(m.nom) === normalizedCol);
          if (mesureMatch) {
            autoMapping[col] = `mesure_${mesureMatch.nom}`;
          }
        }
      });

      setMapping(autoMapping);
      setActiveStep(1);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      alert("Erreur lors de la lecture du fichier: " + (error instanceof Error ? error.message : 'Inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const db = await getDb();
      // Requête corrigée - sans "categorie"
      const mesures = await db.select<{ nom: string }[]>(
        "SELECT nom FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage"
      );
      const colonnesMesures = mesures.map(m => m.nom);

      console.log("📏 Mesures pour le template:", colonnesMesures);

      // Valeurs d'exemple pour chaque mesure
      const valeursExemples: Record<string, number> = {
        'Tour de poitrine': 95,
        'Tour de taille': 75,
        'Tour de hanches': 102,
        'Longueur totale': 165,
        'Longueur manche': 60,
        'Tour de cou': 38,
        'Largeur épaule': 42,
        'Longueur jambe': 105,
        'Tour de cuisse': 58,
        'Tour de bras': 32,
      };

      // Ligne 1: Client principal
      const templatePrincipal: any = {
        telephone_id: '75118161',
        nom_prenom: 'Jacques KORGO',
        profil: 'principal',
        adresse: 'Ouagadougou, Burkina Faso',
        email: 'jacqueskorgo5@gmail.com',
        observations: 'Client fidèle - Livraison express',
      };

      colonnesMesures.forEach(nom => {
        templatePrincipal[nom] = valeursExemples[nom] || 85;
      });

      // Ligne 2: Conjoint (même téléphone)
      const templateConjoint: any = {
        telephone_id: '75118161',
        nom_prenom: 'Marie KORGO',
        profil: 'conjoint',
        adresse: 'Ouagadougou, Burkina Faso',
        email: '',
        observations: 'Conjointe',
      };

      colonnesMesures.forEach(nom => {
        const valeurBase = valeursExemples[nom] || 85;
        templateConjoint[nom] = nom.includes('Longueur') ? valeurBase - 10 : valeurBase - 5;
      });

      // Ligne 3: Enfant (même téléphone)
      const templateEnfant: any = {
        telephone_id: '75118161',
        nom_prenom: 'Enfant KORGO',
        profil: 'enfant',
        adresse: 'Ouagadougou, Burkina Faso',
        email: '',
        observations: 'Enfant - 12 ans',
      };

      colonnesMesures.forEach(nom => {
        const valeurBase = valeursExemples[nom] || 85;
        templateEnfant[nom] = Math.round(valeurBase * 0.6);
      });

      const data = [templatePrincipal, templateConjoint, templateEnfant];

      const ws = XLSX.utils.json_to_sheet(data);

      // Configurer les largeurs des colonnes
      const largeurs = [
        { wch: 15 }, // telephone_id
        { wch: 25 }, // nom_prenom
        { wch: 12 }, // profil
        { wch: 30 }, // adresse
        { wch: 25 }, // email
        { wch: 25 }, // observations
      ];
      colonnesMesures.forEach(() => largeurs.push({ wch: 15 }));
      ws['!cols'] = largeurs;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');

      // Feuille d'instructions
      const instructions = [
        ['📋 GUIDE D\'IMPORTATION DES CLIENTS'],
        [''],
        ['🔴 COLONNES OBLIGATOIRES :'],
        ['   telephone_id - Numéro de téléphone (identifiant unique par famille)'],
        ['   nom_prenom - Nom et prénom complet'],
        [''],
        ['🟡 COLONNES OPTIONNELLES :'],
        ['   profil - principal, enfant, conjoint, parent, autre (défaut: principal)'],
        ['   adresse - Adresse complète'],
        ['   email - Adresse email'],
        ['   observations - Notes diverses'],
        [''],
        ['📏 MESURES :'],
        [`   ${colonnesMesures.join(', ')}`],
        ['   ⚠️ Les noms doivent correspondre EXACTEMENT à ceux ci-dessus'],
        ['   💡 Valeurs numériques en centimètres (ex: 95, 70.5)'],
        ['   📌 Les mesures vides seront ignorées'],
        [''],
        ['💡 ASTUCES :'],
        ['   • Pour une famille, utilisez le même telephone_id pour tous les membres'],
        ['   • Différenciez les membres avec le champ "profil"'],
        ['   • Les valeurs de mesures doivent être des nombres'],
        [''],
        [`📅 Généré le: ${new Date().toLocaleString('fr-FR')}`],
        [`📊 ${colonnesMesures.length} mesures incluses`],
      ];

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
      wsInstructions['!cols'] = [{ wch: 90 }];
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      const filePath = await save({
        title: 'Enregistrer le modèle Excel',
        filters: [{ name: 'Excel files', extensions: ['xlsx'] }],
        defaultPath: `template_clients_${new Date().toISOString().split('T')[0]}.xlsx`
      });

      if (filePath) {
        await writeFile(filePath, new Uint8Array(excelBuffer));
        alert(`✅ Modèle téléchargé avec succès !\n📊 ${colonnesMesures.length} mesures incluses\n👥 3 exemples (principal, conjoint, enfant)`);
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleImport = async () => {
    const telMap = Object.entries(mapping).find(([_, v]) => v === 'telephone_id');
    const nomMap = Object.entries(mapping).find(([_, v]) => v === 'nom_prenom');

    if (!telMap || !nomMap) {
      alert("Vous devez mapper les champs Téléphone et Nom complet");
      return;
    }

    setLoading(true);
    setProgress(0);

    const db = await getDb();
    const mesures = typesMesuresExistants;
    const mesureMap = new Map(mesures.map(m => [m.nom.toLowerCase(), m.id]));

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    const messages: string[] = [];

    for (let i = 0; i < excelData.length; i++) {
      try {
        const row = excelData[i];
        const clientData: any = {};
        const mesuresData: { nom: string; valeur: number }[] = [];

        // Extraire les données du mapping
        for (const [excelCol, champApp] of Object.entries(mapping)) {
          if (!champApp) continue;

          let valeur = row[excelCol];
          if (valeur === undefined || valeur === null || valeur === '') continue;

          if (champApp.startsWith('mesure_')) {
            const mesureNom = champApp.replace('mesure_', '');
            // Nettoyer la valeur: virgule en point, enlever les caractères non numériques
            let valeurStr = String(valeur).replace(',', '.');
            // Enlever tout sauf chiffres, point et moins
            valeurStr = valeurStr.replace(/[^0-9.-]/g, '');
            const numValeur = parseFloat(valeurStr);

            if (!isNaN(numValeur) && numValeur > 0) {
              mesuresData.push({ nom: mesureNom, valeur: numValeur });
            }
          } else {
            clientData[champApp] = String(valeur).trim();
          }
        }

        // Valider les champs obligatoires
        if (!clientData.telephone_id || clientData.telephone_id === '') {
          errorCount++;
          messages.push(`❌ Ligne ${i + 2}: Téléphone manquant - ignoré`);
          continue;
        }

        if (!clientData.nom_prenom || clientData.nom_prenom === '') {
          errorCount++;
          messages.push(`❌ Ligne ${i + 2}: Nom manquant pour ${clientData.telephone_id} - ignoré`);
          continue;
        }

        // Profil par défaut
        const profil = clientData.profil && PROFILS_DISPONIBLES.some(p => p.value === clientData.profil.toLowerCase())
          ? clientData.profil.toLowerCase()
          : defaultProfil;

        // Vérifier/insérer le client
        const existingClient = await db.select<{ id: number }[]>(
          "SELECT id FROM clients WHERE telephone_id = ? AND nom_prenom = ?",
          [clientData.telephone_id, clientData.nom_prenom]
        );

        let clientId: number;
        

        if (existingClient && existingClient.length > 0) {
          clientId = existingClient[0].id;
          await db.execute(
            `UPDATE clients SET profil = ?, adresse = ?, email = ?, observations = ? WHERE id = ?`,
            [profil, clientData.adresse || '', clientData.email || '', clientData.observations || '', clientId]
          );
          messages.push(`✏️ Ligne ${i + 2}: ${clientData.nom_prenom} mis à jour`);
        } else {
          const result = await db.execute(
            `INSERT INTO clients (telephone_id, nom_prenom, profil, adresse, email, observations)
           VALUES (?, ?, ?, ?, ?, ?)`,
            [clientData.telephone_id, clientData.nom_prenom, profil,
            clientData.adresse || '', clientData.email || '', clientData.observations || '']
          );
          clientId = Number(result.lastInsertId);
   
          messages.push(`✅ Ligne ${i + 2}: ${clientData.nom_prenom} créé`);
        }

        // Insérer les mesures
        let mesuresCount = 0;
        for (const mesure of mesuresData) {
          const mesureId = mesureMap.get(mesure.nom.toLowerCase());
          if (mesureId) {
            const existingMeasure = await db.select<{ id: number }[]>(
              "SELECT id FROM mesures_clients WHERE client_id = ? AND type_mesure_id = ?",
              [clientId, mesureId]
            );

            if (existingMeasure && existingMeasure.length > 0) {
              await db.execute(
                `UPDATE mesures_clients SET valeur = ?, date_mesure = CURRENT_TIMESTAMP
               WHERE client_id = ? AND type_mesure_id = ?`,
                [mesure.valeur, clientId, mesureId]
              );
            } else {
              await db.execute(
                `INSERT INTO mesures_clients (client_id, type_mesure_id, valeur)
               VALUES (?, ?, ?)`,
                [clientId, mesureId, mesure.valeur]
              );
            }
            mesuresCount++;
          }
        }

        if (mesuresCount > 0) {
          messages.push(`  📏 ${mesuresCount} mesures enregistrées pour ${clientData.nom_prenom}`);
        }

        successCount++;
        setProgress(((i + 1) / excelData.length) * 100);
      } catch (err: any) {
        errorCount++;
        messages.push(`❌ Ligne ${i + 2}: ${err.message || 'Erreur'}`);
      }
    }

    const finalMessage = `${successCount} client(s) importés, ${skipCount} ignorés, ${errorCount} erreurs`;
    setImportResult({ success: successCount, errors: errorCount, messages });
    setActiveStep(3);
    setLoading(false);

    notifications.show({
      title: 'Import terminé',
      message: finalMessage,
      color: errorCount > 0 ? 'orange' : 'green'
    });
  };
  const renderMappingStep = () => (
    <Stack gap="md">
      <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
        <Text fw={600}>Association des colonnes</Text>
        <Text size="sm">Associez chaque colonne de votre fichier Excel au champ correspondant.</Text>
      </Alert>

      <Paper p="md" withBorder bg="gray.0">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <IconFileExcel size={20} color="green" />
            <Text size="sm" fw={500}>Fichier : {fileName}</Text>
            <Badge color="blue" variant="light">{excelData.length} lignes</Badge>
          </Group>
          <Group gap="md">
            <Select
              label="Profil par défaut"
              placeholder="Choisir un profil"
              data={PROFILS_DISPONIBLES}
              value={defaultProfil}
              onChange={(val) => setDefaultProfil(val || 'principal')}
              size="xs"
              style={{ width: 150 }}
            />
            <Button variant="subtle" size="xs" onClick={() => setActiveStep(0)}>Changer</Button>
          </Group>
        </Group>
      </Paper>

      <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
        <Table striped>
          <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0 }}>
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
                      {
                        group: 'Mesures', items: typesMesuresExistants.map(m => ({
                          value: `mesure_${m.nom}`,
                          label: `📏 ${m.nom}`
                        }))
                      }
                    ]}
                    value={mapping[col] || null}
                    onChange={(value) => setMapping({ ...mapping, [col]: value || '' })}
                    size="xs"
                    clearable
                    searchable
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {excelData[0]?.[col]?.toString() || '-'}
                  </Text>
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

  const renderPreviewStep = () => {
    const previewData = excelData.slice(0, 5).map(row => {
      const preview: any = {};
      for (const [col, field] of Object.entries(mapping)) {
        if (field) {
          let value = row[col];
          if (value === undefined || value === null) value = '-';
          preview[col] = String(value);
        }
      }
      return preview;
    });

    return (
      <Stack gap="md">
        <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
          <Text fw={600}>Aperçu des {Math.min(5, excelData.length)} premières lignes</Text>
          <Group gap="xs" mt="xs">
            <Text size="xs">Profil par défaut :</Text>
            <Badge color="blue" variant="light">{defaultProfil}</Badge>
            <Text size="xs" c="dimmed">(si non spécifié)</Text>
          </Group>
        </Alert>

        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0 }}>
              <Table.Tr>
                {Object.keys(previewData[0] || {}).map((col, idx) => (
                  <Table.Th key={idx} style={{ color: 'white' }}>{col}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {previewData.map((row, idx) => (
                <Table.Tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <Table.Td key={i}>
                      <Text size="xs" lineClamp={1}>{String(val)}</Text>
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        <Paper p="md" withBorder bg="gray.0">
          <Group justify="space-between">
            <Text size="sm">Total : <strong>{excelData.length}</strong> lignes</Text>
            <Badge color="blue" variant="light">Téléphone et Nom requis</Badge>
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
  };

  const renderResultStep = () => (
    <Stack align="center" gap="md" py="xl">
      <ThemeIcon size={80} radius="xl" color={importResult && importResult.errors === 0 ? 'green' : 'orange'} variant="light">
        {importResult && importResult.errors === 0 ? <IconCheck size={40} /> : <IconAlertCircle size={40} />}
      </ThemeIcon>
      <Title order={3}>Import terminé</Title>
      <Paper p="md" withBorder bg="gray.0" w="100%" ta="center">
        <Text size="lg" c="green">✅ {importResult?.success || 0} clients importés/mis à jour</Text>
        {importResult && importResult.errors > 0 && (
          <Text c="red" size="md" mt="sm">❌ {importResult.errors} erreurs</Text>
        )}
      </Paper>
      {importResult && importResult.messages.length > 0 && (
        <Paper p="sm" withBorder w="100%" mah={300} style={{ overflowY: 'auto' }}>
          <Text fw={600} size="xs" mb="xs">Détail des opérations :</Text>
          {importResult.messages.slice(-30).map((msg, i) => (
            <Text key={i} size="xs" c={msg.includes('✅') ? 'green' : msg.includes('✏️') ? 'blue' : 'red'}>
              {msg}
            </Text>
          ))}
          {importResult.messages.length > 30 && (
            <Text size="xs" c="dimmed">...et {importResult.messages.length - 30} autres messages</Text>
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
                <IconUsers size={30} color="white" />
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
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} hidden />
              </Button>

              <Button variant="subtle" onClick={downloadTemplate} leftSection={<IconDownload size={16} />}>
                Télécharger le modèle Excel
              </Button>

              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="md">
                <Text fw={600}>Format attendu</Text>
                <Text size="xs">• Première ligne = en-têtes</Text>
                <Text size="xs">• Colonne téléphone obligatoire (identifiant famille)</Text>
                <Text size="xs">• Colonne nom complet obligatoire</Text>
                <Text size="xs">• Les colonnes de mesures doivent correspondre exactement aux noms dans la base</Text>
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