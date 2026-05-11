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
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
  Progress,
  Badge,
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
  IconCheck,
  IconTrendingUp,
  IconReceipt,
} from '@tabler/icons-react';
import FormulairePrestationRealisee from './FormulairePrestationRealisee';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import { useReactToPrint } from 'react-to-print';
import { apiDelete, apiGet } from '../../services/api';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const itemsPerPage = 10;

  const printRef = useRef<HTMLDivElement>(null);

  const chargerPrestations = async () => {
    setLoading(true)

  const prestationsData =
  await apiGet(
    "/prestations-realisees"
  );

const employesData =
  await apiGet(
    "/employes"
  );

const result: Prestation[] =

  prestationsData

    .map((pr: any) => {

      const employe =
        employesData.find(
          (e: any) =>
            e.id === pr.employe_id
        );

      return {

        id:
          pr.id,

        employe_id:
          pr.employe_id,

        date_prestation:
          pr.date_prestation,

        designation:
          pr.designation,

        valeur:
          pr.valeur,

        nombre:
          pr.nombre,

        total:
          pr.total,

        employe_nom:
          employe?.nom_prenom || ''
      };
    })

    .filter(
      (pr: any) =>
        pr.employe_nom !== ''
    )

    .sort(
      (a: any, b: any) =>

        new Date(
          b.date_prestation
        ).getTime()

        -

        new Date(
          a.date_prestation
        ).getTime()
    );

    setPrestations(result || []);
    setLoading(false);
  };

  useEffect(() => { chargerPrestations(); }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Prestations_realisees',
  });

  const handleReset = () => {
    setRecherche('');
    chargerPrestations();
    setCurrentPage(1);
    setSuccessMessage('Liste actualisée');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const prestationsFiltres = prestations.filter(p =>
    p.designation.toLowerCase().includes(recherche.toLowerCase()) ||
    p.employe_nom.toLowerCase().includes(recherche.toLowerCase())
  );

  const totalPages = Math.ceil(prestationsFiltres.length / itemsPerPage);
  const paginatedData = prestationsFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalValeur = prestationsFiltres.reduce((sum, p) => sum + p.total, 0);
  const totalPrestations = prestationsFiltres.length;
  const valeurMoyenne = totalPrestations > 0 ? totalValeur / totalPrestations : 0;

  const handleExportExcel = async () => {
    const data = prestationsFiltres.map(p => ({
      Employé: p.employe_nom,
      Date: new Date(p.date_prestation).toLocaleDateString('fr-FR'),
      Désignation: p.designation,
      'Valeur unitaire (FCFA)': p.valeur,
      Quantité: p.nombre,
      'Total (FCFA)': p.total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prestations');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const filePath = await save({
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      defaultPath: `prestations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`
    });
    if (filePath) {
      await writeFile(filePath, new Uint8Array(buffer));
      setSuccessMessage('Export Excel réussi');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    doc.setFillColor(27, 54, 93);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Liste des prestations réalisées', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 105, 32, { align: 'center' });
    
    autoTable(doc, {
      head: [['Employé', 'Date', 'Désignation', 'Valeur unit.', 'Qté', 'Total']],
      body: prestationsFiltres.map(p => [
        p.employe_nom,
        new Date(p.date_prestation).toLocaleDateString('fr-FR'),
        p.designation,
        `${p.valeur.toLocaleString()} FCFA`,
        p.nombre.toString(),
        `${p.total.toLocaleString()} FCFA`
      ]),
      startY: 50,
      headStyles: { fillColor: [27, 54, 93], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    
    const blob = doc.output('blob');
    const filePath = await save({
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: `prestations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`
    });
    if (filePath) {
      await writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
      setSuccessMessage('Export PDF réussi');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleExportWord = async () => {
    const rows = prestationsFiltres.map(p => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${p.employe_nom}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(p.date_prestation).toLocaleDateString('fr-FR')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${p.designation}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.valeur.toLocaleString()} FCFA</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.nombre}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>${p.total.toLocaleString()} FCFA</strong></td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prestations réalisées</title>
      <style>
        body { font-family: 'Calibri', Arial, sans-serif; margin: 40px; }
        h1 { color: #1b365d; border-bottom: 3px solid #1b365d; padding-bottom: 10px; }
        .info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1b365d; color: white; padding: 12px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      <h1>📋 Liste des prestations réalisées</h1>
      <div class="info">
        <p><strong>Date d'édition :</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <p><strong>Nombre de prestations :</strong> ${totalPrestations}</p>
        <p><strong>Montant total :</strong> ${totalValeur.toLocaleString()} FCFA</p>
      </div>
      <table>
        <thead>
          <tr><th>Employé</th><th>Date</th><th>Désignation</th><th>Valeur unit.</th><th>Qté</th><th>Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <p>Document généré automatiquement par Gestion Couture</p>
        <p>© ${new Date().getFullYear()} - Tous droits réservés</p>
      </div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const filePath = await save({
      filters: [{ name: 'Word', extensions: ['doc'] }],
      defaultPath: `prestations_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.doc`
    });
    if (filePath) {
      await writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
      setSuccessMessage('Export Word réussi');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const supprimer = async (id: number, designation: string) => {
    if (!
globalThis.confirm(`Supprimer la prestation "${designation}" ?`)) return;
   await apiDelete(
  `/prestations-realisees/${id}`
);
    await chargerPrestations();
    setSuccessMessage(`Prestation "${designation}" supprimée avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (vueForm) {
    return (
      <FormulairePrestationRealisee
        prestation={prestationEdition}
        onSuccess={() => { 
          setVueForm(false); 
          setPrestationEdition(null); 
          chargerPrestations();
          setSuccessMessage(prestationEdition ? 'Prestation modifiée avec succès' : 'Prestation ajoutée avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
        onCancel={() => { setVueForm(false); setPrestationEdition(null); }}
      />
    );
  }

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconClipboardList size={40} stroke={1.5} />
            <Text>Chargement des prestations...</Text>
          </Stack>
        </Card>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Container size="full ">
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
                  <IconClipboardList size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Gestion des prestations des employés</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Suivi des prestations effectuées par les employés
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {totalPrestations} prestation{totalPrestations > 1 ? 's' : ''}
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
            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total prestations</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconClipboardList size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{totalPrestations}</Text>
              <Progress value={100} size="sm" radius="xl" color="blue" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Prestations enregistrées</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Montant total</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconMoneybag size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalValeur.toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Valeur totale générée</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Valeur moyenne</Text>
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <IconTrendingUp size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">{Math.round(valeurMoyenne).toLocaleString()} FCFA</Text>
              <Progress value={(valeurMoyenne / (totalValeur || 1)) * 100} size="sm" radius="xl" color="orange" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Par prestation</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Employés actifs</Text>
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconUser size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="violet">
                {new Set(prestationsFiltres.map(p => p.employe_id)).size}
              </Text>
              <Progress value={100} size="sm" radius="xl" color="violet" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Employés concernés</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher par employé ou prestation..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 320 }}
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Actualiser">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Menu shadow="md" width={180}>
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
                  <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg" radius="md">
                    <IconPrinter size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => {
                    setPrestationEdition(null);
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouvelle prestation
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des prestations amélioré */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {prestationsFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconClipboardList size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucune prestation trouvée</Text>
                <Button variant="light" onClick={() => { setPrestationEdition(null); setVueForm(true); }}>
                  Ajouter une prestation
                </Button>
              </Stack>
            ) : (
              <>
                <div ref={printRef}>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Date</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Désignation</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'right' }}>Valeur unit.</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'center' }}>Qté</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'right' }}>Total</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'center', width: 100 }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedData.map((p) => (
                        <Table.Tr key={p.id}>
                          <Table.Td fw={500}>
                            <Group gap="xs">
                              <Avatar size="sm" radius="xl" color="blue">
                                <IconUser size={12} />
                              </Avatar>
                              {p.employe_nom}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <IconCalendar size={12} color="#1b365d" />
                              {new Date(p.date_prestation).toLocaleDateString('fr-FR')}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <IconShoppingBag size={12} color="#1b365d" />
                              {p.designation}
                            </Group>
                          </Table.Td>
                          <Table.Td ta="right">{p.valeur.toLocaleString()} FCFA</Table.Td>
                          <Table.Td ta="center">
                            <Badge color="blue" variant="light" size="sm">
                              {p.nombre}
                            </Badge>
                          </Table.Td>
                          <Table.Td ta="right" fw={700} c="green">
                            {p.total.toLocaleString()} FCFA
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              <Tooltip label="Modifier">
                                <ActionIcon
                                  size="md"
                                  variant="subtle"
                                  color="orange"
                                  onClick={() => { setPrestationEdition(p); setVueForm(true); }}
                                >
                                  <IconEdit size={18} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Supprimer">
                                <ActionIcon
                                  size="md"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => supprimer(p.id, p.designation)}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Group justify="center" p="md">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      color="#1b365d"
                      size="md"
                      radius="md"
                    />
                  </Group>
                )}
              </>
            )}
          </Card>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Gestion des prestations"
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
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouvelle prestation" pour ajouter une prestation</Text>
                  <Text size="sm">2️⃣ La recherche filtre par employé ou par désignation</Text>
                  <Text size="sm">3️⃣ Exportez la liste en Excel, PDF ou Word selon vos besoins</Text>
                  <Text size="sm">4️⃣ Utilisez l'impression pour obtenir une version papier</Text>
                  <Text size="sm">5️⃣ Les prestations sont automatiquement comptabilisées dans les salaires</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Informations :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconReceipt size={16} color="#e65100" />
                    <Text size="sm">Le total est automatiquement calculé (valeur × quantité)</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCalendar size={16} color="#e65100" />
                    <Text size="sm">La date de prestation est enregistrée automatiquement</Text>
                  </Group>
                  <Group gap="xs">
                    <IconUser size={16} color="#e65100" />
                    <Text size="sm">Seuls les employés actifs sont disponibles</Text>
                  </Group>
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
    </Box>
  );
};

export default ListePrestationsRealisees;