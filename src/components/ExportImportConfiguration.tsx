import React, { useState } from 'react';

import {
  Group,
  Button,
  Card,
  Title,
  Text,
  Stack,
  Alert,
  LoadingOverlay,
  Switch,
  Divider,
  Badge
} from '@mantine/core';

import {
  IconDownload,
  IconUpload,
  IconCheck,
  IconAlertCircle,
  IconRuler
} from '@tabler/icons-react';

import * as XLSX from 'xlsx';

import {
  apiGet,
  apiPost,
  apiPut
} from '../services/api';

import {
  journaliserAction
} from '../services/journal';

interface ExportImportConfigurationProps {
  onComplete?: () => void;
}

const ExportImportConfiguration:
React.FC<
  ExportImportConfigurationProps
> = ({
  onComplete
}) => {

  const [loading, setLoading] =
    useState(false);

  const [
    exportResult,
    setExportResult
  ] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [
    importResult,
    setImportResult
  ] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [
    importMode,
    setImportMode
  ] = useState<
    'insert' | 'update'
  >('insert');

  /**
   * EXPORT
   */
  const exportConfigMesures =
  async () => {

    setLoading(true);

    setExportResult(null);

    try {

      const mesures =
        await apiGet(
          "/types-mesures"
        );

      const data =
        mesures.map((m: any) => ({
          'ID': m.id,
          'Nom': m.nom,
          'Unité':
            m.unite || 'cm',
          'Ordre':
            m.ordre_affichage || 0,
          'Active':
            m.est_active === 1
              ? 'Oui'
              : 'Non'
        }));

      const ws =
        XLSX.utils.json_to_sheet(
          data
        );

      ws['!cols'] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 10 },
        { wch: 10 },
        { wch: 8 }
      ];

      const wb =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        'Types de mesures'
      );

      /**
       * Instructions
       */
      const instructions = [
        {
          'Instruction':
            '📏 IMPORT DES TYPES DE MESURES'
        },

        { 'Instruction': '' },

        {
          'Instruction':
            'Colonnes :'
        },

        {
          'Instruction':
            '- ID : optionnel'
        },

        {
          'Instruction':
            '- Nom : obligatoire'
        },

        {
          'Instruction':
            '- Unité : cm, mm, m, pouce'
        },

        {
          'Instruction':
            '- Ordre : ordre affichage'
        },

        {
          'Instruction':
            '- Active : Oui/Non'
        },

        { 'Instruction': '' },

        {
          'Instruction':
            `📅 Exporté le : ${new Date().toLocaleDateString('fr-FR')}`
        }
      ];

      const wsInstructions =
        XLSX.utils.json_to_sheet(
          instructions
        );

      wsInstructions['!cols'] = [
        { wch: 70 }
      ];

      XLSX.utils.book_append_sheet(
        wb,
        wsInstructions,
        'Instructions'
      );

      XLSX.writeFile(
        wb,
        `configuration_mesures_${
          new Date()
            .toISOString()
            .split('T')[0]
        }.xlsx`
      );

      /**
       * Journal
       */
      await journaliserAction({
        utilisateur:
          'Utilisateur',

        action:
          'EXPORT',

        table:
          'types_mesures',

        idEnregistrement:
          'CONFIG_EXPORT',

        details:
          `${mesures.length} types exportés`
      });

      setExportResult({
        success: true,

        message:
          `${mesures.length} types exportés`
      });

    } catch (error) {

      console.error(error);

      setExportResult({
        success: false,

        message:
          "Erreur lors de l'export"
      });

    } finally {

      setLoading(false);

      setTimeout(
        () => setExportResult(null),
        3000
      );
    }
  };

  /**
   * IMPORT
   */
  const importConfigMesures =
  async (
    e:
    React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    setLoading(true);

    setImportResult(null);

    try {

      const data =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(data, {
          type: 'array'
        });

      const firstSheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          firstSheet
        ) as Record<string, any>[];

      if (
        !rows ||
        rows.length === 0
      ) {

        throw new Error(
          "Fichier vide"
        );
      }

      const existing =
        await apiGet(
          "/types-mesures"
        );

      let created = 0;

      let updated = 0;

      let errors = 0;

      for (
        let i = 0;
        i < rows.length;
        i++
      ) {

        try {

          const row =
            rows[i];

          let id =
            row['ID']
            || row.Id
            || row.id;

          const nom =
            row['Nom']
            || row.Nom
            || row.nom
            || '';

          const unite =
            row['Unité']
            || row.Unité
            || row.unite
            || row.Unite
            || 'cm';

          const ordre =
            Number(
              row['Ordre']
              || row.Ordre
              || row.ordre
              || 0
            );

          let active =
            row['Active']
            || row.Active
            || row.active
            || row.est_active;

          let est_active = 1;

          if (
            active !== undefined &&
            active !== null &&
            active !== ''
          ) {

            if (
              typeof active
              === 'boolean'
            ) {

              est_active =
                active ? 1 : 0;

            } else if (
              typeof active
              === 'number'
            ) {

              est_active =
                active !== 0
                  ? 1
                  : 0;

            } else {

              const activeStr =
                String(active)
                  .toLowerCase()
                  .trim();

              est_active =
                (
                  activeStr === 'oui'
                  || activeStr === 'yes'
                  || activeStr === 'true'
                  || activeStr === '1'
                )
                  ? 1
                  : 0;
            }
          }

          if (
            !nom ||
            !nom
              .toString()
              .trim()
          ) {

            errors++;

            continue;
          }

          const nomTrim =
            nom
              .toString()
              .trim();

          let existingId:
          number | null = null;

          /**
           * Recherche ID
           */
          if (
            id &&
            !isNaN(Number(id))
          ) {

            const existingById =
              existing.find(
                (m: any) =>
                  m.id ===
                  Number(id)
              );

            if (existingById) {

              existingId =
                existingById.id;
            }
          }

          /**
           * Recherche nom
           */
          if (!existingId) {

            const existingByNom =
              existing.find(
                (m: any) =>

                  m.nom
                    ?.toLowerCase()
                    ?.trim()

                  ===

                  nomTrim
                    .toLowerCase()
                    .trim()
              );

            if (existingByNom) {

              existingId =
                existingByNom.id;
            }
          }

          /**
           * UPDATE
           */
          if (
            existingId &&
            importMode === 'update'
          ) {

            await apiPut(
              `/types-mesures/${existingId}`,
              {
                nom:
                  nomTrim,

                unite,

                ordre_affichage:
                  ordre,

                est_active
              }
            );

            updated++;
          }

          /**
           * INSERT
           */
          else if (!existingId) {

            await apiPost(
              "/types-mesures",
              {
                nom:
                  nomTrim,

                unite,

                ordre_affichage:
                  ordre,

                est_active
              }
            );

            created++;
          }

        } catch (rowError) {

          console.error(
            rowError
          );

          errors++;
        }
      }

      /**
       * Journal
       */
      await journaliserAction({

        utilisateur:
          'Utilisateur',

        action:
          'IMPORT',

        table:
          'types_mesures',

        idEnregistrement:
          file.name,

        details:
          `${created} créés, `
          + `${updated} mis à jour, `
          + `${errors} erreurs`
      });

      setImportResult({
        success:
          errors === 0,

        message:
          `${created} créé(s), `
          + `${updated} mis à jour, `
          + `${errors} erreur(s)`
      });

      if (
        onComplete &&
        (
          created > 0 ||
          updated > 0
        )
      ) {

        setTimeout(
          () => onComplete(),
          2000
        );
      }

    } catch (error) {

      console.error(error);

      setImportResult({
        success: false,

        message:
          "Erreur lors de l'import"
      });

    } finally {

      setLoading(false);

      setTimeout(
        () => setImportResult(null),
        5000
      );

      e.target.value = '';
    }
  };

  return (

    <Card
      withBorder
      radius="lg"
      p="xl"
      shadow="sm"
    >

      <LoadingOverlay
        visible={loading}
      />

      <Stack gap="md">

        <Group>

          <IconRuler
            size={24}
            color="#1b365d"
          />

          <Title
            order={3}
            size="h4"
          >
            📦 Export / Import
            configuration mesures
          </Title>

        </Group>

        <Text
          size="sm"
          c="dimmed"
        >
          Exportez ou importez
          les types de mesures
          en Excel.
        </Text>

        <Divider />

        <Group>

          <Text
            size="sm"
            fw={500}
          >
            Mode d'import :
          </Text>

          <Switch
            label="Insertion uniquement"
            checked={
              importMode === 'insert'
            }
            onChange={(e) =>
              setImportMode(
                e.currentTarget.checked
                  ? 'insert'
                  : 'update'
              )
            }
            size="sm"
          />

          {
            importMode === 'update'
            && (
              <Badge
                color="blue"
                variant="light"
              >
                Mise à jour autorisée
              </Badge>
            )
          }

        </Group>

        <Group grow>

          <Button
            onClick={
              exportConfigMesures
            }
            variant="gradient"
            gradient={{
              from: 'blue',
              to: 'cyan'
            }}
            leftSection={
              <IconDownload
                size={18}
              />
            }
            disabled={loading}
          >
            Exporter Excel
          </Button>

          <Button
            component="label"
            variant="gradient"
            gradient={{
              from: 'green',
              to: 'teal'
            }}
            leftSection={
              <IconUpload
                size={18}
              />
            }
            disabled={loading}
          >

            Importer Excel

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={
                importConfigMesures
              }
              hidden
            />

          </Button>

        </Group>

        {
          exportResult && (

            <Alert
              icon={
                exportResult.success
                  ? <IconCheck size={16} />
                  : <IconAlertCircle size={16} />
              }

              color={
                exportResult.success
                  ? "green"
                  : "red"
              }

              variant="light"
            >
              {
                exportResult.message
              }
            </Alert>
          )
        }

        {
          importResult && (

            <Alert
              icon={
                importResult.success
                  ? <IconCheck size={16} />
                  : <IconAlertCircle size={16} />
              }

              color={
                importResult.success
                  ? "green"
                  : "red"
              }

              variant="light"
            >
              {
                importResult.message
              }
            </Alert>
          )
        }

      </Stack>

    </Card>
  );
};

export default
ExportImportConfiguration;