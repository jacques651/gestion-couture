import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Text,
  Group,
  Button,
  NumberInput,
  Select,
  TextInput,
  Divider,
  Alert,
  ActionIcon,
  Paper,
  Badge,
  SimpleGrid,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconCash,
  IconMovie,
  IconTransfer,
  IconReceipt,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

// ======================
// TYPES
// ======================
interface Paiement {
  id: number;
  commande_id: number;
  montant: number;
  mode?: string;
  observation?: string;
  date_paiement?: string;
}

interface Props {
  commandeId: number;
  totalCommande: number | null;
  onPaiementChange?: () => void;
}

// ======================
// COMPONENT
// ======================
const GestionPaiements: React.FC<Props> = ({ commandeId, totalCommande, onPaiementChange }) => {

  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<string | null>('cash');
  const [observation, setObservation] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const totalCommandeSafe = Number(totalCommande) || 0;
  const totalPaye = paiements.reduce((s, p) => s + (p.montant || 0), 0);
  const reste = totalCommandeSafe - totalPaye;

  const modesPaiement = [
    { value: 'cash', label: '💰 Espèces', icon: <IconCash size={16} /> },
    { value: 'mobile', label: '📱 Mobile Money', icon: <IconMovie size={16} /> },
    { value: 'virement', label: '🏦 Virement bancaire', icon: <IconTransfer size={16} /> }
  ];

  // ======================
  // LOAD DATA
  // ======================
  const load = async () => {
    setLoading(true);
    const db = await getDb();

    const res = await db.select<Paiement[]>(`
      SELECT 
        id,
        commande_id,
        montant,
        mode,
        observation,
        date_paiement
      FROM paiements_commandes
      WHERE commande_id = ?
      ORDER BY date_paiement DESC
    `, [commandeId]);

    setPaiements(res || []);
    setLoading(false);
  };

  useEffect(() => {
    if (commandeId) load();
  }, [commandeId]);

  // ======================
  // RESET FORM
  // ======================
  const resetForm = () => {
    setMontant(undefined);
    setMode('cash');
    setObservation('');
    setEditingId(null);
    setShowForm(false);
  };

  // ======================
  // SUBMIT
  // ======================
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const m = montant || 0;

    if (m <= 0) {
      alert("Montant invalide");
      return;
    }

    if (m > reste && !editingId) {
      alert("Le montant dépasse le reste à payer");
      return;
    }

    const db = await getDb();

    try {
      if (editingId) {
        await db.execute(
          `UPDATE paiements_commandes 
           SET montant = ?, mode = ?, observation = ?
           WHERE id = ?`,
          [m, mode, observation || null, editingId]
        );
      } else {
        await db.execute(
          `INSERT INTO paiements_commandes 
          (commande_id, montant, mode, observation, date_paiement)
          VALUES (?, ?, ?, ?, datetime('now'))`,
          [commandeId, m, mode, observation || null]
        );
      }

      resetForm();
      await load();
      onPaiementChange?.();

    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'opération");
    }
  };

  // ======================
  // DELETE
  // ======================
  const remove = async (id: number) => {
    if (!confirm("Supprimer ce paiement ?")) return;

    const db = await getDb();

    await db.execute(
      `DELETE FROM paiements_commandes WHERE id = ?`,
      [id]
    );

    await load();
    onPaiementChange?.();
  };

  // ======================
  // EDIT
  // ======================
  const edit = (p: Paiement) => {
    setEditingId(p.id);
    setMontant(p.montant);
    setMode(p.mode || 'cash');
    setObservation(p.observation || '');
    setShowForm(true);
  };

  const getModeIcon = (modeValue: string) => {
    const modeItem = modesPaiement.find(m => m.value === modeValue);
    return modeItem?.icon || <IconCash size={14} />;
  };

  const getModeLabel = (modeValue: string) => {
    const modeItem = modesPaiement.find(m => m.value === modeValue);
    return modeItem?.label || modeValue;
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des paiements...</Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* HEADER */}
      <Card withBorder radius="md" p="md" bg="gray.0">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={4}>
            <Group gap="xs">
              <IconReceipt size={18} />
              <Text fw={600}>Paiements</Text>
            </Group>
            <SimpleGrid cols={3} spacing="md">
              <Text size="xs" c="dimmed">
                Total: <strong>{totalCommandeSafe.toLocaleString()} FCFA</strong>
              </Text>
              <Text size="xs" c="dimmed">
                Payé: <strong className="text-green-600">{totalPaye.toLocaleString()} FCFA</strong>
              </Text>
              <Text size="xs" c="dimmed">
                Reste: <strong className={reste > 0 ? "text-red-600" : "text-green-600"}>
                  {reste.toLocaleString()} FCFA
                </strong>
              </Text>
            </SimpleGrid>
          </Stack>
          
          {!showForm && (
            <Button
              leftSection={<IconPlus size={14} />}
              onClick={() => setShowForm(true)}
              variant="light"
              color="blue"
              size="sm"
            >
              Ajouter un paiement
            </Button>
          )}
        </Group>
      </Card>

      {/* FORMULAIRE D'AJOUT */}
      {showForm && (
        <Card withBorder radius="md" p="md" bg="blue.0">
          <form onSubmit={submit}>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={600} size="sm">
                  {editingId ? "Modifier le paiement" : "Nouveau paiement"}
                </Text>
                <ActionIcon variant="subtle" color="gray" onClick={resetForm}>
                  <IconX size={16} />
                </ActionIcon>
              </Group>
              
              <Divider />
              
              <NumberInput
                label="Montant (FCFA)"
                placeholder="Saisir le montant"
                value={montant}
                onChange={(val) => setMontant(Number(val))}
                min={0}
                step={500}
                required
                leftSection="FCFA"
              />
              
              <Select
                label="Mode de paiement"
                placeholder="Choisir un mode"
                data={modesPaiement}
                value={mode}
                onChange={setMode}
                required
              />
              
              <TextInput
                label="Observation"
                placeholder="Référence, note..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
              
              <Group justify="flex-end">
                <Button variant="light" color="gray" onClick={resetForm}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  leftSection={<IconDeviceFloppy size={14} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {editingId ? "Modifier" : "Ajouter"}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      )}

      {/* LISTE DES PAIEMENTS */}
      {paiements.length === 0 && !showForm ? (
        <Card withBorder radius="md" p="xl" ta="center">
          <IconCash size={32} color="gray" strokeWidth={1} />
          <Text ta="center" c="dimmed" mt="sm">
            Aucun paiement enregistré
          </Text>
        </Card>
      ) : (
        <Stack gap="sm">
          {paiements.map((p) => (
            <Paper key={p.id} withBorder p="md" radius="md">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap={4} style={{ flex: 1 }}>
                  <Group gap="xs">
                    {getModeIcon(p.mode || 'cash')}
                    <Text fw={700} size="lg" c="green">
                      {p.montant.toLocaleString()} FCFA
                    </Text>
                    <Badge size="sm" variant="light" color="blue">
                      {getModeLabel(p.mode || 'cash')}
                    </Badge>
                  </Group>
                  
                  <Group gap="md" mt={4}>
                    {p.date_paiement && (
                      <Text size="xs" c="dimmed">
                        📅 {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                      </Text>
                    )}
                    {p.observation && (
                      <Text size="xs" c="dimmed" fs="italic">
                        📝 {p.observation}
                      </Text>
                    )}
                  </Group>
                </Stack>
                
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="orange"
                    onClick={() => edit(p)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => remove(p.id)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      {/* ALERTE SI RESTE À PAYER */}
      {reste > 0 && paiements.length > 0 && (
        <Alert color="orange" variant="light" radius="md">
          <Group justify="space-between">
            <Text size="sm">⚠️ Il reste {reste.toLocaleString()} FCFA à payer</Text>
            {!showForm && (
              <Button size="xs" variant="light" onClick={() => setShowForm(true)}>
                Ajouter un paiement
              </Button>
            )}
          </Group>
        </Alert>
      )}
    </Stack>
  );
};

export default GestionPaiements;