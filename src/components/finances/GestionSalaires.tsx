import { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  LoadingOverlay,
  Box,
  SimpleGrid,
  Divider,
  Modal,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconMoneybag,
  IconRefresh,
  IconInfoCircle,
  IconUser,
  IconCash,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconTrash,
} from '@tabler/icons-react';
import {
  payerSalaire,
  selectSafe,
  annulerPaiementSalaire
} from '../../database/db';
import ModalPaiementSalaire from './ModalPaiementSalaire';

// ================= TYPES =================
interface SalaireEmploye {
  employe_id: number;
  nom: string;
  type: 'fixe' | 'prestation';
  salaire_brut: number;
  retenue: number;
  total_paye: number;
  reste_a_payer: number;
}

interface SalairePaye {
  id: number;
  montant_net: number;
  date_paiement: string;
}

const GestionSalaires = () => {
  const [employes, setEmployes] = useState<SalaireEmploye[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmploye, setSelectedEmploye] = useState<{ id: number; nom: string } | null>(null);
  const [resteAPayer, setResteAPayer] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showAnnulationModal, setShowAnnulationModal] = useState(false);
  const [salairesEmploye, setSalairesEmploye] = useState<SalairePaye[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // ================= LOAD =================
  const loadEmployes = async () => {
    setLoading(true);
    const data = await selectSafe<any[]>(`
      SELECT 
        e.id as employe_id,
        e.nom_prenom as nom,
        e.type_remuneration as type,
        COALESCE(e.salaire_base, 0) as salaire_base,
        COALESCE((
          SELECT SUM(pr.total)
          FROM prestations_realisees pr
          WHERE pr.employe_id = e.id 
          AND (pr.paye = 0 OR pr.paye IS NULL)
        ), 0) as total_prestations,
        COALESCE((
          SELECT SUM(s.montant_net)
          FROM salaires s
          WHERE s.employe_id = e.id AND s.annule = 0
        ), 0) as total_paye,
        COALESCE((
          SELECT SUM(em.montant)
          FROM emprunts em
          WHERE em.employe_id = e.id AND em.deduit = 0
        ), 0) as retenue
      FROM employes e
      WHERE e.est_actif = 1 AND e.est_supprime = 0
    `);

    const list = data.map((emp: any) => {
      const brut =
        emp.type === 'fixe'
          ? emp.salaire_base
          : emp.total_prestations;
      const reste = brut - emp.total_paye - emp.retenue;
      return {
        employe_id: emp.employe_id,
        nom: emp.nom,
        type: emp.type,
        salaire_brut: brut,
        retenue: emp.retenue,
        total_paye: emp.total_paye,
        reste_a_payer: reste > 0 ? reste : 0
      };
    });

    setEmployes(list);
    setLoading(false);
  };

  useEffect(() => {
    loadEmployes();
  }, []);

  // ================= PAIEMENT =================
  const handlePayerClick = (emp: SalaireEmploye) => {
    setSelectedEmploye({ id: emp.employe_id, nom: emp.nom });
    setResteAPayer(emp.reste_a_payer);
    setShowModal(true);
  };

  const handleSubmitPaiement = async (
    montant: number,
    mode: string,
    observation: string
  ) => {
    if (!selectedEmploye) return;
    const emp = employes.find(e => e.employe_id === selectedEmploye.id);
    await payerSalaire({
      employe_id: selectedEmploye.id,
      type: emp?.type || 'fixe',
      montant_net: montant,
      mode,
      observation
    });
    setShowModal(false);
    await loadEmployes();
  };

  // ================= ANNULATION =================
  const handleAnnulerClick = async (emp: SalaireEmploye) => {
    const salaires = await selectSafe<SalairePaye>(`
      SELECT id, montant_net, created_at as date_paiement
      FROM salaires
      WHERE employe_id = ?
      ORDER BY created_at DESC
    `, [emp.employe_id]);
    setSalairesEmploye(salaires);
    setSelectedEmploye({ id: emp.employe_id, nom: emp.nom });
    setShowAnnulationModal(true);
  };

  const handleConfirmAnnulation = async (salaireId: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await annulerPaiementSalaire(salaireId);
      setShowAnnulationModal(false);
      await loadEmployes();
    } finally {
      setSubmitting(false);
    }
  };

  const totalBrut = employes.reduce((sum, e) => sum + e.salaire_brut, 0);
  const totalPaye = employes.reduce((sum, e) => sum + e.total_paye, 0);
  const totalReste = employes.reduce((sum, e) => sum + e.reste_a_payer, 0);

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des salaires...</Text>
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
                <Title order={2} c="white">Gestion des salaires</Title>
              </Group>
              <Text size="sm" c="gray.3">
                Paiement et suivi des salaires des employés
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
          <Card withBorder radius="md" p="md" bg="blue.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total brut
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconMoneybag size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalBrut.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="green.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total payé
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconCheck size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {totalPaye.toLocaleString()} FCFA
            </Text>
          </Card>

          <Card withBorder radius="md" p="md" bg="red.0">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Reste à payer
              </Text>
              <ThemeIcon size={30} radius="md" color="red" variant="light">
                <IconAlertCircle size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="red">
              {totalReste.toLocaleString()} FCFA
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="flex-end">
            <Tooltip label="Actualiser">
              <ActionIcon variant="light" onClick={loadEmployes} size="lg">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Card>

        {/* TABLEAU */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
              <Table.Tr>
                <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                <Table.Th style={{ color: 'white' }}>Type</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Brut</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Retenue</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Payé</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'right' }}>Reste</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {employes.map((emp) => (
                <Table.Tr key={emp.employe_id}>
                  <Table.Td fw={500}>
                    <Group gap={4}>
                      <IconUser size={14} />
                      {emp.nom}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={emp.type === 'fixe' ? 'green' : 'blue'}
                      variant="light"
                      size="sm"
                    >
                      {emp.type === 'fixe' ? 'Fixe' : 'Prestation'}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {emp.salaire_brut.toLocaleString()} FCFA
                  </Table.Td>
                  <Table.Td ta="right" c="orange" fw={600}>
                    {emp.retenue.toLocaleString()} FCFA
                  </Table.Td>
                  <Table.Td ta="right" c="green" fw={600}>
                    {emp.total_paye.toLocaleString()} FCFA
                  </Table.Td>
                  <Table.Td ta="right" c="red" fw={700}>
                    {emp.reste_a_payer.toLocaleString()} FCFA
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="center">
                      <Button
                        size="xs"
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                        leftSection={<IconCash size={14} />}
                        onClick={() => handlePayerClick(emp)}
                        disabled={emp.reste_a_payer <= 0}
                      >
                        Payer
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleAnnulerClick(emp)}
                        disabled={emp.total_paye <= 0}
                      >
                        Annuler
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
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
            <Text size="sm">1. Cliquez sur "Payer" pour effectuer un paiement de salaire</Text>
            <Text size="sm">2. Les retenues (emprunts) sont automatiquement déduites</Text>
            <Text size="sm">3. Pour les employés à prestation, le brut est calculé automatiquement</Text>
            <Text size="sm">4. Utilisez "Annuler" pour annuler un paiement récent</Text>
            <Text size="sm">5. Le tableau récapitule la situation financière de chaque employé</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">
              Version 1.0.0 - Gestion Couture
            </Text>
          </Stack>
        </Modal>

        {/* MODAL PAIEMENT */}
        {showModal && selectedEmploye && (
          <ModalPaiementSalaire
            employe={selectedEmploye}
            salaire={{ resteAPayer }}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmitPaiement}
          />
        )}

        {/* MODAL ANNULATION */}
        <Modal
          opened={showAnnulationModal}
          onClose={() => setShowAnnulationModal(false)}
          title={`Annuler paiement - ${selectedEmploye?.nom}`}
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
            {salairesEmploye.length === 0 ? (
              <Text ta="center" c="dimmed" py={20}>
                Aucun paiement trouvé
              </Text>
            ) : (
              salairesEmploye.map((s) => (
                <Card key={s.id} withBorder p="sm" radius="md">
                  <Group justify="space-between">
                    <Stack gap={0}>
                      <Text fw={700} size="lg" c="blue">
                        {s.montant_net.toLocaleString()} FCFA
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(s.date_paiement).toLocaleDateString('fr-FR')}
                      </Text>
                    </Stack>
                    <Button
                      size="sm"
                      color="red"
                      variant="light"
                      leftSection={<IconX size={14} />}
                      onClick={() => handleConfirmAnnulation(s.id)}
                      loading={submitting}
                    >
                      Annuler
                    </Button>
                  </Group>
                </Card>
              ))
            )}
            <Divider />
            <Group justify="flex-end">
              <Button variant="light" onClick={() => setShowAnnulationModal(false)}>
                Fermer
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default GestionSalaires;