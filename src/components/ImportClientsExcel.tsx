import React, {
  useState,
  useEffect
} from 'react';

import {
  save
} from '@tauri-apps/plugin-dialog';

import {
  writeFile
} from '@tauri-apps/plugin-fs';

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
} from '@mantine/core';

import {
  IconDownload,
  IconUpload,
  IconUsers,
} from '@tabler/icons-react';

import * as XLSX from 'xlsx';

import {
  apiGet,
  apiPost,
  apiPut
} from '../services/api';

import {
  notifications
} from '@mantine/notifications';

import {
  journaliserAction
} from '../services/journal';



const ImportClientsExcel:
  React.FC = () => {

    const [
      activeStep,
      setActiveStep
    ] = useState(0);

    const [
      loading,
      setLoading
    ] = useState(false);

    const [
      excelData,
      setExcelData
    ] = useState<any[]>([]);

    const [

,

      setColonnesExcel

    ] = useState<string[]>([]);

    const [
      mapping,
      setMapping
    ] = useState<
      Record<string, string>
    >({});

    const [
      progress,
      setProgress
    ] = useState(0);

    const [

,

      setImportResult

    ] = useState<any>(null);

    const [
      typesMesuresExistants,
      setTypesMesuresExistants
    ] = useState<
      { id: number; nom: string }[]
    >([]);

    const [
      fileName,
      setFileName
    ] = useState('');

    const [

      defaultProfil

    ] = useState(
      'principal'
    );

    /**
     * Charger mesures
     */
    useEffect(() => {

      const loadMesures =
        async () => {

          try {

            const mesures =
              await apiGet(
                "/types-mesures"
              );

            setTypesMesuresExistants(
              mesures || []
            );

          } catch (error) {

            console.error(error);
          }
        };

      loadMesures();

    }, []);

    const normalize =
      (s: string) =>

        s
          .toLowerCase()
          .replace(/[^a-z]/g, '');

    /**
     * Upload fichier
     */
    const handleFileUpload =
      async (
        e:
          React.ChangeEvent<HTMLInputElement>
      ) => {

        const file =
          e.target.files?.[0];

        if (!file) return;

        setFileName(file.name);

        setLoading(true);

        try {

          const data =
            await file.arrayBuffer();

          const workbook =
            XLSX.read(data, {
              type: 'array'
            });

          const worksheet =
            workbook.Sheets[
            workbook.SheetNames[0]
            ];

          const rawRows: any[][] =
            XLSX.utils.sheet_to_json(
              worksheet,
              {
                header: 1,
                defval: '',
                blankrows: false
              }
            );

          if (
            rawRows.length < 2
          ) {

            notifications.show({

              title:
                'Erreur',

              message:
                'Fichier invalide',

              color:
                'red'
            });
            return;
          }

          const headers =
            rawRows[0].map(
              (cell: any) =>

                String(cell || '')
                  .trim()
            );

          const jsonData: any[] = [];

          for (
            let i = 1;
            i < rawRows.length;
            i++
          ) {

            const row =
              rawRows[i];

            const obj: any = {};

            let hasData =
              false;

            for (
              let j = 0;
              j < headers.length;
              j++
            ) {

              const header =
                headers[j];

              if (!header) continue;

              const value =
                row[j];

              if (
                value !== undefined &&
                value !== null &&
                value !== ''
              ) {

                hasData = true;

                obj[header] =
                  String(value)
                    .trim();
              }
            }

            if (hasData) {

              jsonData.push(obj);
            }
          }

          setExcelData(jsonData);

          const cols =
            Array.from(
              new Set(
                jsonData.flatMap(
                  row =>
                    Object.keys(row)
                )
              )
            );

          setColonnesExcel(cols);

          /**
           * Auto mapping
           */
          const autoMapping:
            Record<string, string> = {};

          cols.forEach(col => {

            const normalizedCol =
              normalize(col);

            if (
              normalizedCol.includes('tel')
            ) {

              autoMapping[col] =
                'telephone_id';
            }

            else if (
              normalizedCol.includes('nom')
            ) {

              autoMapping[col] =
                'nom_prenom';
            }

            else if (
              normalizedCol.includes('profil')
            ) {

              autoMapping[col] =
                'profil';
            }

            else if (
              normalizedCol.includes('adresse')
            ) {

              autoMapping[col] =
                'adresse';
            }

            else if (
              normalizedCol.includes('mail')
            ) {

              autoMapping[col] =
                'email';
            }

            else if (
              normalizedCol.includes('observ')
            ) {

              autoMapping[col] =
                'observations';
            }

            else {

              const mesureMatch =
                typesMesuresExistants.find(
                  m =>
                    normalize(m.nom)
                    === normalizedCol
                );

              if (mesureMatch) {

                autoMapping[col] =
                  `mesure_${mesureMatch.nom}`;
              }
            }
          });

          setMapping(autoMapping);

          setActiveStep(1);

        } catch (error) {

          console.error(error);

          notifications.show({

  title:
    'Erreur',

  message:
    'Erreur lecture fichier',

  color:
    'red'
});

        } finally {

          setLoading(false);
        }
      };

    /**
     * Template Excel
     */
    const downloadTemplate =
      async () => {

        try {

          const mesures =
            await apiGet(
              "/types-mesures"
            );

          const colonnesMesures =
            mesures.map(
              (m: any) => m.nom
            );

          const template: any = {
            telephone_id:
              '75118161',

            nom_prenom:
              'Jacques KORGO',

            profil:
              'principal',

            adresse:
              'Ouagadougou',

            email:
              'email@gmail.com',

            observations:
              'Client fidèle'
          };

          colonnesMesures.forEach(
            (nom: string) => {

              template[nom] = 90;
            }
          );

          const ws =
            XLSX.utils.json_to_sheet(
              [template]
            );

          const wb =
            XLSX.utils.book_new();

          XLSX.utils.book_append_sheet(
            wb,
            ws,
            'Clients'
          );

          const excelBuffer =
            XLSX.write(wb, {
              bookType: 'xlsx',
              type: 'array'
            });

          const filePath =
            await save({
              title:
                'Template Excel',

              filters: [
                {
                  name:
                    'Excel',

                  extensions:
                    ['xlsx']
                }
              ],

              defaultPath:
                'template_clients.xlsx'
            });

          if (filePath) {

            await writeFile(
              filePath,
              new Uint8Array(
                excelBuffer
              )
            );

            notifications.show({
              title:
                'Succès',

              message:
                'Template téléchargé',

              color:
                'green'
            });
          }

        } catch (error) {

          console.error(error);
        }
      };

    /**
     * Import
     */
    const handleImport =
      async () => {

        setLoading(true);

        setProgress(0);

        try {

          const clientsExistants =
            await apiGet(
              "/clients"
            );

          const mesuresExistantes =
            await apiGet(
              "/types-mesures"
            );

          let successCount = 0;

          let errorCount = 0;

          const messages:
            string[] = [];

          for (
            let i = 0;
            i < excelData.length;
            i++
          ) {

            try {

              const row =
                excelData[i];

              const clientData:
                any = {};

              const mesuresData:
                any[] = [];

              for (
                const [
                  excelCol,
                  champApp
                ]

                of Object.entries(
                  mapping
                )
              ) {

                if (!champApp)
                  continue;

                const valeur =
                  row[excelCol];

                if (
                  valeur === undefined
                  || valeur === null
                  || valeur === ''
                ) continue;

                if (
                  champApp.startsWith(
                    'mesure_'
                  )
                ) {

                  const mesureNom =
                    champApp.replace(
                      'mesure_',
                      ''
                    );

                  const mesure =
                    mesuresExistantes.find(
                      (m: any) =>
                        m.nom ===
                        mesureNom
                    );

                  if (mesure) {

                    mesuresData.push({
                      type_mesure_id:
                        mesure.id,

                      valeur:
                        Number(valeur)
                    });
                  }

                } else {

                  clientData[
                    champApp
                  ] = valeur;
                }
              }

              /**
               * Validation
               */
              if (
                !clientData.telephone_id
                || !clientData.nom_prenom
              ) {

                errorCount++;

                continue;
              }

              const existingClient =
                clientsExistants.find(
                  (c: any) =>

                    c.telephone_id
                    ===
                    clientData.telephone_id

                    &&

                    c.nom_prenom
                    ===
                    clientData.nom_prenom
                );

              let clientId:
                number;

              /**
               * UPDATE
               */
              if (existingClient) {

                clientId =
                  existingClient.id;

                await apiPut(
                  `/clients/${clientId}`,
                  {
                    ...existingClient,

                    profil:
                      clientData.profil
                      || defaultProfil,

                    adresse:
                      clientData.adresse
                      || '',

                    email:
                      clientData.email
                      || '',

                    observations:
                      clientData.observations
                      || ''
                  }
                );

              }

              /**
               * CREATE
               */
              else {

                const newClient =
                  await apiPost(
                    "/clients",
                    {
                      telephone_id:
                        clientData.telephone_id,

                      nom_prenom:
                        clientData.nom_prenom,

                      profil:
                        clientData.profil
                        || defaultProfil,

                      adresse:
                        clientData.adresse
                        || '',

                      email:
                        clientData.email
                        || '',

                      observations:
                        clientData.observations
                        || ''
                    }
                  );

                clientId =
                  newClient.id;
              }

              /**
               * Mesures
               */
              for (
                const mesure
                of mesuresData
              ) {

                await apiPost(
                  "/mesures-clients",
                  {
                    client_id:
                      clientId,

                    type_mesure_id:
                      mesure.type_mesure_id,

                    valeur:
                      mesure.valeur
                  }
                );
              }

              successCount++;

              messages.push(
                `✅ ${clientData.nom_prenom}`
              );

              setProgress(
                (
                  (i + 1)
                  / excelData.length
                ) * 100
              );

            } catch (err: any) {

              console.error(err);

              errorCount++;
            }
          }

          setImportResult({

            success:
              successCount,

            errors:
              errorCount,

            messages
          });

          setActiveStep(3);

          notifications.show({
            title:
              'Import terminé',

            message:
              `${successCount} succès, ${errorCount} erreurs`,

            color:
              errorCount > 0
                ? 'orange'
                : 'green'
          });

          await journaliserAction({

            utilisateur:
              'Utilisateur',

            action:
              'IMPORT',

            table:
              'clients',

            idEnregistrement:
              fileName,

            details:
              `${successCount} clients importés`
          });

        } catch (error) {

          console.error(error);

        } finally {

          setLoading(false);
        }
      };

    return (
      <Container
        size="full"
        p="md"
      >

        <Stack gap="lg">

          <Card
            withBorder
            radius="lg"
            p="xl"
          >

            <Group>

              <Avatar
                size={60}
                radius="md"
              >

                <IconUsers
                  size={30}
                />

              </Avatar>

              <Box>

                <Title order={2}>
                  Import Clients Excel
                </Title>

                <Text c="dimmed">
                  Importation via PostgreSQL
                </Text>

              </Box>

            </Group>

          </Card>

          <Card
            withBorder
            radius="lg"
            p="xl"
          >

            <LoadingOverlay
              visible={loading}
            />

            <Stepper
              active={activeStep}
              mb="xl"
            >

              <Stepper.Step
                label="Fichier"
              />

              <Stepper.Step
                label="Mapping"
              />

              <Stepper.Step
                label="Aperçu"
              />

              <Stepper.Step
                label="Résultat"
              />

            </Stepper>
            {
              activeStep === 1 && (
                <Button
                  onClick={() =>
                    setActiveStep(2)
                  }
                >
                  Continuer
                </Button>
              )
            }

            {
              activeStep === 2 && (
                <Button
                  onClick={handleImport}
                >
                  Importer
                </Button>
              )
            }

            {
              activeStep === 0 && (

                <Stack
                  align="center"
                  py="xl"
                >

                  <Button
                    component="label"
                    leftSection={
                      <IconUpload
                        size={18}
                      />
                    }
                  >

                    Sélectionner Excel

                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={
                        handleFileUpload
                      }
                      hidden
                    />

                  </Button>

                  <Button
                    variant="subtle"
                    onClick={
                      downloadTemplate
                    }
                    leftSection={
                      <IconDownload
                        size={16}
                      />
                    }
                  >
                    Télécharger template
                  </Button>

                </Stack>
              )
            }

            {
              progress > 0 &&
              progress < 100 && (

                <Progress
                  value={progress}
                  striped
                  animated
                />
              )
            }

          </Card>

        </Stack>

      </Container>
    );
  };

export default
  ImportClientsExcel;