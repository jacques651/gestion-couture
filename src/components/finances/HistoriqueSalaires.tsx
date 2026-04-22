import { useEffect, useState } from "react";
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

  // ================= PRINT =================
  const handlePrint = () => window.print();

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
      defaultPath: "salaires.csv"
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
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .total { margin-top: 20px; text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>📋 Historique des salaires</h1>
        <p><strong>Date d'export :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <p><strong>Nombre de paiements :</strong> ${totalPaiements}</p>
        <table>
          <thead>
            <tr><th>Date</th><th>Employé</th><th>Montant (FCFA)</th></tr>
          </thead>
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
        <div class="total">
          Total : ${total.toLocaleString()} FCFA
        </div>
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
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1b365d; border-bottom: 2px solid #1b365d; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>📋 Historique des salaires</h1>
      <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <p><strong>Nombre de paiements :</strong> ${totalPaiements}</p>
      <table border="1" cellpadding="5" cellspacing="0">
        <thead>
          <tr><th>Date</th><th>Employé</th><th>Montant (FCFA)</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <h3>Total : ${total.toLocaleString()} FCFA</h3>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const path = await save({
      filters: [{ name: "Word", extensions: ["doc"] }],
      defaultPath: "salaires.doc"
    });

    if (path) {
      const buffer = await blob.arrayBuffer();
      await writeFile(path, new Uint8Array(buffer));
    }
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement de l'historique...</Text>
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
                <IconHistory size={24} color="white" />
                <Title order={2} c="white">Historique des salaires</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Suivi de tous les paiements de salaires
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
                <IconHistory size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Card withBorder radius="md" p="md" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total des paiements
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconMoneybag size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {total.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Nombre de paiements
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconReceipt size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalPaiements}
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'EXPORT */}
        <Card withBorder radius="md" p="md">
          <Group justify="flex-end" gap="sm">
            <Tooltip label="Imprimer">
              <Button variant="outline" leftSection={<IconPrinter size={16} />} onClick={handlePrint}>
                Imprimer
              </Button>
            </Tooltip>
            <Tooltip label="Excel (CSV)">
              <Button variant="outline" color="green" leftSection={<IconFileExcel size={16} />} onClick={exportExcel}>
                Excel
              </Button>
            </Tooltip>
            <Tooltip label="PDF">
              <Button variant="outline" color="red" leftSection={<IconFile size={16} />} onClick={exportPDF}>
                PDF
              </Button>
            </Tooltip>
            <Tooltip label="Word">
              <Button variant="outline" color="blue" leftSection={<IconFileWord size={16} />} onClick={exportWord}>
                Word
              </Button>
            </Tooltip>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
              <Table.Tr>
                <Table.Th style={{ color: 'white', width: 120 }}>Date</Table.Th>
                <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right', width: 150 }}>Montant</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'center', width: 120 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {salaires.map((s) => (
                <Table.Tr key={s.id}>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <IconCalendar size={12} />
                      <Text size="sm">{new Date(s.date).toLocaleDateString('fr-FR')}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <IconUser size={12} />
                      {s.nom}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right" fw={600} c="green">
                    {s.montant.toLocaleString()} FCFA
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="center">
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={() => setSelectedEmployeId(s.employe_id)}
                      >
                        Bulletin
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>

        {/* TOTAL */}
        <Card withBorder radius="md" p="md" bg="gray.0">
          <Group justify="flex-end">
            <Text fw={700} size="lg">
              Total général : {total.toLocaleString()} FCFA
            </Text>
          </Group>
        </Card>

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
            <Text size="sm">1. Ce tableau montre l'historique complet des paiements de salaires</Text>
            <Text size="sm">2. Utilisez les boutons d'export pour sauvegarder les données</Text>
            <Text size="sm">3. Cliquez sur "Bulletin" pour voir le détail d'un paiement</Text>
            <Text size="sm">4. Le total général est affiché en bas du tableau</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
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
    </Box>
  );
};

export default HistoriqueSalaires;