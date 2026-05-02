import React, { useState } from 'react';
import { Group, Button, Card, Title, Text, Stack, Alert, LoadingOverlay } from '@mantine/core';
import { IconDownload, IconUpload, IconCheck, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { getDb } from '../database/db';  // ← chemin corrigé
import * as XLSX from 'xlsx';

interface ExportImportConfigurationProps {
  onComplete?: () => void;
}

const ExportImportConfiguration: React.FC<ExportImportConfigurationProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const exportConfigMesures = async () => {
    setLoading(true);
    setExportResult(null);
    try {
      const db = await getDb();
      const mesures = await db.select<{ nom: string; unite: string; categorie: string; ordre_affichage: number }[]>(
        "SELECT nom, unite, categorie, ordre_affichage FROM types_mesures WHERE est_active = 1 ORDER BY ordre_affichage"
      );

      const data = mesures.map(m => ({
        'Nom': m.nom,
        'Unité': m.unite || 'cm',
        'Catégorie': m.categorie || 'general',
        'Ordre': m.ordre_affichage || 0
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 8 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Types de mesures');

      const instructions = [
        { 'Instruction': 'Catégories acceptées : haut, bas, general, accessoire' },
        { 'Instruction': 'Unités suggérées : cm, mm, pouce, m' },
        { 'Instruction': `Exporté le : ${new Date().toLocaleDateString('fr-FR')}` },
      ];
      const wsInstructions = XLSX.utils.json_to_sheet(instructions);
      wsInstructions['!cols'] = [{ wch: 60 }];
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      XLSX.writeFile(wb, `configuration_mesures_${new Date().toISOString().split('T')[0]}.xlsx`);
      setExportResult({ success: true, message: `${mesures.length} types de mesures exportés` });
    } catch (error) {
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
      let count = 0;
      const categoriesValides = ['haut', 'bas', 'general', 'accessoire'];

      for (const row of rows) {
        const nom = row['Nom'] || row.Nom || row['nom'] || '';
        const unite = row['Unité'] || row.Unité || row['unite'] || row['Unite'] || 'cm';
        const categorie = (row['Catégorie'] || row.Catégorie || row['categorie'] || row['Categorie'] || 'general').toLowerCase();
        const ordre = Number(row['Ordre'] || row.Ordre || row['ordre'] || row['Ordre'] || 0);

        if (nom && nom.toString().trim()) {
          const catFinale = categoriesValides.includes(categorie) ? categorie : 'general';
          await db.execute(`
            INSERT OR IGNORE INTO types_mesures (nom, unite, categorie, est_active, ordre_affichage)
            VALUES (?, ?, ?, 1, ?)
          `, [nom.toString().trim(), unite, catFinale, ordre || count]);
          count++;
        }
      }

      setImportResult({ success: true, message: `${count} types de mesures importés` });
      if (onComplete) setTimeout(() => onComplete(), 2000);
    } catch (error) {
      setImportResult({ success: false, message: "Erreur lors de l'import" });
    } finally {
      setLoading(false);
      setTimeout(() => setImportResult(null), 3000);
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
          Exportez ou importez la configuration des types de mesures en format Excel (.xlsx).
        </Text>

        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text fw={600} size="sm">Format du fichier Excel</Text>
          <Text size="xs">
            Colonnes : <strong>Nom, Unité, Catégorie, Ordre</strong>
          </Text>
        </Alert>

        <Group grow>
          <Button onClick={exportConfigMesures} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} leftSection={<IconDownload size={18} />} disabled={loading}>
            Exporter (Excel)
          </Button>
          <Button component="label" variant="gradient" gradient={{ from: 'green', to: 'teal' }} leftSection={<IconUpload size={18} />} disabled={loading}>
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
            1. Exportez la configuration actuelle<br />
            2. Modifiez le fichier si nécessaire<br />
            3. Réimportez pour mettre à jour<br />
            4. Transférez entre postes pour synchroniser
          </Text>
        </Alert>
      </Stack>
    </Card>
  );
};

export default ExportImportConfiguration;