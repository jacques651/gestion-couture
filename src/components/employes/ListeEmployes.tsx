import React, { useEffect, useState } from 'react';
import { journaliserAction } from "../../services/journal";
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
  Container,
  Avatar,
  Center,
  Paper,
  Notification,
  Progress,
} from '@mantine/core';
import {
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconPhone,
  IconCalendar,
  IconWallet,
  IconUserCheck,
  IconUserX,
  IconCash,
  IconPercentage,
  IconCheck,
  IconUserStar,
} from '@tabler/icons-react';
import { getDb, payerSalaireSecurise } from '../../database/db';
import FormulaireEmploye from './FormulaireEmploye';

interface Employe {
  id: number;
  nom_prenom: string;
  telephone: string;
  date_embauche: string | null;
  est_actif: number;
  type_remuneration?: string;
  salaire_base?: number;
}

const ListeEmployes: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [recherche, setRecherche] = useState('');
  const [vueForm, setVueForm] = useState(false);
  const [employeEdition, setEmployeEdition] = useState<Employe | null>(null);
  const [loadingPaiement, setLoadingPaiement] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [paiementResult, setPaiementResult] = useState<any>(null);
  const itemsPerPage = 10;

  const chargerEmployes = async () => {
    setLoading(true);
    const db = await getDb();
    const result = await db.select<Employe[]>(
      `SELECT * FROM employes 
       WHERE est_supprime = 0 
       ORDER BY nom_prenom`
    );
    setEmployes(result.flat());
    setLoading(false);
  };

  useEffect(() => {
    chargerEmployes();
  }, []);

  const supprimerEmploye = async (
    id: number,
    nom: string
  ) => {

    if (!
globalThis.confirm(
      `Supprimer l'employé "${nom}" ?`
    )) {
      return;
    }

    try {

      const db = await getDb();

      // Suppression logique
      await db.execute(
        `
      UPDATE employes
      SET est_supprime = 1
      WHERE id = ?
      `,
        [id]
      );

      // Journalisation
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'DELETE',
        table: 'employes',
        idEnregistrement: id,
        details: `Suppression employé : ${nom}`
      });

      // Recharge
      await chargerEmployes();

      // Succès
      setSuccessMessage(
        `Employé "${nom}" supprimé avec succès`
      );

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    } catch (error) {

      console.error(
        "Erreur suppression employé:",
        error
      );

    }
  };

  const handlePaiement = async (e: Employe) => {
    try {
      setLoadingPaiement(e.id);
      const result = await payerSalaireSecurise(e.id);
      
      // Journalisation paiement
      await journaliserAction({
        utilisateur: 'Utilisateur',
        action: 'CREATE',
        table: 'paiements_salaires',
        idEnregistrement: e.id,
        details:
          `Paiement salaire : ${e.nom_prenom} - ` +
          `${result.montant_net.toLocaleString()} FCFA`
      });

      setPaiementResult({
        employe: e.nom_prenom,
        brut: result.montant_brut,
        retenue: result.retenue,
        net: result.montant_net
      });
      await chargerEmployes();
      setShowSuccess(true);
      setSuccessMessage(`Paiement effectué pour ${e.nom_prenom}`);
      setTimeout(() => setPaiementResult(null), 5000);
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setLoadingPaiement(null);
    }
  };

  const handleReset = () => {
    setRecherche('');
    chargerEmployes();
    setCurrentPage(1);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const employesFiltres = employes.filter(e =>
    e.nom_prenom.toLowerCase().includes(recherche.toLowerCase()) ||
    (e.telephone && e.telephone.includes(recherche))
  );

  const totalPages = Math.ceil(employesFiltres.length / itemsPerPage);
  const paginatedData = employesFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const employesActifs = employesFiltres.filter(e => e.est_actif === 1).length;
  const totalSalaires = employesFiltres
    .filter(e => e.type_remuneration === 'fixe')
    .reduce((sum, e) => sum + (e.salaire_base || 0), 0);
  const employesPrestation = employesFiltres.filter(e => e.type_remuneration === 'prestation').length;
  const tauxActif = employesFiltres.length > 0 ? (employesActifs / employesFiltres.length) * 100 : 0;

  if (vueForm) {
    return (
      <FormulaireEmploye
        employe={employeEdition || undefined}
        onSuccess={() => {
          setVueForm(false);
          setEmployeEdition(null);
          chargerEmployes();
          setSuccessMessage(employeEdition ? 'Employé modifié avec succès' : 'Employé créé avec succès');
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }}
        onCancel={() => {
          setVueForm(false);
          setEmployeEdition(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Card withBorder radius="lg" p="xl">
          <LoadingOverlay visible={true} />
          <Stack align="center" gap="md">
            <IconUsers size={40} stroke={1.5} />
            <Text>Chargement des employés...</Text>
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

          {/* Modal de résultat de paiement */}
          {paiementResult && (
            <Modal
              opened={true}
              onClose={() => setPaiementResult(null)}
              title="💰 Résultat du paiement"
              size="md"
              centered
              radius="lg"
            >
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600}>Employé :</Text>
                  <Text>{paiementResult.employe}</Text>
                </Group>
                <Divider />
                <Group justify="space-between">
                  <Text c="blue" fw={600}>Salaire brut :</Text>
                  <Text fw={700} c="blue">{paiementResult.brut.toLocaleString()} FCFA</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="red" fw={600}>Retenue (emprunts) :</Text>
                  <Text fw={700} c="red">{paiementResult.retenue.toLocaleString()} FCFA</Text>
                </Group>
                <Group justify="space-between">
                  <Text c="green" fw={600}>Salaire net :</Text>
                  <Text fw={700} c="green" size="lg">{paiementResult.net.toLocaleString()} FCFA</Text>
                </Group>
                <Divider />
                <Button variant="light" onClick={() => setPaiementResult(null)} fullWidth>
                  Fermer
                </Button>
              </Stack>
            </Modal>
          )}

          {/* Header amélioré */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconUsers size={30} color="black" />
                </Avatar>
                <Box>
                  <Title order={1} c="white" size="h2">Gestion des employés</Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    Gérez les informations et les salaires de votre équipe
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge size="sm" variant="white" color="blue">
                      {employesFiltres.length} employé{employesFiltres.length > 1 ? 's' : ''}
                    </Badge>
                    <Badge size="sm" variant="white" color="green">
                      {employesActifs} actif{employesActifs > 1 ? 's' : ''}
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
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Employés actifs</Text>
                <ThemeIcon size="lg" radius="md" color="green" variant="light">
                  <IconUserCheck size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="green">{employesActifs}</Text>
              <Progress value={tauxActif} size="sm" radius="xl" color="green" mt={8} />
              <Text size="xs" c="dimmed" mt={4}>{Math.round(tauxActif)}% des employés</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total salaires fixes</Text>
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconCash size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="blue">{totalSalaires.toLocaleString()} FCFA</Text>
              <Text size="xs" c="dimmed" mt={4}>Masse salariale mensuelle</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>À prestation</Text>
                <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                  <IconPercentage size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="orange">{employesPrestation}</Text>
              <Text size="xs" c="dimmed" mt={4}>Employés à prestation</Text>
            </Paper>

            <Paper p="md" radius="lg" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Ancienneté</Text>
                <ThemeIcon size="lg" radius="md" color="violet" variant="light">
                  <IconCalendar size={18} />
                </ThemeIcon>
              </Group>
              <Text fw={700} size="xl" c="violet">
                {employesFiltres.filter(e => e.date_embauche).length}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>Avec date d'embauche</Text>
            </Paper>
          </SimpleGrid>

          {/* Barre d'outils */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group justify="space-between" wrap="wrap" gap="sm">
              <Group gap="sm">
                <TextInput
                  placeholder="Rechercher par nom ou téléphone..."
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
                <Button
                  leftSection={<IconPlus size={18} />}
                  onClick={() => {
                    setEmployeEdition(null);
                    setVueForm(true);
                  }}
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  radius="md"
                >
                  Nouvel employé
                </Button>
              </Group>
            </Group>
          </Card>

          {/* Tableau des employés */}
          <Card withBorder radius="lg" shadow="sm" p={0} style={{ overflow: 'hidden' }}>
            {employesFiltres.length === 0 ? (
              <Stack align="center" py={60} gap="sm">
                <ThemeIcon size="xl" radius="xl" color="gray" variant="light">
                  <IconUsers size={30} />
                </ThemeIcon>
                <Text c="dimmed" size="lg">Aucun employé trouvé</Text>
                <Button variant="light" onClick={() => { setEmployeEdition(null); setVueForm(true); }}>
                  Ajouter un employé
                </Button>
              </Stack>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                    <Table.Tr>
                      <Table.Th style={{ color: 'white' }}>Employé</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Contact</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Type</Table.Th>
                      <Table.Th style={{ color: 'white', textAlign: 'right' }}>Salaire</Table.Th>
                      <Table.Th style={{ color: 'white' }}>Embauche</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white' }}>Statut</Table.Th>
                      <Table.Th style={{ textAlign: 'center', color: 'white', width: 160 }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((e) => (
                      <Table.Tr key={e.id}>
                        <Table.Td fw={500}>
                          <Group gap="xs">
                            <Avatar size="sm" radius="xl" color="blue">
                              <IconUserStar size={12} />
                            </Avatar>
                            {e.nom_prenom}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          {e.telephone ? (
                            <Group gap={4}>
                              <IconPhone size={12} color="#1b365d" />
                              <Text size="sm">{e.telephone}</Text>
                            </Group>
                          ) : (
                            <Text size="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={e.type_remuneration === 'fixe' ? 'green' : 'blue'}
                            variant="light"
                            size="md"
                            leftSection={e.type_remuneration === 'fixe' ? <IconCash size={10} /> : <IconPercentage size={10} />}
                          >
                            {e.type_remuneration === 'fixe' ? 'Salaire fixe' : 'À prestation'}
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="right">
                          {e.type_remuneration === 'fixe' ? (
                            <Text fw={600} c="green">
                              {(e.salaire_base || 0).toLocaleString()} FCFA
                            </Text>
                          ) : (
                            <Badge color="orange" variant="light" size="sm">
                              Variable
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <IconCalendar size={12} color="#1b365d" />
                            <Text size="sm">{formatDate(e.date_embauche)}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td ta="center">
                          <Badge
                            color={e.est_actif ? 'green' : 'gray'}
                            variant="light"
                            size="md"
                            leftSection={e.est_actif ? <IconUserCheck size={10} /> : <IconUserX size={10} />}
                          >
                            {e.est_actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <Tooltip label="Modifier">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="orange"
                                onClick={() => {
                                  setEmployeEdition(e);
                                  setVueForm(true);
                                }}
                              >
                                <IconEdit size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Supprimer">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => supprimerEmploye(e.id, e.nom_prenom)}
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Payer le salaire">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="green"
                                onClick={() => handlePaiement(e)}
                                loading={loadingPaiement === e.id}
                              >
                                <IconWallet size={18} />
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

          {/* Modal Instructions améliorée */}
          <Modal
            opened={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            title="📋 Gestion des employés"
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
                  <Text size="sm">1️⃣ Utilisez le bouton "Nouvel employé" pour ajouter un employé</Text>
                  <Text size="sm">2️⃣ La recherche filtre par nom ou téléphone</Text>
                  <Text size="sm">3️⃣ Cliquez sur ✏️ pour modifier un employé</Text>
                  <Text size="sm">4️⃣ Cliquez sur 🗑️ pour supprimer un employé</Text>
                  <Text size="sm">5️⃣ Cliquez sur 👛 pour payer le salaire (automatique)</Text>
                </Stack>
              </Paper>

              <Paper p="md" radius="md" withBorder bg="yellow.0">
                <Text fw={600} size="sm" mb="md">💡 Types de rémunération :</Text>
                <Stack gap="xs">
                  <Group gap="xs">
                    <Badge color="green" size="sm">Salaire fixe</Badge>
                    <Text size="xs">Montant mensuel fixe défini à l'embauche</Text>
                  </Group>
                  <Group gap="xs">
                    <Badge color="blue" size="sm">À prestation</Badge>
                    <Text size="xs">Paiement basé sur les prestations réalisées</Text>
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

export default ListeEmployes;