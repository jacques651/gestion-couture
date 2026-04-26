// src/components/tailles/ListeTailles.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Badge, ActionIcon, Stack, Title, Card, Text, Tooltip, Modal, TextInput, NumberInput } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface Taille {
  id: number;
  code_taille: string;
  libelle: string;
  ordre: number;
  est_actif: number;
}

export const ListeTailles: React.FC = () => {
  const [tailles, setTailles] = useState<Taille[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingTaille, setEditingTaille] = useState<Taille | null>(null);
  const [formData, setFormData] = useState({ code_taille: '', libelle: '', ordre: 0 });

  const loadData = async () => {
    setLoading(true);
    const db = await getDb();
    try {
      const data = await db.select<Taille[]>('SELECT * FROM tailles ORDER BY ordre');
      setTailles(data);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    const db = await getDb();
    try {
      if (editingTaille) {
        await db.execute(`UPDATE tailles SET code_taille = ?, libelle = ?, ordre = ? WHERE id = ?`, 
          [formData.code_taille, formData.libelle, formData.ordre, editingTaille.id]);
        notifications.show({ title: 'Succès', message: 'Taille modifiée', color: 'green' });
      } else {
        await db.execute(`INSERT INTO tailles (code_taille, libelle, ordre) VALUES (?, ?, ?)`,
          [formData.code_taille, formData.libelle, formData.ordre]);
        notifications.show({ title: 'Succès', message: 'Taille créée', color: 'green' });
      }
      setModalOpened(false);
      loadData();
    } catch (error) {
      notifications.show({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement', color: 'red' });
    }
  };

  const handleDelete = async (id: number, libelle: string) => {
    if (confirm(`Supprimer la taille "${libelle}" ?`)) {
      const db = await getDb();
      try {
        await db.execute(`DELETE FROM tailles WHERE id = ?`, [id]);
        notifications.show({ title: 'Succès', message: 'Taille supprimée', color: 'green' });
        loadData();
      } catch (error) {
        notifications.show({ title: 'Erreur', message: 'Erreur lors de la suppression', color: 'red' });
      }
    }
  };

  if (loading) return <Card withBorder p="xl"><Text>Chargement...</Text></Card>;

  return (
    <Stack gap="md">
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={2}>Tailles</Title>
          <Button leftSection={<IconPlus size={18} />} onClick={() => { setEditingTaille(null); setFormData({ code_taille: '', libelle: '', ordre: 0 }); setModalOpened(true); }}>
            Nouvelle taille
          </Button>
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Libellé</Table.Th>
              <Table.Th>Ordre</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {tailles.map((t) => (
              <Table.Tr key={t.id}>
                <Table.Td><Badge variant="light">{t.code_taille}</Badge></Table.Td>
                <Table.Td>{t.libelle}</Table.Td>
                <Table.Td>{t.ordre}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Modifier">
                      <ActionIcon color="blue" onClick={() => { setEditingTaille(t); setFormData({ code_taille: t.code_taille, libelle: t.libelle, ordre: t.ordre }); setModalOpened(true); }}>
                        <IconEdit size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Supprimer">
                      <ActionIcon color="red" onClick={() => handleDelete(t.id, t.libelle)}>
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
      <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title={editingTaille ? 'Modifier taille' : 'Nouvelle taille'}>
        <Stack gap="md">
          <TextInput label="Code taille" value={formData.code_taille} onChange={(e) => setFormData({...formData, code_taille: e.target.value})} required />
          <TextInput label="Libellé" value={formData.libelle} onChange={(e) => setFormData({...formData, libelle: e.target.value})} required />
          <NumberInput label="Ordre d'affichage" value={formData.ordre} onChange={(val) => setFormData({...formData, ordre: Number(val)})} min={0} />
          <Group justify="flex-end"><Button onClick={handleSave}>{editingTaille ? 'Modifier' : 'Créer'}</Button></Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
export default ListeTailles;