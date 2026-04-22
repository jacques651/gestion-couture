import React, { useState, useEffect } from 'react';
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
  Alert,
  Box,
  Modal,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconPackage,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
  IconCategory,
  IconRuler,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface Matiere {
  id: number;
  designation: string;
  categorie: string;
  unite: string;
  seuil_alerte: number;
}

interface FormulaireMatiereProps {
  matiere?: Matiere;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormulaireMatiere: React.FC<FormulaireMatiereProps> = ({ matiere, onSuccess, onCancel }) => {
  const [designation, setDesignation] = useState('');
  const [categorie, setCategorie] = useState('');
  const [unite, setUnite] = useState('');
  const [seuilAlerte, setSeuilAlerte] = useState<number | undefined>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  useEffect(() => {
    if (matiere) {
      setDesignation(matiere.designation);
      setCategorie(matiere.categorie || '');
      setUnite(matiere.unite);
      setSeuilAlerte(matiere.seuil_alerte || 0);
    }
  }, [matiere]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!designation.trim()) {
      setError('La désignation est obligatoire');
      return;
    }

    if (!unite.trim()) {
      setError("L'unité est obligatoire");
      return;
    }

    const seuil = seuilAlerte || 0;

    setLoading(true);

    try {
      const db = await getDb();

      if (matiere) {
        await db.execute(
          `UPDATE matieres 
           SET designation = ?, categorie = ?, unite = ?, seuil_alerte = ?
           WHERE id = ?`,
          [designation, categorie || null, unite, seuil, matiere.id]
        );
        setSuccess(true);
      } else {
        await db.execute(
          `INSERT INTO matieres (designation, categorie, unite, seuil_alerte, est_supprime)
           VALUES (?, ?, ?, ?, 0)`,
          [designation, categorie || null, unite, seuil]
        );
        setSuccess(true);
      }

      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
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
              <IconPackage size={18} color="white" />
              <Title order={4} size="h5" c="white">
                {matiere ? 'Modifier la matière' : 'Nouvelle matière'}
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
                  <Text size="xs">
                    Matière {matiere ? 'modifiée' : 'ajoutée'} avec succès !
                  </Text>
                </Alert>
              )}

              {/* ERREUR */}
              {error && (
                <Alert icon={<IconAlertCircle size={14} />} color="red" variant="light" p="xs">
                  <Text size="xs">{error}</Text>
                </Alert>
              )}

              {/* DÉSIGNATION */}
              <TextInput
                label="Désignation"
                placeholder="Ex: Tissu wax, Fil, Bouton..."
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                leftSection={<IconPackage size={14} />}
                size="sm"
                required
              />

              {/* CATÉGORIE */}
              <TextInput
                label="Catégorie"
                placeholder="Ex: Tissus, Mercerie, Fourniture..."
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                leftSection={<IconCategory size={14} />}
                size="sm"
              />

              {/* UNITÉ */}
              <TextInput
                label="Unité"
                placeholder="Ex: m, kg, pièce, rouleau..."
                value={unite}
                onChange={(e) => setUnite(e.target.value)}
                leftSection={<IconRuler size={14} />}
                size="sm"
                required
              />

              {/* SEUIL D'ALERTE */}
              <NumberInput
                label="Seuil d'alerte"
                placeholder="Quantité minimale avant alerte"
                value={seuilAlerte}
                onChange={(val) => setSeuilAlerte(Number(val))}
                leftSection={<IconAlertCircle size={14} />}
                size="sm"
                min={0}
                step={1}
                description="Alerte quand le stock devient inférieur ou égal à cette valeur"
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
                  {matiere ? 'Mettre à jour' : 'Enregistrer'}
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
            <Text size="xs">1. Saisissez la désignation de la matière (obligatoire)</Text>
            <Text size="xs">2. Ajoutez une catégorie pour organiser vos matières</Text>
            <Text size="xs">3. Indiquez l'unité de mesure (m, kg, pièce...)</Text>
            <Text size="xs">4. Définissez un seuil d'alerte pour être averti du stock bas</Text>
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

export default FormulaireMatiere;