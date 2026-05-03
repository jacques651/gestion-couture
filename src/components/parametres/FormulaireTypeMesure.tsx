import React, { useState, useEffect } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  Select,
  Divider,
  Alert,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconRuler,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface TypeMesure {
  id?: number;
  nom: string;
  unite: string;
}

interface FormulaireTypeMesureProps {
  type?: TypeMesure;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulaireTypeMesure: React.FC<FormulaireTypeMesureProps> = ({
  type,
  onSuccess,
  onCancel
}) => {
  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState<string | null>('cm');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const unitesOptions = [
    { value: 'cm', label: 'Centimètres (cm)' },
    { value: 'm', label: 'Mètres (m)' },
    { value: 'pouce', label: 'Pouces' },
  ];

  useEffect(() => {
    if (type) {
      setNom(type.nom);
      setUnite(type.unite);
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    setLoading(true);
    const db = await getDb();

    try {
      if (type?.id) {
        
        setSuccessMessage('Type de mesure modifié avec succès');
        setSuccess(true);
      } else {
        const results = await db.select<{ max_ordre: number }[]>(
          "SELECT COALESCE(MAX(ordre_affichage), 0) as max_ordre FROM types_mesures WHERE est_active = 1"
        );
        const dernierOrdre = results?.[0]?.max_ordre ?? 0;

        await db.execute(
          "INSERT INTO types_mesures (nom, unite, ordre_affichage, est_active) VALUES (?, ?, ?, ?, 1)",
          [nom.trim(), unite, dernierOrdre + 1]
        );
        setSuccessMessage('Type de mesure ajouté avec succès');
        setSuccess(true);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ maxWidth: 800, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconRuler size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {type ? 'Modifier le type de mesure' : 'Nouveau type de mesure'}
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
                  <Text size="xs">{successMessage}</Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* NOM */}
              <TextInput
                label="Nom"
                placeholder="Ex: Tour de poitrine"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                leftSection={<IconRuler size={14} />}
                size="sm"
                required
              />

              {/* UNITÉ */}
              <Select
                label="Unité"
                placeholder="Choisir une unité"
                data={unitesOptions}
                value={unite}
                onChange={setUnite}
                leftSection={<IconRuler size={14} />}
                size="sm"
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
                  loading={loading}
                  leftSection={<IconDeviceFloppy size={14} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {type ? 'Mettre à jour' : 'Enregistrer'}
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
            <Text size="xs">1. Saisissez le nom du type de mesure</Text>
            <Text size="xs">2. Choisissez l'unité de mesure (cm, m, pouce)</Text>
            <Text size="xs">3. Sélectionnez une catégorie pour organiser les mesures</Text>
            <Text size="xs">4. Cliquez sur "Enregistrer" pour valider</Text>
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

export default FormulaireTypeMesure;