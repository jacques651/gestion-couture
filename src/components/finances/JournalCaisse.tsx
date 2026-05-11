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
  IconCheck,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import {

  apiGet

} from "../../services/api";

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

  const loadJournal =
    async () => {

      setLoading(true);

      try {

        /**
         * =====================
         * VENTES
         * =====================
         */
        const ventes =
          (
            await apiGet(
              "/ventes"
            )
          ) || [];

        /**
         * =====================
         * DEPENSES
         * =====================
         */
        const depenses =
          (
            await apiGet(
              "/depenses"
            )
          ) || [];

        /**
         * =====================
         * SALAIRES
         * =====================
         */
        const salaires =
          (
            await apiGet(
              "/historique-salaires"
            )
          ) || [];

        const allTransactions: {

          date: string;

          description: string;

          montant: number;

          type:
          'entree'
          |
          'sortie'

        }[] = [];

        /**
         * =====================
         * ENCAISSEMENTS
         * =====================
         */
        ventes.forEach((v: any) => {

          const montant =
            Number(
              v.montant_regle || 0
            );

          if (montant > 0) {

            allTransactions.push({

              date:
                v.date_vente,

              description:

                `Vente ${v.code_vente || ''
                } - ${v.client_nom
                ||
                'Client comptoir'
                }`,

              montant,

              type:
                'entree'
            });
          }
        });

        /**
         * =====================
         * DEPENSES
         * =====================
         */
        depenses.forEach((d: any) => {

          allTransactions.push({

            date:
              d.date_depense,

            description:

              `Dépense : ${d.designation || ''
              }`,

            montant:
              Number(
                d.montant || 0
              ),

            type:
              'sortie'
          });
        });

        /**
         * =====================
         * SALAIRES
         * =====================
         */
        salaires.forEach((s: any) => {

          allTransactions.push({

            date:
              s.date,

            description:

              `Salaire : ${s.nom || ''
              }`,

            montant:
              Number(
                s.montant || 0
              ),

            type:
              'sortie'
          });
        });

        /**
         * =====================
         * TRI
         * =====================
         */
        allTransactions.sort(

          (
            a,
            b
          ) =>

            new Date(a.date)
              .getTime()

            -

            new Date(b.date)
              .getTime()
        );

        /**
         * =====================
         * SOLDE PROGRESSIF
         * =====================
         */
        let solde = 0;

        const journal:
          LigneJournal[] =

          allTransactions.map(t => {

            const entree =

              t.type === 'entree'

                ? t.montant

                : 0;

            const sortie =

              t.type === 'sortie'

                ? t.montant

                : 0;

            solde =
              solde
              +
              entree
              -
              sortie;

            return {

              date:
                t.date,

              description:
                t.description,

              entree,

              sortie,

              solde
            };
          });

        setTransactions(
          journal
        );

      } catch (err) {

        console.error(
          "Erreur chargement journal:",
          err
        );

      } finally {

        setLoading(false);
      }
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

  const nombreEnLettres = (n: number): string => {
    if (n === 0) return "zéro";
    return n.toLocaleString() + " francs CFA";
  };

  const exportExcel =
    async () => {

      const ws =
        XLSX.utils.json_to_sheet(

          filtered.map(t => ({

            Date:
              new Date(
                t.date
              ).toLocaleDateString(
                'fr-FR'
              ),

            Description:
              t.description,

            'Entrée (FCFA)':
              t.entree,

            'Sortie (FCFA)':
              t.sortie,

            'Solde (FCFA)':
              t.solde
          }))
        );

      const wb =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(

        wb,

        ws,

        "Journal"
      );

      const excelBuffer =
        XLSX.write(

          wb,

          {
            bookType: 'xlsx',
            type: 'array'
          }
        );

      const blob =

        new Blob(

          [excelBuffer],

          {
            type:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =

        `journal-caisse-${new Date()
          .toISOString()
          .slice(0, 10)
        }.xlsx`;

      document.body
        .appendChild(link);

      link.click();

      document.body
        .removeChild(link);

      URL.revokeObjectURL(
        url
      );

      setSuccessMessage(
        'Export Excel réussi'
      );

      setShowSuccess(true);

      setTimeout(
        () =>
          setShowSuccess(false),
        3000
      );
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
    <head><meta charset="UTF-8"><title>Journal de Caisse</title>
    <style>
      body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; }
      h1 { color: #1b365d; border-bottom: 3px solid #1b365d; padding-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background-color: #1b365d; color: white; padding: 12px; border: 1px solid #ddd; }
      td { padding: 8px; border: 1px solid #ddd; }
      tr:nth-child(even) { background-color: #f9f9f9; }
    </style></head>
    <body>
      <h1>📋 Journal de Caisse</h1>
      <table><thead><tr><th>Date</th><th>Description</th><th>Entrée</th><th>Sortie</th><th>Solde</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.download =

      `journal-caisse-${new Date()
        .toISOString()
        .slice(0, 10)
      }.doc`;

    document.body
      .appendChild(link);

    link.click();

    document.body
      .removeChild(link);

    URL.revokeObjectURL(
      url
    );

    setSuccessMessage(
      'Export Word réussi'
    );

    setShowSuccess(true);

    setTimeout(
      () =>
        setShowSuccess(false),
      3000
    );
  };

 const exportPDF =
async () => {

  const element =
    document.getElementById(
      "journal-print"
    );

  if (!element)
    return;

  const opt = {

    margin: 10,

    filename:

      `journal-caisse-${
        new Date()
          .toISOString()
          .slice(0, 10)
      }.pdf`,

    image: {

      type: 'jpeg',

      quality: 0.98

    } as const,

    html2canvas: {

      scale: 2
    },

    jsPDF: {

      unit: 'mm',

      format: 'a4',

      orientation:
        'landscape' as const
    }
  };

  /**
   * PDF Blob
   */
  const pdfBlob =
    await html2pdf()

      .from(element)

      .set(opt)

      .output('blob');

  /**
   * URL
   */
  const url =
    URL.createObjectURL(
      pdfBlob
    );

  /**
   * Download
   */
  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =

    `journal-caisse-${
      new Date()
        .toISOString()
        .slice(0, 10)
    }.pdf`;

  document.body
    .appendChild(link);

  link.click();

  document.body
    .removeChild(link);

  /**
   * Cleanup
   */
  URL.revokeObjectURL(
    url
  );

  /**
   * Notification
   */
  setSuccessMessage(
    'Export PDF réussi'
  );

  setShowSuccess(
    true
  );

  setTimeout(

    () =>
      setShowSuccess(false),

    3000
  );
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
            <Text>Chargement du journal...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {showSuccess && (
            <Notification icon={<IconCheck size={18} />} color="green" title="Succès !" onClose={() => setShowSuccess(false)} radius="md">
              {successMessage}
            </Notification>
          )}

          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconBook size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Journal de Caisse</Title>
                  <Text c="gray.3" size="sm">Suivi des entrées et sorties d'argent</Text>
                  <Badge size="sm" variant="white" mt={8}>{filtered.length} transaction{filtered.length > 1 ? 's' : ''}</Badge>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">Instructions</Button>
            </Group>
          </Card>

          {/* KPI */}
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Paper p="md" radius="lg" withBorder bg="#ebfbee">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total entrées</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light"><IconTrendingUp size={18} /></ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalEntrees.toLocaleString()} FCFA</Text>
            </Paper>
            <Paper p="md" radius="lg" withBorder bg="#fff5f5">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total sorties</Text>
                <ThemeIcon size="lg" radius="md" color="red" variant="light"><IconTrendingDown size={18} /></ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="red">{totalSorties.toLocaleString()} FCFA</Text>
            </Paper>
            <Paper p="md" radius="lg" withBorder bg="#e8f4fd">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Solde final</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light"><IconMoneybag size={18} /></ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{soldeFinal.toLocaleString()} FCFA</Text>
            </Paper>
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Transactions</Text>
                <ThemeIcon size="lg" radius="md" color="violet" variant="light"><IconBook size={18} /></ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="violet">{filtered.length}</Text>
            </Paper>
          </SimpleGrid>

          {/* Filtres */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Title order={4} mb="md">📅 Filtres de période</Title>
            <Group wrap="wrap" gap="sm">
              <TextInput type="date" label="Début" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} radius="md" style={{ width: 160 }} />
              <TextInput type="date" label="Fin" value={dateFin} onChange={(e) => setDateFin(e.target.value)} radius="md" style={{ width: 160 }} />
              <TextInput type="month" label="Mois" value={mois} onChange={(e) => setMois(e.target.value)} radius="md" style={{ width: 160 }} />
              <TextInput type="number" label="Année" placeholder="AAAA" value={annee} onChange={(e) => setAnnee(e.target.value)} radius="md" style={{ width: 120 }} />
              <Tooltip label="Réinitialiser"><ActionIcon variant="light" onClick={resetFilters} size="lg" radius="md"><IconRefresh size={18} /></ActionIcon></Tooltip>
            </Group>
          </Card>

          {/* Exports */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="flex-end">
              <Button leftSection={<IconFileExcel size={16} />} variant="light" color="green" onClick={exportExcel}>Excel</Button>
              <Button leftSection={<IconFileWord size={16} />} variant="light" color="blue" onClick={exportWord}>Word</Button>
              <Button leftSection={<IconFile size={16} />} variant="light" color="red" onClick={exportPDF}>PDF</Button>
              <Button leftSection={<IconPrinter size={16} />} variant="light" color="teal" onClick={handlePrint}>Imprimer</Button>
            </Group>
          </Card>

          {/* Tableau */}
          <div id="journal-print" ref={printRef}>
            <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <Center py={60}><Text c="dimmed">Aucun mouvement pour cette période</Text></Center>
              ) : (
                <>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th style={{ color: 'white', width: 110 }}>Date</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Description</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'right', width: 130 }}>Entrée</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'right', width: 130 }}>Sortie</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'right', width: 130 }}>Solde</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filtered.map((l, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>{new Date(l.date).toLocaleDateString('fr-FR')}</Table.Td>
                          <Table.Td>{l.description}</Table.Td>
                          <Table.Td ta="right">{l.entree > 0 ? <Badge color="green" variant="light">+{l.entree.toLocaleString()} FCFA</Badge> : '-'}</Table.Td>
                          <Table.Td ta="right">{l.sortie > 0 ? <Badge color="red" variant="light">-{l.sortie.toLocaleString()} FCFA</Badge> : '-'}</Table.Td>
                          <Table.Td ta="right"><Badge color="blue" variant="light">{l.solde.toLocaleString()} FCFA</Badge></Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <Box p="md" bg="#f8f9fa" style={{ borderTop: '1px solid #e9ecef' }}>
                    <SimpleGrid cols={3} spacing="md">
                      <Paper p="sm" radius="md" withBorder bg="white" ta="center">
                        <Text size="xs" c="dimmed">Total entrées</Text>
                        <Text fw={700} c="green">{totalEntrees.toLocaleString()} FCFA</Text>
                      </Paper>
                      <Paper p="sm" radius="md" withBorder bg="white" ta="center">
                        <Text size="xs" c="dimmed">Total sorties</Text>
                        <Text fw={700} c="red">{totalSorties.toLocaleString()} FCFA</Text>
                      </Paper>
                      <Paper p="sm" radius="md" withBorder bg="white" ta="center">
                        <Text size="xs" c="dimmed">Solde final</Text>
                        <Text fw={700} c="blue">{soldeFinal.toLocaleString()} FCFA</Text>
                      </Paper>
                    </SimpleGrid>
                    <Divider my="md" />
                    <Text ta="center" size="sm" c="dimmed">
                      Arrêté à la somme de <strong>{soldeFinal.toLocaleString()} FCFA</strong> ({nombreEnLettres(soldeFinal)})
                    </Text>
                  </Box>
                </>
              )}
            </Card>
          </div>

          {/* Modal Instructions */}
          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">1️⃣ Les entrées = paiements des ventes</Text>
              <Text size="sm">2️⃣ Les sorties = dépenses + salaires</Text>
              <Text size="sm">3️⃣ Filtrez par période (dates, mois, année)</Text>
              <Text size="sm">4️⃣ Exportez en Excel, PDF ou Word</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #journal-print, #journal-print * { visibility: visible; }
          #journal-print { position: absolute; top: 0; left: 0; width: 100%; padding: 20px; }
        }
      `}</style>
    </Box>
  );
};

export default JournalCaisse;