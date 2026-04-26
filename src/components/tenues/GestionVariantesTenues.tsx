// src/components/tenues/GestionVariantesTenues.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Group, ActionIcon, Stack, Text, Tooltip, Modal, Select, NumberInput, LoadingOverlay } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface Taille {
  id: number;
  code_taille: string;
  libelle: string;
  ordre: number;
  est_actif: number;
}

interface Variante {
  id: number;
  tenue_id: number;
  taille_id: number;
  code_variante: string;
  stock_actuel: number;
  seuil_alerte: number;
  prix_vente: number | null;
  taille_libelle?: string;
  code_taille?: string;
}

interface Props { 
  tenueId: number; 
}

export const GestionVariantesTenues: React.FC<Props> = ({ tenueId }) => {
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [tailles, setTailles] = useState<Taille[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingVariante, setEditingVariante] = useState<Variante | null>(null);
  const [formData, setFormData] = useState({
    taille_id: 0,
    stock_actuel: 0,
    seuil_alerte: 0,
    prix_vente: 0,
  });

  const loadData = async () => {
    setLoading(true);
    const db = await getDb();
    try {
      // Charger les variantes
      const variantesData = await db.select<Variante[]>(`
        SELECT tv.*, t.libelle as taille_libelle, t.code_taille
        FROM tenues_variantes tv
        JOIN tailles t ON tv.taille_id = t.id
        WHERE tv.tenue_id = ?
        ORDER BY t.ordre
      `, [tenueId]);
      setVariantes(variantesData);
      
      // Charger les tailles disponibles
      const taillesData = await db.select<Taille[]>(
        'SELECT * FROM tailles WHERE est_actif = 1 ORDER BY ordre'
      );
      setTailles(taillesData);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [tenueId]);

  const generateCodeVariante = (tailleId: number) => {
    const taille = tailles.find(t => t.id === tailleId);
    return `VAR-${tenueId}-${taille?.code_taille || 'XX'}`;
  };

  const handleSave = async () => {
    if (!formData.taille_id) {
      notifications.show({ title: 'Erreur', message: 'Sélectionnez une taille', color: 'red' });
      return;
    }

    const db = await getDb();
    try {
      if (editingVariante) {
        await db.execute(`
          UPDATE tenues_variantes 
          SET stock_actuel = ?, seuil_alerte = ?, prix_vente = ? 
          WHERE id = ?
        `, [formData.stock_actuel, formData.seuil_alerte, formData.prix_vente || null, editingVariante.id]);
        notifications.show({ title: 'Succès', message: 'Variante modifiée', color: 'green' });
      } else {
        const code_variante = generateCodeVariante(formData.taille_id);
        await db.execute(`
          INSERT INTO tenues_variantes (tenue_id, taille_id, code_variante, stock_actuel, seuil_alerte, prix_vente) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [tenueId, formData.taille_id, code_variante, formData.stock_actuel, formData.seuil_alerte, formData.prix_vente || null]);
        notifications.show({ title: 'Succès', message: 'Variante créée', color: 'green' });
      }
      setModalOpened(false);
      loadData();
    } catch (error) {
      notifications.show({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement', color: 'red' });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette variante ?')) {
      const db = await getDb();
      try {
        await db.execute(`DELETE FROM tenues_variantes WHERE id = ?`, [id]);
        notifications.show({ title: 'Succès', message: 'Variante supprimée', color: 'green' });
        loadData();
      } catch (error) {
        notifications.show({ title: 'Erreur', message: 'Erreur lors de la suppression', color: 'red' });
      }
    }
  };

  if (loading) return <LoadingOverlay visible={true} />;

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button size="sm" leftSection={<IconRefresh size={16} />} onClick={loadData} variant="light">
          Actualiser
        </Button>
        <Button size="sm" leftSection={<IconPlus size={16} />} onClick={() => { 
          setEditingVariante(null); 
          setFormData({ taille_id: 0, stock_actuel: 0, seuil_alerte: 0, prix_vente: 0 }); 
          setModalOpened(true); 
        }}>
          Ajouter une taille
        </Button>
      </Group>
      
      {variantes.length === 0 ? (
        <Text c="dimmed" ta="center" py={40}>Aucune variante. Ajoutez des tailles à cette tenue.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Taille</Table.Th>
              <Table.Th>Code variante</Table.Th>
              <Table.Th>Stock</Table.Th>
              <Table.Th>Prix vente</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {variantes.map((v) => (
              <Table.Tr key={v.id}>
                <Table.Td><strong>{v.taille_libelle}</strong></Table.Td>
                <Table.Td><Text size="sm">{v.code_variante}</Text></Table.Td>
                <Table.Td>{v.stock_actuel}</Table.Td>
                <Table.Td>{v.prix_vente ? `${v.prix_vente.toLocaleString()} FCFA` : 'Prix base'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Modifier">
                      <ActionIcon color="blue" onClick={() => { 
                        setEditingVariante(v); 
                        setFormData({ 
                          taille_id: v.taille_id, 
                          stock_actuel: v.stock_actuel, 
                          seuil_alerte: v.seuil_alerte, 
                          prix_vente: v.prix_vente || 0 
                        }); 
                        setModalOpened(true); 
                      }}>
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Supprimer">
                      <ActionIcon color="red" onClick={() => handleDelete(v.id)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={editingVariante ? 'Modifier variante' : 'Ajouter une taille'}>
        <Stack gap="md">
          <Select
            label="Taille"
            data={tailles.map(t => ({ value: t.id.toString(), label: t.libelle }))}
            value={formData.taille_id?.toString()}
            onChange={(val) => setFormData({ ...formData, taille_id: parseInt(val || '0') })}
            required
            disabled={!!editingVariante}
          />
          {!editingVariante && (
            <Text size="xs" c="dimmed">
              Code variante: {generateCodeVariante(formData.taille_id)}
            </Text>
          )}
          <NumberInput
            label="Stock initial"
            value={formData.stock_actuel}
            onChange={(val) => setFormData({ ...formData, stock_actuel: Number(val) || 0 })}
            min={0}
          />
          <NumberInput
            label="Seuil d'alerte"
            value={formData.seuil_alerte}
            onChange={(val) => setFormData({ ...formData, seuil_alerte: Number(val) || 0 })}
            min={0}
          />
          <NumberInput
            label="Prix de vente (optionnel)"
            description="Laissez vide pour utiliser le prix base"
            value={formData.prix_vente}
            onChange={(val) => setFormData({ ...formData, prix_vente: Number(val) || 0 })}
            min={0}
          />
          <Group justify="flex-end">
            <Button onClick={handleSave}>{editingVariante ? 'Modifier' : 'Ajouter'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};