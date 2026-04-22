import React, { useEffect, useState } from 'react';
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
  const itemsPerPage = 10;

  // ================= LOAD =================
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

  // ================= SUPPRIMER =================
  const supprimerEmploye = async (id: number) => {
    if (!window.confirm('Supprimer cet employé ?')) return;

    const db = await getDb();
    await db.execute(
      "UPDATE employes SET est_supprime = 1 WHERE id=?",
      [id]
    );

    chargerEmployes();
  };

  // ================= PAIEMENT =================
  const handlePaiement = async (e: Employe) => {
    try {
      setLoadingPaiement(e.id);

      const result = await payerSalaireSecurise(e.id);

      alert(
        `Paiement effectué\n\nBrut: ${result.montant_brut} FCFA\nRetenue: ${result.retenue} FCFA\nNet: ${result.montant_net} FCFA`
      );

      await chargerEmployes();

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

  // ================= UTILS =================
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

  if (vueForm) {
    return (
      <FormulaireEmploye
        employe={employeEdition || undefined}
        onSuccess={() => {
          setVueForm(false);
          setEmployeEdition(null);
          chargerEmployes();
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
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des employés...</Text>
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
                <IconUsers size={24} color="white" />
                <Title order={2} c="white">Gestion des employés</Title>
              </Group>
              <Text size="sm" c="gray.3">
                {employesFiltres.length} employé(s) au total
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

        {/* STATS KPI */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Employés actifs
              </Text>
              <ThemeIcon size={30} radius="md" color="green" variant="light">
                <IconUserCheck size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="green">
              {employesActifs}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              sur {employesFiltres.length} employé(s)
            </Text>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Total salaires fixes
              </Text>
              <ThemeIcon size={30} radius="md" color="blue" variant="light">
                <IconWallet size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="blue">
              {totalSalaires.toLocaleString()} FCFA
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              Salaire mensuel
            </Text>
          </Card>

          <Card withBorder radius="md" p="md">
            <Group justify="space-between" mb="xs">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Type variable
              </Text>
              <ThemeIcon size={30} radius="md" color="orange" variant="light">
                <IconUsers size={18} />
              </ThemeIcon>
            </Group>
            <Text fw={700} size="xl" c="orange">
              {employesFiltres.filter(e => e.type_remuneration === 'prestation').length}
            </Text>
            <Text size="xs" c="dimmed" mt="xs">
              employés à prestation
            </Text>
          </Card>
        </SimpleGrid>

        {/* BARRE D'OUTILS */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between">
            <TextInput
              placeholder="Rechercher par nom ou téléphone..."
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
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => setVueForm(true)}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Nouvel employé
              </Button>
            </Group>
          </Group>
        </Card>

        {/* TABLEAU DES EMPLOYÉS */}
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
          {employesFiltres.length === 0 ? (
            <Text ta="center" c="dimmed" py={60}>
              Aucun employé trouvé
            </Text>
          ) : (
            <>
              <Table striped highlightOnHover>
                <Table.Thead style={{ backgroundColor: '#1b365d' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Téléphone</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Type</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'right' }}>Salaire</Table.Th>
                    <Table.Th style={{ color: 'white' }}>Date embauche</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Statut</Table.Th>
                    <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((e) => (
                    <Table.Tr key={e.id}>
                      <Table.Td fw={500}>{e.nom_prenom}</Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconPhone size={12} />
                          <Text size="sm">{e.telephone || '-'}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={e.type_remuneration === 'fixe' ? 'green' : 'blue'}
                          variant="light"
                          size="sm"
                        >
                          {e.type_remuneration === 'fixe' ? 'Fixe' : 'Prestation'}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">
                        {e.type_remuneration === 'fixe'
                          ? `${(e.salaire_base || 0).toLocaleString()} FCFA`
                          : 'Variable'}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <IconCalendar size={12} />
                          <Text size="sm">{formatDate(e.date_embauche)}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Badge
                          color={e.est_actif ? 'green' : 'gray'}
                          variant="light"
                          size="sm"
                          leftSection={e.est_actif ? <IconUserCheck size={10} /> : <IconUserX size={10} />}
                        >
                          {e.est_actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6} justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="orange"
                              onClick={() => {
                                setEmployeEdition(e);
                                setVueForm(true);
                              }}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => supprimerEmploye(e.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Payer salaire">
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="green"
                              onClick={() => handlePaiement(e)}
                              loading={loadingPaiement === e.id}
                            >
                              <IconWallet size={16} />
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
            <Text size="sm">1. Utilisez le bouton "Nouvel employé" pour ajouter un employé</Text>
            <Text size="sm">2. La recherche filtre par nom ou téléphone</Text>
            <Text size="sm">3. Cliquez sur l'icône ✏️ pour modifier un employé</Text>
            <Text size="sm">4. Cliquez sur l'icône 🗑️ pour supprimer un employé</Text>
            <Text size="sm">5. Cliquez sur l'icône 👛 pour payer le salaire</Text>
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

export default ListeEmployes;