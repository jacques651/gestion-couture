// components/referentiels/TexturesManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Stack,
  Card,
  Title,
  Text,
  Button,
  Group,
  Modal,
  Table,
  TextInput,
  Textarea,
  Switch,
  LoadingOverlay,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Pagination,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconRefresh } from '@tabler/icons-react';
import { getTextures, createTexture, updateTexture, deleteTexture, Texture } from '../../database/db';

const TexturesManager: React.FC = () => {
  const [textures, setTextures] = useState<Texture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTexture, setEditingTexture] = useState<Texture | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nom_texture: '',
    description: '',
    densite: '',
    composition: '',
    est_actif: 1
  });

  const loadTextures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTextures();
      setTextures(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTextures();
  }, []);

  const resetForm = () => {
    setFormData({
      nom_texture: '',
      description: '',
      densite: '',
      composition: '',
      est_actif: 1
    });
    setEditingTexture(null);
  };

  const openAddModal = () => {
    resetForm();
    openModal();
  };

  const openEditModal = (texture: Texture) => {
    setEditingTexture(texture);
    setFormData({
      nom_texture: texture.nom_texture,
      description: texture.description || '',
      densite: texture.densite || '',
      composition: texture.composition || '',
      est_actif: texture.est_actif
    });
    openModal();
  };

  const openDeleteConfirm = (id: number, _nom: string) => {
    setDeleteId(id);
    openDeleteModal();
  };

  const handleSave = async () => {
    if (!formData.nom_texture.trim()) {
      setError('Le nom de la texture est requis');
      return;
    }

    try {
      setError(null);
      if (editingTexture) {
        await updateTexture(editingTexture.id, formData);
      } else {
        await createTexture(formData);
      }
      closeModal();
      await loadTextures();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setError(null);
      await deleteTexture(deleteId);
      closeDeleteModal();
      setDeleteId(null);
      await loadTextures();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  // Filtrage
  const filteredTextures = textures.filter(t =>
    t.nom_texture.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredTextures.length / itemsPerPage);
  const paginatedTextures = filteredTextures.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Box pos="relative" h={200}>
        <LoadingOverlay visible={true} />
      </Box>
    );
  }

  return (
    <Box p="md">
      <Container size="full">
        <Stack gap="lg">
          {/* En-tête */}
          <Card withBorder radius="lg" p="xl" style={{ background: 'linear-gradient(135deg, #1b365d 0%, #2a4a7a 100%)' }}>
            <Group justify="space-between" align="center">
              <Box>
                <Title order={1} c="white" size="h2">Gestion des Textures</Title>
                <Text c="gray.3" size="sm" mt={4}>
                  Gérez les textures/matières (Coton, Lin, Soie, Laine, etc.)
                </Text>
              </Box>
              <Button
                onClick={openAddModal}
                leftSection={<IconPlus size={18} />}
                variant="light"
                color="white"
                radius="md"
              >
                Nouvelle texture
              </Button>
            </Group>
          </Card>

          {/* Barre de recherche */}
          <Card withBorder radius="lg" shadow="sm" p="md">
            <Group>
              <TextInput
                placeholder="Rechercher par nom ou description..."
                leftSection={<IconSearch size={16} />}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ flex: 1 }}
                radius="md"
              />
              <Tooltip label="Actualiser">
                <ActionIcon variant="light" onClick={loadTextures} size="lg" radius="md">
                  <IconRefresh size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Card>

          {/* Message d'erreur */}
          {error && (
            <Alert color="red" onClose={() => setError(null)} withCloseButton radius="md">
              {error}
            </Alert>
          )}

          {/* Tableau des textures */}
          <Card withBorder radius="lg" shadow="sm" p={0}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Table.Tr>
                  <Table.Th>Nom</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Densité</Table.Th>
                  <Table.Th>Composition</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Statut</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedTextures.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                      <Text c="dimmed">
                        {searchTerm ? 'Aucune texture ne correspond à votre recherche' : 'Aucune texture enregistrée'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedTextures.map((texture) => (
                    <Table.Tr key={texture.id}>
                      <Table.Td>
                        <Text fw={500}>{texture.nom_texture}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2} c="dimmed">
                          {texture.description || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray" size="sm">
                          {texture.densite || '-'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={1}>
                          {texture.composition || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Badge color={texture.est_actif === 1 ? 'green' : 'red'} variant="light">
                          {texture.est_actif === 1 ? 'Actif' : 'Inactif'}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <Group gap="xs" justify="center">
                          <Tooltip label="Modifier">
                            <ActionIcon
                              variant="subtle"
                              color="yellow"
                              onClick={() => openEditModal(texture)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => openDeleteConfirm(texture.id, texture.nom_texture)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="center" p="md">
                <Pagination
                  value={currentPage}
                  onChange={setCurrentPage}
                  total={totalPages}
                  color="blue"
                  radius="md"
                />
              </Group>
            )}
          </Card>
        </Stack>
      </Container>

      {/* Modal formulaire - CORRIGÉ */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingTexture ? 'Modifier la texture' : 'Nouvelle texture'}
        size="md"
        radius="md"
      >
        <Stack>
          <TextInput
            label="Nom de la texture"
            placeholder="Ex: Coton, Lin, Soie, Laine..."
            value={formData.nom_texture}
            onChange={(e) => setFormData({ ...formData, nom_texture: e.target.value })}
            required
            withAsterisk
          />

          <Textarea
            label="Description"
            placeholder="Description de la texture..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <TextInput
            label="Densité"
            placeholder="Ex: 150g/m², 200g/m²..."
            value={formData.densite}
            onChange={(e) => setFormData({ ...formData, densite: e.target.value })}
          />

          <TextInput
            label="Composition"
            placeholder="Ex: 100% coton, 50% lin 50% coton..."
            value={formData.composition}
            onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
          />

          <Switch
            label="Actif"
            checked={formData.est_actif === 1}
            onChange={(e) => setFormData({ ...formData, est_actif: e.currentTarget.checked ? 1 : 0 })}
          />

          <Divider />

          <Group justify="flex-end">
            <Button variant="light" onClick={closeModal}>
              Annuler
            </Button>
            <Button onClick={handleSave} color="blue">
              {editingTexture ? 'Modifier' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Confirmation"
        size="sm"
        radius="md"
      >
        <Stack>
          <Text>Êtes-vous sûr de vouloir supprimer cette texture ?</Text>
          <Text size="sm" c="dimmed">
            Cette action est irréversible.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal}>
              Annuler
            </Button>
            <Button color="red" onClick={handleDelete}>
              Supprimer
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};

export default TexturesManager;