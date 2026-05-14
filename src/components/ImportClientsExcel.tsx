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
  Progress,
  Container,
  Avatar,
  Box,
  Alert,
  Table,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { IconDownload, IconUpload, IconUsers, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { apiGet, apiPost, apiPut } from '../services/api';
import { notifications } from '@mantine/notifications';
import { journaliserAction } from '../services/journal';

interface TypeMesure {
  id: number;
  nom: string;
  unite?: string;
  ordre_affichage?: number;
}

interface ClientApercu {
  telephone_id: string;
  nom_prenom: string;
  profil: string;
  adresse?: string;
  email?: string;
  observations?: string;
  mesures: Array<{ nom: string; valeur: number; unite?: string }>;
  valide: boolean;
  erreurs: string[];
}

const ImportClientsExcel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [typesMesures, setTypesMesures] = useState<TypeMesure[]>([]);
  const [fileName, setFileName] = useState('');
  const [apercu, setApercu] = useState<ClientApercu[]>([]);
  const [progress, setProgress] = useState(0);
  const [resultat, setResultat] = useState<{ success: number; errors: number; details: any[] } | null>(null);

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
          message: 'Impossible de charger les types de mesures. Veuillez les configurer d\'abord.',
          color: 'red'
        });
      }
    };
    loadTypesMesures();
  }, []);

  // Télécharger le template Excel personnalisé

  const downloadTemplate = () => {
    try {
      // Construire l'en-tête du template
      const headers: string[] = [
        'telephone_id*',
        'nom_prenom*',
        'profil',
        'adresse',
        'email',
        'observations',
        ...typesMesures.map(m => `${m.nom}${m.unite ? ` (${m.unite})` : ''}`)
      ];

      // Ligne d'exemple
      const exemple: (string | number)[] = [
        '75118161',
        'Jacques KORGO',
        'principal',
        'Ouagadougou',
        'jacques@email.com',
        'Client fidèle',
        ...typesMesures.map(() => 90)
      ];

      // Convertir en tableau de tableaux pour XLSX
      const data: (string | number)[][] = [headers, exemple];

      const ws = XLSX.utils.aoa_to_sheet(data);

      // Ajuster la largeur des colonnes
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length, 20) }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');

      // Ajouter une feuille d'instructions
      const instructions: string[][] = [
        ['📋 INSTRUCTIONS POUR L\'IMPORT DES CLIENTS'],
        [''],
        ['🔑 COLONNES OBLIGATOIRES (marquées par *) :'],
        ['   - telephone_id* : Numéro de téléphone unique du client'],
        ['   - nom_prenom* : Nom et prénom complet du client'],
        [''],
        ['📝 COLONNES OPTIONNELLES :'],
        ['   - profil : principal, secondaire, enfant (défaut: principal)'],
        ['   - adresse : Adresse complète du client'],
        ['   - email : Adresse email'],
        ['   - observations : Notes diverses sur le client'],
        [''],
        ['📏 COLONNES DE MESURES :']
      ];

      // Ajouter chaque mesure ligne par ligne
      for (const m of typesMesures) {
        instructions.push([`   - ${m.nom}${m.unite ? ` (unité: ${m.unite})` : ''} : Valeur numérique`]);
      }

      // Ajouter la suite des instructions
      instructions.push(
        [''],
        ['⚠️ RÈGLES IMPORTANTES :'],
        ['1. Ne modifiez pas les noms des colonnes'],
        ['2. Les valeurs des mesures doivent être des nombres'],
        ['3. Le téléphone_id doit être unique'],
        ['4. Si un client existe déjà, ses informations seront mises à jour'],
        ['5. Les mesures seront ajoutées ou remplacées pour chaque client'],
        [''],
        ['💡 ASTUCES :'],
        ['- Vous pouvez ajouter vos propres colonnes de mesures'],
        ['- Les mesures non reconnues seront ignorées'],
        ['- Le fichier peut contenir autant de lignes que nécessaire']
      );

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      // Exporter le fichier
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_clients_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notifications.show({
        title: '✅ Template généré',
        message: 'Le fichier template a été téléchargé avec vos types de mesures',
        color: 'green'
      });

    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de générer le template',
        color: 'red'
      });
    }
  };

  // Analyser et valider les données Excel
  const analyserFichier = (data: any[]) => {
    console.log("📊 === DÉBUT ANALYSE FICHIER ===");
    console.log("📊 Nombre de lignes:", data.length);

    if (data.length === 0) {
      console.log("❌ Aucune donnée à analyser");
      return;
    }

    // Fonction pour normaliser les noms (supprime unités, accents, espaces)
    const normaliserNom = (nom: string) => {
      return nom.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprime accents
        .replace(/\([^)]*\)/g, '') // Supprime ce qui est entre parenthèses (ex: (cm))
        .replace(/[^a-z]/g, '') // Garde seulement les lettres
        .trim();
    };

    const colonnesExcel = Object.keys(data[0]);
    console.log("📊 Colonnes du fichier Excel:", colonnesExcel);
    console.log("📊 Types de mesures en base:", typesMesures.map(t => t.nom));

    // Créer un mapping entre colonnes Excel et types de mesures
    const mappingMesures: Record<string, string> = {};
    for (const col of colonnesExcel) {
      const colNormalise = normaliserNom(col);
      for (const type of typesMesures) {
        const typeNormalise = normaliserNom(type.nom);
        if (colNormalise === typeNormalise) {
          mappingMesures[col] = type.nom;
          console.log(`✅ Correspondance: "${col}" -> ${type.nom}`);
          break;
        }
      }
    }

    console.log("📊 Mapping final:", mappingMesures);

    const apercuData: ClientApercu[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const erreurs: string[] = [];

      // Extraire les champs de base
      const telephone_id = row['telephone_id'] || row['telephone_id*'];
      const nom_prenom = row['nom_prenom'] || row['nom_prenom*'];
      const profil = row['profil'] || 'principal';
      const adresse = row['adresse'] || '';
      const email = row['email'] || '';
      const observations = row['observations'] || '';

      // Validation
      if (!telephone_id) erreurs.push('Téléphone ID manquant');
      if (!nom_prenom) erreurs.push('Nom et prénom manquants');
      if (profil && !['principal', 'secondaire', 'enfant', 'autre'].includes(profil)) {
        erreurs.push('Profil invalide (principal, secondaire, enfant, autre)');
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erreurs.push('Email invalide');
      }

      // Extraire les mesures en utilisant le mapping
      const mesures: Array<{ nom: string; valeur: number; unite?: string }> = [];
      for (const [colExcel, nomMesure] of Object.entries(mappingMesures)) {
        const valeurRaw = row[colExcel];
        if (valeurRaw !== undefined && valeurRaw !== null && valeurRaw !== '') {
          const valeur = Number(valeurRaw);
          if (isNaN(valeur)) {
            erreurs.push(`${nomMesure}: valeur non numérique (${valeurRaw})`);
          } else {
            const typeMesure = typesMesures.find(t => t.nom === nomMesure);
            mesures.push({
              nom: nomMesure,
              valeur: valeur,
              unite: typeMesure?.unite
            });
          }
        }
      }

      // Log pour les premiers clients
      if (i < 3) {
        console.log(`📊 Client ${i + 1}: ${nom_prenom} - ${mesures.length} mesures trouvées`);
        if (mesures.length > 0) {
          console.log(`   Mesures:`, mesures.map(m => `${m.nom}=${m.valeur}`).join(', '));
        }
      }

      apercuData.push({
        telephone_id: telephone_id || '',
        nom_prenom: nom_prenom || '',
        profil,
        adresse,
        email,
        observations,
        mesures,
        valide: erreurs.length === 0,
        erreurs
      });
    }

    const clientsValides = apercuData.filter(c => c.valide).length;
    const clientsAvecMesures = apercuData.filter(c => c.mesures.length > 0).length;

    console.log(`📊 === FIN ANALYSE ===`);
    console.log(`📊 Total clients: ${apercuData.length}`);
    console.log(`📊 Clients valides: ${clientsValides}`);
    console.log(`📊 Clients avec mesures: ${clientsAvecMesures}`);

    setApercu(apercuData);
    setActiveStep(2);
  };

  // Upload du fichier Excel
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
        notifications.show({
          title: 'Erreur',
          message: 'Le fichier ne contient pas de données',
          color: 'red'
        });
        return;
      }

      analyserFichier(jsonData);

      notifications.show({
        title: '✅ Fichier chargé',
        message: `${jsonData.length} client(s) trouvé(s)`,
        color: 'green'
      });

    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de la lecture du fichier',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };


  const handleImport = async () => {
    setLoading(true);
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;
    const details: any[] = [];

    const clientsValides = apercu.filter(c => c.valide);

    console.log(`📊 Début import: ${clientsValides.length} clients à traiter`);
    console.log(`📏 Types de mesures disponibles:`, typesMesures.map(t => t.nom));

    for (let i = 0; i < clientsValides.length; i++) {
      try {
        const client = clientsValides[i];
        console.log(`\n--- Traitement client ${i + 1}/${clientsValides.length}: ${client.nom_prenom} (${client.telephone_id}) ---`);
        console.log(`📏 Mesures du client:`, client.mesures);

        // 1. Chercher si le client existe déjà
        const clientsExistants = await apiGet("/clients");
        const existingClient = clientsExistants.find(
          (c: any) => c.telephone_id === client.telephone_id &&
            c.profil === client.profil &&
            c.nom_prenom === client.nom_prenom
        );

        let clientId: number;

        if (existingClient) {
          console.log(`📝 Mise à jour du client existant ID: ${existingClient.id}`);
          await apiPut(`/clients/${client.telephone_id}`, {
            nom_prenom: client.nom_prenom,
            profil: client.profil || 'principal',
            adresse: client.adresse || '',
            email: client.email || '',
            observations: client.observations || ''
          });
          clientId = existingClient.id;
          console.log(`✅ Client mis à jour avec ID: ${clientId}`);
        } else {
          console.log(`✨ Création nouveau client`);
          const response = await apiPost("/clients", {
            telephone_id: client.telephone_id,
            nom_prenom: client.nom_prenom,
            profil: client.profil || 'principal',
            adresse: client.adresse || '',
            email: client.email || '',
            observations: client.observations || ''
          });
          clientId = response.client?.id || response.id;
          console.log(`✅ Client créé avec ID: ${clientId}`);
        }

        // 2. Sauvegarde des mesures - PARTIE CRITIQUE
        if (client.mesures && client.mesures.length > 0) {
          console.log(`📏 Client a ${client.mesures.length} mesures à sauvegarder`);

          const mesuresToSave = [];
          for (const mesure of client.mesures) {
            const typeMesure = typesMesures.find(tm => tm.nom === mesure.nom);
            if (typeMesure) {
              mesuresToSave.push({
                type_mesure_id: typeMesure.id,
                valeur: mesure.valeur
              });
              console.log(`   - ${mesure.nom}: ${mesure.valeur} (type_id: ${typeMesure.id})`);
            } else {
              console.warn(`   ⚠️ Type de mesure non trouvé: ${mesure.nom}`);
            }
          }

          if (mesuresToSave.length > 0) {
            console.log(`📏 Sauvegarde de ${mesuresToSave.length} mesures pour client ID ${clientId}`);
            try {
              await apiPost(`/clients/${clientId}/mesures-by-id`, {
                mesures: mesuresToSave
              });
              console.log(`✅ Mesures sauvegardées avec succès pour ${client.nom_prenom}`);
            } catch (err) {
              console.error(`❌ Erreur sauvegarde mesures:`, err);
              throw err;
            }
          } else {
            console.warn(`⚠️ Aucune mesure valide à sauvegarder pour ${client.nom_prenom}`);
          }
        } else {
          console.log(`📏 Aucune mesure à sauvegarder pour ${client.nom_prenom}`);
        }

        successCount++;
        details.push({
          telephone: client.telephone_id,
          nom: client.nom_prenom,
          statut: existingClient ? 'Mis à jour' : 'Créé',
          id: clientId,
          mesuresCount: client.mesures?.length || 0
        });

      } catch (err: any) {
        errorCount++;
        details.push({
          telephone: clientsValides[i].telephone_id,
          nom: clientsValides[i].nom_prenom,
          statut: 'Erreur',
          erreur: err.message
        });
        console.error(`❌ Erreur:`, err.message);
      }

      setProgress(((i + 1) / clientsValides.length) * 100);
    }

    console.log(`\n📊 Résultat final: ${successCount} succès, ${errorCount} erreurs`);

    setResultat({ success: successCount, errors: errorCount, details });
    setActiveStep(3);

    notifications.show({
      title: errorCount > 0 ? '⚠️ Import terminé avec erreurs' : '✅ Import réussi',
      message: `${successCount} client(s) importés, ${errorCount} erreur(s)`,
      color: errorCount > 0 ? 'orange' : 'green'
    });

    await journaliserAction({
      utilisateur: 'Utilisateur',
      action: 'IMPORT',
      table: 'clients',
      idEnregistrement: fileName,
      details: `${successCount} clients importés`
    });

    setLoading(false);
  };

  const resetImport = () => {
    setActiveStep(0);
    setFileName('');
    setApercu([]);
    setResultat(null);
    setProgress(0);
  };

  const clientsValidesCount = apercu.filter(c => c.valide).length;
  const clientsInvalidesCount = apercu.filter(c => !c.valide).length;

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        {/* En-tête */}
        <Card withBorder radius="lg" p="xl">
          <Group>
            <Avatar size={60} radius="md" color="blue">
              <IconUsers size={30} />
            </Avatar>
            <Box flex={1}>
              <Title order={2}>Import Clients avec Mesures</Title>
              <Text c="dimmed">
                Importez vos clients et leurs mesures en masse
              </Text>
              {typesMesures.length > 0 && (
                <Badge size="md" mt="xs" variant="light">
                  {typesMesures.length} type(s) de mesure(s) configuré(s)
                </Badge>
              )}
            </Box>
          </Group>
        </Card>

        {/* Stepper */}
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={loading} />

          <Stepper active={activeStep} mb="xl">
            <Stepper.Step label="1. Télécharger" description="Obtenir le template" />
            <Stepper.Step label="2. Charger" description="Sélectionner le fichier" />
            <Stepper.Step label="3. Vérifier" description="Valider les données" />
            <Stepper.Step label="4. Importer" description="Transfert PostgreSQL" />
          </Stepper>

          {/* Étape 1: Télécharger le template */}
          {activeStep === 0 && (
            <Stack align="center" py="xl">
              <Alert color="blue" icon={<IconInfoCircle size={20} />}>
                <Text fw={500}>Préparez votre fichier</Text>
                <Text size="sm">Téléchargez d'abord le modèle Excel qui contient vos types de mesures personnalisés.</Text>
              </Alert>

              <Button
                size="lg"
                onClick={downloadTemplate}
                leftSection={<IconDownload size={20} />}
                disabled={typesMesures.length === 0}
              >
                Télécharger le template Excel
              </Button>

              {typesMesures.length === 0 && (
                <Alert color="yellow" title="Configuration requise">
                  Veuillez d'abord configurer vos types de mesures dans l'application.
                </Alert>
              )}

              <Button
                variant="light"
                onClick={() => setActiveStep(1)}
                rightSection={<IconCheck size={18} />}
                disabled={typesMesures.length === 0}
              >
                J'ai déjà mon fichier
              </Button>
            </Stack>
          )}

          {/* Étape 2: Charger le fichier */}
          {activeStep === 1 && (
            <Stack align="center" py="xl">
              <Button
                component="label"
                size="lg"
                leftSection={<IconUpload size={20} />}
              >
                Sélectionner le fichier Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  hidden
                />
              </Button>

              <Text size="sm" c="dimmed">
                Fichiers acceptés : .xlsx, .xls
              </Text>

              <Button variant="subtle" onClick={() => setActiveStep(0)}>
                ← Retour pour télécharger le template
              </Button>
            </Stack>
          )}

          {/* Étape 3: Vérifier les données */}
          {activeStep === 2 && (
            <Stack gap="md">
              <Alert
                color={clientsInvalidesCount === 0 ? 'green' : 'orange'}
                title={`${apercu.length} client(s) trouvé(s)`}
              >
                {clientsInvalidesCount > 0 && (
                  <Text size="sm">
                    ⚠️ {clientsInvalidesCount} client(s) ont des erreurs et ne seront pas importés
                  </Text>
                )}
                {clientsValidesCount > 0 && (
                  <Text size="sm" c="green">
                    ✅ {clientsValidesCount} client(s) valides prêts à être importés
                  </Text>
                )}
              </Alert>

              <ScrollArea h={400}>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Téléphone</Table.Th>
                      <Table.Th>Nom/Prénom</Table.Th>
                      <Table.Th>Profil</Table.Th>
                      <Table.Th>Mesures</Table.Th>
                      <Table.Th>Statut</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {apercu.map((client, idx) => (
                      <Table.Tr key={idx} bg={!client.valide ? 'red.0' : undefined}>
                        <Table.Td>{client.telephone_id || '-'}</Table.Td>
                        <Table.Td>{client.nom_prenom || '-'}</Table.Td>
                        <Table.Td>{client.profil || '-'}</Table.Td>
                        <Table.Td>
                          {client.mesures && client.mesures.slice(0, 3).map((m, i) => (
                            <Badge key={i} size="sm" mr={5} color="cyan">
                              {m.nom}: {m.valeur}{m.unite}
                            </Badge>
                          ))}
                          {client.mesures && client.mesures.length > 3 && (
                            <Badge size="sm">+{client.mesures.length - 3}</Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {!client.valide && client.erreurs.length > 0 && (
                            <Text size="xs" c="red">
                              {client.erreurs[0]}
                            </Text>
                          )}
                          {client.valide && (
                            <Badge color="green">Valide</Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              <Group justify="apart" mt="md">
                <Button variant="light" onClick={() => setActiveStep(1)}>
                  Retour
                </Button>
                <Button
                  color="green"
                  onClick={handleImport}
                  disabled={clientsValidesCount === 0}
                  leftSection={<IconCheck size={18} />}
                >
                  Importer {clientsValidesCount} client(s)
                </Button>
              </Group>
            </Stack>
          )}

          {/* Étape 4: Import en cours et résultat */}
          {activeStep === 3 && (
            <Stack gap="md" py="xl">
              {progress > 0 && progress < 100 ? (
                <>
                  <Alert color="blue" title="Import en cours">
                    Transfert des données vers PostgreSQL...
                  </Alert>
                  <Progress value={progress} striped animated size="lg" />
                  <Text ta="center" size="sm">
                    {Math.round(progress)}% - {Math.round((progress * clientsValidesCount) / 100)} sur {clientsValidesCount} clients
                  </Text>
                </>
              ) : resultat ? (
                <>
                  <Alert
                    color={resultat.errors === 0 ? 'green' : 'orange'}
                    title={resultat.errors === 0 ? '✅ Import réussi !' : '⚠️ Import partiel'}
                  >
                    <Text size="lg" fw={500}>
                      {resultat.success} client(s) importé(s) avec succès
                    </Text>
                    {resultat.errors > 0 && (
                      <Text size="md" c="orange" mt="xs">
                        {resultat.errors} erreur(s) rencontrée(s)
                      </Text>
                    )}
                  </Alert>

                  {resultat.details.length > 0 && (
                    <ScrollArea h={300}>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Téléphone</Table.Th>
                            <Table.Th>Client</Table.Th>
                            <Table.Th>Statut</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {resultat.details.slice(0, 10).map((detail, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td>{detail.telephone}</Table.Td>
                              <Table.Td>{detail.nom}</Table.Td>
                              <Table.Td>
                                <Badge color={detail.statut === 'Erreur' ? 'red' : 'green'}>
                                  {detail.statut}
                                  {detail.mesures !== undefined && ` (${detail.mesures} mesures)`}
                                </Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                      {resultat.details.length > 10 && (
                        <Text size="sm" c="dimmed" ta="center" mt="md">
                          ... et {resultat.details.length - 10} autres
                        </Text>
                      )}
                    </ScrollArea>
                  )}

                  <Group justify="center" mt="md">
                    <Button onClick={resetImport} variant="light">
                      Nouvel import
                    </Button>
                  </Group>
                </>
              ) : null}
            </Stack>
          )}
        </Card>
      </Stack>
    </Container>
  );
};

export default ImportClientsExcel;