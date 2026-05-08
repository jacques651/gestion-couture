import React, { useState, useRef } from 'react';
import { journaliserAction } from "../../services/journal";
import {
  Modal,
  Stack,
  Title,
  Group,
  Button,
  Box,
  Menu,
  ActionIcon,
  ThemeIcon,
  Text,
  Divider,
  Paper,
  ScrollArea,
  Badge,
} from '@mantine/core';
import {
  IconPrinter,
  IconX,
  IconChevronDown,
  IconRuler,
  IconNote,
} from '@tabler/icons-react';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Props {
  client: {
    nom_prenom: string;
    telephone_id: string;
    observations?: string;
  };
  mesures: Array<{
    nom: string;
    valeur: number;
    unite: string;
  }>;
  onClose: () => void;
}

const ModalMesures: React.FC<Props> = ({ client, mesures, onClose }) => {
  const [] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);


  // ============================================================
  // IMPRESSION AVEC FORMATS MULTIPLES
  // ============================================================
  const handlePrint = (format: 'A4' | 'A5' | 'A6' = 'A4') => {
  const printContent = printContentRef.current?.innerHTML;
  if (!printContent) return;

  const formats = {
    A4: { width: 210, height: 297, margin: 10, fontSize: 11 },
    A5: { width: 148, height: 210, margin: 8, fontSize: 9 },
    A6: { width: 105, height: 148, margin: 6, fontSize: 8 }
  };

  const selectedFormat = formats[format];

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fiche mesures - ${client.nom_prenom}</title>
        <meta charset="UTF-8">
        <style>
          @page { 
            size: ${format};
            margin: ${selectedFormat.margin}mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            font-size: ${selectedFormat.fontSize}px;
            line-height: 1.3;
            color: #333;
          }
          .print-container {
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 6px;
            border-bottom: 2px solid #1b365d;
            padding-bottom: 4px;
          }
          h1 {
            font-size: ${format === 'A4' ? '16' : format === 'A5' ? '14' : '12'}px;
            font-weight: bold;
            color: #1b365d;
            margin-bottom: 3px;
          }
          .client-name {
            font-size: ${format === 'A4' ? '13' : format === 'A5' ? '11' : '10'}px;
            font-weight: 600;
            margin: 3px 0;
          }
          .client-info {
            font-size: ${format === 'A4' ? '10' : '9'}px;
            color: #7f8c8d;
            margin: 2px 0;
          }
          .date {
            font-size: ${format === 'A4' ? '9' : '8'}px;
            color: #95a5a6;
          }
          .observations-box {
            background: #f0f7ff;
            border-left: 3px solid #1b365d;
            padding: 6px 8px;
            margin: 6px 0;
            border-radius: 4px;
          }
          .observations-title {
            font-weight: 600;
            font-size: ${format === 'A4' ? '10' : '9'}px;
            margin-bottom: 3px;
          }
          .observations-text {
            font-size: ${format === 'A4' ? '9' : '8'}px;
            line-height: 1.4;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: ${format === 'A4' ? '5px 6px' : format === 'A5' ? '4px 5px' : '3px 4px'};
            text-align: left;
          }
          th {
            background: #1b365d;
            color: white;
            font-weight: 600;
            font-size: ${format === 'A4' ? '10' : '9'}px;
          }
          td {
            font-size: ${format === 'A4' ? '10' : '9'}px;
          }
          tr:nth-child(even) {
            background: #f9f9f9;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 8px;
            color: #95a5a6;
            border-top: 1px solid #ecf0f1;
            padding-top: 4px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            <h1>FICHE MESURES</h1>
            <div class="client-name">${client.nom_prenom}</div>
            ${client.telephone_id ? `<div class="client-info">📞 ${client.telephone_id}</div>` : ''}
            <div class="date">📅 ${new Date().toLocaleDateString()}</div>
          </div>
          ${client.observations ? `
            <div class="observations-box">
              <div class="observations-title">📝 Observations</div>
              <div class="observations-text">${client.observations}</div>
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
                  <td><strong>${m.valeur}</strong> ${m.unite || 'cm'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${mesures.length === 0 ? '<p style="text-align:center; padding:20px;">Aucune mesure enregistrée</p>' : ''}
          <div class="footer">
            Document généré par Gestion Couture - ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
    </html>
  `;

  // Créer une iframe invisible pour l'impression
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }
};
  journaliserAction({
    utilisateur: 'Utilisateur',
    action: 'CREATE',
    table: 'impression_mesures',
    idEnregistrement: client.telephone_id,
    details: `Impression fiche mesures (${FormData}) : ${client.nom_prenom}`
  });

  return (
    <Modal
      opened={true}
      onClose={onClose}
      size="800px"
      centered
      overlayProps={{ blur: 3 }}
      padding={0}
      styles={{
        header: { display: 'none' },
        body: { padding: 0 },
      }}
    >
      <Stack gap={0}>
        {/* Barre d'actions */}
        <Group justify="space-between" p="md" style={{ backgroundColor: '#1b365d' }}>
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <IconRuler size={18} color="white" />
            </ThemeIcon>
            <Title order={3} c="white" size="h4">Fiche mesures - {client.nom_prenom}</Title>
            <Badge size="sm" variant="light" color="white" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              {mesures.length} mesures
            </Badge>
          </Group>
          <Group gap="xs">
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="light" color="white" size="sm" leftSection={<IconPrinter size={16} />} rightSection={<IconChevronDown size={14} />}>
                  Imprimer
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>📄 Choisir le format</Menu.Label>
                <Menu.Item onClick={() => handlePrint('A4')}>
                  <Group justify="space-between" style={{ width: '100%' }}>
                    <span>📄 Format A4</span>
                    <Text size="xs" c="dimmed">21 x 29,7 cm</Text>
                  </Group>
                </Menu.Item>
                <Menu.Item onClick={() => handlePrint('A5')}>
                  <Group justify="space-between" style={{ width: '100%' }}>
                    <span>📄 Format A5</span>
                    <Text size="xs" c="dimmed">14,8 x 21 cm</Text>
                  </Group>
                </Menu.Item>
                <Menu.Item onClick={() => handlePrint('A6')}>
                  <Group justify="space-between" style={{ width: '100%' }}>
                    <span>📄 Format A6</span>
                    <Text size="xs" c="dimmed">10,5 x 14,8 cm</Text>
                  </Group>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <ActionIcon variant="light" color="white" onClick={onClose} size="lg">
              <IconX size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Contenu visible */}
        <ScrollArea style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div ref={printContentRef} style={{ padding: '30px', backgroundColor: 'white' }}>
            <Box style={{ maxWidth: '700px', margin: '0 auto' }}>

              {client.observations && (
                <Paper p="md" withBorder mb="xl" style={{ background: '#f0f7ff', borderLeft: '4px solid #1b365d' }}>
                  <Group gap="xs" mb={5}>
                    <IconNote size={14} />
                    <Text fw={600}>Observations</Text>
                  </Group>
                  <Text size="sm">{client.observations}</Text>
                </Paper>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1b365d' }}>
                    <th style={{ padding: '10px', border: '1px solid #2c3e50', color: 'white', textAlign: 'left' }}>Mesure</th>
                    <th style={{ padding: '10px', border: '1px solid #2c3e50', color: 'white', textAlign: 'left' }}>Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {mesures.map((m, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 500 }}>{m.nom}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <strong style={{ color: '#1b365d' }}>{m.valeur}</strong> {m.unite || 'cm'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {mesures.length === 0 && (
                <Text ta="center" c="dimmed" py={60}>Aucune mesure enregistrée pour ce client</Text>
              )}

              <Divider my="xl" />
              <Text ta="center" size="xs" c="dimmed">
                Document généré par Gestion Couture - {new Date().toLocaleString()}
              </Text>
            </Box>
          </div>
        </ScrollArea>
      </Stack>
    </Modal>
  );
};

export default ModalMesures;