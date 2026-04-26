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
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
  Progress,
  RingProgress,
} from '@mantine/core';
import {
  IconBook,
  IconFileExcel,
  IconFileWord,
  IconFile,
  IconPrinter,
  IconMoneybag,
  IconRefresh,
  IconInfoCircle,
  IconCalendar,
  IconFilter,
  IconCheck,
  IconTrendingUp,
  IconTrendingDown,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage('Filtres réinitialisés');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const totalEntrees = filtered.reduce((sum, t) => sum + t.entree, 0);
  const totalSorties = filtered.reduce((sum, t) => sum + t.sortie, 0);
  const soldeFinal = filtered.length > 0 ? filtered[filtered.length - 1].solde : 0;
  const tauxEpargne = totalEntrees > 0 ? (soldeFinal / totalEntrees) * 100 : 0;

  const nombreEnLettres = (n: number): string => {
    if (n === 0) return "zéro";
    return n.toLocaleString() + " francs CFA";
  };

  const exportExcel = async () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map(t => ({
        Date: new Date(t.date).toLocaleDateString('fr-FR'),
        Description: t.description,
        'Entrée (FCFA)': t.entree,
        'Sortie (FCFA)': t.sortie,
        'Solde (FCFA)': t.solde
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Journal");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const filePath = await save({ 
      filters: [{ name: 'Excel', extensions: ['xlsx'] }], 
      defaultPath: `journal-caisse-${new Date().toISOString().slice(0, 10)}.xlsx` 
    });
    if (filePath) {
      await writeFile(filePath, new Uint8Array(excelBuffer));
      setSuccessMessage('Export Excel réussi');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const exportWord = async () => {
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
        body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; }
        h1 { color: #1b365d; border-bottom: 3px solid #1b365d; padding-bottom: 10px; }
        .info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1b365d; color: white; padding: 12px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        .summary { margin-top: 20px; padding: 15px; background: #e8f4fd; border-radius: 8px; }
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
        <thead><tr><th>Date</th><th>Description</th><th>Entrée (FCFA)</th><th>Sortie (FCFA)</th><th>Solde (FCFA)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <p><strong>Total entrées :</strong> ${totalEntrees.toLocaleString()} FCFA</p>
        <p><strong>Total sorties :</strong> ${totalSorties.toLocaleString()} FCFA</p>
        <p><strong>Solde final :</strong> ${soldeFinal.toLocaleString()} FCFA</p>
        <p>Arrêté le présent compte à la somme de <strong>${soldeFinal.toLocaleString()} FCFA</strong><br/>(${nombreEnLettres(soldeFinal)})</p>
      </div>
      <div class="footer">
        <p>Document généré automatiquement par Gestion Couture</p>
        <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
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
      setSuccessMessage('Export Word réussi');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById("journal-print");
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `journal-caisse-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 } as const,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };
    const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
    const filePath = await save({ 
      filters: [{ name: 'PDF', extensions: ['pdf'] }], 
      defaultPath: `journal-caisse-${new Date().toISOString().slice(0, 10)}.pdf` 
    });
    if (filePath) {
      const buffer = await pdfBlob.arrayBuffer();
      await writeFile(filePath, new Uint8Array(buffer));
      setSuccessMessage('Export PDF réussi');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconBook size={40} stroke={1.5} />
            <Text>Chargement des transactions...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Notification de succès */}
          {showSuccess && (
            <Notification
              icon={<IconCheck size={18} />}
              color="green"
              title="Succès !"
              onClose={() => setShowSuccess(false)}
              radius="md"
            >
              {successMessage}
            </Notification>
          )}

          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconBook size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Journal de Caisse</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Suivi des entrées et sorties d'argent
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {filtered.length} transaction{filtered.length > 1 ? 's' : ''}
                    </Badge>
                  </Group>
                </Box>
              </Group>
              <Button
                variant="light"
                color="white"
                leftSection={<IconInfoCircle size={18} />}
                onClick={() => setInfoModalOpen(true)}
                radius="md"
              >
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Statistiques KPI modernisées */}
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total entrées</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconTrendingUp size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalEntrees.toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Recettes totales</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff5f5' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total sorties</Text>
                <ThemeIcon size="lg" radius="md" color="red" variant="light">
                  <IconTrendingDown size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="red">{totalSorties.toLocaleString()} FCFA</Text>
              <Progress value={(totalSorties / (totalEntrees || 1)) * 100} size="sm" radius="xl" color="red" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Dépenses totales</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Solde final</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconMoneybag size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{soldeFinal.toLocaleString()} FCFA</Text>
              <RingProgress
                size={50}
                thickness={4}
                sections={[{ value: Math.min((soldeFinal / (totalEntrees || 1)) * 100, 100), color: 'blue' }]}
                label={<Text size="xs" ta="center">{Math.round(tauxEpargne)}%</Text>}
              />
              <Text size="xs" c="dimmed" mt={4}>Taux d'épargne</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Transactions</Text>
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconBook size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="violet">{filtered.length}</Text>
              <Progress value={100} size="sm" radius="xl" color="violet" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Mouvements enregistrés</Text>
            </Paper>
          </SimpleGrid>

          {/* Filtres améliorés */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group mb="md">
              <ThemeIcon size="md" radius="md" color="blue" variant="light">
                <IconFilter size={16} />
              </ThemeIcon>
              <Title order={4} size="h5">Filtres de période</Title>
            </Group>
            <Divider mb="md" />
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  type="date"
                  label="Date de début"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  size="md"
                  radius="md"
                  style={{ width: 160 }}
                  leftSection={<IconCalendar size={14} />}
                />
                <TextInput
                  type="date"
                  label="Date de fin"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  size="md"
                  radius="md"
                  style={{ width: 160 }}
                  leftSection={<IconCalendar size={14} />}
                />
                <TextInput
                  type="month"
                  label="Mois"
                  value={mois}
                  onChange={(e) => setMois(e.target.value)}
                  size="md"
                  radius="md"
                  style={{ width: 160 }}
                />
                <TextInput
                  type="number"
                  label="Année"
                  placeholder="AAAA"
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  size="md"
                  radius="md"
                  style={{ width: 120 }}
                />
              </Group>
              <Tooltip label="Réinitialiser les filtres">
                <ActionIcon variant="light" onClick={resetFilters} size="lg" radius="md">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>

          {/* Barre d'export améliorée */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="flex-end" gap="sm">
              <Tooltip label="Exporter en Excel">
                <ActionIcon variant="light" color="green" onClick={exportExcel} size="lg" radius="md">
                  <IconFileExcel size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Exporter en Word">
                <ActionIcon variant="light" color="blue" onClick={exportWord} size="lg" radius="md">
                  <IconFileWord size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Exporter en PDF">
                <ActionIcon variant="light" color="red" onClick={exportPDF} size="lg" radius="md">
                  <IconFile size={20} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Imprimer">
                <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg" radius="md">
                  <IconPrinter size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>

          {/* Tableau des transactions amélioré */}
          <div id="journal-print" ref={printRef}>
            <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <Stack align="center" py={60} gap="sm">
                  <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                    <IconBook size={30} />
                  </ThemeIcon>
                  <Text c="dimmed" size="lg">Aucun mouvement enregistré pour cette période</Text>
                </Stack>
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
                          <Table.Td>
                            <Group gap={4}>
                              <IconCalendar size={12} color="#1b365d" />
                              {new Date(l.date).toLocaleDateString('fr-FR')}
                            </Group>
                          </Table.Td>
                          <Table.Td>{l.description}</Table.Td>
                          <Table.Td ta="right">
                            {l.entree > 0 ? (
                              <Badge color="green" variant="light" size="sm">
                                +{l.entree.toLocaleString()} FCFA
                              </Badge>
                            ) : '-'}
                          </Table.Td>
                          <Table.Td ta="right">
                            {l.sortie > 0 ? (
                              <Badge color="red" variant="light" size="sm">
                                -{l.sortie.toLocaleString()} FCFA
                              </Badge>
                            ) : '-'}
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

                  {/* Totaux et synthèse */}
                  <Box p="md" style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                      <Paper p="sm" radius="md" withBorder bg="white">
                        <Text size="xs" c="dimmed" ta="center">Total entrées</Text>
                        <Text fw={700} size="lg" ta="center" c="green">{totalEntrees.toLocaleString()} FCFA</Text>
                      </Paper>
                      <Paper p="sm" radius="md" withBorder bg="white">
                        <Text size="xs" c="dimmed" ta="center">Total sorties</Text>
                        <Text fw={700} size="lg" ta="center" c="red">{totalSorties.toLocaleString()} FCFA</Text>
                      </Paper>
                      <Paper p="sm" radius="md" withBorder bg="white">
                        <Text size="xs" c="dimmed" ta="center">Solde final</Text>
                        <Text fw={700} size="lg" ta="center" c="blue">{soldeFinal.toLocaleString()} FCFA</Text>
                      </Paper>
                    </SimpleGrid>
                    <Divider my="md" />
                    <Text ta="center" size="sm" fs="italic" c="dimmed">
                      Arrêté le présent compte à la somme de <strong>{soldeFinal.toLocaleString()} FCFA</strong>
                      <br />
                      (<em>{nombreEnLettres(soldeFinal)}</em>)
                    </Text>
                  </Box>
                </>
              )}
            </Card>
          </div>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Journal de caisse - Instructions"
            size="md"
            centered
            radius="lg"
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
                padding: '24px',
              },
            }}
          >
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder bg="blue.0">
                <Text fw={600} size="sm" mb="md">📌 Fonctionnalités :</Text>
                <Stack gap="xs">
                  <Text size="sm">1️⃣ Utilisez les filtres pour affiner la période (dates, mois, année)</Text>
                  <Text size="sm">2️⃣ Cliquez sur "Réinitialiser" pour effacer tous les filtres</Text>
                  <Text size="sm">3️⃣ Exportez le journal en Excel, PDF ou Word selon vos besoins</Text>
                  <Text size="sm">4️⃣ Utilisez l'impression pour obtenir une version papier</Text>
                  <Text size="sm">5️⃣ Le solde final est recalculé après chaque filtre</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Informations :</Text>
                <Stack gap="xs">
                  <Text size="sm">• Les entrées incluent les paiements des clients</Text>
                  <Text size="sm">• Les sorties incluent les salaires et dépenses</Text>
                  <Text size="sm">• Le solde est calculé automatiquement en temps réel</Text>
                </Stack>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 1.0.0 - Gestion Couture
              </Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>

      {/* Styles d'impression */}
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