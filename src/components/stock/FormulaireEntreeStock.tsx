// src/components/stock/FormulaireEntreeStock.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  Group,
  Button,
  NumberInput,
  Select,
  Textarea,
  Stack,
  Divider,
  LoadingOverlay,
  Box,
  Alert,
} from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconPackage, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  unite: string;
  stock_actuel: number;
}

interface FormulaireEntreeStockProps {
  onClose: () => void;
  onSuccess: () => void;
  editingEntree?: {
    id: number;
    matiere_id: number;
    quantite: number;
    cout_unitaire: number;
    observation: string;
  } | null;
}

const FormulaireEntreeStock: React.FC<FormulaireEntreeStockProps> = ({ onClose, onSuccess, editingEntree }) => {
  const [loading, setLoading] = useState(false);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [formData, setFormData] = useState({
    matiere_id: 0,
    quantite: 0,
    cout_unitaire: 0,
    observation: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadMatieres = async () => {
      const db = await getDb();
      const result = await db.select<Matiere[]>(`
        SELECT id, code_matiere, designation, unite, stock_actuel 
        FROM matieres 
        WHERE est_supprime = 0 
        ORDER BY designation
      `);
      setMatieres(result);
    };
    loadMatieres();

    if (editingEntree) {
      setFormData({
        matiere_id: editingEntree.matiere_id,
        quantite: editingEntree.quantite,
        cout_unitaire: editingEntree.cout_unitaire,
        observation: editingEntree.observation || '',
      });
    }
  }, [editingEntree]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.matiere_id) {
      setError('Veuillez sélectionner une matière');
      return;
    }
    if (formData.quantite <= 0) {
      setError('La quantité doit être supérieure à 0');
      return;
    }
    if (formData.cout_unitaire <= 0) {
      setError('Le coût unitaire doit être supérieur à 0');
      return;
    }

    setLoading(true);

    try {
      const db = await getDb();
      const matiere = matieres.find(m => m.id === formData.matiere_id);
      
      if (editingEntree) {
        // Mise à jour
        await db.execute(`
          UPDATE entrees_stock 
          SET matiere_id = ?, quantite = ?, cout_unitaire = ?, observation = ?, date_entree = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [formData.matiere_id, formData.quantite, formData.cout_unitaire, formData.observation || null, editingEntree.id]);
        
        notifications.show({
          title: 'Succès',
          message: 'Entrée de stock modifiée avec succès',
          color: 'green',
        });
      } else {
        // Création - générer un code d'entrée
        const code_entree = `ENT-${Date.now()}`;
        
        await db.execute(`
          INSERT INTO entrees_stock (
            code_entree, matiere_id, quantite, cout_unitaire, observation, date_entree
          ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [code_entree, formData.matiere_id, formData.quantite, formData.cout_unitaire, formData.observation || null]);
        
        notifications.show({
          title: 'Succès',
          message: `Entrée de stock pour "${matiere?.designation}" enregistrée`,
          color: 'green',
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erreur lors de l\'enregistrement');
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'enregistrement',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const total = formData.quantite * formData.cout_unitaire;
  const selectedMatiere = matieres.find(m => m.id === formData.matiere_id);

  return (
    <Box style={{ maxWidth: 600, margin: '0 auto' }} p="md">
      <Stack gap="md">
        {/* HEADER */}
        <Card withBorder radius="md" p="md" bg="#1b365d">
          <Group justify="space-between">
            <Group gap="xs">
              <IconPackage size={24} color="white" />
              <Title order={2} size="h4" c="white">
                {editingEntree ? 'Modifier une entrée' : 'Nouvelle entrée de stock'}
              </Title>
            </Group>
            <Button
              variant="light"
              color="white"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={onClose}
            >
              Retour
            </Button>
          </Group>
        </Card>

        {/* FORMULAIRE */}
        <Card withBorder radius="md" p="md">
          <LoadingOverlay visible={loading} />
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              {/* Sélection matière */}
              <Select
                label="Matière première"
                placeholder="Sélectionnez une matière"
                data={matieres.map(m => ({
                  value: m.id.toString(),
                  label: `${m.code_matiere} - ${m.designation} (Stock actuel: ${m.stock_actuel} ${m.unite})`
                }))}
                value={formData.matiere_id?.toString()}
                onChange={(val) => setFormData({ ...formData, matiere_id: parseInt(val || '0') })}
                required
                searchable
                disabled={!!editingEntree}
              />

              {selectedMatiere && (
                <Alert color="blue" variant="light" p="xs">
                  <Text size="sm">Stock actuel : {selectedMatiere.stock_actuel} {selectedMatiere.unite}</Text>
                </Alert>
              )}

              <Divider label="Détails de l'entrée" labelPosition="center" />

              {/* Quantité et coût */}
              <Group grow>
                <NumberInput
                  label="Quantité"
                  placeholder="Quantité reçue"
                  value={formData.quantite}
                  onChange={(val) => setFormData({ ...formData, quantite: Number(val) || 0 })}
                  min={0}
                  step={1}
                  required
                />
                <NumberInput
                  label="Coût unitaire (FCFA)"
                  placeholder="Prix d'achat unitaire"
                  value={formData.cout_unitaire}
                  onChange={(val) => setFormData({ ...formData, cout_unitaire: Number(val) || 0 })}
                  min={0}
                  step={100}
                  required
                />
              </Group>

              {/* Total calculé */}
              {formData.quantite > 0 && formData.cout_unitaire > 0 && (
                <Alert color="green" variant="light" p="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Total :</Text>
                    <Text fw={700} size="md" c="green">
                      {total.toLocaleString()} FCFA
                    </Text>
                  </Group>
                </Alert>
              )}

              {/* Observation */}
              <Textarea
                label="Observation (optionnel)"
                placeholder="Fournisseur, numéro de facture, lot..."
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                rows={3}
              />

              {error && (
                <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                  Entrée enregistrée avec succès !
                </Alert>
              )}

              <Divider />

              {/* Actions */}
              <Group justify="flex-end">
                <Button variant="light" color="red" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  leftSection={<IconDeviceFloppy size={16} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  {editingEntree ? 'Modifier' : 'Enregistrer'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>

        {/* Information */}
        <Card withBorder radius="md" p="sm" bg="gray.0">
          <Text size="xs" c="dimmed">
            💡 Les entrées de stock augmentent automatiquement le stock de la matière sélectionnée.
            Le coût moyen est recalculé automatiquement.
          </Text>
        </Card>
      </Stack>
    </Box>
  );
};

export default FormulaireEntreeStock;