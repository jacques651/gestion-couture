import { useEffect, useState, useRef } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Pagination,
  Tooltip,
  Box,
  Modal,
  Divider,
  ThemeIcon,
  SimpleGrid,
  Select,
  NumberInput,
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
  Progress,
} from '@mantine/core';
import {
  IconMoneybag,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconPrinter,
  IconFileExcel,
  IconFile,
  IconUser,
  IconCalendar,
  IconCheck,
  IconX,
  IconWallet,
  IconTrendingDown,
  IconCash,
  IconReceipt,
} from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDb } from '../../database/db';

interface Employe {
  id: number;
  nom_prenom: string;
}

interface Emprunt {
  id: number;
  employe_id: number;
  employe_nom: string;
  montant: number;
  date_emprunt: string;
  deduit: number;
  salaire_id: number | null;
  date_deduction: string | null;
}

const ListeEmprunts: React.FC = () => {
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<'tous' | 'deduit' | 'non_deduit'>('tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmprunt, setEditingEmprunt] = useState<Emprunt | null>(null);
  const [form, setForm] = useState({ employe_id: 0, montant: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 10;

  const fetchEmployes = async () => {
    const db = await getDb();
    const res = await db.select<Employe[]>(`
      SELECT id, nom_prenom 
      FROM employes
      WHERE est_supprime = 0 AND est_actif = 1
      ORDER BY nom_prenom
    `);
    setEmployes(res || []);
  };

  const fetchEmprunts = async () => {
    setLoading(true);
    const db = await getDb();
    const res = await db.select<Emprunt[]>(`
      SELECT 
        e.id,
        e.employe_id,
        e.montant,
        e.date_emprunt,
        e.deduit,
        e.salaire_id,
        e.date_deduction,
        emp.nom_prenom as employe_nom
      FROM emprunts e
      LEFT JOIN employes emp ON emp.id = e.employe_id
      ORDER BY e.date_emprunt DESC
    `);
    setEmprunts(res || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployes();
    fetchEmprunts();
  }, []);

  const handleAdd = async () => {
    if (!form.employe_id || form.montant <= 0) {
      alert("Veuillez sélectionner un employé et un montant valide");
      return;
    }
    const db = await getDb();
    await db.execute(
      `INSERT INTO emprunts (employe_id, montant, date_emprunt)
       VALUES (?, ?, DATE('now'))`,
      [form.employe_id, form.montant]
    );
    setIsModalOpen(false);
    setForm({ employe_id: 0, montant: 0 });
    await fetchEmprunts();
    setSuccessMessage(`Emprunt de ${form.montant.toLocaleString()} FCFA enregistré`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleEdit = async () => {
    if (!editingEmprunt) return;
    if (!form.employe_id || form.montant <= 0) {
      alert("Veuillez sélectionner un employé et un montant valide");
      return;
    }
    const db = await getDb();
    await db.execute(
      `UPDATE emprunts 
       SET employe_id = ?, montant = ?
       WHERE id = ? AND deduit = 0`,
      [form.employe_id, form.montant, editingEmprunt.id]
    );
    setIsEditModalOpen(false);
    setEditingEmprunt(null);
    setForm({ employe_id: 0, montant: 0 });
    await fetchEmprunts();
    setSuccessMessage(`Emprunt modifié avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const db = await getDb();
    await db.execute(`DELETE FROM emprunts WHERE id = ? AND deduit = 0`, [deleteId]);
    setDeleteId(null);
    await fetchEmprunts();
    setSuccessMessage(`Emprunt supprimé avec succès`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const openEditModal = (emprunt: Emprunt) => {
    if (emprunt.deduit === 1) {
      alert("Cet emprunt a déjà été déduit et ne peut pas être modifié");
      return;
    }
    setEditingEmprunt(emprunt);
    setForm({
      employe_id: emprunt.employe_id,
      montant: emprunt.montant
    });
    setIsEditModalOpen(true);
  };

  const openDeleteConfirm = (id: number, deduit: number) => {
    if (deduit === 1) {
      alert("Cet emprunt a déjà été déduit et ne peut pas être supprimé");
      return;
    }
    setDeleteId(id);
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ Réinitialiser tous les emprunts déduits ?\nCela annulera les déductions et les liens avec les salaires.")) return;
    const db = await getDb();
    await db.execute(`
      UPDATE emprunts 
      SET deduit = 0, salaire_id = NULL, date_deduction = NULL
      WHERE deduit = 1
    `);
    await fetchEmprunts();
    setRecherche('');
    setFiltre('tous');
    setCurrentPage(1);
    setSuccessMessage("Tous les emprunts ont été réinitialisés");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Liste_Emprunts'
  });

  const handleExcel = () => {
    const data = emprunts.map(e => ({
      Employé: e.employe_nom,
      Montant: e.montant,
      Date_emprunt: e.date_emprunt,
      Statut: e.deduit ? 'Déduit' : 'Non déduit',
      Salaire_ID: e.salaire_id || '',
      Date_déduction: e.date_deduction || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emprunts');
    XLSX.writeFile(wb, `emprunts_${new Date().toISOString().split('T')[0]}.xlsx`);
    setSuccessMessage("Export Excel réussi");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(27, 54, 93);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Liste des emprunts', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 105, 32, { align: 'center' });
    
    autoTable(doc, {
      head: [['Employé', 'Montant (FCFA)', 'Date emprunt', 'Statut', 'Date déduction']],
      body: emprunts.map(e => [
        e.employe_nom,
        e.montant.toLocaleString(),
        new Date(e.date_emprunt).toLocaleDateString('fr-FR'),
        e.deduit ? 'Déduit' : 'Non déduit',
        e.date_deduction ? new Date(e.date_deduction).toLocaleDateString('fr-FR') : ''
      ]),
      startY: 50,
      headStyles: { fillColor: [27, 54, 93], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save(`emprunts_${new Date().toISOString().split('T')[0]}.pdf`);
    setSuccessMessage("Export PDF réussi");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filtered = emprunts.filter(e => {
    const match = e.employe_nom?.toLowerCase().includes(recherche.toLowerCase());
    if (!match) return false;
    if (filtre === 'deduit') return e.deduit === 1;
    if (filtre === 'non_deduit') return e.deduit === 0;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalMontant = filtered.reduce((sum, e) => sum + e.montant, 0);
  const totalDeduit = filtered.filter(e => e.deduit === 1).reduce((sum, e) => sum + e.montant, 0);
  const totalNonDeduit = totalMontant - totalDeduit;
  const tauxDeduction = totalMontant > 0 ? (totalDeduit / totalMontant) * 100 : 0;

  const employesOptions = employes.map(e => ({
    value: e.id.toString(),
    label: e.nom_prenom
  }));

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconMoneybag size={40} stroke={1.5} />
            <Text>Chargement des emprunts...</Text>
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
                  <IconMoneybag size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Emprunts</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gestion des emprunts des employés
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {emprunts.length} emprunt{emprunts.length > 1 ? 's' : ''}
                    </Badge>
                    <Badge size="sm" variant="white" color="green">
                      {emprunts.filter(e => e.deduit).length} déduit{emprunts.filter(e => e.deduit).length > 1 ? 's' : ''}
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
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total emprunts</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconWallet size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{totalMontant.toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="blue" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Somme totale</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Déjà déduits</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalDeduit.toLocaleString()} FCFA</Text>
              <Progress value={(totalDeduit / totalMontant) * 100} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>{Math.round((totalDeduit / totalMontant) * 100) || 0}% remboursé</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff3e0' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Reste à déduire</Text>
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <IconTrendingDown size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">{totalNonDeduit.toLocaleString()} FCFA</Text>
              <Progress value={totalMontant > 0 ? (totalNonDeduit / totalMontant) * 100 : 0} size="sm" radius="xl" color="orange" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>En attente</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Taux de déduction</Text>
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconReceipt size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="violet">{Math.round(tauxDeduction)}%</Text>
              <Progress value={tauxDeduction} size="sm" radius="xl" color="violet" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Taux de remboursement</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher employé..."
                  leftSection={<IconSearch size={16} />}
                  value={recherche}
                  onChange={(e) => {
                    setRecherche(e.target.value);
                    setCurrentPage(1);
                  }}
                  size="md"
                  radius="md"
                  style={{ width: 280 }}
                />
                <Select
                  value={filtre}
                  onChange={(val) => setFiltre(val as any)}
                  data={[
                    { value: 'tous', label: '📊 Tous' },
                    { value: 'deduit', label: '✅ Déduits' },
                    { value: 'non_deduit', label: '⏳ Non déduits' },
                  ]}
                  size="md"
                  radius="md"
                  style={{ width: 160 }}
                />
              </Group>
              <Group gap="sm">
                <Tooltip label="Réinitialiser les déductions">
                  <ActionIcon variant="light" onClick={handleReset} size="lg" radius="md">
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Imprimer">
                  <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg" radius="md">
                    <IconPrinter size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Exporter Excel">
                  <ActionIcon variant="light" color="green" onClick={handleExcel} size="lg" radius="md">
                    <IconFileExcel size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Exporter PDF">
                  <ActionIcon variant="light" color="red" onClick={handlePDF} size="lg" radius="md">
                    <IconFile size={18} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => setIsModalOpen(true)}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouvel emprunt
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des emprunts avec actions */}
          <div ref={printRef}>
            <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <Stack align="center" py={60} gap="sm">
                  <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                    <IconMoneybag size={30} />
                  </ThemeIcon>
                  <Text c="dimmed" size="lg">Aucun emprunt trouvé</Text>
                  <Button variant="light" onClick={() => setIsModalOpen(true)}>
                    Ajouter un emprunt
                  </Button>
                </Stack>
              ) : (
                <>
                  <Table striped highlightOnHover>
                    <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                      <Table.Tr>
                        <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                        <Table.Th style={{ color: 'white', textAlign: 'right' }}>Montant</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Date emprunt</Table.Th>
                        <Table.Th style={{ textAlign: 'center', color: 'white' }}>Statut</Table.Th>
                        <Table.Th style={{ color: 'white' }}>Date déduction</Table.Th>
                        <Table.Th style={{ textAlign: 'center', color: 'white', width: 120 }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedData.map((e) => (
                        <Table.Tr key={e.id}>
                          <Table.Td fw={500}>
                            <Group gap="xs">
                              <Avatar size="sm" radius="xl" color="blue">
                                <IconUser size={12} />
                              </Avatar>
                              {e.employe_nom}
                            </Group>
                          </Table.Td>
                          <Table.Td ta="right" fw={600}>
                            <Badge color="blue" variant="light" size="md">
                              {e.montant.toLocaleString()} FCFA
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <IconCalendar size={12} color="#1b365d" />
                              <Text size="sm">{new Date(e.date_emprunt).toLocaleDateString('fr-FR')}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td ta="center">
                            <Badge
                              color={e.deduit ? 'green' : 'red'}
                              variant="light"
                              size="md"
                              leftSection={e.deduit ? <IconCheck size={12} /> : <IconX size={12} />}
                            >
                              {e.deduit ? 'Déduit' : 'Non déduit'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {e.date_deduction ? (
                              <Group gap={4}>
                                <IconCalendar size={12} color="#1b365d" />
                                <Text size="sm">{new Date(e.date_deduction).toLocaleDateString('fr-FR')}</Text>
                              </Group>
                            ) : (
                              <Text size="sm" c="dimmed">—</Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="center">
                              <Tooltip label="Modifier">
                                <ActionIcon
                                  size="md"
                                  variant="subtle"
                                  color="orange"
                                  onClick={() => openEditModal(e)}
                                  disabled={e.deduit === 1}
                                >
                                  <IconEdit size={18} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Supprimer">
                                <ActionIcon
                                  size="md"
                                  variant="subtle"
                                  color="red"
                                  onClick={() => openDeleteConfirm(e.id, e.deduit)}
                                  disabled={e.deduit === 1}
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
          </div>

          {/* Modal Nouvel emprunt */}
          <Modal
            opened={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="💰 Nouvel emprunt"
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
              <Select
                label="Employé"
                placeholder="Choisir un employé"
                data={employesOptions}
                value={form.employe_id ? form.employe_id.toString() : null}
                onChange={(val) => setForm({ ...form, employe_id: Number(val) })}
                size="md"
                radius="md"
                required
              />
              <NumberInput
                label="Montant (FCFA)"
                placeholder="Ex: 50000"
                value={form.montant || undefined}
                onChange={(val) => setForm({ ...form, montant: Number(val) })}
                size="md"
                radius="md"
                min={0}
                step={5000}
                thousandSeparator=" "
                required
              />
              <Divider />
              <Group justify="flex-end" gap="md">
                <Button variant="light" onClick={() => setIsModalOpen(false)} radius="md">
                  Annuler
                </Button>
                <Button
                  onClick={handleAdd}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                  leftSection={<IconPlus size={16} />}
                >
                  Enregistrer l'emprunt
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Modal Modification emprunt */}
          <Modal
            opened={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingEmprunt(null);
              setForm({ employe_id: 0, montant: 0 });
            }}
            title="✏️ Modifier l'emprunt"
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
              <Select
                label="Employé"
                placeholder="Choisir un employé"
                data={employesOptions}
                value={form.employe_id ? form.employe_id.toString() : null}
                onChange={(val) => setForm({ ...form, employe_id: Number(val) })}
                size="md"
                radius="md"
                required
              />
              <NumberInput
                label="Montant (FCFA)"
                placeholder="Ex: 50000"
                value={form.montant || undefined}
                onChange={(val) => setForm({ ...form, montant: Number(val) })}
                size="md"
                radius="md"
                min={0}
                step={5000}
                thousandSeparator=" "
                required
              />
              <Divider />
              <Group justify="flex-end" gap="md">
                <Button variant="light" onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEmprunt(null);
                  setForm({ employe_id: 0, montant: 0 });
                }} radius="md">
                  Annuler
                </Button>
                <Button
                  onClick={handleEdit}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                  leftSection={<IconEdit size={16} />}
                >
                  Modifier
                </Button>
              </Group>
            </Stack>
          </Modal>

          {/* Modal confirmation suppression */}
          <Modal
            opened={deleteId !== null}
            onClose={() => setDeleteId(null)}
            title="Confirmation de suppression"
            size="sm"
            centered
            radius="md"
          >
            <Stack>
              <Text>Êtes-vous sûr de vouloir supprimer cet emprunt ?</Text>
              <Text size="sm" c="dimmed">Cette action est irréversible.</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={() => setDeleteId(null)}>Annuler</Button>
                <Button color="red" onClick={handleDelete}>Supprimer</Button>
              </Group>
            </Stack>
          </Modal>

          {/* Modal Instructions */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Gestion des emprunts"
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
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouvel emprunt" pour ajouter un emprunt</Text>
                  <Text size="sm">2️⃣ La recherche filtre par employé</Text>
                  <Text size="sm">3️⃣ Filtrez par statut (Déduit / Non déduit)</Text>
                  <Text size="sm">4️⃣ Exportez la liste en Excel, PDF ou imprimez-la</Text>
                  <Text size="sm">5️⃣ Le bouton "Réinitialiser" remet tous les emprunts en non déduits</Text>
                  <Text size="sm">6️⃣ ✏️ Modifier et 🗑️ Supprimer les emprunts non déduits</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Informations :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCash size={16} color="#e65100" />
                    <Text size="sm">Les emprunts sont automatiquement déduits des salaires</Text>
                  </Group>
                  <Group gap="xs">
                    <IconCalendar size={16} color="#e65100" />
                    <Text size="sm">La date de déduction correspond au jour de paiement</Text>
                  </Group>
                  <Group gap="xs">
                    <IconWallet size={16} color="#e65100" />
                    <Text size="sm">Un emprunt ne peut pas être modifié après déduction</Text>
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

export default ListeEmprunts;