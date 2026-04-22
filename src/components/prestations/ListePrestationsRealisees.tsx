import React, { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  ActionIcon,
  LoadingOverlay,
  Box,
  Pagination,
  Tooltip,
  Modal,
  Divider,
  ThemeIcon,
  Menu,
  SimpleGrid,
} from '@mantine/core';
import {
  IconClipboardList,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconPrinter,
  IconFileExcel,
  IconFile,
  IconFileWord,
  IconCalendar,
  IconUser,
  IconShoppingBag,
  IconMoneybag,
  IconInfoCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import FormulairePrestationRealisee from './FormulairePrestationRealisee';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useReactToPrint } from 'react-to-print';

interface Prestation {
  id: number;
  employe_id: number;
  employe_nom: string;
  date_prestation: string;
  designation: string;
  valeur: number;
  nombre: number;
  total: number;
}

const ListePrestationsRealisees: React.FC = () => {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [prestationEdition, setPrestationEdition] = useState<Prestation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const itemsPerPage = 10;

  const printRef = useRef<HTMLDivElement>(null);

  const chargerPrestations = async () => {
    setLoading(true);
    const db = await getDb();

    const result = await db.select<Prestation[]>(`
      SELECT 
        pr.id,
        pr.employe_id,
        pr.date_prestation,
        pr.designation,
        pr.valeur,
        pr.nombre,
        pr.total,
        e.nom_prenom as employe_nom
      FROM prestations_realisees pr
      JOIN employes e ON pr.employe_id = e.id
      WHERE e.est_supprime = 0
      ORDER BY pr.date_prestation DESC
    `);

    setPrestations(result || []);
    setLoading(false);
  };

  useEffect(() => { chargerPrestations(); }, []);

  // Impression
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Prestations_realisees',
  });

  const handleReset = () => {
    setRecherche('');
    chargerPrestations();
    setCurrentPage(1);
  };

  // Filtrage par recherche
  const prestationsFiltres = prestations.filter(p =>
    p.designation.toLowerCase().includes(recherche.toLowerCase()) ||
    p.employe_nom.toLowerCase().includes(recherche.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(prestationsFiltres.length / itemsPerPage);
  const paginatedData = prestationsFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calcul des totaux
  const totalValeur = prestationsFiltres.reduce((sum, p) => sum + p.total, 0);
  const totalPrestations = prestationsFiltres.length;

  // Export Excel
  const handleExportExcel = async () => {
    const data = prestationsFiltres.map(p => ({
      Employé: p.employe_nom,
      Date: new Date(p.date_prestation).toLocaleDateString('fr-FR'),
      Désignation: p.designation,
      'Valeur unitaire': p.valeur,
      Quantité: p.nombre,
      Total: p.total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prestations');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const filePath = await save({
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      defaultPath: `prestations_${new Date().toISOString().slice(0, 19)}.xlsx`
    });
    if (filePath) await writeFile(filePath, new Uint8Array(buffer));
  };

  // Export PDF
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    doc.text('Liste des prestations réalisées', 14, 10);
    autoTable(doc, {
      head: [['Employé', 'Date', 'Désignation', 'Valeur unit.', 'Qté', 'Total']],
      body: prestationsFiltres.map(p => [
        p.employe_nom,
        new Date(p.date_prestation).toLocaleDateString('fr-FR'),
        p.designation,
        p.valeur.toLocaleString(),
        p.nombre.toString(),
        p.total.toLocaleString()
      ]),
      startY: 20,
      headStyles: { fillColor: [27, 54, 93] },
    });
    const blob = doc.output('blob');
    const filePath = await save({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: `prestations_${new Date().toISOString().slice(0, 19)}.pdf`
    });
    if (filePath) await writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
  };

  // Export Word
  const handleExportWord = async () => {
    const rows = prestationsFiltres.map(p => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${p.employe_nom}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(p.date_prestation).toLocaleDateString('fr-FR')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${p.designation}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.valeur.toLocaleString()} FCFA</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.nombre}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.total.toLocaleString()} FCFA</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prestations réalisées</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #1b365d; border-bottom: 2px solid #1b365d; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1b365d; color: white; padding: 10px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h1>📋 Liste des prestations réalisées</h1>
      <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <p><strong>Total :</strong> ${totalPrestations} prestation(s)</p>
      <p><strong>Montant total :</strong> ${totalValeur.toLocaleString()} FCFA</p>
      <table>
        <thead>
          <tr>
            <th>Employé</th><th>Date</th><th>Désignation</th><th>Valeur unit.</th><th>Qté</th><th>Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const filePath = await save({
      filters: [{ name: 'Word', extensions: ['doc'] }],
      defaultPath: `prestations_${new Date().toISOString().slice(0, 19)}.doc`
    });
    if (filePath) await writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
  };

  // Supprimer une prestation
  const supprimer = async (id: number) => {
    if (!window.confirm('Supprimer cette prestation ?')) return;
    const db = await getDb();
    await db.execute("DELETE FROM prestations_realisees WHERE id = ?", [id]);
    chargerPrestations();
  };

  if (vueForm) {
    return (
      <FormulairePrestationRealisee
        prestation={prestationEdition}
        onSuccess={() => { setVueForm(false); setPrestationEdition(null); chargerPrestations(); }}
        onCancel={() => { setVueForm(false); setPrestationEdition(null); }}
      />
    );
  }

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des prestations...</Text>
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
                <IconClipboardList size={24} color="white" />
                <Title order={2} c="white">Prestations réalisées</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Suivi des prestations effectuées par les employés
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
                <IconClipboardList size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Nombre de prestations
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconClipboardList size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalPrestations}
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Montant total
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconMoneybag size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalValeur.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par employé ou prestation..."
              leftSection={<IconSearch size={16} />}
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setCurrentPage(1);
              }}
              size="sm"
              style={{ width: 300 }}
            />
            <Group>
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={handleReset} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <Menu shadow="md" width={160}>
                <Menu.Target>
                  <Button variant="outline" leftSection={<IconFileExcel size={14} />}>
                    Exporter
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconFileExcel size={14} color="#00a84f" />}
                    onClick={handleExportExcel}
                  >
                    Excel (.xlsx)
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFile size={14} color="#e74c3c" />}
                    onClick={handleExportPDF}
                  >
                    PDF (.pdf)
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileWord size={14} color="#2980b9" />}
                    onClick={handleExportWord}
                  >
                    Word (.doc)
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Tooltip label="Imprimer">
                <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg">
                  <IconPrinter size={18} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setVueForm(true)}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvelle prestation
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU DES PRESTATIONS */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {prestationsFiltres.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucune prestation trouvée
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Valeur unit.</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Qté</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td fw={500}>
                        <Group gap={4}>
                          <IconUser size={12} />
                          {p.employe_nom}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconCalendar size={12} />
                          {new Date(p.date_prestation).toLocaleDateString('fr-FR')}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconShoppingBag size={12} />
                          {p.designation}
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        {p.valeur.toLocaleString()} FCFA
                      </Table.Td>
                      <Table.Td ta="center">{p.nombre}</Table.Td>
                      <Table.Td ta="right" fw={600} c="green">
                        {p.total.toLocaleString()} FCFA
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="orange"
                              onClick={() => { setPrestationEdition(p); setVueForm(true); }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => supprimer(p.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <Group justify="center" p="md">
                  <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={totalPages}
                    color="blue"
                    size="sm"
                  />
                </Group>
              )}
            </>
          )}
        </Card>

        {/* COMPOSANT D'IMPRESSION CACHÉ */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            <Box p="lg">
              <Title order={2} ta="center" mb="lg">Prestations réalisées</Title>
              <Text mb="md">Date : {new Date().toLocaleString('fr-FR')}</Text>
              <Table striped>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Valeur unit.</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Qté</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {prestationsFiltres.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{p.employe_nom}</Table.Td>
                      <Table.Td>{new Date(p.date_prestation).toLocaleDateString('fr-FR')}</Table.Td>
                      <Table.Td>{p.designation}</Table.Td>
                      <Table.Td ta="right">{p.valeur.toLocaleString()} FCFA</Table.Td>
                      <Table.Td ta="center">{p.nombre}</Table.Td>
                      <Table.Td ta="right">{p.total.toLocaleString()} FCFA</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </div>
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
            <Text size="sm">1. Utilisez le bouton "Nouvelle prestation" pour ajouter une prestation</Text>
            <Text size="sm">2. La recherche filtre par employé ou par désignation</Text>
            <Text size="sm">3. Exportez la liste en Excel, PDF ou Word selon vos besoins</Text>
            <Text size="sm">4. Utilisez l'impression pour obtenir une version papier</Text>
            <Text size="sm">5. Les prestations sont automatiquement comptabilisées dans les salaires</Text>
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

export default ListePrestationsRealisees;