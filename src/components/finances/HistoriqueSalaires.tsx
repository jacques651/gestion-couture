import { useEffect, useState, useRef } from "react";
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
  SimpleGrid,
  Divider,
  Modal,
  ThemeIcon,
  Tooltip,
  Container,
  Avatar,
  Center,
  Paper,
  Badge,
} from '@mantine/core';
import {
  IconHistory,
  IconPrinter,
  IconFileExcel,
  IconFile,
  IconFileWord,
  IconInfoCircle,
  IconCalendar,
  IconUser,
  IconMoneybag,
  IconReceipt,
  IconEye,
  IconTrendingUp,
} from '@tabler/icons-react';
import { getDb } from "../../database/db";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import BulletinSalaire from "./BulletinSalaire";

// ================= TYPES =================
interface Salaire {
  id: number;
  employe_id: number;
  date: string;
  nom: string;
  montant: number;
}

const HistoriqueSalaires = () => {
  const [salaires, setSalaires] = useState<Salaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeId, setSelectedEmployeId] = useState<number | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // ================= LOAD =================
  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDb();

      const result = await db.select<any[]>(`
        SELECT 
          s.id,
          e.id as employe_id,
          s.date_paiement as date,
          e.nom_prenom as nom,
          s.montant_net as montant
        FROM salaires s
        LEFT JOIN employes e ON e.id = s.employe_id
        ORDER BY s.date_paiement DESC
      `);

      setSalaires(result || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const total = salaires.reduce((sum, s) => sum + (s.montant || 0), 0);
  const totalPaiements = salaires.length;

  // ================= IMPRESSION AMÉLIORÉE =================
  const handlePrint = () => {
    const printContent = printRef.current?.cloneNode(true) as HTMLElement;
    if (!printContent) return;

    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    let stylesHTML = '';
    styles.forEach((style) => {
      if (style.tagName === 'STYLE') {
        stylesHTML += style.outerHTML;
      } else if (style.tagName === 'LINK') {
        stylesHTML += `<link rel="stylesheet" href="${(style as HTMLLinkElement).href}">`;
      }
    });

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Historique des salaires</title>
        ${stylesHTML}
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 20px;
            margin: 0;
            background: white;
          }
          .print-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1b365d;
          }
          .print-header h1 {
            color: #1b365d;
            margin-bottom: 10px;
          }
          .print-stats {
            margin-bottom: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #1b365d;
            color: white;
            padding: 12px;
            border: 1px solid #2a4a7a;
            text-align: left;
          }
          td {
            padding: 10px;
            border: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .print-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
            .print-container {
              margin: 0;
              padding: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="print-header">
            <h1>📋 Historique des salaires</h1>
            <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
          </div>
          <div class="print-stats">
            <p><strong>Total des paiements :</strong> ${totalPaiements}</p>
            <p><strong>Montant total :</strong> ${total.toLocaleString()} FCFA</p>
            <p><strong>Moyenne par paiement :</strong> ${(totalPaiements > 0 ? Math.round(total / totalPaiements) : 0).toLocaleString()} FCFA</p>
          </div>
          ${printContent.querySelector('table')?.outerHTML || ''}
          <div class="print-footer">
            <p>Document généré par Gestion Couture - Application de gestion d'atelier professionnel</p>
            <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  // ================= EXPORT EXCEL (CSV) =================
  const exportExcel = async () => {
    const csv = [
      ["Date", "Employé", "Montant (FCFA)"],
      ...salaires.map(s => [
        new Date(s.date).toLocaleDateString("fr-FR"),
        s.nom,
        s.montant.toString()
      ])
    ]
      .map(r => r.join(","))
      .join("\n");

    const path = await save({
      filters: [{ name: "Excel", extensions: ["csv"] }],
      defaultPath: `salaires_${new Date().toISOString().slice(0, 10)}.csv`
    });

    if (path) {
      await writeFile(path, new TextEncoder().encode(csv));
    }
  };

  // ================= EXPORT PDF =================
  const exportPDF = () => {
    const win = window.open("", "", "width=800,height=600");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Historique des salaires</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1b365d; border-bottom: 2px solid #1b365d; }
          .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>📋 Historique des salaires</h1>
        <div class="stats">
          <p><strong>Date d'export :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Nombre de paiements :</strong> ${totalPaiements}</p>
          <p><strong>Montant total :</strong> ${total.toLocaleString()} FCFA</p>
          <p><strong>Moyenne :</strong> ${(totalPaiements > 0 ? Math.round(total / totalPaiements) : 0).toLocaleString()} FCFA</p>
        </div>
        <tr>
          <thead><tr><th>Date</th><th>Employé</th><th>Montant (FCFA)</th></tr></thead>
          <tbody>
            ${salaires.map(s => `
              <tr>
                <td>${new Date(s.date).toLocaleDateString('fr-FR')}</td>
                <td>${s.nom}</td>
                <td style="text-align: right">${s.montant.toLocaleString()} FCFA</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="total">Total général : ${total.toLocaleString()} FCFA</div>
        <div class="footer">Document généré par Gestion Couture - © ${new Date().getFullYear()}</div>
      </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  // ================= EXPORT WORD =================
  const exportWord = async () => {
    const rows = salaires.map(s => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(s.date).toLocaleDateString('fr-FR')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${s.nom}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${s.montant.toLocaleString()} FCFA</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Historique des salaires</title>
      <style>
        body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; }
        h1 { color: #1b365d; border-bottom: 3px solid #1b365d; padding-bottom: 10px; }
        .stats { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1b365d; color: white; padding: 12px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      <h1>📋 Historique des salaires</h1>
      <div class="stats">
        <p><strong>Date d'export :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <p><strong>Nombre de paiements :</strong> ${totalPaiements}</p>
        <p><strong>Montant total :</strong> ${total.toLocaleString()} FCFA</p>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Employé</th><th>Montant (FCFA)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <p>Total général : <strong>${total.toLocaleString()} FCFA</strong></p>
        <p>Document généré par Gestion Couture - © ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const path = await save({
      filters: [{ name: "Word", extensions: ["doc"] }],
      defaultPath: `salaires_${new Date().toISOString().slice(0, 10)}.doc`
    });

    if (path) {
      const buffer = await blob.arrayBuffer();
      await writeFile(path, new Uint8Array(buffer));
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconHistory size={40} stroke={1.5} />
            <Text>Chargement de l'historique...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconHistory size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Historique des salaires</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Suivi de tous les paiements de salaires
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {totalPaiements} paiement{totalPaiements > 1 ? 's' : ''}
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

          {/* Statistiques KPI */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total versé</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconMoneybag size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{total.toLocaleString()} FCFA</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Nombre de paiements</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconReceipt size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalPaiements}</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Moyenne par paiement</Text>
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <IconTrendingUp size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">
                {totalPaiements > 0 ? Math.round(total / totalPaiements).toLocaleString() : 0} FCFA
              </Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'export compacte */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="flex-end" gap="sm">
              <Button variant="subtle" color="teal" leftSection={<IconPrinter size={16} />} onClick={handlePrint} size="compact-sm">
                Imprimer
              </Button>
              <Button variant="subtle" color="green" leftSection={<IconFileExcel size={16} />} onClick={exportExcel} size="compact-sm">
                Excel
              </Button>
              <Button variant="subtle" color="red" leftSection={<IconFile size={16} />} onClick={exportPDF} size="compact-sm">
                PDF
              </Button>
              <Button variant="subtle" color="blue" leftSection={<IconFileWord size={16} />} onClick={exportWord} size="compact-sm">
                Word
              </Button>
            </Group>
          </Card>

          {/* Tableau des salaires - Lignes compactes */}
          <div ref={printRef}>
            <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
              {salaires.length === 0 ? (
                <Stack align="center" py={60} gap="sm">
                  <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                    <IconHistory size={30} />
                  </ThemeIcon>
                  <Text c="dimmed" size="lg">Aucun paiement trouvé</Text>
                </Stack>
              ) : (
                <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white', padding: '10px 12px', width: 120 }}>Date</Table.Th>
                      <Table.Th style={{ color: 'white', padding: '10px 12px' }}>Employé</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right', padding: '10px 12px', width: 150 }}>Montant</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center', padding: '10px 12px', width: 100 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {salaires.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td style={{ padding: '8px 12px' }}>
                          <Group gap={4} wrap="nowrap">
                            <IconCalendar size={12} color="#1b365d" />
                            <Text size="sm">{new Date(s.date).toLocaleDateString('fr-FR')}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ padding: '8px 12px' }}>
                          <Group gap={4} wrap="nowrap">
                            <Avatar size={24} radius="xl" color="blue">
                              <IconUser size={12} />
                            </Avatar>
                            <Text size="sm">{s.nom}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right" style={{ padding: '8px 12px' }}>
                          <Badge color="green" variant="light" size="sm">
                            {s.montant.toLocaleString()} FCFA
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ padding: '8px 12px' }}>
                          <Group justify="center">
                            <Tooltip label="Voir le bulletin">
                              <Button
                                size="compact-xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconEye size={14} />}
                                onClick={() => setSelectedEmployeId(s.employe_id)}
                                radius="md"
                              >
                                Bulletin
                              </Button>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Card>
          </div>

          {/* Total général compact */}
          <Paper p="md" radius="lg" withBorder bg="gray.0">
            <Group justify="flex-end">
              <Text fw={700} size="lg">
                Total général : <span style={{ color: '#1b365d' }}>{total.toLocaleString()} FCFA</span>
              </Text>
            </Group>
          </Paper>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Historique des salaires"
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
                  <Text size="sm">1️⃣ Ce tableau montre l'historique complet des paiements de salaires</Text>
                  <Text size="sm">2️⃣ Utilisez les boutons d'export pour sauvegarder les données</Text>
                  <Text size="sm">3️⃣ Cliquez sur "Bulletin" pour voir le détail d'un paiement</Text>
                  <Text size="sm">4️⃣ Le total général est affiché en bas du tableau</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Informations :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconEye size={16} color="#e65100" />
                    <Text size="sm">Le bulletin détaille le brut, les retenues et le net</Text>
                  </Group>
                  <Group gap="xs">
                    <IconFileExcel size={16} color="#e65100" />
                    <Text size="sm">Les exports sont disponibles en CSV, PDF et Word</Text>
                  </Group>
                </Stack>
              </Paper>

              <Divider />
              <Text size="xs" c="dimmed" ta="center">
                Version 1.0.0 - Gestion Couture
              </Text>
            </Stack>
          </Modal>

          {/* BULLETIN MODAL */}
          {selectedEmployeId && (
            <BulletinSalaire
              employeId={selectedEmployeId}
              onClose={() => setSelectedEmployeId(null)}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default HistoriqueSalaires;