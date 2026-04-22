import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Table,
  Badge,
  LoadingOverlay,
  Box,
  ThemeIcon,
  SimpleGrid,
  Divider,
  TextInput,
  NumberInput,
  Textarea,
  Alert,
  ActionIcon,
} from '@mantine/core';
import {
  IconPackage,
  IconArrowLeft,
  IconPlus,
  IconMinus,
  IconAlertTriangle,
  IconDeviceFloppy,
  IconX,
  IconCalendar,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface Matiere {
  id: number;
  designation: string;
  categorie: string;
  unite: string;
  seuil_alerte: number;
}

interface Mouvement {
  id: number;
  date: string;
  type: 'entree' | 'sortie';
  quantite: number;
  cout_unitaire: number;
  observation: string;
  commande_id?: number;
}

interface EntreeRow {
  id: number;
  date_entree: string;
  quantite: number;
  cout_unitaire: number;
  observation: string;
}

interface SortieRow {
  id: number;
  date_sortie: string;
  quantite: number;
  cout_unitaire: number;
  observation: string;
  commande_id: number | null;
}

const GestionStockMatiere: React.FC<{ matiere: Matiere; onBack: () => void }> = ({ matiere, onBack }) => {
  const [stock, setStock] = useState<number | null>(null);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [showForm, setShowForm] = useState<'entree' | 'sortie' | null>(null);
  const [quantite, setQuantite] = useState<number | undefined>(undefined);
  const [coutUnitaire, setCoutUnitaire] = useState<number | undefined>(undefined);
  const [observation, setObservation] = useState('');
  const [commandeId, setCommandeId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const chargerStock = async () => {
    const db = await getDb();
    const entree = await db.select<{ total: number }[]>(
      "SELECT COALESCE(SUM(quantite), 0) as total FROM entrees_stock WHERE matiere_id = ?",
      [matiere.id]
    );
    const sortie = await db.select<{ total: number }[]>(
      "SELECT COALESCE(SUM(quantite), 0) as total FROM sorties_stock WHERE matiere_id = ?",
      [matiere.id]
    );
    const stockActuel = (entree[0]?.total || 0) - (sortie[0]?.total || 0);
    setStock(stockActuel);
  };

  const chargerMouvements = async () => {
    const db = await getDb();
    const entrees = await db.select<EntreeRow[]>(
      "SELECT id, date_entree, quantite, cout_unitaire, observation FROM entrees_stock WHERE matiere_id = ? ORDER BY date_entree DESC",
      [matiere.id]
    );
    const sorties = await db.select<SortieRow[]>(
      "SELECT id, date_sortie, quantite, cout_unitaire, observation, commande_id FROM sorties_stock WHERE matiere_id = ? ORDER BY date_sortie DESC",
      [matiere.id]
    );

    const mouvementsEntrees: Mouvement[] = entrees.map((e: EntreeRow) => ({
      id: e.id,
      date: e.date_entree,
      type: 'entree',
      quantite: e.quantite,
      cout_unitaire: e.cout_unitaire,
      observation: e.observation,
    }));

    const mouvementsSorties: Mouvement[] = sorties.map((s: SortieRow) => ({
      id: s.id,
      date: s.date_sortie,
      type: 'sortie',
      quantite: s.quantite,
      cout_unitaire: s.cout_unitaire,
      observation: s.observation,
      commande_id: s.commande_id ?? undefined,
    }));

    const tous = [...mouvementsEntrees, ...mouvementsSorties].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setMouvements(tous);
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([chargerStock(), chargerMouvements()]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!quantite || quantite <= 0) {
      setError("Veuillez saisir une quantité positive");
      return;
    }
    if (showForm === 'entree' && (!coutUnitaire || coutUnitaire <= 0)) {
      setError("Veuillez saisir un coût unitaire valide");
      return;
    }
    if (showForm === 'sortie' && stock !== null && quantite > stock) {
      setError(`Stock insuffisant. Stock actuel : ${stock} ${matiere.unite}`);
      return;
    }

    setIsSubmitting(true);
    const db = await getDb();
    try {
      if (showForm === 'entree') {
        await db.execute(
          `INSERT INTO entrees_stock (matiere_id, quantite, cout_unitaire, observation, date_entree)
           VALUES (?, ?, ?, ?, DATE('now'))`,
          [matiere.id, quantite, coutUnitaire, observation || null]
        );
      } else if (showForm === 'sortie') {
        await db.execute(
          `INSERT INTO sorties_stock (matiere_id, quantite, cout_unitaire, observation, commande_id, date_sortie)
           VALUES (?, ?, ?, ?, ?, DATE('now'))`,
          [matiere.id, quantite, 0, observation || null, commandeId || null]
        );
      }
      setSuccess(true);
      await Promise.all([chargerStock(), chargerMouvements()]);
      setShowForm(null);
      setQuantite(undefined);
      setCoutUnitaire(undefined);
      setObservation('');
      setCommandeId(undefined);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const estEnAlerte = stock !== null && stock <= matiere.seuil_alerte;

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des données...</Text>
      </Card>
    );
  }

  return (
    <Box p="md">
      <Stack gap="lg">
        {/* HEADER */}
        <Card withBorder radius="md" p="lg" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconPackage size={24} color="white" />
              <Title order={2} c="white">Gestion du stock</Title>
            </Group>
            <Button
              variant="light"
              color="white"
              leftSection={<IconArrowLeft size={16} />}
              onClick={onBack}
            >
              Retour
            </Button>
          </Group>
        </Card>

        {/* INFOS MATIÈRE */}
        <Card withBorder radius="md" p="lg">
          <Group gap="md" mb="md">
            <ThemeIcon size={50} radius="md" color="blue" variant="light">
              <IconPackage size={28} />
            </ThemeIcon>
            <Box>
              <Title order={3}>{matiere.designation}</Title>
              <Text size="sm" c="dimmed">
                {matiere.categorie && `${matiere.categorie} • `}{matiere.unite}
              </Text>
            </Box>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Card withBorder radius="md" p="md" bg={estEnAlerte ? 'red.0' : 'gray.0'}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Stock actuel</Text>
              <Text fw={700} size="xl" c={estEnAlerte ? 'red' : 'blue'}>
                {stock === null ? '...' : `${stock} ${matiere.unite}`}
              </Text>
              {estEnAlerte && (
                <Group gap={4} mt="xs">
                  <IconAlertTriangle size={14} color="red" />
                  <Text size="xs" c="red">Stock inférieur au seuil d'alerte ({matiere.seuil_alerte})</Text>
                </Group>
              )}
            </Card>

            <Card withBorder radius="md" p="md" bg="gray.0">
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Seuil d'alerte</Text>
              <Text fw={700} size="xl" c="orange">
                {matiere.seuil_alerte} {matiere.unite}
              </Text>
            </Card>
          </SimpleGrid>

          <Group gap="md" mt="md">
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowForm('entree')}
              variant="gradient"
              gradient={{ from: 'green', to: 'teal' }}
              fullWidth
            >
              Entrée de stock
            </Button>
            <Button
              leftSection={<IconMinus size={16} />}
              onClick={() => setShowForm('sortie')}
              variant="gradient"
              gradient={{ from: 'orange', to: 'yellow' }}
              fullWidth
            >
              Sortie de stock
            </Button>
          </Group>
        </Card>

        {/* FORMULAIRE D'AJOUT */}
        {showForm && (
          <Card withBorder radius="md" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={4}>
                {showForm === 'entree' ? 'Nouvelle entrée de stock' : 'Nouvelle sortie de stock'}
              </Title>
              <ActionIcon variant="subtle" color="gray" onClick={() => setShowForm(null)}>
                <IconX size={18} />
              </ActionIcon>
            </Group>
            <Divider mb="md" />

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                {success && (
                  <Alert icon={<IconCheck size={14} />} color="green" variant="light">
                    Mouvement enregistré avec succès !
                  </Alert>
                )}
                {error && (
                  <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <NumberInput
                  label={`Quantité (${matiere.unite})`}
                  placeholder="Quantité"
                  value={quantite}
                  onChange={(val) => setQuantite(Number(val))}
                  min={0}
                  step={1}
                  required
                />

                {showForm === 'entree' && (
                  <NumberInput
                    label="Coût unitaire (FCFA)"
                    placeholder="Prix d'achat unitaire"
                    value={coutUnitaire}
                    onChange={(val) => setCoutUnitaire(Number(val))}
                    min={0}
                    step={100}
                    required
                  />
                )}

                {showForm === 'sortie' && (
                  <TextInput
                    label="ID Commande associée (optionnel)"
                    placeholder="ID de la commande"
                    value={commandeId || ''}
                    onChange={(e) => setCommandeId(Number(e.target.value))}
                  />
                )}

                <Textarea
                  label="Observation"
                  placeholder="Note..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={2}
                />

                <Divider />

                <Group justify="flex-end">
                  <Button variant="light" color="red" onClick={() => setShowForm(null)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    leftSection={<IconDeviceFloppy size={14} />}
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                  >
                    Enregistrer
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {/* HISTORIQUE DES MOUVEMENTS */}
        <Card withBorder radius="md" p="lg">
          <Title order={4} mb="md">Historique des mouvements</Title>
          <Divider mb="md" />

          {mouvements.length === 0 ? (
            <Text ta="center" c="dimmed" py={40}>
              Aucun mouvement enregistré
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#f5f5f5' }}>
                <Table.Tr>
                  <Table.Th style={{ width: 110 }}>Date</Table.Th>
                  <Table.Th style={{ width: 100 }}>Type</Table.Th>
                  <Table.Th>Quantité</Table.Th>
                  <Table.Th>Coût unitaire</Table.Th>
                  <Table.Th>Observation</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {mouvements.map((m) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <IconCalendar size={12} />
                        <Text size="sm">{new Date(m.date).toLocaleDateString('fr-FR')}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={m.type === 'entree' ? 'green' : 'orange'}
                        variant="light"
                        size="sm"
                      >
                        {m.type === 'entree' ? 'Entrée' : 'Sortie'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {m.quantite} {matiere.unite}
                    </Table.Td>
                    <Table.Td>
                      {m.cout_unitaire ? `${m.cout_unitaire.toLocaleString()} FCFA` : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {m.observation || '—'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
      </Stack>
    </Box>
  );
};

export default GestionStockMatiere;