import React, { useState } from 'react';
import {
  Stack,
  Card,
  Title,
  Text,
  Group,
  Button,
  TextInput,
  NumberInput,
  Divider,
  Box,
  Modal,
  Alert,
  Avatar,
  Container,
  Paper,
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconLayersOff,
  IconDeviceFloppy,
  IconAlertCircle,
  IconCheck,
  IconInfoCircle,
  IconHelp,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

// ======================
// TYPES
// ======================
interface TypePrestation {
  id?: number;
  nom: string;
  prix_par_defaut: number;
}

interface Props {
  type?: TypePrestation;
  onSuccess: () => void;
  onCancel: () => void;
}

// ======================
// COMPONENT
// ======================
const FormulaireTypePrestation: React.FC<Props> = ({ type, onSuccess, onCancel }) => {
  const [nom, setNom] = useState(type?.nom || '');
  const [valeur, setValeur] = useState<number | undefined>(type?.prix_par_defaut || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Validation
  const validateForm = (): boolean => {
    if (!nom.trim()) {
      setError("Le nom est obligatoire");
      notifications.show({ title: 'Erreur', message: 'Le nom est obligatoire', color: 'red' });
      return false;
    }

    if (valeur === undefined || valeur < 0) {
      setError("La valeur doit être supérieure à 0");
      notifications.show({ title: 'Erreur', message: 'La valeur doit être supérieure à 0', color: 'red' });
      return false;
    }

    setError('');
    return true;
  };

  // ======================
  // SUBMIT
  // ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const db = await getDb();

      if (type?.id) {
        // Corrigé : virgule en trop supprimée
        await db.execute(
          `UPDATE types_prestations 
           SET nom = ?, prix_par_defaut = ?
           WHERE id = ?`,
          [nom.trim(), valeur, type.id]
        );

        notifications.show({
          title: 'Succès',
          message: 'Type de prestation modifié avec succès',
          color: 'green',
        });
      } else {
        await db.execute(
          `INSERT INTO types_prestations 
           (nom, prix_par_defaut, est_active, created_at)
           VALUES (?, ?, 1, CURRENT_TIMESTAMP)`,
          [nom.trim(), valeur]
        );

        notifications.show({
          title: 'Succès',
          message: 'Type de prestation ajouté avec succès',
          color: 'green',
        });
      }

      setSuccess(true);

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'opération");
      notifications.show({
        title: 'Erreur',
        message: err.message || "Erreur lors de l'opération",
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" p={0}>
      <Box style={{ maxWidth: 600, margin: '0 auto' }} p="md">
        <Stack gap="md">
          {/* HEADER MODERNE */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.1 }}>
              <IconLayersOff size={200} color="white" />
            </div>
            <Group justify="space-between" align="center">
              <Group gap="md">
                <Avatar size={60} radius="md" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <IconLayersOff size={30} color="white" />
                </Avatar>
                <Box>
                  <Title order={2} c="white" size="h3">
                    {type ? "✏️ Modifier le type" : "➕ Nouveau type"}
                  </Title>
                  <Text c="gray.3" size="sm" mt={4}>
                    {type
                      ? "Modifiez le type de prestation"
                      : "Ajoutez un nouveau type de prestation"}
                  </Text>
                </Box>
              </Group>
              <Group>
                <Tooltip label="Informations">
                  <ActionIcon
                    variant="light"
                    color="white"
                    size="lg"
                    onClick={() => setInfoModalOpen(true)}
                  >
                    <IconHelp size={20} />
                  </ActionIcon>
                </Tooltip>
                <Button
                  variant="light"
                  color="white"
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={onCancel}
                  radius="md"
                >
                  Retour
                </Button>
              </Group>
            </Group>
          </Card>

          {/* FORMULAIRE PRINCIPAL */}
          <Card withBorder radius="lg" shadow="sm" p="lg">
            <form onSubmit={handleSubmit}>
              <Stack gap="lg">
                {/* SUCCÈS */}
                {success && (
                  <Alert
                    icon={<IconCheck size={16} />}
                    color="green"
                    variant="filled"
                  >
                    <Text size="sm" c="white">
                      {type ? "✅ Type modifié avec succès !" : "✅ Type ajouté avec succès !"}
                    </Text>
                    <Text size="xs" c="green.1" mt={4}>
                      Redirection en cours...
                    </Text>
                  </Alert>
                )}

                {/* ERREUR */}
                {error && (
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    variant="light"
                  >
                    <Text size="sm">{error}</Text>
                  </Alert>
                )}

                {/* NOM */}
                <TextInput
                  label="Nom de la prestation"
                  placeholder="Ex: Couture, Broderie, Ourlet..."
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  size="md"
                  required
                  withAsterisk
                  description="Nom unique pour identifier ce type de prestation"
                />

                {/* VALEUR PAR DÉFAUT */}
                <NumberInput
                  label="Valeur par défaut (FCFA)"
                  placeholder="0"
                  value={valeur}
                  onChange={(val) => setValeur(Number(val) || 0)}
                  min={0}
                  step={500}
                  size="md"
                  description="Montant par défaut pour cette prestation"
                  thousandSeparator=" "
                />

                <Divider />

                {/* APERÇU */}
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <Text size="xs" fw={600} c="gray.6" mb="xs">Aperçu</Text>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{nom || 'Nom de la prestation'}</Text>
                    <Text fw={700} c="blue">
                      {(valeur || 0).toLocaleString()} FCFA
                    </Text>
                  </Group>
                </Paper>

                <Divider />

                {/* ACTIONS */}
                <Group justify="space-between">
                  <Button
                    variant="outline"
                    color="red"
                    onClick={onCancel}
                    leftSection={<IconArrowLeft size={16} />}
                    size="md"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    leftSection={<IconDeviceFloppy size={16} />}
                    variant="gradient"
                    gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                    size="md"
                  >
                    {type ? "Mettre à jour" : "Enregistrer"}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Box>

      {/* MODAL INFORMATIONS */}
      <Modal
        opened={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        title={
          <Group gap="xs">
            <IconInfoCircle size={18} />
            <Text fw={600}>À propos des prestations</Text>
          </Group>
        }
        size="md"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <Paper p="sm" bg="blue.0" radius="md">
            <Text size="sm" fw={500} mb="xs">📋 Définition</Text>
            <Text size="xs" c="dimmed">
              Les prestations sont des services que les employés peuvent réaliser (couture, broderie, ourlet, etc.).
              Elles sont utilisées pour calculer les salaires des employés rémunérés à la prestation.
            </Text>
          </Paper>

          <Paper p="sm" bg="green.0" radius="md">
            <Text size="sm" fw={500} mb="xs">💰 Valeur par défaut</Text>
            <Text size="xs" c="dimmed">
              La valeur par défaut sera automatiquement appliquée lors de la saisie d'une prestation.
              Vous pouvez toujours modifier cette valeur au moment du paiement.
            </Text>
          </Paper>

          <Paper p="sm" bg="orange.0" radius="md">
            <Text size="sm" fw={500} mb="xs">💡 Conseils</Text>
            <Text size="xs" c="dimmed">
              • Un employé peut cumuler plusieurs prestations
            </Text>
            <Text size="xs" c="dimmed">
              • Le salaire total est la somme de toutes les prestations réalisées
            </Text>
            <Text size="xs" c="dimmed">
              • Les types de prestation peuvent être désactivés plutôt que supprimés
            </Text>
            <Text size="xs" c="dimmed">
              • Les prestations sont indépendantes des ventes de produits
            </Text>
          </Paper>

          <Divider />

          <Text size="xs" c="dimmed" ta="center">
            Version 1.0.0 - Gestion Couture Pro
          </Text>
        </Stack>
      </Modal>
    </Container>
  );
};

export default FormulaireTypePrestation;