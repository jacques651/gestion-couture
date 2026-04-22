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
  Divider,
  Alert,
  Box,
  Modal,
  LoadingOverlay,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconPackage,
  IconBox,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { getDb } from '../../database/db';

interface MatiereStock {
  id: number;
  designation: string;
  unite: string;
  stock: number;
  cout_moyen: number;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const FormulaireSortieStock: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [matieres, setMatieres] = useState<MatiereStock[]>([]);
  const [matiereId, setMatiereId] = useState<string | null>(null);
  const [selectedMatiere, setSelectedMatiere] = useState<MatiereStock | null>(null);
  const [quantite, setQuantite] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const db = await getDb();

      const data = await db.select<MatiereStock[]>(`
        SELECT 
          m.id,
          m.designation,
          m.unite,
          COALESCE(SUM(e.quantite), 0) - COALESCE(SUM(s.quantite), 0) as stock,
          CASE 
            WHEN SUM(e.quantite) > 0 
            THEN SUM(e.quantite * e.cout_unitaire) / SUM(e.quantite)
            ELSE 0
          END as cout_moyen
        FROM matieres m
        LEFT JOIN entrees_stock e ON e.matiere_id = m.id
        LEFT JOIN sorties_stock s ON s.matiere_id = m.id
        WHERE m.est_supprime = 0
        GROUP BY m.id
        HAVING stock > 0
        ORDER BY m.designation
      `);

      setMatieres(data);
      setLoading(false);
    };

    load();
  }, []);

  // Mettre à jour la matière sélectionnée quand l'ID change
  useEffect(() => {
    if (matiereId) {
      const matiere = matieres.find(m => m.id.toString() === matiereId);
      setSelectedMatiere(matiere || null);
    } else {
      setSelectedMatiere(null);
    }
    setQuantite(undefined);
    setError('');
  }, [matiereId, matieres]);

  const matieresOptions = matieres.map(m => ({
    value: m.id.toString(),
    label: `${m.designation} (${m.unite}) - Stock: ${m.stock}`
  }));

  const enregistrer = async () => {
    setError('');
    setSuccess(false);

    if (!matiereId || !selectedMatiere) {
      setError('Veuillez sélectionner une matière');
      return;
    }

    if (!quantite || quantite <= 0) {
      setError('Veuillez saisir une quantité valide');
      return;
    }

    if (quantite > selectedMatiere.stock) {
      setError(`Stock insuffisant. Disponible: ${selectedMatiere.stock} ${selectedMatiere.unite}`);
      return;
    }

    setSaving(true);
    const db = await getDb();

    try {
      await db.execute(
        `INSERT INTO sorties_stock (matiere_id, quantite, cout_unitaire, date_sortie)
         VALUES (?, ?, ?, DATE('now'))`,
        [parseInt(matiereId), quantite, selectedMatiere.cout_moyen]
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
              <Title order={4} size="h5" c="white">Nouvelle sortie de stock</Title>
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
                <Text size="xs">Sortie enregistrée avec succès !</Text>
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
              nothingFoundMessage="Aucune matière avec stock disponible"
            />

            {/* INFOS STOCK */}
            {selectedMatiere && (
              <Paper p="xs" withBorder bg="gray.0" radius="sm">
                <SimpleGrid cols={2} spacing="sm">
                  <div>
                    <Text size="xs" c="dimmed">Stock disponible</Text>
                    <Text fw={700} size="md" c={selectedMatiere.stock <= 5 ? "orange" : "green"}>
                      {selectedMatiere.stock} {selectedMatiere.unite}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">Coût moyen</Text>
                    <Text fw={700} size="md" c="blue">
                      {selectedMatiere.cout_moyen.toFixed(2)} FCFA
                    </Text>
                  </div>
                </SimpleGrid>
              </Paper>
            )}

            {/* QUANTITÉ */}
            <NumberInput
              label="Quantité à sortir"
              placeholder="Quantité"
              value={quantite}
              onChange={(val) => setQuantite(Number(val))}
              leftSection={<IconPackage size={14} />}
              size="sm"
              min={0}
              step={1}
              required
              disabled={!selectedMatiere}
            />

            {/* ALERTE STOCK BAS */}
            {selectedMatiere && selectedMatiere.stock <= 5 && selectedMatiere.stock > 0 && (
              <Alert color="orange" variant="light" p="xs">
                <Group gap="xs">
                  <IconAlertCircle size={14} />
                  <Text size="xs">Stock bas ! Il reste {selectedMatiere.stock} {selectedMatiere.unite}</Text>
                </Group>
              </Alert>
            )}

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
            <Text size="xs">1. Sélectionnez la matière première à sortir</Text>
            <Text size="xs">2. Vérifiez le stock disponible affiché</Text>
            <Text size="xs">3. Saisissez la quantité à sortir</Text>
            <Text size="xs">4. La sortie est automatiquement valorisée au coût moyen</Text>
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

export default FormulaireSortieStock;