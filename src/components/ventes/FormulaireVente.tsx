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
  NumberInput,
  Divider,
  Alert,
  Box,
  Modal,
  Radio,
  SimpleGrid,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconShoppingBag,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
  IconShirt,
  IconPackage,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface FormulaireVenteProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulaireVente: React.FC<FormulaireVenteProps> = ({ onSuccess, onCancel }) => {
  const [type, setType] = useState<'tenue' | 'tissu'>('tenue');
  const [designation, setDesignation] = useState('');
  const [quantite, setQuantite] = useState<number | undefined>(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number | undefined>(undefined);
  const [observation, setObservation] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const total = (quantite || 0) * (prixUnitaire || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!designation.trim()) {
      setError('La désignation est obligatoire');
      return;
    }

    if (!quantite || quantite <= 0) {
      setError('Quantité invalide');
      return;
    }

    if (!prixUnitaire || prixUnitaire <= 0) {
      setError('Prix unitaire invalide');
      return;
    }

    setIsSubmitting(true);

    try {
      const db = await getDb();

      await db.execute(
        `INSERT INTO ventes 
        (type, designation, quantite, prix_unitaire, total, observation, date_vente)
        VALUES (?, ?, ?, ?, ?, ?, DATE('now'))`,
        [type, designation.trim(), quantite, prixUnitaire, total, observation || null]
      );

      setSuccess(true);

      // Reset form
      setDesignation('');
      setQuantite(1);
      setPrixUnitaire(undefined);
      setObservation('');

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box style={{ maxWidth: 500, margin: '0 auto' }} p="sm">
      <Stack gap="md">
        {/* HEADER COMPACT */}
        <Card withBorder radius="md" p="sm" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconShoppingBag size={18} color="white" />
              <Title order={4} size="h5" c="white">Nouvelle vente</Title>
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
                  <Text size="xs">Vente enregistrée avec succès !</Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* TYPE DE VENTE */}
              <Radio.Group
                value={type}
                onChange={(value) => setType(value as 'tenue' | 'tissu')}
                label="Type de vente"
                size="sm"
              >
                <Group gap="lg" mt="xs">
                  <Radio
                    value="tenue"
                    label="Tenue"
                    icon={IconShirt}
                    size="sm"
                  />
                  <Radio
                    value="tissu"
                    label="Tissu"
                    icon={IconPackage}
                    size="sm"
                  />
                </Group>
              </Radio.Group>

              {/* DÉSIGNATION */}
              <TextInput
                label="Désignation"
                placeholder="Ex: Robe en pagne, 5 mètres de wax..."
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                leftSection={<IconShoppingBag size={14} />}
                size="sm"
                required
              />

              {/* QUANTITÉ & PRIX */}
              <SimpleGrid cols={2} spacing="sm">
                <NumberInput
                  label="Quantité"
                  placeholder="Quantité"
                  value={quantite}
                  onChange={(val) => setQuantite(Number(val))}
                  min={0}
                  step={1}
                  size="sm"
                  required
                />

                <NumberInput
                  label="Prix unitaire (FCFA)"
                  placeholder="Prix unitaire"
                  value={prixUnitaire}
                  onChange={(val) => setPrixUnitaire(Number(val))}
                  min={0}
                  step={100}
                  size="sm"
                  required
                />
              </SimpleGrid>

              {/* TOTAL */}
              {prixUnitaire && quantite && prixUnitaire > 0 && quantite > 0 && (
                <Alert color="blue" variant="light" p="xs" radius="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Total :</Text>
                    <Text fw={700} size="md" c="blue">
                      {total.toLocaleString()} FCFA
                    </Text>
                  </Group>
                </Alert>
              )}

              {/* OBSERVATION */}
              <Textarea
                label="Observation"
                placeholder="Informations complémentaires..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                leftSection={<IconInfoCircle size={14} />}
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
                  Enregistrer
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
            <Text size="xs">1. Sélectionnez le type de vente (Tenue ou Tissu)</Text>
            <Text size="xs">2. Saisissez la désignation du produit</Text>
            <Text size="xs">3. Indiquez la quantité et le prix unitaire</Text>
            <Text size="xs">4. Le total est calculé automatiquement</Text>
            <Text size="xs">5. Ajoutez une observation si nécessaire</Text>
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

export default FormulaireVente;