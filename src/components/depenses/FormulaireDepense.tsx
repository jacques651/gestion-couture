import React, { useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Textarea,
  Divider,
  Alert,
  Box,
  Modal,
  Select,
  NumberInput,
} from '@mantine/core';
import {
  IconReceipt,
  IconDeviceFloppy,
  IconArrowLeft,
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconCategory,
  IconTag,
  IconMoneybag,
  IconUser,
  IconNotes,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

const categories = [
  { value: 'transport', label: '🚗 Transport' },
  { value: 'fourniture', label: '📦 Fournitures' },
  { value: 'tissu', label: '🧵 Tissu' },
  { value: 'entretien', label: '🔧 Entretien' },
  { value: 'eau-electricite', label: '💡 Eau/Électricité' },
  { value: 'loyer', label: '🏠 Loyer' },
  { value: 'autre', label: '📋 Autre' },
];

const FormulaireDepense: React.FC<{
  depense?: any;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ depense, onSuccess, onCancel }) => {

  const [categorie, setCategorie] = useState(depense?.categorie || '');
  const [designation, setDesignation] = useState(depense?.designation || '');
  const [montant, setMontant] = useState<number | undefined>(depense?.montant);
  const [responsable, setResponsable] = useState(depense?.responsable || '');
  const [observation, setObservation] = useState(depense?.observation || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categorie.trim()) return setError('Catégorie requise');
    if (!designation.trim()) return setError('Désignation requise');
    if (!montant || montant <= 0) return setError('Montant invalide');
    if (!responsable.trim()) return setError('Responsable requis');

    setIsSubmitting(true);
    setError('');

    try {
      const db = await getDb();

      if (depense) {
        await db.execute(
          `UPDATE depenses SET categorie=?, designation=?, montant=?, responsable=?, observation=? WHERE id=?`,
          [categorie, designation, montant, responsable, observation, depense.id]
        );
        setSuccess('Dépense modifiée avec succès');
      } else {
        await db.execute(
          `INSERT INTO depenses (categorie, designation, montant, responsable, observation)
           VALUES (?, ?, ?, ?, ?)`,
          [categorie, designation, montant, responsable, observation]
        );
        setSuccess('Dépense ajoutée avec succès');
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconReceipt size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {depense ? 'Modifier dépense' : 'Nouvelle dépense'}
              </Title>
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
                onClick={onCancel}
              >
                Retour
              </Button>
            </Group>
          </Group>
        </Card>

        {/* FORMULAIRE PRINCIPAL */}
        <Card withBorder radius="md" p="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              {/* SUCCÈS */}
              {success && (
                <Alert icon={<IconCheck size={14} />} color="green" variant="light" p="xs">
                  <Text size="xs">{success}</Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* CATÉGORIE */}
              <Select
                label="Catégorie"
                placeholder="Choisir une catégorie"
                data={categories}
                value={categorie}
                onChange={(val) => setCategorie(val || '')}
                leftSection={<IconCategory size={14} />}
                size="sm"
                required
                searchable
              />

              {/* DÉSIGNATION */}
              <TextInput
                label="Désignation"
                placeholder="Ex: Achat tissu, Transport..."
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                leftSection={<IconTag size={14} />}
                size="sm"
                required
              />

              {/* MONTANT */}
              <NumberInput
                label="Montant (FCFA)"
                placeholder="Ex: 5000"
                value={montant}
                onChange={(val) => setMontant(Number(val))}
                leftSection={<IconMoneybag size={14} />}
                size="sm"
                min={0}
                step={500}
                required
              />

              {/* RESPONSABLE */}
              <TextInput
                label="Responsable"
                placeholder="Nom du responsable"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                leftSection={<IconUser size={14} />}
                size="sm"
                required
              />

              {/* OBSERVATION */}
              <Textarea
                label="Observation"
                placeholder="Notes supplémentaires..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                leftSection={<IconNotes size={14} />}
                size="sm"
                rows={2}
              />

              <Divider />

              {/* ACTIONS */}
              <Group justify="space-between">
                <Button size="sm" variant="light" color="red" onClick={onCancel}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  loading={isSubmitting}
                  leftSection={<IconDeviceFloppy size={14} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {depense ? 'Mettre à jour' : 'Enregistrer'}
                </Button>
              </Group>
            </Stack>
          </form>
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
            <Text size="xs">1. Sélectionnez une catégorie de dépense</Text>
            <Text size="xs">2. Saisissez la désignation et le montant</Text>
            <Text size="xs">3. Indiquez le responsable de la dépense</Text>
            <Text size="xs">4. Ajoutez une observation si nécessaire</Text>
            <Divider />
            <Text size="xs" c="dimmed" ta="center">Version 1.0.0</Text>
          </Stack>
        </Modal>
      </Stack>
    </Box>
  );
};

export default FormulaireDepense;