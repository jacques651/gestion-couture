// src/components/categories/ListeCategoriesMatieres.tsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Badge, ActionIcon, Stack, Title, Card, Text, Tooltip, Modal, TextInput, Textarea, Switch, LoadingOverlay } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import { getDb } from '../../database/db';
import { notifications } from '@mantine/notifications';

interface CategorieMatiere {
  id: number;
  code_categorie: string;
  nom_categorie: string;
  description: string | null;
  est_actif: number;
  created_at: string;
}

export const ListeCategoriesMatieres: React.FC = () => {
  const [categories, setCategories] = useState<CategorieMatiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [editing, setEditing] = useState<CategorieMatiere | null>(null);
  const [formData, setFormData] = useState({
    code_categorie: '',
    nom_categorie: '',
    description: '',
    est_actif: true
  });

  const loadData = async () => {
    setLoading(true);
    const db = await getDb();
    try {
      const data = await db.select<CategorieMatiere[]>('SELECT * FROM categories_matieres ORDER BY nom_categorie');
      setCategories(data);
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erreur', message: 'Erreur de chargement', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!formData.code_categorie || !formData.nom_categorie) {
      notifications.show({ title: 'Erreur', message: 'Code et nom sont requis', color: 'red' });
      return;
    }

    const db = await getDb();
    try {
      if (editing) {
        await db.execute(`
          UPDATE categories_matieres 
          SET code_categorie = ?, nom_categorie = ?, description = ?, est_actif = ? 
          WHERE id = ?
        `, [formData.code_categorie, formData.nom_categorie, formData.description || null, formData.est_actif ? 1 : 0, editing.id]);
        notifications.show({ title: 'Succès', message: 'Catégorie modifiée', color: 'green' });
      } else {
        await db.execute(`
          INSERT INTO categories_matieres (code_categorie, nom_categorie, description, est_actif) 
          VALUES (?, ?, ?, ?)
        `, [formData.code_categorie, formData.nom_categorie, formData.description || null, formData.est_actif ? 1 : 0]);
        notifications.show({ title: 'Succès', message: 'Catégorie créée', color: 'green' });
      }
      setModalOpened(false);
      loadData();
    } catch (error) {
      console.error(error);
      notifications.show({ title: 'Erreur', message: 'Erreur lors de l\'enregistrement', color: 'red' });
    }
  };

  const handleDelete = async (id: number, nom: string) => {
    if (
globalThis.confirm(`Supprimer la catégorie "${nom}" ?`)) {
      const db = await getDb();
      try {
        // Vérifier si des matières utilisent cette catégorie
        const used = await db.select<{ count: number }[]>(
          `SELECT COUNT(*) as count FROM matieres WHERE categorie_id = ?`,
          [id]
        );
        if (used[0].count > 0) {
          notifications.show({ 
            title: 'Impossible', 
            message: `Cette catégorie est utilisée par ${used[0].count} matière(s)`, 
            color: 'red' 
          });
          return;
        }
        await db.execute(`DELETE FROM categories_matieres WHERE id = ?`, [id]);
        notifications.show({ title: 'Succès', message: 'Catégorie supprimée', color: 'green' });
        loadData();
      } catch (error) {
        console.error(error);
        notifications.show({ title: 'Erreur', message: 'Erreur lors de la suppression', color: 'red' });
      }
    }
  };

  if (loading) {
    return (
      <Card withBorder radius="md" p="lg" pos="relative">
        <LoadingOverlay visible={true} />
        <Text>Chargement des catégories...</Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Card withBorder radius="md">
        <Group justify="space-between" mb="md">
          <Title order={2}>Catégories de matières</Title>
          <Group>
            <Tooltip label="Actualiser">
              <ActionIcon variant="light" onClick={loadData} size="lg">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Button 
              leftSection={<IconPlus size={18} />} 
              onClick={() => { 
                setEditing(null); 
                setFormData({ code_categorie: '', nom_categorie: '', description: '', est_actif: true }); 
                setModalOpened(true); 
              }}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
            >
              Nouvelle catégorie
            </Button>
          </Group>
        </Group>

        {categories.length === 0 ? (
          <Text ta="center" c="dimmed" py={60}>
            Aucune catégorie trouvée
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#1b365d' }}>
              <Table.Tr>
                <Table.Th style={{ color: 'white' }}>Code</Table.Th>
                <Table.Th style={{ color: 'white' }}>Nom</Table.Th>
                <Table.Th style={{ color: 'white' }}>Description</Table.Th>
                <Table.Th style={{ color: 'white' }}>Statut</Table.Th>
                <Table.Th style={{ color: 'white', textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {categories.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Badge variant="light" color="blue" size="sm">
                      {c.code_categorie}
                    </Badge>
                  </Table.Td>
                  <Table.Td fw={500}>{c.nom_categorie}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {c.description || '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={c.est_actif === 1 ? 'green' : 'gray'} variant="light" size="sm">
                      {c.est_actif === 1 ? 'Actif' : 'Inactif'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="center">
                      <Tooltip label="Modifier">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="blue"
                          onClick={() => { 
                            setEditing(c); 
                            setFormData({ 
                              code_categorie: c.code_categorie, 
                              nom_categorie: c.nom_categorie, 
                              description: c.description || '', 
                              est_actif: c.est_actif === 1 
                            }); 
                            setModalOpened(true); 
                          }}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Supprimer">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(c.id, c.nom_categorie)}
                        >
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
      </Card>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        size="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Code catégorie"
            placeholder="Ex: TISSU, FOURNITURE..."
            value={formData.code_categorie}
            onChange={(e) => setFormData({ ...formData, code_categorie: e.target.value.toUpperCase() })}
            required
          />
          <TextInput
            label="Nom"
            placeholder="Nom de la catégorie"
            value={formData.nom_categorie}
            onChange={(e) => setFormData({ ...formData, nom_categorie: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            placeholder="Description de la catégorie"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <Switch
            label="Catégorie active"
            checked={formData.est_actif}
            onChange={(e) => setFormData({ ...formData, est_actif: e.currentTarget.checked })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={() => setModalOpened(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ListeCategoriesMatieres;