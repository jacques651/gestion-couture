import React, { useState } from 'react';
import { Group, Button, Card, Title, Text, Stack, Alert, LoadingOverlay, Switch, Divider, Badge } from '@mantine/core';
import { IconDownload, IconUpload, IconCheck, IconAlertCircle, IconInfoCircle, IconRuler } from '@tabler/icons-react';
import { getDb } from '../database/db';
import * as XLSX from 'xlsx';
import { journaliserAction } from '../services/journal';


interface ExportImportConfigurationProps {
  onComplete?: () => void;
}

const ExportImportConfiguration: React.FC<ExportImportConfigurationProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importMode, setImportMode] = useState<'insert' | 'update'>('insert');

  const exportConfigMesures = async () => {
    setLoading(true);
    setExportResult(null);
    try {
      const db = await getDb();
      const mesures = await db.select<{
        id: number;
        nom: string;
        unite: string;
        categorie: string;
        ordre_affichage: number;
        est_active: number;
      }[]>(
        "SELECT id, nom, unite, categorie, ordre_affichage, est_active FROM types_mesures ORDER BY categorie, ordre_affichage"
      );

      const data = mesures.map(m => ({
        'ID': m.id,
        'Nom': m.nom,
        'Unité': m.unite || 'cm',
        'Catégorie': m.categorie || 'Général',
        'Ordre': m.ordre_affichage || 0,
        'Active': m.est_active === 1 ? 'Oui' : 'Non'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 8 },   // ID
        { wch: 30 },  // Nom
        { wch: 10 },  // Unité
        { wch: 15 },  // Catégorie
        { wch: 10 },  // Ordre
        { wch: 8 }    // Active
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Types de mesures');

      // Feuille d'instructions
      const instructions = [
        { 'Instruction': '📏 IMPORT DES TYPES DE MESURES' },
        { 'Instruction': '' },
        { 'Instruction': 'Colonnes :' },
        { 'Instruction': '  - ID : (optionnel) Pour la mise à jour, laisser vide pour création' },
        { 'Instruction': '  - Nom : (obligatoire) Nom de la mesure (ex: Longueur, Largeur, Tour de poitrine)' },
        { 'Instruction': '  - Unité : (optionnel) cm, mm, pouce, m (défaut: cm)' },
        { 'Instruction': '  - Catégorie : (optionnel) Pour regrouper les mesures (ex: Principal, Enfant)' },
        { 'Instruction': '  - Ordre : (optionnel) Pour l\'affichage trié' },
        { 'Instruction': '  - Active : (optionnel) Oui/Non, 1/0 (défaut: Oui)' },
        { 'Instruction': '' },
        { 'Instruction': `📅 Exporté le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}` },
      ];
      const wsInstructions = XLSX.utils.json_to_sheet(instructions);
      wsInstructions['!cols'] = [{ wch: 70 }];
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      XLSX.writeFile(wb, `configuration_mesures_${new Date().toISOString().split('T')[0]}.xlsx`);

      // Journalisation export configuration
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'EXPORT',
        table: 'types_mesures',
        idEnregistrement: 'CONFIG_EXPORT',
        details:
          `Export configuration mesures : ` +
          `${mesures.length} types exportés`
      });
      setExportResult({ success: true, message: `${mesures.length} types de mesures exportés` });
    } catch (error) {
      console.error('Export error:', error);
      setExportResult({ success: false, message: "Erreur lors de l'export" });
    } finally {
      setLoading(false);
      setTimeout(() => setExportResult(null), 3000);
    }
  };

  const importConfigMesures = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportResult(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet) as Record<string, any>[];

      if (!rows || rows.length === 0) throw new Error("Fichier vide");

      const db = await getDb();
      let created = 0;
      let updated = 0;
      let errors = 0;
      const errorMessages: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];

          // Extraire les valeurs avec différents cas possibles
          let id = row['ID'] || row.Id || row.id;
          const nom = row['Nom'] || row.Nom || row.nom || '';
          const unite = row['Unité'] || row.Unité || row.unite || row.Unite || 'cm';
          const categorie = row['Catégorie'] || row.Catégorie || row.categorie || 'Général';
          const ordre = Number(row['Ordre'] || row.Ordre || row.ordre || 0);
          let active = row['Active'] || row.Active || row.active || row.est_active;

          // Convertir active en boolean
          let est_active = 1;
          if (active !== undefined && active !== null && active !== '') {
            if (typeof active === 'boolean') {
              est_active = active ? 1 : 0;
            } else if (typeof active === 'number') {
              est_active = active !== 0 ? 1 : 0;
            } else {
              const activeStr = String(active).toLowerCase().trim();
              est_active = (activeStr === 'oui' || activeStr === 'yes' || activeStr === 'true' || activeStr === '1') ? 1 : 0;
            }
          }

          if (!nom || !nom.toString().trim()) {
            errors++;
            errorMessages.push(`Ligne ${i + 2}: Nom manquant - ignoré`);
            continue;
          }

          const nomTrim = nom.toString().trim();

          // Vérifier si le type de mesure existe déjà
          let existingId: number | null = null;

          if (id && !isNaN(Number(id))) {
            // Si un ID est fourni, vérifier s'il existe
            const existing = await db.select<{ id: number }[]>(
              "SELECT id FROM types_mesures WHERE id = ?",
              [Number(id)]
            );
            if (existing && existing.length > 0) {
              existingId = existing[0].id;
            }
          }

          // Si pas d'ID ou ID invalide, chercher par nom
          if (!existingId) {
            const existing = await db.select<{ id: number }[]>(
              "SELECT id FROM types_mesures WHERE nom = ?",
              [nomTrim]
            );
            if (existing && existing.length > 0) {
              existingId = existing[0].id;
            }
          }

          if (existingId && importMode === 'update') {
            // Mettre à jour existant
            await db.execute(
              `UPDATE types_mesures 
               SET nom = ?, unite = ?, categorie = ?, ordre_affichage = ?, est_active = ?
               WHERE id = ?`,
              [nomTrim, unite, categorie, ordre, est_active, existingId]
            );
            updated++;
          } else if (!existingId) {
            // Insérer nouveau
            await db.execute(
              `INSERT INTO types_mesures (nom, unite, categorie, ordre_affichage, est_active)
               VALUES (?, ?, ?, ?, ?)`,
              [nomTrim, unite, categorie, ordre, est_active]
            );
            created++;
          } else if (existingId && importMode === 'insert') {
            // Mode insertion seulement, on ignore les existants
            // Optionnel: on pourrait les ignorer silencieusement
          }
        } catch (rowError) {
          errors++;
          errorMessages.push(`Ligne ${i + 2}: ${rowError instanceof Error ? rowError.message : 'Erreur'}`);
        }
      }

      const message = `${created} créé(s), ${updated} mis à jour, ${errors} erreur(s)`;

      // Journalisation import configuration
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'IMPORT',
        table: 'types_mesures',
        idEnregistrement: file.name,
        details:
          `Import configuration mesures : ` +
          `${created} créés, ` +
          `${updated} mis à jour, ` +
          `${errors} erreurs`
      });
      setImportResult({ success: errors === 0, message });

      if (errorMessages.length > 0 && errors > 0) {
        console.error('Erreurs d\'import:', errorMessages);
      }

      if (onComplete && (created > 0 || updated > 0)) {
        setTimeout(() => onComplete(), 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ success: false, message: "Erreur lors de l'import: " + (error instanceof Error ? error.message : 'Fichier invalide') });
    } finally {
      setLoading(false);
      setTimeout(() => setImportResult(null), 5000);
      e.target.value = '';
    }
  };

  return (
    <Card withBorder radius="lg" p="xl" shadow="sm">
      <LoadingOverlay visible={loading} />
      <Stack gap="md">
        <Group>
          <IconRuler size={24} color="#1b365d" />
          <Title order={3} size="h4">📦 Export / Import configuration des mesures</Title>
        </Group>

        <Text size="sm" c="dimmed">
          Exportez ou importez la configuration des types de mesures en format Excel (.xlsx).
        </Text>

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text fw={600} size="sm">Structure de la table types_mesures</Text>
          <Text size="xs">
            <strong>id</strong> : Clé primaire auto-incrémentée<br />
            <strong>nom</strong> : Nom de la mesure (ex: Longueur, Largeur, Tour de poitrine)<br />
            <strong>unite</strong> : cm, mm, pouce, m (défaut: cm)<br />
            <strong>categorie</strong> : Pour regrouper les mesures (ex: Principal, Enfant)<br />
            <strong>ordre_affichage</strong> : Ordre d'affichage dans les listes<br />
            <strong>est_active</strong> : 0=inactif, 1=actif
          </Text>
        </Alert>

        <Divider />

        <Group>
          <Text size="sm" fw={500}>Mode d'import :</Text>
          <Switch
            label="Insertion uniquement (ignore les existants)"
            checked={importMode === 'insert'}
            onChange={(e) => setImportMode(e.currentTarget.checked ? 'insert' : 'update')}
            size="sm"
          />
          {importMode === 'update' && (
            <Badge color="blue" variant="light">Mise à jour autorisée</Badge>
          )}
        </Group>

        <Group grow>
          <Button
            onClick={exportConfigMesures}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            leftSection={<IconDownload size={18} />}
            disabled={loading}
          >
            Exporter (Excel)
          </Button>
          <Button
            component="label"
            variant="gradient"
            gradient={{ from: 'green', to: 'teal' }}
            leftSection={<IconUpload size={18} />}
            disabled={loading}
          >
            Importer (Excel)
            <input type="file" accept=".xlsx,.xls" onChange={importConfigMesures} hidden />
          </Button>
        </Group>

        {exportResult && (
          <Alert icon={exportResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />} color={exportResult.success ? "green" : "red"} variant="light">
            {exportResult.message}
          </Alert>
        )}
        {importResult && (
          <Alert icon={importResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />} color={importResult.success ? "green" : "red"} variant="light">
            {importResult.message}
          </Alert>
        )}

        <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
          <Text fw={600} size="sm">💡 Utilisation</Text>
          <Text size="xs">
            1. Exportez la configuration actuelle pour avoir le modèle<br />
            2. Modifiez/ajoutez les types de mesures dans le fichier Excel<br />
            3. Pour mettre à jour, gardez la colonne ID<br />
            4. Réimportez pour synchroniser<br />
            5. Les mesures désactivées ne seront plus proposées
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
};

export default ExportImportConfiguration;