import React, { useEffect, useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  Select,
  NumberInput,
  Textarea,
  Divider,
  Alert,
  Box,
  Modal,
  LoadingOverlay,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconPackage,
  IconBox,
  IconCash,
  IconNotes,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface Matiere {
  id: number;
  designation: string;
  unite: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const FormulaireEntreeStock: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [matiereId, setMatiereId] = useState<string | null>(null);
  const [quantite, setQuantite] = useState<number | undefined>(undefined);
  const [cout, setCout] = useState<number | undefined>(undefined);
  const [observation, setObservation] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const db = await getDb();
      const data = await db.select<Matiere[]>(`
        SELECT id, designation, unite FROM matieres WHERE est_supprime = 0 ORDER BY designation
      `);
      setMatieres(data);
      setLoading(false);
    };
    load();
  }, []);

  const matieresOptions = matieres.map(m => ({
    value: m.id.toString(),
    label: `${m.designation} (${m.unite})`
  }));

  const enregistrer = async () => {
    setError('');
    setSuccess(false);

    if (!matiereId) {
      setError('Veuillez sélectionner une matière');
      return;
    }

    if (!quantite || quantite <= 0) {
      setError('Veuillez saisir une quantité valide');
      return;
    }

    if (!cout || cout <= 0) {
      setError('Veuillez saisir un coût unitaire valide');
      return;
    }

    setSaving(true);
    const db = await getDb();

    try {
      await db.execute(
        `INSERT INTO entrees_stock (matiere_id, quantite, cout_unitaire, observation, date_entree)
         VALUES (?, ?, ?, ?, DATE('now'))`,
        [parseInt(matiereId), quantite, cout, observation || null]
      );

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des matières...</Text>
      </Card>
    );
  }

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconPackage size={18} color="white" />
              <Title order={4} size="h5" c="white">Nouvelle entrée de stock</Title>
            </Group>
            <Group gap="xs">
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                leftSection={<IconInfoCircle size={14} />}
                onClick={() => setInfoModalOpen(true)}
              >
                Aide
              </Button>
              <Button
                variant="subtle"
                color="white"
                size="compact-sm"
                leftSection={<IconArrowLeft size={14} />}
                onClick={onClose}
              >
                Retour
              </Button>
            </Group>
          </Group>
        </Card>

        {/* FORMULAIRE PRINCIPAL */}
        <Card withBorder radius="md" p="sm">
          <Stack gap="sm">
            {/* SUCCÈS */}
            {success && (
              <Alert icon={<IconCheck size={14} />} color="green" variant="light" p="xs">
                <Text size="xs">Entrée enregistrée avec succès !</Text>
              </Alert>
            )}

            {/* ERREUR */}
            {error && (
              <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                <Text size="xs">{error}</Text>
              </Alert>
            )}

            {/* MATIÈRE */}
            <Select
              label="Matière première"
              placeholder="Choisir une matière"
              data={matieresOptions}
              value={matiereId}
              onChange={setMatiereId}
              leftSection={<IconBox size={14} />}
              size="sm"
              required
              searchable
              nothingFoundMessage="Aucune matière trouvée"
            />

            {/* QUANTITÉ */}
            <NumberInput
              label="Quantité"
              placeholder="Quantité reçue"
              value={quantite}
              onChange={(val) => setQuantite(Number(val))}
              leftSection={<IconPackage size={14} />}
              size="sm"
              min={0}
              step={1}
              required
            />

            {/* COÛT UNITAIRE */}
            <NumberInput
              label="Coût unitaire (FCFA)"
              placeholder="Prix d'achat unitaire"
              value={cout}
              onChange={(val) => setCout(Number(val))}
              leftSection={<IconCash size={14} />}
              size="sm"
              min={0}
              step={100}
              required
            />

            {/* OBSERVATION */}
            <Textarea
              label="Observation"
              placeholder="Fournisseur, facture, note..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              leftSection={<IconNotes size={14} />}
              size="sm"
              rows={2}
            />

            <Divider />

            {/* ACTIONS */}
            <Group justify="space-between">
              <Button size="sm" variant="light" color="red" onClick={onClose}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={enregistrer}
                loading={saving}
                leftSection={<IconDeviceFloppy size={14} />}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Enregistrer
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* MODAL INSTRUCTIONS */}
        <Modal
          opened={infoModalOpen}
          onClose={() => setInfoModalOpen(false)}
          title="📋 Instructions"
          size="sm"
          centered
          styles={{
            header: {
              backgroundColor: '#1b365d',
              padding: '10px 12px',
            },
            title: {
              color: 'white',
              fontWeight: 600,
              fontSize: 13,
            },
            body: {
              padding: '12px',
            },
          }}
        >
          <Stack gap="xs">
            <Text size="xs">1. Sélectionnez la matière première concernée</Text>
            <Text size="xs">2. Saisissez la quantité reçue</Text>
            <Text size="xs">3. Indiquez le coût unitaire d'achat</Text>
            <Text size="xs">4. Ajoutez une observation (fournisseur, facture...)</Text>
            <Text size="xs">5. Cliquez sur "Enregistrer" pour valider</Text>
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

export default FormulaireEntreeStock;