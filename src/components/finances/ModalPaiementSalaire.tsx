import { useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  NumberInput,
  Select,
  Textarea,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconCash,
  IconDeviceFloppy,
  IconX,
  IconAlertCircle,
  IconMoneybag,
} from '@tabler/icons-react';

interface Props {
  employe: { id: number; nom: string };
  salaire: { resteAPayer: number };
  onClose: () => void;
  onSubmit: (montant: number, mode: string, observation: string) => void;
}

const ModalPaiementSalaire = ({ employe, salaire, onClose, onSubmit }: Props) => {
  const [montant, setMontant] = useState<number | undefined>(salaire.resteAPayer);
  const [mode, setMode] = useState<string | null>('Espèce');
  const [observation, setObservation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const modesPaiement = [
    { value: 'Espèce', label: '💰 Espèce' },
    { value: 'Orange money', label: '📱 Orange Money' },
    { value: 'Wave', label: '🌊 Wave' },
    { value: 'Moov money', label: '📱 Moov Money' },
    { value: 'Telecel money', label: '📱 Telecel Money' },
    { value: 'Sank Money', label: '💰 Sank Money' },
    { value: 'Virement bancaire', label: '🏦 Virement bancaire' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!montant || montant <= 0) {
      setError('Veuillez saisir un montant valide');
      return;
    }

    if (montant > salaire.resteAPayer) {
      setError(`Le montant ne peut pas dépasser ${salaire.resteAPayer.toLocaleString()} FCFA`);
      return;
    }

    if (!mode) {
      setError('Veuillez sélectionner un mode de paiement');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(montant, mode, observation);
      onClose();
    } catch (err) {
      setError('Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={`Paiement - ${employe.nom}`}
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* INFO RESTE À PAYER */}
          <Alert color="blue" variant="light" radius="md">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Reste à payer :</Text>
              <Text fw={700} size="lg" c="blue">
                {salaire.resteAPayer.toLocaleString()} FCFA
              </Text>
            </Group>
          </Alert>

          {/* ERREUR */}
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          {/* MONTANT */}
          <NumberInput
            label="Montant (FCFA)"
            placeholder="Saisir le montant"
            value={montant}
            onChange={(val) => setMontant(Number(val))}
            min={0}
            max={salaire.resteAPayer}
            step={1000}
            required
            leftSection={<IconMoneybag size={16} />}
          />

          {/* MODE DE PAIEMENT */}
          <Select
            label="Mode de paiement"
            placeholder="Choisir un mode"
            data={modesPaiement}
            value={mode}
            onChange={setMode}
            required
            leftSection={<IconCash size={16} />}
          />

          {/* OBSERVATION */}
          <Textarea
            label="Observation"
            placeholder="Référence, note supplémentaire..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={2}
          />

          <Divider />

          {/* ACTIONS */}
          <Group justify="space-between">
            <Button variant="light" color="red" onClick={onClose} leftSection={<IconX size={16} />}>
              Annuler
            </Button>
            <Button
              type="submit"
              loading={submitting}
              leftSection={<IconDeviceFloppy size={16} />}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
            >
              Valider le paiement
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ModalPaiementSalaire;