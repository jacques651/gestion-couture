import { useState, useEffect } from 'react';
import { journaliserAction } from "../../services/journal";
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
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
  Progress,
} from '@mantine/core';
import {
  IconMoneybag,
  IconRefresh,
  IconInfoCircle,
  IconUser,
  IconCash,
  IconCheck,
  IconX,
  IconTrash,
  IconTrendingUp,
  IconTrendingDown,
  IconReceipt,
  IconCalendar,
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

    // Journalisation paiement salaire
    await journaliserAction({
      utilisateur: 'Utilisateur',
      action: 'CREATE',
      table: 'salaires',
      idEnregistrement: selectedEmploye.id,
      details:
        `Paiement salaire : ${selectedEmploye.nom} - ` +
        `${montant.toLocaleString()} FCFA (${mode})`
    });

    setShowModal(false);
    await loadEmployes();
    setSuccessMessage(`Paiement de ${montant.toLocaleString()} FCFA effectué pour ${selectedEmploye.nom}`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // ================= ANNULATION =================
  const handleAnnulerClick = async (emp: SalaireEmploye) => {
    const salaires = await selectSafe<SalairePaye>(`
      SELECT id, montant_net, date_paiement
      FROM salaires
      WHERE employe_id = ?
      ORDER BY date_paiement DESC
    `, [emp.employe_id]);
    setSalairesEmploye(salaires);
    setSelectedEmploye({ id: emp.employe_id, nom: emp.nom });
    setShowAnnulationModal(true);
  };

  const handleConfirmAnnulation = async (salaireId: number, montant: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await annulerPaiementSalaire(salaireId);

      // Journalisation annulation salaire
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'DELETE',
        table: 'salaires',
        idEnregistrement: salaireId,
        details:
          `Annulation paiement salaire : ` +
          `${selectedEmploye?.nom} - ` +
          `${montant.toLocaleString()} FCFA`
      });
      setShowAnnulationModal(false);
      await loadEmployes();
      setSuccessMessage(`Annulation du paiement de ${montant.toLocaleString()} FCFA effectuée`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const totalBrut = employes.reduce((sum, e) => sum + e.salaire_brut, 0);
  const totalPaye = employes.reduce((sum, e) => sum + e.total_paye, 0);
  const totalReste = employes.reduce((sum, e) => sum + e.reste_a_payer, 0);
  const tauxPaiement = totalBrut > 0 ? (totalPaye / totalBrut) * 100 : 0;

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconMoneybag size={40} stroke={1.5} />
            <Text>Chargement des salaires...</Text>
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
                  <IconMoneybag size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Gestion des salaires</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Paiement et suivi des salaires des employés
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {employes.length} employé{employes.length > 1 ? 's' : ''}
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
            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#e8f4fd' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total brut</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconTrendingUp size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{totalBrut.toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="blue" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Masse salariale brute</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#ebfbee' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total payé</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{totalPaye.toLocaleString()} FCFA</Text>
              <Progress value={tauxPaiement} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>{Math.round(tauxPaiement)}% payé</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder style={{ backgroundColor: '#fff5f5' }}>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Reste à payer</Text>
                <ThemeIcon size="lg" radius="md" color="red" variant="light">
                  <IconTrendingDown size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="red">{totalReste.toLocaleString()} FCFA</Text>
              <Progress value={totalBrut > 0 ? (totalReste / totalBrut) * 100 : 0} size="sm" radius="xl" color="red" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>En attente de paiement</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Retenues totales</Text>
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <IconReceipt size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">{employes.reduce((sum, e) => sum + e.retenue, 0).toLocaleString()} FCFA</Text>
              <Progress value={100} size="sm" radius="xl" color="orange" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>Emprunts déduits</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="flex-end">
              <Tooltip label="Actualiser les données">
                <ActionIcon
                  variant="light"
                  onClick={async () => {

                    await loadEmployes();

                    await journaliserAction({
                      utilisateur: 'Utilisateur',
                      action: 'UPDATE',
                      table: 'gestion_salaires',
                      idEnregistrement: 'REFRESH',
                      details: 'Actualisation des données salaires'
                    });

                  }}

                  size="lg" radius="md">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>

          {/* Tableau des salaires - Lignes compactes */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {employes.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconMoneybag size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun employé actif trouvé</Text>
              </Stack>
            ) : (
              <Table striped highlightOnHover verticalSpacing="xs" horizontalSpacing="sm">
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white', padding: '10px 12px' }}>Employé</Table.Th>
                    <Table.Th style={{ color: 'white', padding: '10px 12px' }}>Type</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', padding: '10px 12px' }}>Brut</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', padding: '10px 12px' }}>Retenue</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', padding: '10px 12px' }}>Payé</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right', padding: '10px 12px' }}>Reste</Table.Th>
                    <Table.Th style={{ textAlign: 'center', color: 'white', padding: '10px 12px', width: 180 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {employes.map((emp) => (
                    <Table.Tr key={emp.employe_id}>
                      <Table.Td fw={500} style={{ padding: '8px 12px' }}>
                        <Group gap="xs" wrap="nowrap">
                          <Avatar size={28} radius="xl" color="blue">
                            <IconUser size={14} />
                          </Avatar>
                          <Text size="sm" lineClamp={1}>{emp.nom}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ padding: '8px 12px' }}>
                        <Badge
                          color={emp.type === 'fixe' ? 'green' : 'blue'}
                          variant="light"
                          size="sm"
                        >
                          {emp.type === 'fixe' ? 'Fixe' : 'Prestation'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right" style={{ padding: '8px 12px' }}>
                        <Badge color="blue" variant="light" size="sm">
                          {emp.salaire_brut.toLocaleString()}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right" style={{ padding: '8px 12px' }}>
                        {emp.retenue > 0 ? (
                          <Badge color="orange" variant="light" size="sm">
                            {emp.retenue.toLocaleString()}
                          </Badge>
                        ) : '-'}
                      </Table.Td>
                      <Table.Td ta="right" style={{ padding: '8px 12px' }}>
                        <Badge color="green" variant="light" size="sm">
                          {emp.total_paye.toLocaleString()}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right" style={{ padding: '8px 12px' }}>
                        <Badge color={emp.reste_a_payer > 0 ? "red" : "green"} variant="light" size="sm">
                          {emp.reste_a_payer.toLocaleString()}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ padding: '8px 12px' }}>
                        <Group gap="xs" justify="center" wrap="nowrap">
                          <Button
                            size="compact-xs"
                            variant="gradient"
                            gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                            leftSection={<IconCash size={14} />}
                            onClick={() => handlePayerClick(emp)}
                            disabled={emp.reste_a_payer <= 0}
                            radius="md"
                            style={{ minWidth: 70 }}
                          >
                            Payer
                          </Button>
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleAnnulerClick(emp)}
                            disabled={emp.total_paye <= 0}
                            radius="md"
                            style={{ minWidth: 70 }}
                          >
                            Annuler
                          </Button>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Gestion des salaires"
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
                  <Text size="sm">1️⃣ Cliquez sur "Payer" pour effectuer un paiement de salaire</Text>
                  <Text size="sm">2️⃣ Les retenues (emprunts) sont automatiquement déduites</Text>
                  <Text size="sm">3️⃣ Pour les employés à prestation, le brut est calculé automatiquement</Text>
                  <Text size="sm">4️⃣ Utilisez "Annuler" pour annuler un paiement récent</Text>
                  <Text size="sm">5️⃣ Le tableau récapitule la situation financière de chaque employé</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Informations :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconCalendar size={16} color="#e65100" />
                    <Text size="sm">Les paiements sont horodatés pour le suivi</Text>
                  </Group>
                  <Group gap="xs">
                    <IconReceipt size={16} color="#e65100" />
                    <Text size="sm">Les retenues correspondent aux emprunts non déduits</Text>
                  </Group>
                  <Group gap="xs">
                    <IconTrendingUp size={16} color="#e65100" />
                    <Text size="sm">Le taux de paiement est calculé automatiquement</Text>
                  </Group>
                </Stack>
              </Paper>

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

          {/* MODAL ANNULATION améliorée */}
          <Modal
            opened={showAnnulationModal}
            onClose={() => setShowAnnulationModal(false)}
            title={`Annuler paiement - ${selectedEmploye?.nom}`}
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
              <Text size="sm" c="dimmed">
                Sélectionnez le paiement à annuler :
              </Text>
              {salairesEmploye.length === 0 ? (
                <Text ta="center" c="dimmed" py={20}>
                  Aucun paiement trouvé
                </Text>
              ) : (
                salairesEmploye.map((s) => (
                  <Paper key={s.id} p="sm" radius="md" withBorder>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="xs" wrap="nowrap">
                        <IconCash size={16} color="#1b365d" />
                        <Text fw={700} size="md" c="blue">
                          {s.montant_net.toLocaleString()} FCFA
                        </Text>
                        <IconCalendar size={12} color="#666" />
                        <Text size="xs" c="dimmed">
                          {new Date(s.date_paiement).toLocaleDateString('fr-FR')}
                        </Text>
                      </Group>
                      <Button
                        size="compact-xs"
                        color="red"
                        variant="light"
                        leftSection={<IconX size={14} />}
                        onClick={() => handleConfirmAnnulation(s.id, s.montant_net)}
                        loading={submitting}
                        radius="md"
                      >
                        Annuler
                      </Button>
                    </Group>
                  </Paper>
                ))
              )}
              <Divider />
              <Group justify="flex-end">
                <Button variant="light" onClick={() => setShowAnnulationModal(false)} radius="md">
                  Fermer
                </Button>
              </Group>
            </Stack>
          </Modal>
        </Stack>
      </Container>
    </Box>
  );
};

export default GestionSalaires;