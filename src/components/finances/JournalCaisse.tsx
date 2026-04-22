import { useEffect, useState, useRef } from "react";
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Table,
  Badge,
  LoadingOverlay,
  Box,
  SimpleGrid,
  Divider,
  Modal,
  ThemeIcon,
  TextInput,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconBook,
  IconFileExcel,
  IconFileWord,
  IconFile,
  IconPrinter,
  IconMoneybag,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from "../../database/db";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

interface LigneJournal {
  date: string;
  description: string;
  entree: number;
  sortie: number;
  solde: number;
}

const JournalCaisse = () => {
  const [transactions, setTransactions] = useState<LigneJournal[]>([]);
  const [filtered, setFiltered] = useState<LigneJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [mois, setMois] = useState("");
  const [annee, setAnnee] = useState("");
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadJournal();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [dateDebut, dateFin, mois, annee, transactions]);

  const loadJournal = async () => {
    setLoading(true);
    const db = await getDb();

    const paiements = await db.select<any[]>(`
      SELECT 
        pc.date_paiement as date,
        'Paiement commande #' || pc.commande_id || ' - ' || c.nom_prenom as description,
        pc.montant as montant
      FROM paiements_commandes pc
      LEFT JOIN commandes cmd ON cmd.id = pc.commande_id
      LEFT JOIN clients c ON c.telephone_id = cmd.client_id
      ORDER BY pc.date_paiement
    `);

    const salaires = await db.select<any[]>(`
      SELECT 
        s.date_paiement as date,
        'Salaire versé à ' || e.nom_prenom as description,
        s.montant_net as montant
      FROM salaires s
      LEFT JOIN employes e ON e.id = s.employe_id
      ORDER BY s.date_paiement
    `);

    const depenses = await db.select<any[]>(`
      SELECT 
        date_depense as date,
        'Dépense : ' || designation as description,
        montant
      FROM depenses
      ORDER BY date_depense
    `);

    const allTransactions: { date: string; description: string; montant: number; type: 'entree' | 'sortie' }[] = [];

    paiements.forEach(p => allTransactions.push({ date: p.date, description: p.description, montant: p.montant, type: 'entree' }));
    salaires.forEach(s => allTransactions.push({ date: s.date, description: s.description, montant: s.montant, type: 'sortie' }));
    depenses.forEach(d => allTransactions.push({ date: d.date, description: d.description, montant: d.montant, type: 'sortie' }));

    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let solde = 0;
    const journal: LigneJournal[] = allTransactions.map(t => {
      const entree = t.type === 'entree' ? t.montant : 0;
      const sortie = t.type === 'sortie' ? t.montant : 0;
      solde = solde + entree - sortie;
      return {
        date: t.date,
        description: t.description,
        entree,
        sortie,
        solde
      };
    });

    setTransactions(journal);
    setLoading(false);
  };

  const applyFilters = () => {
    let filteredData = [...transactions];

    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter(t => {
        const d = new Date(t.date);
        return d >= debut && d <= fin;
      });
    }

    if (mois) {
      const [year, month] = mois.split('-');
      filteredData = filteredData.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() + 1 === parseInt(month);
      });
    }

    if (annee) {
      filteredData = filteredData.filter(t => new Date(t.date).getFullYear() === parseInt(annee));
    }

    setFiltered(filteredData);
  };

  const resetFilters = () => {
    setDateDebut("");
    setDateFin("");
    setMois("");
    setAnnee("");
  };

  const totalEntrees = filtered.reduce((sum, t) => sum + t.entree, 0);
  const totalSorties = filtered.reduce((sum, t) => sum + t.sortie, 0);
  const soldeFinal = filtered.length > 0 ? filtered[filtered.length - 1].solde : 0;

  // Conversion simple nombre en lettres
  const nombreEnLettres = (n: number): string => {
    if (n === 0) return "zéro";
    return n.toLocaleString() + " francs CFA";
  };

  // --- EXPORTS ---
  const exportExcel = async () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(t => ({
        Date: new Date(t.date).toLocaleDateString('fr-FR'),
        Description: t.description,
        Entrée: t.entree,
        Sortie: t.sortie,
        Solde: t.solde
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journal");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const filePath = await save({ filters: [{ name: 'Excel', extensions: ['xlsx'] }], defaultPath: `journal-caisse-${new Date().toISOString().slice(0, 10)}.xlsx` });
    if (filePath) await writeFile(filePath, new Uint8Array(excelBuffer));
  };

 const exportWord = async () => {
  // Générer du HTML simple pour Word
  const rows = filtered.map(t => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${new Date(t.date).toLocaleDateString('fr-FR')}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${t.description}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t.entree.toLocaleString()} FCFA</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t.sortie.toLocaleString()} FCFA</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t.solde.toLocaleString()} FCFA</td>
    </tr>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Journal de Caisse</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      h1 { color: #1b365d; border-bottom: 2px solid #1b365d; padding-bottom: 10px; }
      .info { margin: 20px 0; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; text-align: left; }
      td { padding: 8px; border: 1px solid #ddd; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
    </style>
  </head>
  <body>
    <h1>📋 Journal de Caisse</h1>
    <div class="info">
      <p><strong>Période :</strong> ${dateDebut || 'début'} au ${dateFin || 'fin'}</p>
      <p><strong>Mois :</strong> ${mois || 'tous'} | <strong>Année :</strong> ${annee || 'toutes'}</p>
      <p><strong>Date d'export :</strong> ${new Date().toLocaleString('fr-FR')}</p>
    </div>
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Description</th><th>Entrée (FCFA)</th><th>Sortie (FCFA)</th><th>Solde (FCFA)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <p><strong>Total entrées :</strong> ${totalEntrees.toLocaleString()} FCFA</p>
      <p><strong>Total sorties :</strong> ${totalSorties.toLocaleString()} FCFA</p>
      <p><strong>Solde final :</strong> ${soldeFinal.toLocaleString()} FCFA</p>
      <p>Arrêté le présent compte à la somme de <strong>${soldeFinal.toLocaleString()} FCFA</strong><br/>(${nombreEnLettres(soldeFinal)})</p>
    </div>
  </body>
  </html>`;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const filePath = await save({ 
    filters: [{ name: 'Word', extensions: ['doc'] }], 
    defaultPath: `journal-caisse-${new Date().toISOString().slice(0, 10)}.doc` 
  });
  if (filePath) {
    const buffer = await blob.arrayBuffer();
    await writeFile(filePath, new Uint8Array(buffer));
  }
};
  const exportPDF = async () => {
    const element = document.getElementById("journal-print");
    if (!element) return;
    const opt = {
      margin: 10,
      filename: "journal.pdf",
      image: { type: 'jpeg', quality: 0.98 } as const,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };
    const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
    const filePath = await save({ filters: [{ name: 'PDF', extensions: ['pdf'] }], defaultPath: `journal-caisse-${new Date().toISOString().slice(0, 10)}.pdf` });
    if (filePath) {
      const buffer = await pdfBlob.arrayBuffer();
      await writeFile(filePath, new Uint8Array(buffer));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des transactions...</Text>
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
                <IconBook size={24} color="white" />
                <Title order={2} c="white">Journal de Caisse</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Suivi des entrées et sorties d'argent
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
                <IconBook size={28} />
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
                <IconArrowUp size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalEntrees.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total sorties
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconArrowDown size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {totalSorties.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Solde final
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconMoneybag size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {soldeFinal.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* FILTRES */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group gap="sm">
              <TextInput
                type="date"
                label="Du"
                value={dateDebut}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateDebut(e.target.value)}
                size="sm"
                style={{ width: 140 }}
              />
              <TextInput
                type="date"
                label="Au"
                value={dateFin}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFin(e.target.value)}
                size="sm"
                style={{ width: 140 }}
              />
              <TextInput
                type="month"
                label="Mois"
                value={mois}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMois(e.target.value)}
                size="sm"
                style={{ width: 140 }}
              />
              <TextInput
                type="number"
                label="Année"
                placeholder="AAAA"
                value={annee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnnee(e.target.value)}
                size="sm"
                style={{ width: 100 }}
              />
            </Group>
            <Group>
              <Tooltip label="Réinitialiser">
                <ActionIcon variant="light" onClick={resetFilters} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        </Card>

        {/* BARRE D'EXPORT */}
        <Card withBorder radius="md" p="md">
          <Group justify="flex-end" gap="sm">
            <Tooltip label="Excel">
              <ActionIcon variant="light" color="green" onClick={exportExcel} size="lg">
                <IconFileExcel size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Word">
              <ActionIcon variant="light" color="blue" onClick={exportWord} size="lg">
                <IconFileWord size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="PDF">
              <ActionIcon variant="light" color="red" onClick={exportPDF} size="lg">
                <IconFile size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Imprimer">
              <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg">
                <IconPrinter size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Card>

        {/* ZONE À IMPRIMER/EXPORTER */}
        <div id="journal-print" ref={printRef}>
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <Text ta="center" c="dimmed" py={60}>
                Aucun mouvement enregistré pour cette période
              </Text>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Description</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Entrée</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Sortie</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', width: 120 }}>Solde</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtered.map((l, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{new Date(l.date).toLocaleDateString('fr-FR')}</Table.Td>
                        <Table.Td>{l.description}</Table.Td>
                        <Table.Td ta="right" c="green" fw={500}>
                          {l.entree > 0 ? `${l.entree.toLocaleString()} FCFA` : '-'}
                        </Table.Td>
                        <Table.Td ta="right" c="red" fw={500}>
                          {l.sortie > 0 ? `${l.sortie.toLocaleString()} FCFA` : '-'}
                        </Table.Td>
                        <Table.Td ta="right" fw={600}>
                          <Badge color="blue" variant="light" size="sm">
                            {l.solde.toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {/* TOTAUX */}
                <Box p="md" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Stack gap="xs" align="flex-end">
                    <Group justify="space-between" style={{ width: 300 }}>
                      <Text size="sm" fw={500}>Total entrées :</Text>
                      <Text size="sm" fw={700} c="green">{totalEntrees.toLocaleString()} FCFA</Text>
                    </Group>
                    <Group justify="space-between" style={{ width: 300 }}>
                      <Text size="sm" fw={500}>Total sorties :</Text>
                      <Text size="sm" fw={700} c="red">{totalSorties.toLocaleString()} FCFA</Text>
                    </Group>
                    <Divider style={{ width: 300 }} />
                    <Group justify="space-between" style={{ width: 300 }}>
                      <Text size="md" fw={700}>Solde final :</Text>
                      <Text size="md" fw={700} c="blue">{soldeFinal.toLocaleString()} FCFA</Text>
                    </Group>
                  </Stack>
                </Box>

                {/* Mention d'arrêté */}
                <Box p="md" ta="center" style={{ borderTop: '1px solid #e9ecef' }}>
                  <Text size="xs" c="dimmed">
                    Arrêté le présent compte à la somme de <strong>{soldeFinal.toLocaleString()} FCFA</strong>
                    <br />
                    (<em>{nombreEnLettres(soldeFinal)}</em>)
                  </Text>
                </Box>
              </>
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
            <Text size="sm">1. Utilisez les filtres pour affiner la période (dates, mois, année)</Text>
            <Text size="sm">2. Cliquez sur "Réinitialiser" pour effacer tous les filtres</Text>
            <Text size="sm">3. Exportez le journal en Excel, PDF ou Word selon vos besoins</Text>
            <Text size="sm">4. Utilisez l'impression pour obtenir une version papier</Text>
            <Text size="sm">5. Le solde final est recalculé après chaque filtre</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>
      </Stack>

      {/* STYLES D'IMPRESSION */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #journal-print, #journal-print * {
            visibility: visible;
          }
          #journal-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default JournalCaisse;