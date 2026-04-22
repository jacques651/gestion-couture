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
  ThemeIcon,
  TextInput,
  ActionIcon,
  ScrollArea,
  LoadingOverlay,
  Modal,
  Pagination,
  Tooltip,
  Menu,
  Box,
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
import 'jspdf-autotable';
import FormulaireClient from './FormulaireClient';
import ModalMesures from './ModalMesures';

// Déclaration du type pour jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
  recommandations?: string;
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
  const itemsPerPage = 10;

  // Récupérer tous les clients avec leurs mesures
  const { data: clientsAvecMesures = [], isLoading, error, refetch } = useQuery<ClientAvecMesures[]>({
    queryKey: ['clients_avec_mesures'],
    queryFn: async () => {
      const db = await getDb();

      // 1. Récupérer tous les clients actifs
      const clients = await db.select(
        `SELECT telephone_id, nom_prenom, adresse, email, recommandations 
         FROM clients WHERE est_supprime = 0`
      ) as Client[];

      if (clients.length === 0) return [];

      // 2. Récupérer toutes les mesures
      const ids = clients.map(c => c.telephone_id);
      const mesuresRows = await db.select(
        `SELECT mc.client_id, tm.nom, mc.valeur, tm.unite
         FROM mesures_clients mc
         JOIN types_mesures tm ON tm.id = mc.type_mesure_id
         WHERE mc.client_id IN (${ids.map(() => '?').join(',')})`,
        ids
      ) as { client_id: string; nom: string; valeur: number; unite: string }[];

      // 3. Grouper les mesures par client
      const mesuresParClient = new Map<string, Mesure[]>();
      for (const row of mesuresRows) {
        if (!mesuresParClient.has(row.client_id)) mesuresParClient.set(row.client_id, []);
        mesuresParClient.get(row.client_id)!.push({
          nom: row.nom,
          valeur: row.valeur,
          unite: row.unite
        });
      }

      // 4. Construire le tableau final
      return clients.map(client => ({
        ...client,
        mesures: mesuresParClient.get(client.telephone_id) || []
      }));
    },
  });

  // Extraire tous les noms de mesures distincts (pour les en-têtes de colonnes)
  const tousNomsMesures = useMemo(() => {
    const noms = new Set<string>();
    for (const client of clientsAvecMesures) {
      for (const mesure of client.mesures) {
        noms.add(mesure.nom);
      }
    }
    return Array.from(noms).sort();
  }, [clientsAvecMesures]);

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    let filtered = clientsAvecMesures.filter(c =>
      c.nom_prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telephone_id.includes(searchTerm)
    );

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nom_prenom') {
        comparison = a.nom_prenom.localeCompare(b.nom_prenom);
      } else if (sortBy === 'telephone_id') {
        comparison = a.telephone_id.localeCompare(b.telephone_id);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [clientsAvecMesures, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ============================================================
  // MUTATIONS
  // ============================================================
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const db = await getDb();
      await db.execute("UPDATE clients SET est_supprime = 1 WHERE telephone_id = ?", [id]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients_avec_mesures'] });
      setDeleteId(null);
    },
    onError: (error) => {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    }
  });

  const handleSupprimer = (id: string) => {
    setDeleteId(id);
  };

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

  // ============================================================
  // EXPORT EXCEL
  // ============================================================
  const exportToExcel = () => {
    try {
      setExporting(true);
      
      const data = filteredAndSortedData.map(client => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
        const row: any = {
          'Nom': client.nom_prenom,
          'Téléphone': client.telephone_id,
          'Recommandations': client.recommandations || '',
        };
        for (const nom of tousNomsMesures) {
          row[nom] = mesuresMap.get(nom) || '';
        }
        return row;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients avec mesures');
      
      XLSX.writeFile(wb, `clients_mesures_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      alert('✅ Export Excel réussi !');
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // EXPORT PDF
  // ============================================================
  const exportToPDF = () => {
    try {
      setExporting(true);
      
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.text('Liste des clients avec mesures', 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 25);
      doc.text(`Total : ${filteredAndSortedData.length} client(s)`, 14, 32);

      const head = ['Nom', 'Téléphone', 'Recommandations', ...tousNomsMesures];
      const body = filteredAndSortedData.map(client => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
        const ligne = [client.nom_prenom, client.telephone_id, client.recommandations || ''];
        for (const nom of tousNomsMesures) {
          ligne.push(mesuresMap.get(nom) || '');
        }
        return ligne;
      });

      doc.autoTable({
        head: [head],
        body: body,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          2: { cellWidth: 'auto' }
        }
      });

      doc.save(`clients_mesures_${new Date().toISOString().split('T')[0]}.pdf`);
      
      alert('✅ Export PDF réussi !');
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('❌ Erreur lors de l\'export PDF');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // EXPORT WORD
  // ============================================================
  const exportToWord = () => {
    try {
      setExporting(true);
      
      const rows = filteredAndSortedData.map(client => {
        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
        const cells = `<td>${client.nom_prenom}</td><td>${client.telephone_id}</td><td>${client.recommandations || ''}</td>${tousNomsMesures.map(nom => `<td>${mesuresMap.get(nom) || ''}</td>`).join('')}`;
        return `<td>${cells}</tr>`;
      }).join('');

      const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des clients avec mesures</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2980b9; border-bottom: 2px solid #2980b9; padding-bottom: 10px; }
          .info { margin: 20px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #2980b9; color: white; padding: 10px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <h1>📋 Liste des clients avec mesures</h1>
        <div class="info">
          <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Total :</strong> ${filteredAndSortedData.length} client(s)</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom</th><th>Téléphone</th><th>Recommandations</th>${tousNomsMesures.map(n => `<th>${n}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Document généré automatiquement par le système de gestion couture</p>
        </div>
      </body>
      </html>`;

      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `clients_mesures_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      alert('✅ Export Word réussi !');
    } catch (error) {
      console.error('Erreur export Word:', error);
      alert('❌ Erreur lors de l\'export Word');
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // IMPRESSION
  // ============================================================
  const handlePrint = () => {
    const rows = filteredAndSortedData.map(client => {
      const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
      const cells = `<td>${client.nom_prenom}</td><td>${client.telephone_id}</td><td>${client.recommandations || ''}</td>${tousNomsMesures.map(nom => `<td>${mesuresMap.get(nom) || ''}</td>`).join('')}`;
      return `<tr>${cells}</tr>`;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des clients avec mesures</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2980b9; border-bottom: 2px solid #2980b9; padding-bottom: 10px; }
          .info { margin: 20px 0; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #2980b9; color: white; padding: 10px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Liste des clients avec mesures</h1>
        <div class="info">
          <p><strong>Date d'impression :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Nombre total :</strong> ${filteredAndSortedData.length} client(s)</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom</th><th>Téléphone</th><th>Recommandations</th>${tousNomsMesures.map(n => `<th>${n}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <p>Document généré automatiquement par le système de gestion couture</p>
          <p>© ${new Date().getFullYear()} - Gestion Couture</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert("Veuillez autoriser les pop-ups pour cette application");
    }
  };

  if (vueForm) {
    return (
      <FormulaireClient
        clientEdit={clientEdit || undefined}
        onBack={() => setVueForm(false)}
        onSuccess={() => {
          setVueForm(false);
          refetch();
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des clients...</Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card withBorder radius="md" p="lg">
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="Erreur">
          Impossible de charger les clients
        </Alert>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER AVEC BOUTON INSTRUCTIONS */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <IconUsers size={24} color="white" />
                <Title order={2} c="white">Clients avec mesures</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gérez les informations des clients et leurs mesures
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
                <IconUsers size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* CONTENU PRINCIPAL */}
        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            {/* EN-TÊTE DU CARD */}
            <Group justify="space-between" align="flex-end">
              <div>
                <Title order={4}>Liste des clients</Title>
                <Text size="sm" c="dimmed">
                  {filteredAndSortedData.length} client{filteredAndSortedData.length > 1 ? 's' : ''} enregistré{filteredAndSortedData.length > 1 ? 's' : ''}
                </Text>
              </div>
              <Group>
                {/* Menu d'export */}
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Button
                      leftSection={<IconDownload size={16} />}
                      variant="outline"
                      loading={exporting}
                    >
                      Exporter
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Choisir le format</Menu.Label>
                    <Menu.Item
                      leftSection={<IconFileExcel size={16} color="#00a84f" />}
                      onClick={exportToExcel}
                    >
                      Excel (.xlsx)
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconFile size={16} color="#e74c3c" />}
                      onClick={exportToPDF}
                    >
                      PDF (.pdf)
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconFileWord size={16} color="#2980b9" />}
                      onClick={exportToWord}
                    >
                      Word (.doc)
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

                {/* Bouton Impression */}
                <Button
                  leftSection={<IconPrinter size={16} />}
                  onClick={handlePrint}
                  variant="outline"
                  color="teal"
                >
                  Imprimer
                </Button>

                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={() => {
                    setClientEdit(null);
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  Ajouter un client
                </Button>
              </Group>
            </Group>

            <Divider />

            {/* RECHERCHE */}
            <TextInput
              placeholder="Rechercher par nom ou téléphone..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />

            {/* TABLEAU DES CLIENTS */}
            {filteredAndSortedData.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                Aucun client trouvé. Cliquez sur "Ajouter" pour commencer.
              </Alert>
            ) : (
              <>
                <ScrollArea style={{ maxHeight: 600 }}>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th
                          style={{ cursor: 'pointer', color: 'white' }}
                          onClick={() => handleSort('nom_prenom')}
                        >
                          <Group gap={4}>
                            Nom complet
                            {sortBy === 'nom_prenom' && (
                              <Text size="xs" c="yellow">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Text>
                            )}
                          </Group>
                        </Table.Th>
                        <Table.Th
                          style={{ cursor: 'pointer', color: 'white' }}
                          onClick={() => handleSort('telephone_id')}
                        >
                          <Group gap={4}>
                            Téléphone
                            {sortBy === 'telephone_id' && (
                              <Text size="xs" c="yellow">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </Text>
                            )}
                          </Group>
                        </Table.Th>
                        <Table.Th style={{ color: 'white' }}>Recommandations</Table.Th>
                        {tousNomsMesures.map(nom => (
                          <Table.Th key={nom} style={{ color: 'white' }}>{nom}</Table.Th>
                        ))}
                        <Table.Th style={{ textAlign: 'center', color: 'white' }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedData.map((client) => {
                        const mesuresMap = new Map(client.mesures.map(m => [m.nom, `${m.valeur} ${m.unite || 'cm'}`]));
                        return (
                          <Table.Tr key={client.telephone_id}>
                            <Table.Td fw={500}>{client.nom_prenom}</Table.Td>
                            <Table.Td>
                              <Badge color="gray" variant="light" size="sm">
                                {client.telephone_id}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" lineClamp={2}>
                                {client.recommandations || '-'}
                              </Text>
                            </Table.Td>
                            {tousNomsMesures.map(nom => (
                              <Table.Td key={nom}>
                                <Text size="sm">{mesuresMap.get(nom) || '-'}</Text>
                              </Table.Td>
                            ))}
                            <Table.Td>
                              <Group gap="xs" justify="center">
                                <Tooltip label="Voir les mesures">
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    onClick={() => handleVoir(client)}
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Modifier">
                                  <ActionIcon
                                    variant="subtle"
                                    color="orange"
                                    onClick={() => handleModifier(client)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Supprimer">
                                  <ActionIcon
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleSupprimer(client.telephone_id)}
                                  >
                                    <IconTrash size={16} />
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

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      color="blue"
                    />
                  </Group>
                )}
              </>
            )}
          </Stack>
        </Card>

        {/* MODAL DE CONFIRMATION SUPPRESSION */}
        <Modal
          opened={deleteId !== null}
          onClose={() => setDeleteId(null)}
          title="Confirmation"
          centered
        >
          <Stack>
            <Text>Êtes-vous sûr de vouloir supprimer ce client ?</Text>
            <Text size="sm" c="dimmed">Cette action est irréversible.</Text>
            <Group justify="flex-end" mt="md">
              <Button variant="light" onClick={() => setDeleteId(null)}>
                Annuler
              </Button>
              <Button
                color="red"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                loading={deleteMutation.isPending}
              >
                Supprimer
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* MODAL DES MESURES */}
        {showModal && selectedClient && (
          <ModalMesures
            client={selectedClient}
            mesures={selectedClient.mesures}
            onClose={() => setShowModal(false)}
          />
        )}

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
            <Text size="sm">1. Renseignez les informations personnelles du client</Text>
            <Text size="sm">2. Ajoutez les mesures du client dans l'onglet dédié</Text>
            <Text size="sm">3. Les recommandations sont optionnelles mais utiles pour le suivi</Text>
            <Text size="sm">4. Exportez la liste au format Excel, PDF ou Word selon vos besoins</Text>
            <Text size="sm">5. Utilisez la recherche pour filtrer rapidement les clients</Text>
            <Text size="sm">6. Cliquez sur l'icône 👁️ pour voir les mesures détaillées</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
}