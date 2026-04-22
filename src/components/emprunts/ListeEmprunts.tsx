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
} from '@mantine/core';
import {
  IconMoneybag,
  IconPlus,
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
} from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getDb } from '../../database/db';

interface Employe {
  id: number;
  nom_prenom: string;
}

interface Emprunt {
  id: number;
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
  const [form, setForm] = useState({ employe_id: 0, montant: 0 });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
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
    XLSX.writeFile(wb, 'emprunts.xlsx');
  };

  const handlePDF = () => {
    const doc = new jsPDF();
    (doc as any).autoTable({
      head: [['Employé', 'Montant (FCFA)', 'Date emprunt', 'Statut', 'Date déduction']],
      body: emprunts.map(e => [
        e.employe_nom,
        e.montant.toLocaleString(),
        new Date(e.date_emprunt).toLocaleDateString(),
        e.deduit ? 'Déduit' : 'Non déduit',
        e.date_deduction ? new Date(e.date_deduction).toLocaleDateString() : ''
      ])
    });
    doc.save('emprunts.pdf');
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

  const employesOptions = employes.map(e => ({
    value: e.id.toString(),
    label: e.nom_prenom
  }));

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des emprunts...</Text>
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
                <IconMoneybag size={24} color="white" />
                <Title order={2} c="white">Emprunts</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Gestion des emprunts des employés
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
                <IconMoneybag size={28} />
              </ThemeIcon>
            </Group>
          </Group>
        </Card>

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total des emprunts
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconMoneybag size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalMontant.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Déjà déduits
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconCheck size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalDeduit.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="orange.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Reste à déduire
              </Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconX size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">
              {totalNonDeduit.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group>
              <TextInput
                placeholder="Rechercher employé..."
                leftSection={<IconSearch size={16} />}
                value={recherche}
                onChange={(e) => {
                  setRecherche(e.target.value);
                  setCurrentPage(1);
                }}
                size="sm"
                style={{ width: 250 }}
              />
              <Select
                value={filtre}
                onChange={(val) => setFiltre(val as any)}
                data={[
                  { value: 'tous', label: 'Tous' },
                  { value: 'deduit', label: 'Déduits' },
                  { value: 'non_deduit', label: 'Non déduits' },
                ]}
                size="sm"
                style={{ width: 130 }}
              />
            </Group>
            <Group>
              <Tooltip label="Réinitialiser">
                <ActionIcon variant="light" onClick={handleReset} size="lg">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Imprimer">
                <ActionIcon variant="light" color="teal" onClick={handlePrint} size="lg">
                  <IconPrinter size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Excel">
                <ActionIcon variant="light" color="green" onClick={handleExcel} size="lg">
                  <IconFileExcel size={18} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="PDF">
                <ActionIcon variant="light" color="red" onClick={handlePDF} size="lg">
                  <IconFile size={18} />
                </ActionIcon>
              </Tooltip>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setIsModalOpen(true)}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvel emprunt
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU DES EMPRUNTS */}
        <div ref={printRef}>
          <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <Text ta="center" c="dimmed" py={60}>
                Aucun emprunt trouvé
              </Text>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Montant</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Date emprunt</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'center' }}>Statut</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Date déduction</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((e) => (
                      <Table.Tr key={e.id}>
                        <Table.Td fw={500}>
                          <Group gap={4}>
                            <IconUser size={12} />
                            {e.employe_nom}
                          </Group>
                        </Table.Td>
                        <Table.Td ta="right" fw={600}>
                          {e.montant.toLocaleString()} FCFA
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconCalendar size={12} />
                            {new Date(e.date_emprunt).toLocaleDateString('fr-FR')}
                          </Group>
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge
                            color={e.deduit ? 'green' : 'red'}
                            variant="light"
                            size="sm"
                            leftSection={e.deduit ? <IconCheck size={10} /> : <IconX size={10} />}
                          >
                            {e.deduit ? 'Déduit' : 'Non déduit'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {e.date_deduction ? (
                            <Group gap={4}>
                              <IconCalendar size={12} />
                              {new Date(e.date_deduction).toLocaleDateString('fr-FR')}
                            </Group>
                          ) : '-'}
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
        </div>

        {/* MODAL NOUVEL EMPRUNT */}
        <Modal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouvel emprunt"
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
            <Select
              label="Employé"
              placeholder="Choisir un employé"
              data={employesOptions}
              value={form.employe_id ? form.employe_id.toString() : null}
              onChange={(val) => setForm({ ...form, employe_id: Number(val) })}
              size="sm"
              required
            />
            <NumberInput
              label="Montant (FCFA)"
              placeholder="Ex: 50000"
              value={form.montant || undefined}
              onChange={(val) => setForm({ ...form, montant: Number(val) })}
              size="sm"
              min={0}
              step={5000}
              required
            />
            <Divider />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAdd}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Enregistrer
              </Button>
            </Group>
          </Stack>
        </Modal>

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
            <Text size="sm">1. Utilisez le bouton "Nouvel emprunt" pour ajouter un emprunt</Text>
            <Text size="sm">2. La recherche filtre par employé</Text>
            <Text size="sm">3. Filtrez par statut (Déduit / Non déduit)</Text>
            <Text size="sm">4. Exportez la liste en Excel, PDF ou imprimez-la</Text>
            <Text size="sm">5. Le bouton "Réinitialiser" remet tous les emprunts en non déduits</Text>
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

export default ListeEmprunts;