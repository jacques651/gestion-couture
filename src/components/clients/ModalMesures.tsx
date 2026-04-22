import React, { useState, useRef } from 'react';
import {
  Modal,
  Stack,
  Text,
  Title,
  Group,
  Button,
  Table,
  Box,
  Divider,
  Menu,
  ActionIcon,
  Alert,
} from '@mantine/core';
import {
  IconPrinter,
  IconFileText,
  IconX,
  IconChevronDown,
  IconFileExcel,
  IconFileWord,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconFileTypography,
} from '@tabler/icons-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Props {
  client: {
    nom_prenom: string;
    telephone_id: string;
    recommandations?: string;
  };
  mesures: Array<{
    nom: string;
    valeur: number;
    unite: string;
  }>;
  onClose: () => void;
}

const ModalMesures: React.FC<Props> = ({ client, mesures, onClose }) => {
  const [exporting, setExporting] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  const safeWrite = async (filePath: string, buffer: ArrayBuffer) => {
    try {
      await writeFile(filePath, new Uint8Array(buffer));
      alert("✅ Fichier enregistré avec succès");
    } catch (e) {
      console.error(e);
      alert("❌ Erreur lors de l'enregistrement");
    }
  };

  // ============================================================
  // IMPRESSION
  // ============================================================
  const handlePrint = () => {
    const printContent = printContentRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les pop-ups pour cette application");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fiche mesures - ${client.nom_prenom}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              margin-bottom: 5px;
              color: #1b365d;
            }
            .subtitle {
              text-align: center;
              margin: 5px 0;
              font-size: 14px;
            }
            .date {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            .recommandations {
              margin: 20px 0;
              padding: 12px;
              background: #f0f7ff;
              border-left: 4px solid #1b365d;
              font-style: italic;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background: #1b365d;
              color: white;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${printContent}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ============================================================
  // EXPORT PDF
  // ============================================================
  const exportPDF = async () => {
    try {
      setExporting(true);
      const doc = new jsPDF();
      let y = 15;

      // Titre
      doc.setFontSize(18);
      doc.setTextColor(27, 54, 93);
      doc.text("FICHE MESURES", 105, y, { align: "center" });
      y += 10;

      // Client
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(client.nom_prenom, 105, y, { align: "center" });
      y += 7;

      if (client.telephone_id) {
        doc.text(`Tél: ${client.telephone_id}`, 105, y, { align: "center" });
        y += 7;
      }

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(new Date().toLocaleDateString(), 105, y, { align: "center" });
      y += 10;

      // Recommandations
      if (client.recommandations) {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const splitRecommandations = doc.splitTextToSize(
          `Recommandations : ${client.recommandations}`,
          180
        );
        doc.text(splitRecommandations, 15, y);
        y += splitRecommandations.length * 6 + 5;
      }

      // Tableau des mesures
      autoTable(doc, {
        startY: y,
        head: [['Mesure', 'Valeur']],
        body: mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]),
        theme: 'striped',
        headStyles: {
          fillColor: [27, 54, 93],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
      });

      const filePath = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `mesures_${client.nom_prenom.replace(/\s/g, '_')}.pdf`,
      }) as string;

      if (filePath) {
        const buffer = await doc.output('arraybuffer');
        await safeWrite(filePath, buffer);
      }
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('❌ Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // EXPORT EXCEL
  // ============================================================
  const exportExcel = async () => {
    try {
      setExporting(true);
      const wsData = [
        ['FICHE MESURES'],
        [''],
        ['Client', client.nom_prenom],
        ['Téléphone', client.telephone_id || ''],
        ['Date', new Date().toLocaleDateString()],
        [],
      ];

      if (client.recommandations) {
        wsData.push(['Recommandations', client.recommandations]);
        wsData.push([]);
      }

      wsData.push(['Mesure', 'Valeur']);
      mesures.forEach(m => {
        wsData.push([m.nom, `${m.valeur} ${m.unite || 'cm'}`]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 25 }, { wch: 30 }];
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mesures');

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const filePath = await save({
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        defaultPath: `mesures_${client.nom_prenom.replace(/\s/g, '_')}.xlsx`,
      }) as string;

      if (filePath) {
        await safeWrite(filePath, buffer);
      }
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // EXPORT WORD
  // ============================================================
  const exportWord = async () => {
    try {
      setExporting(true);
      const content = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Mesures - ${client.nom_prenom}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #1b365d; text-align: center; }
              .info { margin: 20px 0; }
              .recommandations { 
                background: #f0f7ff; 
                padding: 10px; 
                border-left: 4px solid #1b365d;
                margin: 20px 0;
              }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; }
              td { padding: 8px; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <h1>FICHE MESURES</h1>
            <div class="info">
              <p><strong>Client :</strong> ${client.nom_prenom}</p>
              <p><strong>Téléphone :</strong> ${client.telephone_id || ''}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            ${client.recommandations ? `
              <div class="recommandations">
                <strong>Recommandations :</strong> ${client.recommandations}
              </div>
            ` : ''}
            <table>
              <thead>
                <tr><th>Mesure</th><th>Valeur</th></tr>
              </thead>
              <tbody>
                ${mesures.map(m => `
                  <tr>
                    <td>${m.nom}</td>
                    <td>${m.valeur} ${m.unite || 'cm'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([content], { type: 'application/msword' });
      const buffer = await blob.arrayBuffer();
      const filePath = await save({
        filters: [{ name: 'Word', extensions: ['doc'] }],
        defaultPath: `mesures_${client.nom_prenom.replace(/\s/g, '_')}.doc`,
      }) as string;

      if (filePath) {
        await safeWrite(filePath, buffer);
      }
    } catch (error) {
      console.error('Erreur export Word:', error);
      alert('❌ Erreur lors de l\'export Word');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={`Mesures - ${client.nom_prenom}`}
      size="xl"
      centered
      overlayProps={{ blur: 3 }}
      styles={{
        header: {
          backgroundColor: '#1b365d',
          padding: '16px 20px',
        },
        title: {
          color: 'white',
          fontWeight: 600,
          fontSize: '18px',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <Stack gap={0}>
        {/* Barre d'actions */}
        <Group justify="flex-end" p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
          <Menu shadow="md" width={160}>
            <Menu.Target>
              <Button
                variant="light"
                leftSection={<IconPrinter size={16} />}
                rightSection={<IconChevronDown size={14} />}
              >
                Imprimer
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Format d'impression</Menu.Label>
              <Menu.Item onClick={handlePrint}>A4 (par défaut)</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={160}>
            <Menu.Target>
              <Button
                variant="light"
                leftSection={<IconFileText size={16} />}
                rightSection={<IconChevronDown size={14} />}
                loading={exporting}
              >
                Exporter
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Choisir le format</Menu.Label>
              <Menu.Item
                leftSection={<IconFileTypePdf size={16} color="#e74c3c" />}
                onClick={exportPDF}
              >
                PDF (.pdf)
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileSpreadsheet size={16} color="#00a84f" />}
                onClick={exportExcel}
              >
                Excel (.xlsx)
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileTypography size={16} color="#2980b9" />}
                onClick={exportWord}
              >
                Word (.doc)
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ActionIcon variant="subtle" color="gray" onClick={onClose} size="lg">
            <IconX size={18} />
          </ActionIcon>
        </Group>

        {/* Contenu à imprimer */}
        <div ref={printContentRef} style={{ padding: '30px' }}>
          <Box>
            <Title order={1} ta="center" c="#1b365d" size="h2" mb="xs">
              FICHE MESURES
            </Title>
            <Text ta="center" size="md" fw={500}>
              {client.nom_prenom}
            </Text>
            {client.telephone_id && (
              <Text ta="center" size="sm" c="dimmed">
                Tél: {client.telephone_id}
              </Text>
            )}
            <Text ta="center" size="xs" c="gray" mt={4}>
              {new Date().toLocaleDateString()}
            </Text>

            {client.recommandations && (
              <Alert
                mt="md"
                mb="md"
                color="blue"
                variant="light"
                title="Recommandations"
              >
                {client.recommandations}
              </Alert>
            )}

            <Divider my="md" />

            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr style={{ backgroundColor: '#1b365d' }}>
                  <Table.Th c="white">Mesure</Table.Th>
                  <Table.Th c="white">Valeur</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mesures.map((m, i) => (
                  <Table.Tr key={i}>
                    <Table.Td fw={500}>{m.nom}</Table.Td>
                    <Table.Td>
                      {m.valeur} {m.unite || 'cm'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {mesures.length === 0 && (
              <Text ta="center" c="dimmed" py="xl">
                Aucune mesure enregistrée pour ce client
              </Text>
            )}
          </Box>
        </div>
      </Stack>
    </Modal>
  );
};

export default ModalMesures;