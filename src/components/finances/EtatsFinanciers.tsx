import { useEffect, useRef, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Table,
  LoadingOverlay,
  Box,
  ThemeIcon,
  SimpleGrid,
  Divider,
  Modal,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconWallet,
  IconPrinter,
  IconFileExcel,
  IconFile,
  IconFileWord,
  IconInfoCircle,
  IconCalendar,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

interface Ligne {
  date: string;
  motif: string;
  entree: number;
  sortie: number;
}

const EtatsFinanciers = () => {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [loading, setLoading] = useState(true);
  const [totaux, setTotaux] = useState({
    totalEntrees: 0,
    totalSorties: 0,
    solde: 0
  });
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const charger = async () => {
    setLoading(true);
    const db = await getDb();

    const ventes = await db.select<any[]>(`
      SELECT date_vente as date, designation as motif, total as entree, 0 as sortie
      FROM ventes
    `);

    const depenses = await db.select<any[]>(`
      SELECT date_depense as date, designation as motif, 0 as entree, montant as sortie
      FROM depenses
    `);

    const salaires = await db.select<any[]>(`
      SELECT date_paiement as date, 'Paiement salaire' as motif, 0 as entree, montant_net as sortie
      FROM salaires
    `);

    const data = [...ventes, ...depenses, ...salaires];

    const sorted = data.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let totalEntrees = 0;
    let totalSorties = 0;

    sorted.forEach(l => {
      totalEntrees += Number(l.entree || 0);
      totalSorties += Number(l.sortie || 0);
    });

    setLignes(sorted);
    setTotaux({
      totalEntrees,
      totalSorties,
      solde: totalEntrees - totalSorties
    });
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Etat financier"
  });

  const exportExcel = async () => {
    const path = await save({
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      defaultPath: 'etat_financier.xlsx'
    });
    if (!path) return;

    const ws = XLSX.utils.json_to_sheet(lignes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Etat");
    const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    await writeFile(path, buffer);
  };

  const exportPDF = async () => {
    const path = await save({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: 'etat_financier.pdf'
    });
    if (!path) return;

    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('État financier', 14, 15);
    doc.setFontSize(10);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 25);

    autoTable(doc, {
      head: [['Date', 'Motif', 'Entrée (FCFA)', 'Sortie (FCFA)']],
      body: lignes.map(l => [
        new Date(l.date).toLocaleDateString('fr-FR'),
        l.motif,
        l.entree.toLocaleString(),
        l.sortie.toLocaleString()
      ]),
      startY: 35,
      theme: 'striped',
      headStyles: {
        fillColor: [27, 54, 93],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });

    const pdfBytes = doc.output('arraybuffer');
    await writeFile(path, new Uint8Array(pdfBytes));
  };

  const exportWord = async () => {
    const path = await save({
      filters: [{ name: 'Word', extensions: ['doc'] }],
      defaultPath: 'etat_financier.doc'
    });
    if (!path) return;

    const rows = lignes.map(l => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(l.date).toLocaleDateString('fr-FR')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${l.motif}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${l.entree.toLocaleString()} FCFA</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${l.sortie.toLocaleString()} FCFA</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>État financier</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1b365d; border-bottom: 2px solid #1b365d; padding-bottom: 10px; }
          .info { margin: 20px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .totaux { margin-top: 20px; text-align: right; }
        </style>
      </head>
      <body>
        <h1>📊 État financier</h1>
        <div class="info">
          <p><strong>Date d'export :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Motif</th><th>Entrée (FCFA)</th><th>Sortie (FCFA)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totaux">
          <p><strong>Total entrées :</strong> ${totaux.totalEntrees.toLocaleString()} FCFA</p>
          <p><strong>Total sorties :</strong> ${totaux.totalSorties.toLocaleString()} FCFA</p>
          <p><strong>Solde :</strong> ${totaux.solde.toLocaleString()} FCFA</p>
        </div>
      </body>
      </html>
    `;

    const encoder = new TextEncoder();
    const data = encoder.encode(html);
    await writeFile(path, data);
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des données financières...</Text>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <IconWallet size={24} color="white" />
                <Title order={2} c="white">État financier</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Synthèse des entrées et sorties d'argent
              </Text>
            </Stack>
            <Group gap="md">
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
              >
                Instructions
              </Button>
              <ThemeIcon size={48} radius="md" color="white" variant="light">
                <IconWallet size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total entrées
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconArrowDown size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totaux.totalEntrees.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total sorties
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconArrowUp size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {totaux.totalSorties.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg={totaux.solde >= 0 ? 'blue.0' : 'red.0'}>
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Solde
              </Text>
              <ThemeIcon size={30} radius="md" color={totaux.solde >= 0 ? 'blue' : 'red'} variant="light">
                <IconWallet size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c={totaux.solde >= 0 ? 'blue' : 'red'}>
              {totaux.solde.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'EXPORT */}
        <Card withBorder radius="md" p="md">
          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              leftSection={<IconPrinter size={16} />}
              onClick={handlePrint}
            >
              Imprimer
            </Button>
            <Button
              variant="outline"
              color="green"
              leftSection={<IconFileExcel size={16} />}
              onClick={exportExcel}
            >
              Excel
            </Button>
            <Button
              variant="outline"
              color="red"
              leftSection={<IconFile size={16} />}
              onClick={exportPDF}
            >
              PDF
            </Button>
            <Button
              variant="outline"
              color="blue"
              leftSection={<IconFileWord size={16} />}
              onClick={exportWord}
            >
              Word
            </Button>
          </Group>
        </Card>

        {/* TABLEAU */}
        <div ref={printRef}>
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            {lignes.length === 0 ? (
              <Text ta="center" c="dimmed" py={60}>
                Aucune transaction trouvée
              </Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', width: 120 }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Motif</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 150 }}>Entrée (FCFA)</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', width: 150 }}>Sortie (FCFA)</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {lignes.map((l, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <IconCalendar size={12} />
                          <Text size="sm">{new Date(l.date).toLocaleDateString('fr-FR')}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{l.motif}</Table.Td>
                      <Table.Td ta="right" c="green" fw={500}>
                        {l.entree > 0 ? `${l.entree.toLocaleString()} FCFA` : '-'}
                      </Table.Td>
                      <Table.Td ta="right" c="red" fw={500}>
                        {l.sortie > 0 ? `${l.sortie.toLocaleString()} FCFA` : '-'}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </div>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions"
          size="md"
          centered
          styles={{
            header: {
              backgroundColor: '#1b365d',
              padding: '16px 20px',
            },
            title: {
              color: 'white',
              fontWeight: 600,
            },
            body: {
              padding: '20px',
            },
          }}
        >
          <Stack gap="md">
            <Text size="sm">1. Ce rapport montre l'ensemble des entrées et sorties d'argent</Text>
            <Text size="sm">2. Les entrées proviennent des ventes</Text>
            <Text size="sm">3. Les sorties incluent les dépenses et les salaires</Text>
            <Text size="sm">4. Utilisez les boutons d'export pour sauvegarder le rapport</Text>
            <Text size="sm">5. Le solde est calculé automatiquement (entrées - sorties)</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default EtatsFinanciers;