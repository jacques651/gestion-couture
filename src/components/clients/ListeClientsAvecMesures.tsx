import { useState, useMemo } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Alert,
  Table,
  Badge,
  Divider,
  TextInput,
  ActionIcon,
  ScrollArea,
  LoadingOverlay,
  Modal,
  Pagination,
  Tooltip,
  Menu,
  Box,
  Container,
  Avatar,
  Center,
} from '@mantine/core';
import {
  IconUsers,
  IconAlertCircle,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconEye,
  IconDownload,
  IconFileExcel,
  IconFile,
  IconFileWord,
  IconPrinter,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FormulaireClient from './FormulaireClient';
import FormulaireVente from '../ventes/FormulaireVente';
import ModalMesures from './ModalMesures';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

interface Mesure {
  nom: string;
  valeur: number;
  unite: string;
}

interface Client {
  telephone_id: string;
  nom_prenom: string;
  adresse?: string;
  email?: string;
  observations?: string;
  date_enregistrement?: string;
}

interface ClientAvecMesures extends Client {
  mesures: Mesure[];
}

export default function ListeClientsAvecMesures() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'nom_prenom' | 'telephone_id'>('nom_prenom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [exporting, setExporting] = useState(false);
  const [vueForm, setVueForm] = useState(false);
  const [clientEdit, setClientEdit] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientAvecMesures | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showVenteForm, setShowVenteForm] = useState(false);
  const [venteClientData, setVenteClientData] = useState<{ id: string; nom: string } | null>(null);
  const itemsPerPage = 10;

  // Récupérer tous les clients avec leurs mesures
  const { 
    data: clientsAvecMesures = [], 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useQuery<ClientAvecMesures[]>({
    queryKey: ['clients_avec_mesures'],
    queryFn: async () => {
      try {
        const db = await getDb();
        
        if (!db) {
          throw new Error("Base de données non initialisée");
        }

        // Récupérer les clients (non supprimés)
        const clients = await db.select(
          `SELECT telephone_id, nom_prenom, adresse, email, observations, date_enregistrement
           FROM clients 
           WHERE est_supprime = 0 OR est_supprime IS NULL
           ORDER BY nom_prenom`
        ) as Client[];

        console.log(`Clients chargés: ${clients.length}`);

        if (clients.length === 0) return [];

        const ids = clients.map(c => c.telephone_id);
        
        // Récupérer les mesures pour tous les clients
        const placeholders = ids.map(() => '?').join(',');
        const mesuresRows = await db.select(
          `SELECT mc.client_id, tm.nom, mc.valeur, tm.unite
           FROM mesures_clients mc
           JOIN types_mesures tm ON tm.id = mc.type_mesure_id
           WHERE mc.client_id IN (${placeholders})
           ORDER BY tm.ordre_affichage, tm.nom`,
          ids
        ) as Array<{ client_id: string; nom: string; valeur: number; unite: string | null }>;

        // Organiser les mesures par client
        const mesuresParClient = new Map<string, Mesure[]>();
        for (const row of mesuresRows) {
          if (!mesuresParClient.has(row.client_id)) {
            mesuresParClient.set(row.client_id, []);
          }
          mesuresParClient.get(row.client_id)!.push({
            nom: row.nom,
            valeur: row.valeur,
            unite: row.unite || 'cm'
          });
        }

        return clients.map(client => ({
          ...client,
          observations: client.observations || '',
          mesures: mesuresParClient.get(client.telephone_id) || []
        }));
      } catch (err) {
        console.error("Erreur dans queryFn:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  // Extraire tous les noms de mesures uniques
  const tousNomsMesures = useMemo(() => {
    const noms = new Set<string>();
    if (clientsAvecMesures && clientsAvecMesures.length > 0) {
      for (const client of clientsAvecMesures) {
        if (client.mesures && client.mesures.length > 0) {
          for (const mesure of client.mesures) {
            if (mesure.nom) {
              noms.add(mesure.nom);
            }
          }
        }
      }
    }
    return Array.from(noms).sort();
  }, [clientsAvecMesures]);

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    if (!clientsAvecMesures || clientsAvecMesures.length === 0) return [];
    
    let filtered = clientsAvecMesures.filter(c =>
      (c.nom_prenom && c.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.telephone_id && c.telephone_id.includes(searchTerm))
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nom_prenom') {
        comparison = (a.nom_prenom || '').localeCompare(b.nom_prenom || '');
      } else if (sortBy === 'telephone_id') {
        comparison = (a.telephone_id || '').localeCompare(b.telephone_id || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [clientsAvecMesures, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mutation pour la suppression
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const db = await getDb();
      if (!db) throw new Error("Base de données non disponible");
      await db.execute("UPDATE clients SET est_supprime = 1 WHERE telephone_id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients_avec_mesures'] });
      setDeleteId(null);
    },
    onError: (error) => {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du client');
    }
  });

  const handleSupprimer = (id: string) => setDeleteId(id);
  const handleModifier = (client: Client) => {
    setClientEdit(client);
    setVueForm(true);
  };
  const handleVoir = (client: ClientAvecMesures) => {
    setSelectedClient(client);
    setShowModal(true);
  };
  
  const handleSort = (column: 'nom_prenom' | 'telephone_id') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Exporter Excel
  const exportToExcel = async () => {
    try {
      setExporting(true);

      const filePath = await save({
        title: "Exporter la liste des clients",
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        defaultPath: `clients_mesures_${new Date().toISOString().split('T')[0]}.xlsx`
      });

      if (!filePath) {
        setExporting(false);
        return;
      }

      const data = filteredAndSortedData.map(client => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
        const row: any = {
          'Téléphone': client.telephone_id,
          'Nom complet': client.nom_prenom,
          'Adresse': client.adresse || '',
          'Email': client.email || '',
          'Observations': client.observations || '',
          'Date enregistrement': client.date_enregistrement || new Date().toLocaleDateString('fr-FR'),
        };
        for (const nom of tousNomsMesures) {
          row[nom] = mesuresMap.get(nom) || '';
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, ...tousNomsMesures.map(() => ({ wch: 15 }))];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients avec mesures');

      const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      await writeFile(filePath, new Uint8Array(excelBuffer));

      alert('✅ Export Excel réussi !');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setExporting(false);
    }
  };

  // Exporter PDF
  const exportToPDF = async () => {
    try {
      setExporting(true);

      const filePath = await save({
        title: "Exporter la liste des clients en PDF",
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: `clients_mesures_${new Date().toISOString().split('T')[0]}.pdf`
      });

      if (!filePath) {
        setExporting(false);
        return;
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');

      doc.setFillColor(27, 54, 93);
      doc.rect(0, 0, 297, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('LISTE DES CLIENTS AVEC MESURES', 148.5, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 148.5, 32, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Total clients : ${filteredAndSortedData.length}`, 14, 50);
      doc.text(`Types de mesures : ${tousNomsMesures.length}`, 14, 57);

      const head = ['N°', 'Téléphone', 'Nom', 'Adresse', 'Email', 'Observations', ...tousNomsMesures];
      const body = filteredAndSortedData.map((client, idx) => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
        const ligne = [
          idx + 1, 
          client.telephone_id, 
          client.nom_prenom, 
          client.adresse || '', 
          client.email || '', 
          (client.observations || '').substring(0, 50)
        ];
        for (const nom of tousNomsMesures) {
          ligne.push(mesuresMap.get(nom) || '');
        }
        return ligne;
      });

      autoTable(doc, {
        head: [head],
        body: body,
        startY: 65,
        theme: 'striped',
        headStyles: {
          fillColor: [27, 54, 93],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { fontSize: 7, cellPadding: 2, cellWidth: 'wrap' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 35 },
        },
        margin: { left: 10, right: 10 }
      });

      const pdfBuffer = doc.output('arraybuffer');
      await writeFile(filePath, new Uint8Array(pdfBuffer));

      alert('✅ Export PDF réussi !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('❌ Erreur lors de l\'export PDF: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setExporting(false);
    }
  };

  // Exporter Word
  const exportToWord = async () => {
    try {
      setExporting(true);

      const filePath = await save({
        title: "Exporter la liste des clients en Word",
        filters: [{ name: 'Word Document', extensions: ['doc'] }],
        defaultPath: `clients_mesures_${new Date().toISOString().split('T')[0]}.doc`
      });

      if (!filePath) {
        setExporting(false);
        return;
      }

      const rows = filteredAndSortedData.map((client, idx) => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
        return `<tr>
                  <td style="border:1px solid #ddd;padding:8px;text-align:center">${idx + 1}</td>
                  <td style="border:1px solid #ddd;padding:8px">${client.telephone_id}</td>
                  <td style="border:1px solid #ddd;padding:8px"><strong>${client.nom_prenom}</strong></td>
                  <td style="border:1px solid #ddd;padding:8px">${client.adresse || '-'}</td>
                  <td style="border:1px solid #ddd;padding:8px">${client.email || '-'}</td>
                  <td style="border:1px solid #ddd;padding:8px">${client.observations || '-'}</td>
                  ${tousNomsMesures.map(nom => `<td style="border:1px solid #ddd;padding:8px;text-align:center">${mesuresMap.get(nom) || '-'}</td>`).join('')}
                </tr>`;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des clients avec mesures</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; background: white; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { color: #1b365d; border-bottom: 3px solid #1b365d; padding-bottom: 10px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #1b365d; color: white; padding: 12px; border: 1px solid #ddd; font-weight: bold; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 LISTE DES CLIENTS AVEC MESURES</h1>
          <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Total clients :</strong> ${filteredAndSortedData.length} | <strong>Types de mesures :</strong> ${tousNomsMesures.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>N°</th><th>Téléphone</th><th>Nom complet</th><th>Adresse</th><th>Email</th><th>Observations</th>
              ${tousNomsMesures.map(n => `<th>${n}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Document généré automatiquement par Gestion Couture</p>
          <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
        </div>
      </body>
      </html>`;

      const encoder = new TextEncoder();
      const data = encoder.encode(htmlContent);
      await writeFile(filePath, data);

      alert('✅ Export Word réussi !');
    } catch (error) {
      console.error('Erreur export Word:', error);
      alert('❌ Erreur lors de l\'export Word: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setExporting(false);
    }
  };

  // Impression
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour l'impression");
      return;
    }

    const rows = filteredAndSortedData.map((client, idx) => {
      const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
      return `<tr>
              <td style="border:1px solid #ddd;padding:8px;text-align:center">${idx + 1}</td>
              <td style="border:1px solid #ddd;padding:8px">${client.telephone_id}</td>
              <td style="border:1px solid #ddd;padding:8px"><strong>${client.nom_prenom}</strong></td>
              <td style="border:1px solid #ddd;padding:8px">${client.observations || '-'}</td>
              ${tousNomsMesures.map(nom => `<td style="border:1px solid #ddd;padding:8px;text-align:center">${mesuresMap.get(nom) || '-'}</td>`).join('')}
            </tr>`;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des clients avec mesures</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1b365d;
          }
          .header h1 { color: #1b365d; font-size: 24px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
          th { background: #1b365d; color: white; padding: 10px; border: 1px solid #2a4a7a; text-align: center; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #999; }
          @media print { body { padding: 0; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 LISTE DES CLIENTS AVEC MESURES</h1>
          <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
          <p>Total clients : ${filteredAndSortedData.length} | Types de mesures : ${tousNomsMesures.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>N°</th><th>Téléphone</th><th>Nom complet</th><th>Observations</th>
              ${tousNomsMesures.map(n => `<th>${n}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Document généré automatiquement par Gestion Couture</p>
        </div>
        <script>window.onload = () => { window.print(); window.close(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Affichage du formulaire de vente après création du client
  if (showVenteForm && venteClientData) {
    return (
      <FormulaireVente
        prefillClient={{
          telephone_id: venteClientData.id,
          nom_prenom: venteClientData.nom
        }}
        defaultType="commande"
        onSuccess={() => {
          setShowVenteForm(false);
          setVenteClientData(null);
          refetch();
        }}
        onCancel={() => {
          setShowVenteForm(false);
          setVenteClientData(null);
        }}
      />
    );
  }

  if (vueForm) {
    return (
      <FormulaireClient 
        clientEdit={clientEdit || undefined} 
        onBack={() => setVueForm(false)} 
        onSuccess={(clientId, clientNom) => { 
          setVueForm(false); 
          refetch();
          if (clientId && clientNom) {
            setVenteClientData({ id: clientId, nom: clientNom });
            setShowVenteForm(true);
          }
        }} 
      />
    );
  }

  if (isLoading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconUsers size={40} stroke={1.5} />
            <Text>Chargement des clients...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  if (isError || error) {
    return (
      <Container size="xl" p="md">
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          color="red" 
          title="Erreur de chargement" 
          variant="filled"
        >
          <Stack>
            <Text>Impossible de charger les clients</Text>
            <Text size="sm">{error instanceof Error ? error.message : 'Erreur inconnue'}</Text>
            <Button onClick={() => refetch()} variant="white" size="xs" mt="md">
              Réessayer
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* Header */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconUsers size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Clients avec mesures</Title>
                  <Text c="gray.3" size="sm">Gérez les informations des clients et leurs mesures personnalisées</Text>
                </Box>
              </Group>
              <Button variant="light" color="white" leftSection={<IconInfoCircle size={18} />} onClick={() => setInfoModalOpen(true)} radius="md">
                Instructions
              </Button>
            </Group>
          </Card>

          {/* Contenu principal */}
          <Card withBorder radius="lg" shadow="sm">
            <Stack gap="md">
              {/* Barre d'actions */}
              <Group justify="space-between" align="flex-end">
                <Box>
                  <Title order={3} size="h4" c="#1b365d">Liste des clients</Title>
                  <Text size="xs" c="dimmed">
                    {filteredAndSortedData.length} client{filteredAndSortedData.length > 1 ? 's' : ''} trouvé{filteredAndSortedData.length > 1 ? 's' : ''}
                  </Text>
                </Box>
                <Group>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button leftSection={<IconDownload size={16} />} variant="outline" loading={exporting}>Exporter</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Format d'export</Menu.Label>
                      <Menu.Item leftSection={<IconFileExcel size={16} color="#00a84f" />} onClick={exportToExcel}>Excel (.xlsx)</Menu.Item>
                      <Menu.Item leftSection={<IconFile size={16} color="#e74c3c" />} onClick={exportToPDF}>PDF (.pdf)</Menu.Item>
                      <Menu.Item leftSection={<IconFileWord size={16} color="#2980b9" />} onClick={exportToWord}>Word (.doc)</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                  <Button leftSection={<IconPrinter size={16} />} onClick={handlePrint} variant="outline" color="teal">Imprimer</Button>
                  <Button leftSection={<IconPlus size={16} />} onClick={() => { setClientEdit(null); setVueForm(true); }} variant="gradient" gradient={{ from: '#1b365d', to: '#2a4a7a' }}>Ajouter un client</Button>
                </Group>
              </Group>

              <Divider />

              {/* Recherche */}
              <TextInput
                placeholder="Rechercher par nom ou téléphone..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                radius="md"
                size="md"
              />

              {/* Tableau avec police réduite */}
              {filteredAndSortedData.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light" radius="md">
                  Aucun client trouvé. Cliquez sur "Ajouter" pour commencer.
                </Alert>
              ) : (
                <>
                  <ScrollArea style={{ maxHeight: 600 }} offsetScrollbars>
                    <Table 
                      striped 
                      highlightOnHover 
                      withColumnBorders 
                      style={{ fontSize: '11px' }}
                    >
                      <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                        <Table.Tr>
                          <Table.Th style={{ cursor: 'pointer', color: 'white', fontSize: '11px', whiteSpace: 'nowrap', padding: '8px 4px' }} onClick={() => handleSort('nom_prenom')}>
                            <Group gap={4}>Nom {sortBy === 'nom_prenom' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                          </Table.Th>
                          <Table.Th style={{ cursor: 'pointer', color: 'white', fontSize: '11px', whiteSpace: 'nowrap', padding: '8px 4px' }} onClick={() => handleSort('telephone_id')}>
                            <Group gap={4}>Tél. {sortBy === 'telephone_id' && <Text size="xs" c="yellow">{sortOrder === 'asc' ? '↑' : '↓'}</Text>}</Group>
                          </Table.Th>
                          <Table.Th style={{ color: 'white', fontSize: '11px', padding: '8px 4px' }}>Obs.</Table.Th>
                          {tousNomsMesures.map(nom => (
                            <Table.Th key={nom} style={{ color: 'white', fontSize: '10px', fontWeight: 500, padding: '8px 4px', whiteSpace: 'nowrap' }}>
                              {nom.length > 12 ? nom.substring(0, 10) + '...' : nom}
                            </Table.Th>
                          ))}
                          <Table.Th style={{ textAlign: 'center', color: 'white', fontSize: '11px', padding: '8px 4px' }}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {paginatedData.map((client) => {
                          const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur}${m.unite !== 'cm' ? m.unite : ''}`]));
                          return (
                            <Table.Tr key={client.telephone_id}>
                              <Table.Td style={{ fontSize: '11px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                                <Text size="xs" fw={500} lineClamp={1}>
                                  {client.nom_prenom}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '11px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                                <Badge color="gray" variant="light" size="xs">{client.telephone_id}</Badge>
                              </Table.Td>
                              <Table.Td style={{ fontSize: '11px', padding: '6px 4px', maxWidth: '150px' }}>
                                <Text size="xs" lineClamp={1}>
                                  {client.observations && client.observations.length > 30 
                                    ? client.observations.substring(0, 30) + '...' 
                                    : client.observations || '-'}
                                </Text>
                              </Table.Td>
                              {tousNomsMesures.map(nom => (
                                <Table.Td key={nom} style={{ fontSize: '11px', padding: '6px 4px', whiteSpace: 'nowrap' }}>
                                  <Text size="xs" ta="center">{mesuresMap.get(nom) || '-'}</Text>
                                </Table.Td>
                              ))}
                              <Table.Td style={{ padding: '6px 4px' }}>
                                <Group gap={4} justify="center" wrap="nowrap">
                                  <Tooltip label="Voir les mesures">
                                    <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => handleVoir(client)}>
                                      <IconEye size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Modifier">
                                    <ActionIcon variant="subtle" color="orange" size="sm" onClick={() => handleModifier(client)}>
                                      <IconEdit size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Supprimer">
                                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleSupprimer(client.telephone_id)}>
                                      <IconTrash size={14} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>

                  {totalPages > 1 && (
                    <Group justify="center" mt="md">
                      <Pagination value={currentPage} onChange={setCurrentPage} total={totalPages} color="#1b365d" />
                    </Group>
                  )}
                </>
              )}
            </Stack>
          </Card>

          {/* Modals */}
          <Modal opened={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmation" centered radius="md">
            <Stack>
              <Text>Êtes-vous sûr de vouloir supprimer ce client ?</Text>
              <Text size="sm" c="dimmed">Cette action est irréversible.</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setDeleteId(null)}>Annuler</Button>
                <Button color="red" onClick={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending}>Supprimer</Button>
              </Group>
            </Stack>
          </Modal>

          {showModal && selectedClient && (
            <ModalMesures client={selectedClient} mesures={selectedClient.mesures} onClose={() => setShowModal(false)} />
          )}

          <Modal opened={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="📋 Instructions" size="md" centered radius="md">
            <Stack gap="md">
              <Text size="sm">1️⃣ Renseignez les informations personnelles du client</Text>
              <Text size="sm">2️⃣ Ajoutez les mesures du client dans l'onglet dédié</Text>
              <Text size="sm">3️⃣ Les observations sont optionnelles mais utiles pour le suivi</Text>
              <Text size="sm">4️⃣ Exportez la liste au format Excel, PDF ou Word selon vos besoins</Text>
              <Text size="sm">5️⃣ Utilisez la recherche pour filtrer rapidement les clients</Text>
              <Text size="sm">6️⃣ Cliquez sur l'icône 👁️ pour voir les mesures détaillées</Text>
              <Divider />
              <Text size="xs" c="dimmed" ta="center">Version 1.0.0 - Gestion Couture</Text>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
}