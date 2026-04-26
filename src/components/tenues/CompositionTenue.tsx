// src/components/tenues/CompositionTenue.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Group, ActionIcon, Stack, Text, Tooltip, Modal, Select, NumberInput, LoadingOverlay } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface Matiere {
  id: number;
  code_matiere: string;
  designation: string;
  unite: string;
}

interface Composition {
  id: number;
  tenue_id: number;
  matiere_id: number;
  quantite_requise: number;
  unite: string;
  cout_unitaire: number;
  matiere_designation?: string;
  matiere_code?: string;
}

interface Props { 
  tenueId: number; 
}

export const CompositionTenue: React.FC<Props> = ({ tenueId }) => {
  const [compositions, setCompositions] = useState<Composition[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingComposition, setEditingComposition] = useState<Composition | null>(null);
  const [formData, setFormData] = useState({
    matiere_id: 0,
    quantite_requise: 0,
    cout_unitaire: 0,
  });

  const loadData = async () => {
    setLoading(true);
    const db = await getDb();
    try {
      const compsData = await db.select<Composition[]>(`
        SELECT c.*, m.designation as matiere_designation, m.code_matiere, m.unite
        FROM compositions_tenues c
        JOIN matieres m ON c.matiere_id = m.id
        WHERE c.tenue_id = ?
        ORDER BY m.designation
      `, [tenueId]);
      setCompositions(compsData);
      
      const matieresData = await db.select<Matiere[]>(
        'SELECT id, code_matiere, designation, unite FROM matieres WHERE est_supprime = 0 ORDER BY designation'
      );
      setMatieres(matieresData);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [tenueId]);

  const handleSave = async () => {
    if (!formData.matiere_id) {
      notifications.show({ title: 'Erreur', message: 'Sélectionnez une matière', color: 'red' });
      return;
    }
    if (formData.quantite_requise <= 0) {
      notifications.show({ title: 'Erreur', message: 'La quantité requise doit être positive', color: 'red' });
      return;
    }

    const db = await getDb();
    const matiere = matieres.find(m => m.id === formData.matiere_id);
    
    try {
      if (editingComposition) {
        await db.execute(`
          UPDATE compositions_tenues 
          SET matiere_id = ?, quantite_requise = ?, cout_unitaire = ?, unite = ?
          WHERE id = ?
        `, [formData.matiere_id, formData.quantite_requise, formData.cout_unitaire || 0, matiere?.unite, editingComposition.id]);
        notifications.show({ title: 'Succès', message: 'Composition modifiée', color: 'green' });
      } else {
        await db.execute(`
          INSERT INTO compositions_tenues (tenue_id, matiere_id, quantite_requise, cout_unitaire, unite) 
          VALUES (?, ?, ?, ?, ?)
        `, [tenueId, formData.matiere_id, formData.quantite_requise, formData.cout_unitaire || 0, matiere?.unite]);
        notifications.show({ title: 'Succès', message: 'Composition ajoutée', color: 'green' });
      }
      setModalOpened(false);
      loadData();
    } catch (error) {
      notifications.show({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement', color: 'red' });
    }
  };

  const handleDelete = async (id: number, designation: string) => {
    if (confirm(`Supprimer la matière "${designation}" de la composition ?`)) {
      const db = await getDb();
      try {
        await db.execute(`DELETE FROM compositions_tenues WHERE id = ?`, [id]);
        notifications.show({ title: 'Succès', message: 'Composition supprimée', color: 'green' });
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
          setEditingComposition(null); 
          setFormData({ matiere_id: 0, quantite_requise: 0, cout_unitaire: 0 }); 
          setModalOpened(true); 
        }}>
          Ajouter une matière
        </Button>
      </Group>
      
      {compositions.length === 0 ? (
        <Text c="dimmed" ta="center" py={40}>Aucune matière dans la composition. Ajoutez les matières nécessaires.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Matière</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th>Quantité</Table.Th>
              <Table.Th>Unité</Table.Th>
              <Table.Th>Coût unitaire</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {compositions.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td><strong>{c.matiere_designation}</strong></Table.Td>
                <Table.Td><Text size="sm">{c.matiere_code}</Text></Table.Td>
                <Table.Td>{c.quantite_requise}</Table.Td>
                <Table.Td>{c.unite}</Table.Td>
                <Table.Td>{c.cout_unitaire?.toLocaleString()} FCFA</Table.Td>
                <Table.Td>{(c.quantite_requise * (c.cout_unitaire || 0)).toLocaleString()} FCFA</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Modifier">
                      <ActionIcon color="blue" onClick={() => { 
                        setEditingComposition(c); 
                        setFormData({ 
                          matiere_id: c.matiere_id, 
                          quantite_requise: c.quantite_requise, 
                          cout_unitaire: c.cout_unitaire || 0 
                        }); 
                        setModalOpened(true); 
                      }}>
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Supprimer">
                      <ActionIcon color="red" onClick={() => handleDelete(c.id, c.matiere_designation || '')}>
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

      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={editingComposition ? 'Modifier la composition' : 'Ajouter une matière'}>
        <Stack gap="md">
          <Select
            label="Matière"
            placeholder="Sélectionnez une matière"
            data={matieres.map(m => ({ value: m.id.toString(), label: `${m.code_matiere} - ${m.designation}` }))}
            value={formData.matiere_id?.toString()}
            onChange={(val) => setFormData({ ...formData, matiere_id: parseInt(val || '0') })}
            required
            disabled={!!editingComposition}
            searchable
          />
          <NumberInput
            label="Quantité requise"
            placeholder="Quantité nécessaire pour cette tenue"
            value={formData.quantite_requise}
            onChange={(val) => setFormData({ ...formData, quantite_requise: Number(val) || 0 })}
            min={0}
            step={0.1}
            required
          />
          <NumberInput
            label="Coût unitaire (optionnel)"
            description="Laissez vide pour utiliser le prix d'achat"
            value={formData.cout_unitaire}
            onChange={(val) => setFormData({ ...formData, cout_unitaire: Number(val) || 0 })}
            min={0}
          />
          <Group justify="flex-end">
            <Button onClick={handleSave}>{editingComposition ? 'Modifier' : 'Ajouter'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};